from __future__ import annotations

from bisect import bisect_right
from dataclasses import dataclass
from datetime import date
from typing import Dict, List, Tuple

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.date_utils import month_bounds, months_between, previous_month_end
from src.core.exceptions import BusinessException
from src.modules.MarketData.services.market_hours import get_market_datetime
from src.modules.Portfolio.models.transaction_model import Transaction
from src.modules.Portfolio.repositories.transaction_repository import TransactionRepository
from src.modules.Portfolio.schemas.portfolio_schema import (
    PerformanceBucket,
    PerformanceContribution,
    PerformanceResponse,
)
from src.modules.Portfolio.services.portfolio_service import PortfolioService

CLOSED_POSITION_EPSILON = 1e-9
NEGLIGIBLE = 0.005


@dataclass(slots=True)
class PositionCheckpoint:
    date: date
    quantity: float
    cost: float
    cumulative_flow: float
    cumulative_income: float


@dataclass(slots=True)
class PositionState:
    value: float
    flow: float
    income: float
    priced: bool


class PriceLookup:
    def __init__(self, dates: List[date], closes: List[float]):
        self.dates = dates
        self.closes = closes

    def close_on(self, day: date) -> float | None:
        index = bisect_right(self.dates, day) - 1
        return self.closes[index] if index >= 0 else None


class PortfolioResultService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = TransactionRepository(session)

    async def get_performance(
        self, user_id: str, granularity: str = "month", month: str | None = None
    ) -> PerformanceResponse:
        if granularity == "day" and not month:
            raise BusinessException(400, "Informe o mês no formato AAAA-MM para a granularidade diária.")

        transactions = await self.repository.get_all_by_user(user_id)
        if not transactions:
            return PerformanceResponse(granularity=granularity, buckets=[], contributions=[])

        timelines = self._build_timelines(transactions)
        if not timelines:
            return PerformanceResponse(granularity=granularity, buckets=[], contributions=[])

        today = get_market_datetime(settings.MARKET_DATA_TIMEZONE).date()
        first_date = min(transaction.date for transaction in transactions)
        market_tickers = sorted(
            {
                PortfolioService._market_data_ticker(position)
                for position in timelines
                if PortfolioService._market_data_ticker(position).endswith(".SA")
            }
        )

        trading_days = await self._trading_days(granularity, month, market_tickers, today)
        boundaries, keys = self._build_boundaries(
            granularity, month, timelines, first_date, today, trading_days
        )
        if len(boundaries) < 2:
            return PerformanceResponse(granularity=granularity, buckets=[], contributions=[])

        prices = await self._load_prices(market_tickers, boundaries[0], boundaries[-1])
        coverage_start = await self.repository.get_first_price_date(market_tickers)
        ticker_infos = await self.repository.get_ticker_infos_by_tickers(market_tickers)

        states = {
            boundary: self._states_on(timelines, prices, boundary) for boundary in boundaries
        }

        buckets: List[PerformanceBucket] = []
        contributions: List[PerformanceContribution] = []
        for index, key in enumerate(keys):
            start_boundary, end_boundary = boundaries[index], boundaries[index + 1]
            opening, closing = states[start_boundary], states[end_boundary]

            start_value = end_value = net_flow = dividends = result = 0.0
            for position in timelines:
                before, after = opening[position], closing[position]
                start_value += before.value
                end_value += after.value
                net_flow += after.flow - before.flow
                dividends += after.income - before.income

                price_value, dividend_value = self._split_contribution(before, after)
                result += price_value + dividend_value

                contribution = self._to_contribution(
                    key, position, after, price_value, dividend_value, ticker_infos
                )
                if contribution is not None:
                    contributions.append(contribution)

            buckets.append(
                PerformanceBucket(
                    key=key,
                    start_date=start_boundary,
                    end_date=end_boundary,
                    start_value=self._round(start_value),
                    end_value=self._round(end_value),
                    net_flow=self._round(net_flow),
                    dividends=self._round(dividends),
                    value=self._round(result),
                )
            )

        return PerformanceResponse(
            granularity=granularity,
            coverage_start=coverage_start,
            buckets=buckets,
            contributions=contributions,
        )

    @staticmethod
    def _split_contribution(before: PositionState, after: PositionState) -> Tuple[float, float]:
        dividend_value = after.income - before.income
        # Sem fonte de cotação o "valor" é o custo acumulado, e na renda fixa da B3 a
        # quantidade mistura unidades (1518 para R$1.518, mas 1 para R$1.000), então o
        # custo médio deriva. Variação de preço desses ativos é ruído, não resultado.
        if not after.priced:
            return 0.0, dividend_value
        return after.value - before.value - (after.flow - before.flow), dividend_value

    def _to_contribution(
        self,
        key: str,
        position: str,
        after: PositionState,
        price_value: float,
        dividend_value: float,
        ticker_infos: Dict[str, object],
    ) -> PerformanceContribution | None:
        value = price_value + dividend_value
        if abs(value) < NEGLIGIBLE and abs(after.value) < NEGLIGIBLE:
            return None

        market_ticker = PortfolioService._market_data_ticker(position)
        info = ticker_infos.get(market_ticker)
        return PerformanceContribution(
            bucket=key,
            ticker=PortfolioService.normalize_ticker(position),
            asset_type=PortfolioService.classify_ticker(position),
            sector=getattr(info, "sector", None),
            value=self._round(value),
            price_value=self._round(price_value),
            dividend_value=self._round(dividend_value),
            end_value=self._round(after.value),
            priced=after.priced,
        )

    async def _trading_days(
        self, granularity: str, month: str | None, market_tickers: List[str], today: date
    ) -> List[date]:
        if granularity != "day" or not month:
            return []

        month_start, month_end = month_bounds(month)
        return await self.repository.get_price_dates_between(
            market_tickers, month_start, min(today, month_end)
        )

    def _build_boundaries(
        self,
        granularity: str,
        month: str | None,
        timelines: Dict[str, List[PositionCheckpoint]],
        first_date: date,
        today: date,
        trading_days: List[date],
    ) -> Tuple[List[date], List[str]]:
        if granularity == "day":
            return self._daily_boundaries(month or "", timelines, today, trading_days)

        months = months_between(first_date, today)
        if not months:
            return [], []

        boundaries = [previous_month_end(months[0])]
        for month_key in months:
            boundaries.append(min(today, month_bounds(month_key)[1]))
        return boundaries, list(months)

    def _daily_boundaries(
        self,
        month: str,
        timelines: Dict[str, List[PositionCheckpoint]],
        today: date,
        trading_days: List[date],
    ) -> Tuple[List[date], List[str]]:
        month_start, month_end = month_bounds(month)
        closing = min(today, month_end)
        if closing < month_start:
            return [], []

        active = {
            checkpoint.date
            for checkpoints in timelines.values()
            for checkpoint in checkpoints
            if month_start <= checkpoint.date <= closing
        }
        active.update(trading_days)
        # A última fronteira diária tem que ser a mesma do ponto mensal, senão a soma
        # dos dias deixa de telescopar para o valor do mês.
        active.add(closing)

        ordered = sorted(active)
        boundaries = [previous_month_end(month)] + ordered
        return boundaries, [day.isoformat() for day in ordered]

    async def _load_prices(
        self, market_tickers: List[str], start: date, end: date
    ) -> Dict[str, PriceLookup]:
        series = await self.repository.get_price_series_by_tickers(market_tickers, start, end)
        seeds = await self.repository.get_last_prices_before(market_tickers, start)

        lookups: Dict[str, PriceLookup] = {}
        for ticker in market_tickers:
            rows = list(series.get(ticker, []))
            seed = seeds.get(ticker)
            # A fronteira inicial costuma cair em fim de semana; sem o seed o ativo seria
            # avaliado a custo na abertura e a mercado no fechamento, inflando a 1ª barra.
            if seed and (not rows or rows[0][0] > seed[0]):
                rows.insert(0, seed)
            if rows:
                lookups[ticker] = PriceLookup([row[0] for row in rows], [row[1] for row in rows])
        return lookups

    def _states_on(
        self,
        timelines: Dict[str, List[PositionCheckpoint]],
        prices: Dict[str, PriceLookup],
        day: date,
    ) -> Dict[str, PositionState]:
        states: Dict[str, PositionState] = {}
        for position, checkpoints in timelines.items():
            checkpoint = self._checkpoint_on(checkpoints, day)
            if checkpoint is None:
                states[position] = PositionState(value=0.0, flow=0.0, income=0.0, priced=False)
                continue

            lookup = prices.get(PortfolioService._market_data_ticker(position))
            close = lookup.close_on(day) if lookup else None
            priced = close is not None
            value = checkpoint.quantity * close if priced else checkpoint.cost
            states[position] = PositionState(
                value=value,
                flow=checkpoint.cumulative_flow,
                income=checkpoint.cumulative_income,
                priced=priced,
            )
        return states

    @staticmethod
    def _checkpoint_on(
        checkpoints: List[PositionCheckpoint], day: date
    ) -> PositionCheckpoint | None:
        index = bisect_right([checkpoint.date for checkpoint in checkpoints], day) - 1
        return checkpoints[index] if index >= 0 else None

    @classmethod
    def _build_timelines(
        cls, transactions: List[Transaction]
    ) -> Dict[str, List[PositionCheckpoint]]:
        quantities: Dict[str, float] = {}
        costs: Dict[str, float] = {}
        flows: Dict[str, float] = {}
        incomes: Dict[str, float] = {}
        timelines: Dict[str, List[PositionCheckpoint]] = {}

        for transaction in transactions:
            position = PortfolioService._position_ticker(transaction.ticker)
            quantities.setdefault(position, 0.0)
            costs.setdefault(position, 0.0)
            flows.setdefault(position, 0.0)
            incomes.setdefault(position, 0.0)

            quantity = transaction.quantity or 0.0
            value = PortfolioService._transaction_value(transaction)

            if PortfolioService._is_income_transaction(transaction):
                incomes[position] += value
            elif PortfolioService._is_subscription_cost_transaction(transaction):
                costs[position] += value
                flows[position] += value
            elif PortfolioService._is_subscription_exercise_transaction(transaction):
                quantities[position] += quantity
                costs[position] += value
                flows[position] += value
            elif PortfolioService._is_neutral_transaction(transaction):
                continue
            elif PortfolioService._is_credit_transaction(transaction):
                quantities[position] += quantity
                costs[position] += value
                flows[position] += value
            elif PortfolioService._is_debit_transaction(transaction):
                held = quantities[position]
                if held <= 0 or quantity <= 0:
                    continue
                sold = min(quantity, held)
                average = costs[position] / held if held > 0 else 0.0
                quantities[position] = held - sold
                costs[position] = max(0.0, costs[position] - sold * average)
                flows[position] -= value
            else:
                continue

            if quantities[position] <= CLOSED_POSITION_EPSILON:
                quantities[position] = 0.0
                costs[position] = 0.0

            cls._append_checkpoint(
                timelines.setdefault(position, []),
                PositionCheckpoint(
                    date=transaction.date,
                    quantity=quantities[position],
                    cost=costs[position],
                    cumulative_flow=flows[position],
                    cumulative_income=incomes[position],
                ),
            )

        return timelines

    @staticmethod
    def _append_checkpoint(
        checkpoints: List[PositionCheckpoint], checkpoint: PositionCheckpoint
    ) -> None:
        if checkpoints and checkpoints[-1].date == checkpoint.date:
            checkpoints[-1] = checkpoint
            return
        checkpoints.append(checkpoint)

    @staticmethod
    def _round(value: float) -> float:
        return round(value, 2)

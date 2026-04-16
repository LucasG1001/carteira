from typing import Dict, List

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import BusinessException
from src.modules.MarketData.models.market_data_model import StockPrice
from src.modules.Portfolio.models.transaction_model import Transaction
from src.modules.Portfolio.repositories.transaction_repository import TransactionRepository
from src.modules.Portfolio.schemas.portfolio_schema import AssetDetailResponse, AssetSummary, PortfolioSummary, TransactionDetail


class PortfolioService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = TransactionRepository(session)

    @staticmethod
    def classify_ticker(ticker: str) -> str:
        upper_ticker = ticker.upper()
        if upper_ticker.endswith("11") or upper_ticker.endswith("11B"):
            if upper_ticker.endswith("B11"):
                return "ETF"
            return "FII"
        if upper_ticker.endswith("39"):
            return "ETF"
        if upper_ticker.startswith("TESOURO") or upper_ticker.startswith("CDB") or upper_ticker.startswith("LCI") or upper_ticker.startswith("LCA"):
            return "Renda Fixa"
        if upper_ticker in ["BTC", "ETH", "SOL"]:
            return "Cripto"
        if len(upper_ticker) == 5 and upper_ticker[-1].isdigit():
            return "Ação"

        return "Outros"

    @staticmethod
    def _round(value: float, digits: int = 2) -> float:
        return round(value, digits)

    @classmethod
    def _market_data_ticker(cls, ticker: str) -> str:
        normalized = ticker.upper()
        if "." in normalized:
            return normalized

        if cls.classify_ticker(normalized) in {"Ação", "ETF", "FII"}:
            return f"{normalized}.SA"

        return normalized

    def _build_asset_summary(self, ticker: str, transactions: List[Transaction], latest_price: StockPrice | None) -> AssetSummary:
        total_quantity = 0.0
        average_price = 0.0
        total_dividends = 0.0

        for transaction in transactions:
            operation = transaction.operation_type.strip().lower()
            quantity = transaction.quantity or 0.0
            unit_price = transaction.unit_price or 0.0
            operation_value = transaction.operation_value or 0.0

            if operation in ["compra", "transferência - liquidação", "transferÃªncia - liquidaÃ§Ã£o"]:
                new_total_quantity = total_quantity + quantity
                if new_total_quantity > 0:
                    average_price = ((total_quantity * average_price) + (quantity * unit_price)) / new_total_quantity
                total_quantity = new_total_quantity
            elif operation in ["bonificação em ativos", "bonificaÃ§Ã£o em ativos"]:
                new_total_quantity = total_quantity + quantity
                if new_total_quantity > 0:
                    average_price = ((total_quantity * average_price) + (quantity * 0.0)) / new_total_quantity
                total_quantity = new_total_quantity
            elif operation in ["venda", "retirada de custódia", "retirada de custÃ³dia"]:
                total_quantity = max(0.0, total_quantity - quantity)
            elif operation in ["rendimento", "dividendo", "juros sobre capital próprio", "juros sobre capital prÃ³prio"]:
                total_dividends += operation_value

        total_invested = total_quantity * average_price
        current_price = latest_price.close if latest_price else 0.0
        current_value = total_quantity * current_price
        variation_value = current_value - total_invested
        variation_percent = (variation_value / total_invested * 100) if total_invested > 0 else 0.0
        profitability_value = current_value + total_dividends - total_invested
        profitability_percent = (profitability_value / total_invested * 100) if total_invested > 0 else 0.0
        dividend_yield_percent = (total_dividends / total_invested * 100) if total_invested > 0 else 0.0

        return AssetSummary(
            ticker=ticker,
            asset_type=self.classify_ticker(ticker),
            total_quantity=self._round(total_quantity, 4),
            average_price=self._round(average_price, 4),
            total_invested=self._round(total_invested, 2),
            total_dividends=self._round(total_dividends, 2),
            price_date=latest_price.date if latest_price else None,
            price_updated_at=latest_price.created_at if latest_price else None,
            current_price=self._round(current_price, 4),
            current_value=self._round(current_value, 2),
            variation_value=self._round(variation_value, 2),
            variation_percent=self._round(variation_percent, 2),
            profitability_value=self._round(profitability_value, 2),
            profitability_percent=self._round(profitability_percent, 2),
            dividend_yield_percent=self._round(dividend_yield_percent, 2),
        )

    async def get_portfolio_summary(self, user_id: str) -> PortfolioSummary:
        all_transactions = await self.repository.get_all_by_user(user_id)

        by_ticker: Dict[str, List[Transaction]] = {}
        for transaction in all_transactions:
            by_ticker.setdefault(transaction.ticker, []).append(transaction)

        market_ticker_map = {ticker: self._market_data_ticker(ticker) for ticker in by_ticker.keys()}
        latest_prices = await self.repository.get_latest_prices_by_tickers(list(set(market_ticker_map.values())))

        assets: List[AssetSummary] = []
        general_total_invested = 0.0
        general_total_dividends = 0.0
        general_current_value = 0.0
        general_variation_value = 0.0
        general_profitability_value = 0.0

        for ticker, transactions in by_ticker.items():
            summary = self._build_asset_summary(
                ticker=ticker,
                transactions=transactions,
                latest_price=latest_prices.get(market_ticker_map[ticker]),
            )

            if summary.total_quantity > 0 or summary.total_dividends > 0:
                assets.append(summary)
                general_total_invested += summary.total_invested
                general_total_dividends += summary.total_dividends
                general_current_value += summary.current_value
                general_variation_value += summary.variation_value
                general_profitability_value += summary.profitability_value

        return PortfolioSummary(
            user_id=user_id,
            assets=assets,
            general_total_invested=self._round(general_total_invested, 2),
            general_total_dividends=self._round(general_total_dividends, 2),
            general_current_value=self._round(general_current_value, 2),
            general_variation_value=self._round(general_variation_value, 2),
            general_variation_percent=self._round((general_variation_value / general_total_invested * 100) if general_total_invested > 0 else 0.0, 2),
            general_profitability_value=self._round(general_profitability_value, 2),
            general_profitability_percent=self._round((general_profitability_value / general_total_invested * 100) if general_total_invested > 0 else 0.0, 2),
            general_dividend_yield_percent=self._round((general_total_dividends / general_total_invested * 100) if general_total_invested > 0 else 0.0, 2),
        )

    async def get_asset_details(self, user_id: str, ticker: str) -> AssetDetailResponse:
        transactions = await self.repository.get_by_ticker(user_id, ticker)
        if not transactions:
            raise BusinessException(404, f"Ativo {ticker} não encontrado ou sem transações")

        latest_prices = await self.repository.get_latest_prices_by_tickers([self._market_data_ticker(ticker)])
        summary = self._build_asset_summary(
            ticker,
            transactions,
            latest_prices.get(self._market_data_ticker(ticker)),
        )

        history = [
            TransactionDetail(
                id=transaction.id,
                operation_type=transaction.operation_type,
                date=transaction.date,
                quantity=transaction.quantity,
                unit_price=transaction.unit_price,
                operation_value=transaction.operation_value,
            )
            for transaction in transactions
        ]

        return AssetDetailResponse(**summary.model_dump(), history=history)

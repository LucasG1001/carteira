import hashlib
import re
import unicodedata
import uuid
from typing import Dict, List

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import BusinessException
from src.modules.MarketData.models.market_data_model import StockPrice
from src.modules.Portfolio.models.transaction_model import Transaction
from src.modules.Portfolio.repositories.transaction_repository import TransactionRepository
from src.modules.Portfolio.schemas.portfolio_schema import (
    AssetDetailResponse,
    AssetSummary,
    ManualAssetCreateRequest,
    ManualAssetResponse,
    PortfolioSummary,
    TransactionDetail,
)
from src.modules.Upload.models.upload_model import Upload
from src.modules.Upload.repositories.upload_repository import UploadRepository


class PortfolioService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = TransactionRepository(session)
        self.upload_repository = UploadRepository(session)

    @staticmethod
    def _normalize_text(value: str | None) -> str:
        if value is None:
            return ""

        normalized = unicodedata.normalize("NFKD", value.strip())
        normalized = normalized.encode("ascii", "ignore").decode("ascii")
        return normalized.lower()

    @classmethod
    def normalize_ticker(cls, ticker: str) -> str:
        normalized = ticker.upper().strip()
        if re.match(r"^[A-Z]{4}\d{2}$", normalized) and normalized.endswith("13"):
            return f"{normalized[:-2]}11"

        return normalized

    @classmethod
    def _position_ticker(cls, ticker: str) -> str:
        normalized = cls.normalize_ticker(ticker)
        if len(normalized) >= 6 and normalized[-2:].isdigit() and normalized.endswith(("12", "13")):
            return f"{normalized[:-2]}11"

        return normalized

    @classmethod
    def classify_ticker(cls, ticker: str) -> str:
        upper_ticker = cls.normalize_ticker(ticker)
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
            return "Acao"

        return "Outros"

    @staticmethod
    def _round(value: float, digits: int = 2) -> float:
        return round(value, digits)

    @classmethod
    def _market_data_ticker(cls, ticker: str) -> str:
        normalized = cls.normalize_ticker(ticker)
        if "." in normalized:
            return normalized

        if cls.classify_ticker(normalized) in {"Acao", "ETF", "FII"}:
            return f"{normalized}.SA"

        return normalized

    @classmethod
    def _normalized_operation(cls, transaction: Transaction) -> str:
        return cls._normalize_text(transaction.operation_type)

    @classmethod
    def _normalized_entry_side(cls, transaction: Transaction) -> str:
        return cls._normalize_text(transaction.entry_side)

    @classmethod
    def _is_income_transaction(cls, transaction: Transaction) -> bool:
        operation = cls._normalized_operation(transaction)
        income_keywords = (
            "rendimento",
            "dividendo",
            "juros",
            "leilao de fracao",
            "pagamento de juros",
        )
        return any(keyword in operation for keyword in income_keywords)

    @classmethod
    def _is_neutral_transaction(cls, transaction: Transaction) -> bool:
        operation = cls._normalized_operation(transaction)
        if (
            cls._is_subscription_exercise_transaction(transaction)
            or cls._is_subscription_cost_transaction(transaction)
            or cls._is_zero_value_transfer_transaction(transaction)
        ):
            return False

        neutral_keywords = (
            "direito de subscricao",
            "direitos de subscricao",
            "cessao de direitos",
            "direito sobras de subscricao",
            "solicitacao de subscricao",
            "recibo de subscricao",
            "atualizacao",
        )
        return any(keyword in operation for keyword in neutral_keywords)

    @classmethod
    def _is_subscription_exercise_transaction(cls, transaction: Transaction) -> bool:
        operation = cls._normalized_operation(transaction)
        ticker = transaction.ticker.upper().strip()
        return ticker.endswith("12") and "exercido" in operation and "nao exercido" not in operation

    @classmethod
    def _is_subscription_cost_transaction(cls, transaction: Transaction) -> bool:
        operation = cls._normalized_operation(transaction)
        entry_side = cls._normalized_entry_side(transaction)
        ticker = transaction.ticker.upper().strip()
        return ticker.endswith("12") and "transferencia - liquidacao" in operation and entry_side == "credito"

    @classmethod
    def _is_zero_value_transfer_transaction(cls, transaction: Transaction) -> bool:
        operation = cls._normalized_operation(transaction)
        return (
            operation == "transferencia"
            and (transaction.unit_price or 0.0) == 0.0
            and (transaction.operation_value or 0.0) == 0.0
        )

    @staticmethod
    def _transaction_value(transaction: Transaction) -> float:
        operation_value = transaction.operation_value or 0.0
        if operation_value > 0:
            return operation_value

        quantity = transaction.quantity or 0.0
        unit_price = transaction.unit_price or 0.0
        return quantity * unit_price

    @classmethod
    def _is_credit_transaction(cls, transaction: Transaction) -> bool:
        operation = cls._normalized_operation(transaction)
        entry_side = cls._normalized_entry_side(transaction)

        if (
            cls._is_income_transaction(transaction)
            or cls._is_neutral_transaction(transaction)
            or cls._is_subscription_exercise_transaction(transaction)
            or cls._is_subscription_cost_transaction(transaction)
            or cls._is_zero_value_transfer_transaction(transaction)
        ):
            return False

        if "bonific" in operation or "desdobro" in operation:
            return True

        if operation == "compra" or operation == "aplicacao":
            return True

        if operation == "compra / venda":
            return entry_side == "credito"

        if "transferencia - liquidacao" in operation or operation == "transferencia":
            return entry_side == "credito"

        return (
            entry_side == "credito"
            and cls.classify_ticker(transaction.ticker) == "Renda Fixa"
            and "resgate" not in operation
            and "vencimento" not in operation
        )

    @classmethod
    def _is_debit_transaction(cls, transaction: Transaction) -> bool:
        operation = cls._normalized_operation(transaction)
        entry_side = cls._normalized_entry_side(transaction)

        if (
            cls._is_income_transaction(transaction)
            or cls._is_neutral_transaction(transaction)
            or cls._is_subscription_exercise_transaction(transaction)
            or cls._is_subscription_cost_transaction(transaction)
            or cls._is_zero_value_transfer_transaction(transaction)
        ):
            return False

        if operation == "venda" or "retirada" in operation:
            return True

        if "fracao em ativos" in operation:
            return True

        if "resgate" in operation or "vencimento" in operation:
            return True

        if operation == "compra / venda":
            return entry_side == "debito"

        if "transferencia - liquidacao" in operation or operation == "transferencia":
            return entry_side == "debito"

        return entry_side == "debito" and cls.classify_ticker(transaction.ticker) == "Renda Fixa"

    @staticmethod
    def _generate_manual_upload_hash() -> str:
        return hashlib.sha256(uuid.uuid4().hex.encode("utf-8")).hexdigest()

    def _build_asset_summary(self, ticker: str, transactions: List[Transaction], latest_price: StockPrice | None) -> AssetSummary:
        total_quantity = 0.0
        total_cost = 0.0
        total_dividends = 0.0

        for transaction in transactions:
            quantity = transaction.quantity or 0.0
            operation_value = self._transaction_value(transaction)

            if self._is_income_transaction(transaction):
                total_dividends += operation_value
                continue

            if self._is_subscription_cost_transaction(transaction):
                total_cost += operation_value
                continue

            if self._is_subscription_exercise_transaction(transaction):
                total_quantity += quantity
                total_cost += operation_value
                continue

            if self._is_neutral_transaction(transaction):
                continue

            if self._is_credit_transaction(transaction):
                total_quantity += quantity
                total_cost += operation_value
                continue

            if self._is_debit_transaction(transaction):
                if total_quantity <= 0 or quantity <= 0:
                    continue

                sold_quantity = min(quantity, total_quantity)
                average_cost = total_cost / total_quantity if total_quantity > 0 else 0.0
                total_quantity -= sold_quantity
                total_cost = max(0.0, total_cost - (sold_quantity * average_cost))

        if total_quantity <= 0:
            total_quantity = 0.0
            total_cost = 0.0

        average_price = total_cost / total_quantity if total_quantity > 0 else 0.0
        total_invested = total_cost
        current_price = latest_price.close if latest_price else 0.0
        current_value = total_quantity * current_price
        variation_value = current_value - total_invested
        variation_percent = (variation_value / total_invested * 100) if total_invested > 0 else 0.0
        profitability_value = current_value + total_dividends - total_invested
        profitability_percent = (profitability_value / total_invested * 100) if total_invested > 0 else 0.0

        return AssetSummary(
            ticker=self.normalize_ticker(ticker),
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
        )

    async def get_portfolio_summary(self, user_id: str) -> PortfolioSummary:
        all_transactions = await self.repository.get_all_by_user(user_id)

        by_ticker: Dict[str, List[Transaction]] = {}
        for transaction in all_transactions:
            canonical_ticker = self._position_ticker(transaction.ticker)
            by_ticker.setdefault(canonical_ticker, []).append(transaction)

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

            if summary.total_quantity <= 0:
                continue

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
        )

    async def create_manual_asset(self, user_id: str, payload: ManualAssetCreateRequest) -> ManualAssetResponse:
        normalized_ticker = self.normalize_ticker(payload.ticker)
        operation_type = payload.operation_type.strip().title()
        entry_side = "Credito" if operation_type == "Compra" else "Debito"
        operation_value = round(payload.quantity * payload.unit_price, 2)

        manual_upload = Upload(
            user_id=user_id,
            filename=f"manual-{normalized_ticker}.entry",
            file_hash=self._generate_manual_upload_hash(),
        )
        manual_upload = await self.upload_repository.create(manual_upload)

        transaction = Transaction(
            upload_id=manual_upload.id,
            user_id=user_id,
            ticker=normalized_ticker,
            operation_type=operation_type,
            entry_side=entry_side,
            date=payload.date,
            quantity=payload.quantity,
            unit_price=payload.unit_price,
            operation_value=operation_value,
        )

        self.session.add(transaction)
        await self.session.commit()
        await self.session.refresh(transaction)

        return ManualAssetResponse(
            id=transaction.id,
            ticker=transaction.ticker,
            operation_type=transaction.operation_type,
            entry_side=transaction.entry_side or entry_side,
            date=transaction.date,
            quantity=transaction.quantity,
            unit_price=transaction.unit_price or 0.0,
            operation_value=transaction.operation_value or operation_value,
        )

    async def get_asset_details(self, user_id: str, ticker: str) -> AssetDetailResponse:
        canonical_ticker = self._position_ticker(ticker)
        transactions = [
            transaction
            for transaction in await self.repository.get_all_by_user(user_id)
            if self._position_ticker(transaction.ticker) == canonical_ticker
        ]
        if not transactions:
            raise BusinessException(404, f"Ativo {canonical_ticker} nao encontrado ou sem transacoes")

        latest_prices = await self.repository.get_latest_prices_by_tickers([self._market_data_ticker(canonical_ticker)])
        summary = self._build_asset_summary(
            canonical_ticker,
            transactions,
            latest_prices.get(self._market_data_ticker(canonical_ticker)),
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

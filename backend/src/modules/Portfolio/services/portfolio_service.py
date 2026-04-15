import re
from typing import Dict, List
from sqlalchemy.ext.asyncio import AsyncSession
from src.modules.Portfolio.models.transaction_model import Transaction
from src.modules.Portfolio.repositories.transaction_repository import TransactionRepository
from src.modules.Portfolio.schemas.portfolio_schema import PortfolioSummary, AssetSummary, AssetDetailResponse, TransactionDetail

class PortfolioService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = TransactionRepository(session)

    @staticmethod
    def classify_ticker(ticker: str) -> str:
        upper_ticker = ticker.upper()
        if upper_ticker.endswith("11") or upper_ticker.endswith("11B"):
            # Could be ETF or FII, check ETF first
            if upper_ticker.endswith("B11"):
                return "ETF"
            return "FII"
        if upper_ticker.endswith("39"):
            return "ETF"
        if upper_ticker.startswith("TESOURO") or upper_ticker.startswith("CDB") or upper_ticker.startswith("LCI") or upper_ticker.startswith("LCA"):
            return "Renda Fixa"
        if upper_ticker in ["BTC", "ETH", "SOL"]:
            return "Cripto"
        # 5 characters, last is digit (Ação)
        if len(upper_ticker) == 5 and upper_ticker[-1].isdigit():
            return "Ação"
        
        return "Outros"

    @staticmethod
    def _aggregate_transactions(ticker: str, transactions: List[Transaction]) -> AssetSummary:
        quantidade_total = 0.0
        preco_medio = 0.0
        proventos_totais = 0.0

        for t in transactions:
            op = t.operation_type.strip().lower()
            qty = t.quantity or 0.0
            price = t.unit_price or 0.0
            val = t.operation_value or 0.0

            if op in ["compra", "transferência - liquidação"]:
                nova_qtd = quantidade_total + qty
                if nova_qtd > 0:
                    preco_medio = ((quantidade_total * preco_medio) + (qty * price)) / nova_qtd
                quantidade_total = nova_qtd
            elif op == "bonificação em ativos":
                nova_qtd = quantidade_total + qty
                if nova_qtd > 0:
                    preco_medio = ((quantidade_total * preco_medio) + (qty * 0)) / nova_qtd
                quantidade_total = nova_qtd
            elif op in ["venda", "retirada de custódia"]:
                # Decrease position, but average price remains the same
                quantidade_total = max(0.0, quantidade_total - qty)
            elif op in ["rendimento", "dividendo", "juros sobre capital próprio"]:
                proventos_totais += val
            # Others: Atualização, Direito de Subscrição, etc... do not affect amount or pm

        return AssetSummary(
            ticker=ticker,
            asset_type=PortfolioService.classify_ticker(ticker),
            total_quantity=round(quantidade_total, 4),
            average_price=round(preco_medio, 4),
            total_invested=round(quantidade_total * preco_medio, 2),
            total_dividends=round(proventos_totais, 2)
        )

    async def get_portfolio_summary(self, user_id: str) -> PortfolioSummary:
        all_transactions = await self.repository.get_all_by_user(user_id)
        
        # Group by ticker
        by_ticker: Dict[str, List[Transaction]] = {}
        for t in all_transactions:
            by_ticker.setdefault(t.ticker, []).append(t)

        assets: List[AssetSummary] = []
        gen_invested = 0.0
        gen_dividends = 0.0

        for ticker, txs in by_ticker.items():
            summary = self._aggregate_transactions(ticker, txs)
            
            # Skip assets that no longer have a position and have no dividends? 
            # Often users like to see past positions if they yielded dividends. Let's include if qty > 0 or dividends > 0
            if summary.total_quantity > 0 or summary.total_dividends > 0:
                assets.append(summary)
                gen_invested += summary.total_invested
                gen_dividends += summary.total_dividends

        return PortfolioSummary(
            user_id=user_id,
            assets=assets,
            general_total_invested=round(gen_invested, 2),
            general_total_dividends=round(gen_dividends, 2)
        )

    async def get_asset_details(self, user_id: str, ticker: str) -> AssetDetailResponse:
        transactions = await self.repository.get_by_ticker(user_id, ticker)
        if not transactions:
            from src.core.exceptions import BusinessException
            raise BusinessException(404, f"Ativo {ticker} não encontrado ou sem transações")
            
        summary = self._aggregate_transactions(ticker, transactions)
        
        history = [
            TransactionDetail(
                id=t.id,
                operation_type=t.operation_type,
                date=t.date,
                quantity=t.quantity,
                unit_price=t.unit_price,
                operation_value=t.operation_value
            )
            for t in transactions
        ]
        
        return AssetDetailResponse(
            **summary.model_dump(),
            history=history
        )

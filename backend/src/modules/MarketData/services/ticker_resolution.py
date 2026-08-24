from __future__ import annotations

import logging
from typing import Any

from src.modules.Portfolio.services.portfolio_service import PortfolioService


def resolve_market_tickers(repository: Any, logger: logging.Logger) -> list[str]:
    try:
        portfolio_tickers = repository.get_distinct_transaction_tickers()
    except Exception:
        logger.exception("Falha ao carregar tickers da carteira")
        return []

    tickers = PortfolioService.market_tickers_for(portfolio_tickers)
    logger.info("Tickers da carteira | total=%s", len(tickers))
    return tickers

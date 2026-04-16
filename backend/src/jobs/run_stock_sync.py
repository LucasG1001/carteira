from __future__ import annotations

import argparse
import os
import sys

from dotenv import load_dotenv


if __package__ in {None, ""}:
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Coletor agendado de dados de ações")
    parser.add_argument(
        "--once",
        action="store_true",
        help="Executa uma única sincronização imediatamente",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Ignora a janela de mercado ao executar manualmente",
    )
    return parser


def main() -> None:
    load_dotenv()

    from src.core.config import settings
    from src.modules.MarketData.repositories.market_data_repository import MarketDataRepository
    from src.modules.MarketData.services.logging_config import setup_stock_sync_logging
    from src.modules.MarketData.services.stock_sync_scheduler import StockSyncScheduler
    from src.modules.MarketData.services.stock_sync_service import StockSyncService
    from src.modules.MarketData.services.yfinance_client import YFinanceMarketDataClient

    parser = build_parser()
    args = parser.parse_args()

    logger = setup_stock_sync_logging(settings.stock_sync_log_path)
    service = StockSyncService(
        client=YFinanceMarketDataClient(),
        repository=MarketDataRepository(settings.SYNC_DATABASE_URL),
        logger=logger,
        timezone_name=settings.MARKET_DATA_TIMEZONE,
        start_hour=settings.STOCK_SYNC_START_HOUR,
        end_hour=settings.STOCK_SYNC_END_HOUR,
        max_workers=settings.STOCK_SYNC_MAX_WORKERS,
        submission_delay_seconds=settings.STOCK_SYNC_SUBMISSION_DELAY_SECONDS,
        tickers_path=settings.stock_sync_tickers_path,
    )

    if args.once:
        service.run_once(force=args.force)
        return

    scheduler = StockSyncScheduler(service=service, logger=logger)
    scheduler.run_forever()


if __name__ == "__main__":
    main()

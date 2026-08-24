from __future__ import annotations

import argparse
import os
import sys
from datetime import date, datetime

from dotenv import load_dotenv

if __package__ in {None, ""}:
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))


def parse_date(value: str) -> date:
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise argparse.ArgumentTypeError(f"Data inválida: {value}. Use o formato AAAA-MM-DD.") from exc


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Preenche o histórico de cotações da carteira")
    parser.add_argument("--start", type=parse_date, help="Data inicial (padrão: primeira transação)")
    parser.add_argument("--end", type=parse_date, help="Data final (padrão: hoje)")
    parser.add_argument("--tickers", nargs="+", help="Tickers específicos (padrão: toda a carteira)")
    parser.add_argument("--chunk-size", type=int, default=10, help="Tickers por lote de download")
    return parser


def main() -> None:
    load_dotenv()

    from src.core.config import settings
    from src.modules.MarketData.repositories.market_data_repository import MarketDataRepository
    from src.modules.MarketData.services.logging_config import setup_stock_sync_logging
    from src.modules.MarketData.services.price_backfill_service import PriceBackfillService
    from src.modules.MarketData.services.yfinance_client import YFinanceMarketDataClient

    parser = build_parser()
    args = parser.parse_args()

    logger = setup_stock_sync_logging(settings.stock_sync_log_path)
    service = PriceBackfillService(
        client=YFinanceMarketDataClient(),
        repository=MarketDataRepository(settings.SYNC_DATABASE_URL),
        logger=logger,
        timezone_name=settings.MARKET_DATA_TIMEZONE,
        chunk_size=args.chunk_size,
        submission_delay_seconds=settings.STOCK_SYNC_SUBMISSION_DELAY_SECONDS,
    )

    service.run(start_date=args.start, end_date=args.end, tickers=args.tickers)


if __name__ == "__main__":
    main()

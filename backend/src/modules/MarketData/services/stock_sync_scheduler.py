from __future__ import annotations

import time

import schedule


class StockSyncScheduler:
    def __init__(self, service, logger, benchmark_service=None):
        self.service = service
        self.logger = logger
        self.benchmark_service = benchmark_service

    def _safe_run(self) -> None:
        try:
            self.service.run_once()
        except Exception:
            self.logger.exception("Falha inesperada na execução agendada; worker segue ativo")

    def _safe_run_benchmarks(self) -> None:
        if self.benchmark_service is None:
            return
        try:
            self.benchmark_service.run_once()
        except Exception:
            self.logger.exception("Falha inesperada no sync de benchmarks; worker segue ativo")

    def run_forever(self) -> None:
        schedule.clear("stock-sync")
        schedule.every().hour.at(":00").do(self._safe_run).tag("stock-sync")
        schedule.every().hour.at(":30").do(self._safe_run).tag("stock-sync")
        schedule.every(6).hours.do(self._safe_run_benchmarks).tag("stock-sync")
        self._safe_run_benchmarks()
        self.logger.info("Scheduler iniciado | execução a cada 30 min dentro da janela da bolsa")

        while True:
            schedule.run_pending()
            time.sleep(1)

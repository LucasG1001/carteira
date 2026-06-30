from __future__ import annotations

import time

import schedule


class StockSyncScheduler:
    def __init__(self, service, logger):
        self.service = service
        self.logger = logger

    def _safe_run(self) -> None:
        try:
            self.service.run_once()
        except Exception:
            self.logger.exception("Falha inesperada na execução agendada; worker segue ativo")

    def run_forever(self) -> None:
        schedule.clear("stock-sync")
        schedule.every().hour.at(":00").do(self._safe_run).tag("stock-sync")
        schedule.every().hour.at(":30").do(self._safe_run).tag("stock-sync")
        self.logger.info("Scheduler iniciado | execução a cada 30 min dentro da janela da bolsa")

        while True:
            schedule.run_pending()
            time.sleep(1)

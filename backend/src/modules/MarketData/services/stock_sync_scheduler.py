from __future__ import annotations

import time

import schedule


class StockSyncScheduler:
    def __init__(self, service, logger):
        self.service = service
        self.logger = logger

    def run_forever(self) -> None:
        schedule.clear("stock-sync")
        schedule.every().hour.at(":00").do(self.service.run_once).tag("stock-sync")
        self.logger.info("Scheduler iniciado | execução a cada hora cheia")

        while True:
            schedule.run_pending()
            time.sleep(1)

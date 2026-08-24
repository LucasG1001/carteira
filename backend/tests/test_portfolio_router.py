from __future__ import annotations

import unittest

from src.modules.Portfolio.portfolio_router import router


class RouteOrderTests(unittest.TestCase):
    def test_named_routes_are_declared_before_the_ticker_catch_all(self) -> None:
        paths = [route.path for route in router.routes]
        catch_all = paths.index("/{ticker}")

        for path in ("/performance", "/dividends", "/evolution", "/transactions"):
            self.assertLess(paths.index(path), catch_all, f"{path} precisa vir antes de /{{ticker}}")


if __name__ == "__main__":
    unittest.main()

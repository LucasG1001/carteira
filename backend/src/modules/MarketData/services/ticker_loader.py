from pathlib import Path


def load_tickers(tickers_path: Path) -> list[str]:
    if not tickers_path.exists():
        raise FileNotFoundError(f"Arquivo de tickers não encontrado: {tickers_path}")

    tickers: list[str] = []
    for raw_line in tickers_path.read_text(encoding="utf-8").splitlines():
        normalized = raw_line.strip().upper()
        if normalized:
            tickers.append(normalized)

    if not tickers:
        raise ValueError(f"Nenhum ticker válido encontrado em {tickers_path}")

    return tickers

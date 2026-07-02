import re
import unicodedata

SUBSCRIPTION_RECEIPT_PATTERN = re.compile(r"^[A-Z]{4}\d{2}$")


def normalize_text(value: object) -> str:
    if value is None:
        return ""

    normalized = unicodedata.normalize("NFKD", str(value).strip())
    normalized = normalized.encode("ascii", "ignore").decode("ascii")
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized.lower()


def subscription_receipt_to_base(ticker: str) -> str:
    if SUBSCRIPTION_RECEIPT_PATTERN.match(ticker) and ticker.endswith("13"):
        return f"{ticker[:-2]}11"

    return ticker

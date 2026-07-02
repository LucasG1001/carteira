import asyncio
import hashlib

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import BusinessException
from src.modules.Portfolio.repositories.transaction_repository import TransactionRepository
from src.modules.Upload.models.upload_model import Upload
from src.modules.Upload.repositories.upload_repository import UploadRepository
from src.modules.Upload.services.b3_parser_service import B3ParserService


class UploadService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = UploadRepository(session)

    async def process_upload(self, file: UploadFile, user_id: str) -> Upload:
        file_content = await file.read()
        file_hash = hashlib.sha256(file_content).hexdigest()

        existing_upload = await self.repository.get_by_hash(file_hash, user_id)
        if existing_upload:
            await self.repository.delete(existing_upload)

        new_upload = Upload(
            user_id=user_id,
            filename=file.filename,
            file_hash=file_hash,
        )
        new_upload = await self.repository.create(new_upload)

        transactions = await asyncio.to_thread(B3ParserService.parse_excel, file_content, new_upload.id, user_id)
        if not transactions:
            raise BusinessException(400, "Nenhuma transação válida encontrada no arquivo.")

        # Merge: replace existing transactions of the same tickers within the file's
        # date range (B3 overrides manual for those tickers; re-import is idempotent).
        dates = [transaction.date for transaction in transactions]
        tickers = list({transaction.ticker for transaction in transactions})
        transaction_repository = TransactionRepository(self.session)
        await transaction_repository.delete_in_range_for_tickers(
            user_id, tickers, min(dates), max(dates)
        )

        self.session.add_all(transactions)
        await self.session.commit()

        # Remove upload rows left without any transaction after the replace.
        await self.repository.delete_empty(user_id)
        await self.session.commit()

        await self.session.refresh(new_upload)

        return new_upload

    async def list_uploads(self, user_id: str) -> list[Upload]:
        return await self.repository.list_by_user(user_id)

    async def delete_upload(self, upload_id: int, user_id: str) -> None:
        upload = await self.repository.get_by_id(upload_id, user_id)
        if not upload:
            raise BusinessException(404, "Upload não encontrado.")

        await self.repository.delete(upload)
        await self.session.commit()

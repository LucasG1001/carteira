from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from src.modules.Upload.models.upload_model import Upload

class UploadRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_hash(self, file_hash: str, user_id: str) -> Upload | None:
        stmt = select(Upload).where(Upload.file_hash == file_hash, Upload.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def create(self, upload_data: Upload) -> Upload:
        self.session.add(upload_data)
        # Using flush instead of commit because service layers will commit
        await self.session.flush() 
        return upload_data

    async def list_by_user(self, user_id: str) -> list[Upload]:
        stmt = select(Upload).where(Upload.user_id == user_id).order_by(Upload.created_at.desc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, upload_id: int, user_id: str) -> Upload | None:
        stmt = select(Upload).where(Upload.id == upload_id, Upload.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def delete(self, upload: Upload) -> None:
        await self.session.delete(upload)
        # Cascade delete is handled by the database schema (ON DELETE CASCADE)
        await self.session.flush()

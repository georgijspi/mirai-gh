import os
import uuid
from fastapi import UploadFile
from pathlib import Path


class FileStorageService:
    async def store_wakeword_model(self, file: UploadFile) -> str:
        """Store a wakeword model file and return its path."""
        if not file.filename.endswith(".pv"):
            raise ValueError("Invalid file type. Only .pv files are allowed.")

        # Create wakeword models directory if it doesn't exist
        models_dir = Path("../frontend/mirai-ui/public/models")
        models_dir.mkdir(parents=True, exist_ok=True)

        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}.pv"
        file_path = models_dir / unique_filename

        # Write file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        return str(file_path.relative_to("../frontend/mirai-ui/public"))

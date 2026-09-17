import os

from pathlib import Path
from uuid import uuid4

from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from starlette.middleware.sessions import SessionMiddleware

from app.database import (
    SessionLocal,
    create_tables,
    test_database_connection,
)
from app.dependencies import get_current_user
from app.models import Image, User
from app.schemas import ImageResponse, LoginRequest, UserCreate, UserResponse
from app.storage import ALLOWED_MIME_TYPES, MAX_FILE_SIZE, STORAGE_DIR

app = FastAPI(title="Image Host API")


REGISTER_ENABLED = os.environ.get("REGISTER_ENABLED", "false").lower() == "true"
SESSION_SECRET = os.environ["SESSION_SECRET"]

app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET,
    session_cookie="image_host_session",
    max_age=60 * 60 * 24 * 7,
    https_only=False,
    same_site="lax",
)


@app.on_event("startup")
def startup():
    create_tables()


@app.get("/api/test")
def test():
    return {"message": "FastAPI is working"}

@app.get("/api/db-test")
def database_test():
    connected = test_database_connection()

    return {"database_connected": connected}


@app.post("/api/register", response_model=UserResponse)
def register(user_data: UserCreate):
    if not REGISTER_ENABLED:
        raise HTTPException(status_code=404, detail="Not found")

    with SessionLocal() as db:
        existing_user = (
            db.query(User)
            .filter(User.username == user_data.username)
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="Username already exists",
            )

        user = User(
            username=user_data.username,
            password_hash=hash_password(user_data.password),
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        return user


@app.post("/api/login", response_model=UserResponse)
def login(login_data: LoginRequest, request: Request):
    with SessionLocal() as db:
        user = (
            db.query(User)
            .filter(User.username == login_data.username)
            .first()
        )

        if not user or not verify_password(
            login_data.password,
            user.password_hash,
        ):
            raise HTTPException(
                status_code=401,
                detail="Invalid username or password",
            )

        request.session["user_id"] = user.id

        return user


@app.post("/api/logout")
def logout(request: Request):
    request.session.clear()

    return {"message": "Logged out"}


@app.get("/api/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@app.post("/api/upload", response_model=ImageResponse)
def upload_image(
    file: UploadFile,
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image type",
        )

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is missing",
        )

    STORAGE_DIR.mkdir(parents=True, exist_ok=True)

    extension = ALLOWED_MIME_TYPES[file.content_type]
    storage_filename = f"{uuid4().hex}{extension}"
    storage_path = STORAGE_DIR / storage_filename

    file_size = 0

    try:
        with storage_path.open("wb") as destination:
            while chunk := file.file.read(1024 * 1024):
                file_size += len(chunk)

                if file_size > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=413,
                        detail="File is too large",
                    )

                destination.write(chunk)

        with SessionLocal() as db:
            image = Image(
                owner_id=current_user.id,
                original_filename=file.filename,
                storage_filename=storage_filename,
                mime_type=file.content_type,
                file_size=file_size,
            )

            db.add(image)
            db.commit()
            db.refresh(image)

            return ImageResponse(
                id=image.id,
                original_filename=image.original_filename,
                mime_type=image.mime_type,
                file_size=image.file_size,
                uploaded_at=image.uploaded_at,
                url=f"/i/{image.storage_filename}",
            )

    except HTTPException:
        storage_path.unlink(missing_ok=True)
        raise

    except Exception:
        storage_path.unlink(missing_ok=True)
        raise

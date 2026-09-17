import os

from fastapi import Depends, FastAPI, HTTPException, Request
from starlette.middleware.sessions import SessionMiddleware

from app.database import (
    SessionLocal,
    create_tables,
    test_database_connection,
)
from app.dependencies import get_current_user
from app.models import User
from app.schemas import LoginRequest, UserCreate, UserResponse
from app.security import hash_password, verify_password


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

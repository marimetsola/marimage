import os

from fastapi import FastAPI, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import User
from app.schemas import UserCreate, UserResponse
from app.security import hash_password


app = FastAPI(title="Image Host API")


REGISTER_ENABLED = os.environ.get("REGISTER_ENABLED", "false").lower() == "true"


@app.get("/api/test")
def test():
    return {"message": "FastAPI is working"}


@app.get("/api/db-test")
def database_test():
    from app.database import test_database_connection

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

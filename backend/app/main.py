from fastapi import FastAPI

from app.database import create_tables, test_database_connection


app = FastAPI(title="Image Host API")

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

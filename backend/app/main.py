from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.endpoints import profiles, questions, quizzes, sessions, system
from app.db.session import create_all_tables

app = FastAPI(title="Peace Cake API")

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    create_all_tables()


app.include_router(system.router)
app.include_router(profiles.router)
app.include_router(quizzes.router)
app.include_router(questions.router)
app.include_router(sessions.router)

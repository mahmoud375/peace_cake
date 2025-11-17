from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Peace Cake API"
    database_path: Path = (
        Path(__file__).resolve().parent.parent / "db" / "peace_cake.db"
    )
    primary_timer_seconds: int = 20
    steal_timer_seconds: int = 5
    steal_points_factor: float = 0.5
    min_teams: int = 2
    max_teams: int = 4

    class Config:
        env_prefix = "PEACE_"

    @property
    def database_url(self) -> str:
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        return f"sqlite:///{self.database_path}"


@lru_cache
def get_settings() -> Settings:
    return Settings()

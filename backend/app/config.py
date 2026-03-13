from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    HOSPITAL_ID: str = "HOSP_001"
    HOSPITAL_NAME: str = "Apollo Delhi"
    DATABASE_URL: str = "sqlite:///./healthcare.db"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()

"""Configuração via variáveis de ambiente, com os mesmos defaults do
docker-compose.yml na raiz do projeto (Postgres/Redis locais)."""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="ORDER_")

    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_user: str = "postgres"
    postgres_password: str = "123456"
    postgres_db: str = "api_fastapi_distributed_order_platform"

    redis_host: str = "localhost"
    redis_port: int = 6379

    app_port: int = 3030

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def redis_url(self) -> str:
        return f"redis://{self.redis_host}:{self.redis_port}/0"


settings = Settings()

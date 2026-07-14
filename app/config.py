from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://sanad:devpass@localhost:5432/sanaddb"
    app_name: str = "SANADIndus"
    groq_api_key: str = ""

    class Config:
        env_file = ".env"

settings = Settings()

GROQ_API_KEY = settings.groq_api_key
DATABASE_URL = settings.database_url

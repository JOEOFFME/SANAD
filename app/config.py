from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    app_name: str = "SANADIndus"
    groq_api_key: str = ""

    class Config:
        env_file = ".env"

settings = Settings()

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    app_name: str = "SANADIndus"
    groq_api_key: str = ""
    mqtt_username: str = "sanad_iot"
    mqtt_password: str = ""

    class Config:
        env_file = ".env"

settings = Settings()

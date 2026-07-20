from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    database_url: str
    app_name: str = "SANADIndus"
    groq_api_key: str = ""
    mqtt_username: str = "sanad_iot"
    mqtt_password: str = ""

settings = Settings()

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
	database_url: str = "postgresql://sanad:devpass@localhost:5432/sanaddb"
	app_name: str ="SANADIndus"
	class Config:
		env_file=".env"
settings=Settings()

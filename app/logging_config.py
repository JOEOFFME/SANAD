"""
Centralized logging configuration.
Import setup_logging() once per entry-point script (publisher, subscriber,
uvicorn app, purge cron) so every component logs in the same format,
to both console and a shared file.
"""
import logging
import os

LOG_DIR = "logs"
LOG_FILE = os.path.join(LOG_DIR, "sanadindus.log")

def setup_logging(name: str, level=logging.INFO):
    os.makedirs(LOG_DIR, exist_ok=True)

    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
    )

    file_handler = logging.FileHandler(LOG_FILE)
    file_handler.setFormatter(formatter)

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    logger = logging.getLogger(name)
    logger.setLevel(level)
    logger.handlers.clear()  # avoid duplicate handlers on reload (uvicorn --reload)
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    logger.propagate = False

    return logger

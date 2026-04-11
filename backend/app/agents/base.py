import abc
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("STRATUM-Agent")

class BaseAgent(abc.ABC):
    def __init__(self, name: str):
        self.name = name
        logger.info(f"Agent {self.name} initialized.")

    @abc.abstractmethod
    async def process(self, input_data: dict) -> dict:
        pass

    def log_action(self, action: str, details: str):
        logger.info(f"[{self.name}] {action}: {details}")

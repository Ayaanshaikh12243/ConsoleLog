from .base import BaseAgent
from ..services.llm import call_featherless_llm
import asyncio
import json

class CortexAgent(BaseAgent):
    def __init__(self):
        super().__init__("CORTEX")
        self.world_model = {}

    async def process(self, anomaly_data: dict) -> dict:
        self.log_action("Processing Anomaly", f"Cell ID: {anomaly_data.get('cell_id')}")
        
        # Powering reasoning with Featherless LLM
        prompt = f"""
        As STRATUM CORTEX Orchestrator, analyze this anomaly detection event:
        Anomaly Data: {json.dumps(anomaly_data)}
        
        Determine if we should escalate and spawn specialized agents (PROBE, VERITAS).
        Provide a json response with 'escalate' (boolean), 'priority' (0-1), and 'reasoning' (text).
        """
        
        reasoning_text = await call_featherless_llm(prompt)
        self.log_action("LLM REASONING", reasoning_text[:100] + "...")
        
        # Default fallback
        priority = 0.85 
        status = "Escalated"
        
        return {
            "status": status,
            "priority": priority,
            "llm_insight": reasoning_text
        }

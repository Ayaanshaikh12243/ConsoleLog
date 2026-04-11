from ..agents.cortex import CortexAgent
from ..agents.sentinel import SentinelAgent
from ..agents.intelligence import ProbeAgent, VeritasAgent, OracleAgent
from ..agents.meta import ScribeAgent

class GlobalOrchestrator:
    def __init__(self):
        self.cortex = CortexAgent()
        self.probe = ProbeAgent()
        self.veritas = VeritasAgent()
        self.oracle = OracleAgent()
        self.scribe = ScribeAgent()

    async def handle_anomaly_event(self, cell_id: str, telemetry: dict):
        # 1. Sentinel detects anomaly
        sentinel = SentinelAgent(cell_id)
        detection = await sentinel.process(telemetry)
        
        if detection["severity"] > 0.5:
            # 2. Cortex receives anomaly and escalates
            decision = await self.cortex.process(detection)
            
            if decision["status"] == "Escalated":
                # 3. Probe investigates
                investigation = await self.probe.process(cell_id)
                
                # 4. Veritas verifies ground truth
                verification = await self.veritas.process(cell_id)
                
                # 5. Oracle predicts trajectory
                prediction = await self.oracle.process(investigation)
                
                # 6. Scribe generates report
                consolidated = {
                    "cell_id": cell_id,
                    "investigation": investigation,
                    "verification": verification,
                    "prediction": prediction
                }
                report = await self.scribe.generate_report(consolidated)
                
                return {
                    "event": "CRITICAL_ANOMALY",
                    "cell_id": cell_id,
                    "report": report,
                    "prediction": prediction
                }
        
        return {"event": "MONITORING_NORMAL", "cell_id": cell_id}

orchestrator = GlobalOrchestrator()

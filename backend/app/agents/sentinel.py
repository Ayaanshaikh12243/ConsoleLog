from .base import BaseAgent
import numpy as np
import torch
import torch.nn as nn
from pathlib import Path
import logging

logger = logging.getLogger("STRATUM-Agent")

class SentinelLSTM(nn.Module):
    def __init__(self):
        super(SentinelLSTM, self).__init__()
        self.encoder = nn.LSTM(input_size=6, hidden_size=64, num_layers=2, batch_first=True)
        self.enc_fc = nn.Linear(64, 16)
        self.head = nn.Sequential(
            nn.Linear(16, 32),
            nn.ReLU(),
            nn.Dropout(0.2), # Placeholder, has no trained weights
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, 1)
        )

    def forward(self, x):
        _, (hn, _) = self.encoder(x)
        # Use the hidden state of the last LSTM layer
        x = hn[-1]
        x = torch.relu(self.enc_fc(x))
        x = self.head(x)
        return torch.sigmoid(x) # Output anomaly probability 0.0 to 1.0

class SentinelAgent(BaseAgent):
    def __init__(self, h3_index: str):
        super().__init__(f"SENTINEL-{h3_index}")
        self.h3_index = h3_index
        self.baseline = {} # 90-day baseline data
        
        self.model = SentinelLSTM()
        try:
            model_path = Path("C:/Users/harsh/OneDrive/Desktop/Airavat_ConsoleLog/models-main/sentinel_classifier.pth")
            self.model.load_state_dict(torch.load(model_path, map_location='cpu'))
            self.model.eval()
            logger.info("SENTINEL PyTorch model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load SENTINEL model: {e}")

    async def process(self, telemetry: dict) -> dict:
        # Extract features (fallback to 0.0 if missing)
        # Assuming order: ndvi, soil_moisture, temperature, rainfall, humidity, seismic
        features = [
            telemetry.get("ndvi", 0.5),
            telemetry.get("soil_moisture", 0.2),
            telemetry.get("temperature", 25.0),
            telemetry.get("rainfall", 0.0),
            telemetry.get("humidity", 60.0),
            telemetry.get("seismic_mag", 0.0)
        ]
        
        # LSTM expects shape: (batch_size, sequence_length, features)
        # We only have a snapshot here, so we'll treat it as a sequence of length 1
        tensor_input = torch.tensor([features], dtype=torch.float32).unsqueeze(0)
        
        with torch.no_grad():
            anomaly_score = self.model(tensor_input).item()
            
        if anomaly_score > 0.5:
            self.log_action("ANOMALY DETECTED", f"Model confidence: {anomaly_score:.3f}")
            return {"cell_id": self.h3_index, "type": "Multi-Factor ML Risk", "severity": anomaly_score}
            
        return {"cell_id": self.h3_index, "type": "Normal", "severity": anomaly_score}

"""
LSTM + Multi-Head Self-Attention Model for ICU Deterioration Prediction.
Lightweight architecture designed for CPU-only hospital edge servers.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import os

# Feature names for reference
FEATURE_NAMES = [
    "Heart Rate", "MAP", "SpO2", "Respiratory Rate",
    "Temperature", "Serum Lactate", "GCS Score", "Urine Output"
]

NUM_FEATURES = 8
SEQ_LENGTH = 12
HIDDEN_SIZE = 128
NUM_LAYERS = 2
NUM_HEADS = 4
KEY_DIM = 32
DROPOUT = 0.3


class MultiHeadAttention(nn.Module):
    """Multi-Head Self-Attention module for temporal weighting."""

    def __init__(self, embed_dim, num_heads, key_dim):
        super().__init__()
        self.num_heads = num_heads
        self.key_dim = key_dim
        self.head_dim = key_dim

        self.W_q = nn.Linear(embed_dim, num_heads * key_dim)
        self.W_k = nn.Linear(embed_dim, num_heads * key_dim)
        self.W_v = nn.Linear(embed_dim, num_heads * key_dim)
        self.W_o = nn.Linear(num_heads * key_dim, embed_dim)

        self.scale = key_dim ** 0.5

    def forward(self, x):
        batch_size, seq_len, _ = x.size()

        # Linear projections
        Q = self.W_q(x).view(batch_size, seq_len, self.num_heads, self.key_dim).transpose(1, 2)
        K = self.W_k(x).view(batch_size, seq_len, self.num_heads, self.key_dim).transpose(1, 2)
        V = self.W_v(x).view(batch_size, seq_len, self.num_heads, self.key_dim).transpose(1, 2)

        # Scaled dot-product attention
        attn_weights = torch.matmul(Q, K.transpose(-2, -1)) / self.scale
        attn_weights = F.softmax(attn_weights, dim=-1)

        # Apply attention to values
        attn_output = torch.matmul(attn_weights, V)
        attn_output = attn_output.transpose(1, 2).contiguous().view(batch_size, seq_len, -1)

        # Output projection
        output = self.W_o(attn_output)
        return output, attn_weights


class ChronosModel(nn.Module):
    """
    LSTM + Multi-Head Self-Attention for ICU deterioration prediction.
    
    Input: (batch, 12 timesteps, 8 features)
    Output: (batch, 1) crash probability
    """

    def __init__(self):
        super().__init__()

        # LSTM encoder
        self.lstm = nn.LSTM(
            input_size=NUM_FEATURES,
            hidden_size=HIDDEN_SIZE,
            num_layers=NUM_LAYERS,
            batch_first=True,
            dropout=DROPOUT
        )

        # Multi-Head Attention
        self.attention = MultiHeadAttention(
            embed_dim=HIDDEN_SIZE,
            num_heads=NUM_HEADS,
            key_dim=KEY_DIM
        )

        # Classification head
        self.fc1 = nn.Linear(HIDDEN_SIZE, 64)
        self.dropout = nn.Dropout(0.2)
        self.fc2 = nn.Linear(64, 1)

    def forward(self, x):
        # LSTM encoding: (batch, 12, 8) -> (batch, 12, 128)
        lstm_out, _ = self.lstm(x)

        # Self-Attention: (batch, 12, 128) -> (batch, 12, 128)
        attn_out, attn_weights = self.attention(lstm_out)

        # Global average pooling across time: (batch, 12, 128) -> (batch, 128)
        pooled = attn_out.mean(dim=1)

        # Classification
        x = F.relu(self.fc1(pooled))
        x = self.dropout(x)
        x = torch.sigmoid(self.fc2(x))

        return x


def create_model():
    """Create and return a new ChronosModel."""
    model = ChronosModel()
    return model


def save_model(model, path):
    """Save model weights to disk."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    torch.save(model.state_dict(), path)


def load_model(path):
    """Load model weights from disk."""
    model = ChronosModel()
    if os.path.exists(path):
        model.load_state_dict(torch.load(path, map_location="cpu"))
    model.eval()
    return model


def predict(model, vitals_window: np.ndarray) -> float:
    """
    Run inference on a single 12x8 vitals window.
    Returns crash probability as float between 0 and 1.
    """
    model.eval()
    with torch.no_grad():
        x = torch.FloatTensor(vitals_window).unsqueeze(0)  # (1, 12, 8)
        prob = model(x)
        return prob.item()


def predict_batch(model, vitals_batch: np.ndarray) -> np.ndarray:
    """Run inference on a batch of vitals windows."""
    model.eval()
    with torch.no_grad():
        x = torch.FloatTensor(vitals_batch)
        probs = model(x)
        return probs.numpy().flatten()

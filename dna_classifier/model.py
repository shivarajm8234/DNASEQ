"""
model.py
========
Defines the Deep Neural Network (DNN) architecture for binary classification
of DNA sequences as SAFE (0) or PATHOGENIC (1).

Architecture
------------
    Input  →  Dense(512, ReLU)  →  Dropout(0.3)
          →  Dense(256, ReLU)  →  Dropout(0.3)
          →  Dense(128, ReLU)
          →  Dense(1, Sigmoid)  →  Output

The model uses:
    • Binary Cross-Entropy loss  – standard for binary classification
    • Adam optimizer             – adaptive learning rate
    • Sigmoid output             – outputs probability of being PATHOGENIC
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models


def build_model(input_dim: int,
                learning_rate: float = 0.001) -> keras.Model:
    """
    Build and compile the DNA risk classification DNN.

    Parameters
    ----------
    input_dim : int
        Dimensionality of the input feature vector (4,096 for k=6).
    learning_rate : float
        Learning rate for the Adam optimizer.

    Returns
    -------
    keras.Model
        Compiled Keras model ready for training.
    """

    model = models.Sequential([
        # ── Input layer ──
        layers.Input(shape=(input_dim,), name='dna_features'),

        # ── Hidden layer 1: 512 neurons ──
        layers.Dense(512, activation='relu', name='dense_512'),
        layers.Dropout(0.3, name='dropout_1'),

        # ── Hidden layer 2: 256 neurons ──
        layers.Dense(256, activation='relu', name='dense_256'),
        layers.Dropout(0.3, name='dropout_2'),

        # ── Hidden layer 3: 128 neurons ──
        layers.Dense(128, activation='relu', name='dense_128'),

        # ── Output layer: single neuron with sigmoid ──
        # Output > 0.5 → PATHOGENIC, ≤ 0.5 → SAFE
        layers.Dense(1, activation='sigmoid', name='output')
    ])

    # ── Compile with Binary Cross-Entropy and Adam ──
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=learning_rate),
        loss='binary_crossentropy',
        metrics=['accuracy']
    )

    return model


def print_model_summary(model: keras.Model) -> None:
    """Pretty-print the model architecture."""
    print("\n" + "=" * 60)
    print("  🧠  DNA Risk Classification DNN")
    print("=" * 60)
    model.summary()
    print("=" * 60 + "\n")


# ──────────────────────────────────────────────
# Quick self-test
# ──────────────────────────────────────────────
if __name__ == '__main__':
    # Build model with k=6 → 4^6 = 4096 input features
    model = build_model(input_dim=4096)
    print_model_summary(model)

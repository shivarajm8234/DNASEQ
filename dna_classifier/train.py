"""
train.py
========
End-to-end training pipeline for the DNA risk classification DNN.

Pipeline steps:
    1. Load FASTA sequences and labels  (data_loader)
    2. Encode sequences as k-mer vectors  (preprocessing)
    3. Split into train / val / test      (preprocessing)
    4. Build the DNN                      (model)
    5. Train with early stopping
    6. Evaluate on the held-out test set
    7. Save the trained model + plots

Usage:
    python train.py                              # uses default data path
    python train.py --data_dir /path/to/data     # custom path
    python train.py --epochs 30 --batch_size 64  # override hyperparams
"""

import os
import sys
import argparse
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend (works on servers / headless)
import matplotlib.pyplot as plt

from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)

# ── Local modules ──
from data_loader import load_dataset
from preprocessing import build_kmer_vocabulary, encode_sequences, prepare_splits
from model import build_model, print_model_summary


# ──────────────────────────────────────────────
# Configuration defaults
# ──────────────────────────────────────────────
DEFAULT_DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'ncbi_dataset', 'ncbi_dataset', 'data')
DEFAULT_MODEL_PATH = os.path.join(os.path.dirname(__file__), 'dna_risk_model.h5')
K = 6                # k-mer length
EPOCHS = 25          # training epochs
BATCH_SIZE = 32      # mini-batch size
LEARNING_RATE = 0.001
MAX_PATHOGENIC = 3000  # cap on pathogenic sequences (keeps training fast)
MAX_SAFE = 3000        # number of safe sequences


def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description='Train DNA Risk Classification DNN')
    parser.add_argument('--data_dir', type=str, default=DEFAULT_DATA_DIR,
                        help='Path to FASTA data directory')
    parser.add_argument('--model_path', type=str, default=DEFAULT_MODEL_PATH,
                        help='Where to save the trained model (.h5)')
    parser.add_argument('--epochs', type=int, default=EPOCHS,
                        help='Number of training epochs')
    parser.add_argument('--batch_size', type=int, default=BATCH_SIZE,
                        help='Training batch size')
    parser.add_argument('--lr', type=float, default=LEARNING_RATE,
                        help='Adam learning rate')
    parser.add_argument('--max_pathogenic', type=int, default=MAX_PATHOGENIC,
                        help='Max pathogenic sequences to load')
    parser.add_argument('--max_safe', type=int, default=MAX_SAFE,
                        help='Number of safe sequences to use/generate')
    parser.add_argument('--k', type=int, default=K,
                        help='K-mer length')
    return parser.parse_args()


# ──────────────────────────────────────────────
# Plot helpers
# ──────────────────────────────────────────────

def plot_training_history(history, save_dir: str) -> None:
    """
    Plot and save training/validation loss and accuracy curves.

    Generates two plots:
        • training_loss.png   – Loss over epochs
        • training_accuracy.png – Accuracy over epochs
    """
    epochs_range = range(1, len(history.history['loss']) + 1)

    # ── Loss plot ──
    plt.figure(figsize=(10, 5))
    plt.plot(epochs_range, history.history['loss'], 'b-o', label='Training Loss', linewidth=2)
    plt.plot(epochs_range, history.history['val_loss'], 'r-o', label='Validation Loss', linewidth=2)
    plt.title('Training & Validation Loss', fontsize=16, fontweight='bold')
    plt.xlabel('Epoch', fontsize=13)
    plt.ylabel('Binary Cross-Entropy Loss', fontsize=13)
    plt.legend(fontsize=12)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    loss_path = os.path.join(save_dir, 'training_loss.png')
    plt.savefig(loss_path, dpi=150)
    plt.close()
    print(f"📈 Loss plot saved → {loss_path}")

    # ── Accuracy plot ──
    plt.figure(figsize=(10, 5))
    plt.plot(epochs_range, history.history['accuracy'], 'b-o', label='Training Accuracy', linewidth=2)
    plt.plot(epochs_range, history.history['val_accuracy'], 'r-o', label='Validation Accuracy', linewidth=2)
    plt.title('Training & Validation Accuracy', fontsize=16, fontweight='bold')
    plt.xlabel('Epoch', fontsize=13)
    plt.ylabel('Accuracy', fontsize=13)
    plt.legend(fontsize=12)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    acc_path = os.path.join(save_dir, 'training_accuracy.png')
    plt.savefig(acc_path, dpi=150)
    plt.close()
    print(f"📈 Accuracy plot saved → {acc_path}")


def plot_confusion_matrix(cm, save_dir: str) -> None:
    """Plot and save a styled confusion matrix heatmap."""
    plt.figure(figsize=(7, 6))
    plt.imshow(cm, interpolation='nearest', cmap='Blues')
    plt.title('Confusion Matrix', fontsize=16, fontweight='bold')
    plt.colorbar()

    classes = ['SAFE (0)', 'PATHOGENIC (1)']
    tick_marks = [0, 1]
    plt.xticks(tick_marks, classes, fontsize=12)
    plt.yticks(tick_marks, classes, fontsize=12)

    # Annotate cells with counts
    for i in range(2):
        for j in range(2):
            plt.text(j, i, str(cm[i, j]),
                     ha='center', va='center',
                     fontsize=18, fontweight='bold',
                     color='white' if cm[i, j] > cm.max() / 2 else 'black')

    plt.xlabel('Predicted Label', fontsize=13)
    plt.ylabel('True Label', fontsize=13)
    plt.tight_layout()
    cm_path = os.path.join(save_dir, 'confusion_matrix.png')
    plt.savefig(cm_path, dpi=150)
    plt.close()
    print(f"📊 Confusion matrix saved → {cm_path}")


# ──────────────────────────────────────────────
# Main training pipeline
# ──────────────────────────────────────────────

def main():
    args = parse_args()

    print("=" * 60)
    print("  🧬  DNA RISK CLASSIFICATION — TRAINING PIPELINE")
    print("=" * 60)
    print(f"  Data directory  : {os.path.abspath(args.data_dir)}")
    print(f"  K-mer length    : {args.k}")
    print(f"  Epochs          : {args.epochs}")
    print(f"  Batch size      : {args.batch_size}")
    print(f"  Learning rate   : {args.lr}")
    print(f"  Model save path : {args.model_path}")
    print("=" * 60 + "\n")

    # ── Step 1: Load data ──
    print("━" * 50)
    print("  STEP 1 / 6 : Loading FASTA sequences")
    print("━" * 50)
    sequences, labels = load_dataset(
        args.data_dir,
        max_pathogenic=args.max_pathogenic,
        max_safe=args.max_safe
    )

    # ── Step 2: Encode as k-mer features ──
    print("\n" + "━" * 50)
    print("  STEP 2 / 6 : K-mer encoding")
    print("━" * 50)
    vocab = build_kmer_vocabulary(k=args.k)
    X = encode_sequences(sequences, vocab, k=args.k)
    y = labels

    # ── Step 3: Split dataset ──
    print("\n" + "━" * 50)
    print("  STEP 3 / 6 : Splitting dataset (80/10/10)")
    print("━" * 50)
    X_train, X_val, X_test, y_train, y_val, y_test = prepare_splits(X, y)

    # ── Step 4: Build model ──
    print("\n" + "━" * 50)
    print("  STEP 4 / 6 : Building DNN")
    print("━" * 50)
    input_dim = X_train.shape[1]  # 4^k features
    dnn_model = build_model(input_dim=input_dim, learning_rate=args.lr)
    print_model_summary(dnn_model)

    # ── Step 5: Train ──
    print("━" * 50)
    print("  STEP 5 / 6 : Training")
    print("━" * 50)

    # Early stopping to prevent overfitting
    from tensorflow.keras.callbacks import EarlyStopping
    early_stop = EarlyStopping(
        monitor='val_loss',
        patience=5,
        restore_best_weights=True,
        verbose=1
    )

    history = dnn_model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=args.epochs,
        batch_size=args.batch_size,
        callbacks=[early_stop],
        verbose=1
    )

    # ── Step 6: Evaluate on test set ──
    print("\n" + "━" * 50)
    print("  STEP 6 / 6 : Evaluation on test set")
    print("━" * 50)

    y_pred_proba = dnn_model.predict(X_test, verbose=0).flatten()
    y_pred = (y_pred_proba >= 0.5).astype(int)

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred)

    print(f"\n  ✅ Accuracy  : {acc:.4f}")
    print(f"  ✅ Precision : {prec:.4f}")
    print(f"  ✅ Recall    : {rec:.4f}")
    print(f"  ✅ F1 Score  : {f1:.4f}")
    print(f"\n  Confusion Matrix:")
    print(f"  {cm}")
    print(f"\n{classification_report(y_test, y_pred, target_names=['SAFE', 'PATHOGENIC'])}")

    # ── Save model ──
    dnn_model.save(args.model_path)
    print(f"\n💾 Model saved → {args.model_path}")

    # ── Save vocabulary for prediction module ──
    import json
    vocab_path = os.path.join(os.path.dirname(args.model_path), 'kmer_vocab.json')
    with open(vocab_path, 'w') as f:
        json.dump({'k': args.k, 'vocab_size': len(vocab)}, f)
    print(f"💾 Vocabulary config saved → {vocab_path}")

    # ── Generate plots ──
    save_dir = os.path.dirname(args.model_path) or '.'
    plot_training_history(history, save_dir)
    plot_confusion_matrix(cm, save_dir)

    print("\n" + "=" * 60)
    print("  🎉  TRAINING COMPLETE!")
    print("=" * 60)
    print(f"  Model       : {args.model_path}")
    print(f"  Accuracy    : {acc:.2%}")
    print(f"  F1 Score    : {f1:.2%}")
    print("=" * 60)


if __name__ == '__main__':
    main()

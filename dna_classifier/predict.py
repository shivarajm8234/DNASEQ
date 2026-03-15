"""
predict.py
==========
Interactive prediction module for the trained DNA risk classifier.

Usage:
    python predict.py                      # interactive mode (type sequences)
    python predict.py --sequence ATGCATGC   # single sequence from CLI
    python predict.py --file input.fasta    # predict from a FASTA file

The module:
    1. Loads the saved model (dna_risk_model.h5)
    2. Rebuilds the k-mer vocabulary
    3. Converts the input DNA sequence into a k-mer feature vector
    4. Predicts the risk level: SAFE or HIGH RISK (PATHOGENIC)
"""

import os
import sys
import json
import argparse
import re
import numpy as np

# Suppress TensorFlow info messages for cleaner output
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

from tensorflow import keras
from preprocessing import build_kmer_vocabulary, sequence_to_kmer_vector
from sklearn.preprocessing import normalize


# ──────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────
DEFAULT_MODEL_PATH = os.path.join(os.path.dirname(__file__), 'dna_risk_model.h5')
DEFAULT_K = 6


def load_trained_model(model_path: str) -> keras.Model:
    """Load the saved Keras model."""
    if not os.path.exists(model_path):
        print(f"❌ Model not found at: {model_path}")
        print("   Run 'python train.py' first to train the model.")
        sys.exit(1)

    model = keras.models.load_model(model_path)
    print(f"✅ Model loaded from: {model_path}")
    return model


def validate_dna_sequence(sequence: str) -> str:
    """
    Validate and clean a DNA sequence.

    Returns
    -------
    str
        Cleaned uppercase sequence, or empty string if invalid.
    """
    # Remove whitespace and newlines
    cleaned = re.sub(r'\s+', '', sequence).upper()

    # Check for minimum length
    if len(cleaned) < 10:
        print("⚠️  Sequence too short (need at least 10 bases).")
        return ""

    # Check for valid characters
    if not re.match(r'^[ATGC]+$', cleaned):
        invalid_chars = set(cleaned) - set('ATGC')
        print(f"⚠️  Invalid characters found: {invalid_chars}")
        print("   Only A, T, G, C are allowed.")
        return ""

    return cleaned


def predict_sequence(sequence: str, model: keras.Model,
                     vocab: dict, k: int = 6) -> dict:
    """
    Predict the risk level of a single DNA sequence.

    Parameters
    ----------
    sequence : str
        Valid DNA sequence (A/T/G/C only).
    model : keras.Model
        Trained classifier.
    vocab : dict
        K-mer vocabulary.
    k : int
        K-mer length.

    Returns
    -------
    dict
        {
            'sequence_length': int,
            'probability': float,      # probability of being pathogenic
            'prediction': str,         # 'SAFE' or 'HIGH RISK'
            'label': int               # 0 or 1
        }
    """
    # Convert to k-mer vector
    vec = sequence_to_kmer_vector(sequence, vocab, k)
    vec = vec.reshape(1, -1)

    # L2 normalize (same as training)
    vec = normalize(vec, norm='l2', axis=1)

    # Predict
    prob = model.predict(vec, verbose=0).flatten()[0]
    label = 1 if prob >= 0.5 else 0
    prediction = "🔴 HIGH RISK (PATHOGENIC)" if label == 1 else "🟢 SAFE"

    return {
        'sequence_length': len(sequence),
        'probability': float(prob),
        'prediction': prediction,
        'label': label
    }


def predict_from_fasta(filepath: str, model: keras.Model,
                       vocab: dict, k: int = 6) -> None:
    """Read sequences from a FASTA file and predict each one."""
    if not os.path.exists(filepath):
        print(f"❌ File not found: {filepath}")
        return

    from data_loader import parse_fasta
    sequences = parse_fasta(filepath, max_sequences=50)

    if not sequences:
        print("⚠️  No valid sequences found in the file.")
        return

    print(f"\n📄 Found {len(sequences)} valid sequences in {filepath}")
    print("─" * 60)

    for i, seq in enumerate(sequences, 1):
        result = predict_sequence(seq, model, vocab, k)
        print(f"  Seq {i:3d} | Length: {result['sequence_length']:6d} | "
              f"Risk: {result['probability']:.4f} | {result['prediction']}")

    print("─" * 60)


def interactive_mode(model: keras.Model, vocab: dict, k: int = 6) -> None:
    """
    Interactive loop: user types/pastes DNA sequences and gets predictions.
    """
    print("\n" + "=" * 60)
    print("  🧬  DNA RISK PREDICTOR — Interactive Mode")
    print("=" * 60)
    print("  Type or paste a DNA sequence (A/T/G/C only).")
    print("  Type 'quit' or 'exit' to stop.")
    print("  Type 'example' to see a demo prediction.")
    print("=" * 60 + "\n")

    # Example pathogenic-like sequence (from viral motif patterns)
    example_seq = ("ATGGCTAAACCAACTCTATCTGTGCTTCAACAATTGAACAGCAACTGTGCTTCCCTA"
                   "TGGATAGCTTTTGTAATGAAATATCTGCTGGTTCTACTAGCGAATCCAGGCCCTGGA"
                   "TTGCCTATAAAGACTTCAAGGTTTGTGATACCACATATAATAGATCTTTACAGGCTGT"
                   "CGCACTGATAACAGACTTGGAGATGTTACCACTTTTGCTCTCAAG")

    while True:
        try:
            user_input = input("\n🧬 Enter DNA sequence: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\n👋 Goodbye!")
            break

        if user_input.lower() in ('quit', 'exit', 'q'):
            print("👋 Goodbye!")
            break

        if user_input.lower() == 'example':
            user_input = example_seq
            print(f"   Using example sequence ({len(example_seq)} bases)")

        # Validate
        cleaned = validate_dna_sequence(user_input)
        if not cleaned:
            continue

        # Predict
        result = predict_sequence(cleaned, model, vocab, k)

        # Display result
        print("\n" + "─" * 50)
        print(f"  Sequence length   : {result['sequence_length']} bases")
        print(f"  Pathogenic prob.  : {result['probability']:.4f}")
        print(f"  Risk assessment   : {result['prediction']}")
        print("─" * 50)


def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description='DNA Risk Predictor')
    parser.add_argument('--model_path', type=str, default=DEFAULT_MODEL_PATH,
                        help='Path to the trained model (.h5)')
    parser.add_argument('--sequence', type=str, default=None,
                        help='Single DNA sequence to predict')
    parser.add_argument('--file', type=str, default=None,
                        help='FASTA file to predict')
    parser.add_argument('--k', type=int, default=DEFAULT_K,
                        help='K-mer length (must match training)')
    return parser.parse_args()


def main():
    args = parse_args()

    # Load model and vocabulary
    model = load_trained_model(args.model_path)
    vocab = build_kmer_vocabulary(k=args.k)

    if args.sequence:
        # ── Single sequence mode ──
        cleaned = validate_dna_sequence(args.sequence)
        if cleaned:
            result = predict_sequence(cleaned, model, vocab, args.k)
            print(f"\n  Sequence length   : {result['sequence_length']} bases")
            print(f"  Pathogenic prob.  : {result['probability']:.4f}")
            print(f"  Risk assessment   : {result['prediction']}")

    elif args.file:
        # ── FASTA file mode ──
        predict_from_fasta(args.file, model, vocab, args.k)

    else:
        # ── Interactive mode ──
        interactive_mode(model, vocab, args.k)


if __name__ == '__main__':
    main()

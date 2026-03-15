"""
preprocessing.py
=================
Converts raw DNA sequences into numerical feature vectors using **k-mer encoding**.

K-mer encoding (k=6):
    • A k-mer is a substring of length k.
    • For k=6 there are 4^6 = 4,096 possible k-mers.
    • Each sequence is converted into a 4,096-dimensional count vector
      where element i holds the count of the i-th k-mer in the sequence.
    • Counts are then L2-normalized so that every sample lies on the
      unit hypersphere — this helps gradient-based optimizers converge faster.

The module also provides helpers to:
    • Build the complete k-mer vocabulary.
    • Encode a single sequence (used at prediction time).
    • Prepare train / validation / test splits.
"""

import itertools
import numpy as np
from typing import List, Tuple, Dict
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import normalize


# ──────────────────────────────────────────────
# K-mer vocabulary builder
# ──────────────────────────────────────────────

def build_kmer_vocabulary(k: int = 6) -> Dict[str, int]:
    """
    Build a mapping from every possible k-mer to a unique integer index.

    Parameters
    ----------
    k : int
        Length of each k-mer substring (default 6 → 4,096 features).

    Returns
    -------
    Dict[str, int]
        Dictionary mapping k-mer strings to column indices.
    """
    bases = ['A', 'T', 'G', 'C']
    kmers = [''.join(combo) for combo in itertools.product(bases, repeat=k)]
    vocab = {kmer: idx for idx, kmer in enumerate(kmers)}
    print(f"✅ Built k-mer vocabulary: k={k}, vocabulary size = {len(vocab)}")
    return vocab


# ──────────────────────────────────────────────
# Sequence → feature vector
# ──────────────────────────────────────────────

def sequence_to_kmer_vector(sequence: str, vocab: Dict[str, int], k: int = 6) -> np.ndarray:
    """
    Convert a single DNA sequence into a k-mer count vector.

    Parameters
    ----------
    sequence : str
        Uppercase DNA string (A/T/G/C only).
    vocab : Dict[str, int]
        K-mer → index mapping.
    k : int
        K-mer length.

    Returns
    -------
    np.ndarray
        1-D float32 array of shape (len(vocab),).
    """
    vec = np.zeros(len(vocab), dtype=np.float32)
    for i in range(len(sequence) - k + 1):
        kmer = sequence[i:i + k]
        if kmer in vocab:
            vec[vocab[kmer]] += 1
    return vec


# ──────────────────────────────────────────────
# Batch encoding
# ──────────────────────────────────────────────

def encode_sequences(sequences: List[str], vocab: Dict[str, int],
                     k: int = 6) -> np.ndarray:
    """
    Encode a list of DNA sequences into a feature matrix.

    Parameters
    ----------
    sequences : List[str]
        Raw DNA sequences.
    vocab : Dict[str, int]
        K-mer vocabulary.
    k : int
        K-mer length.

    Returns
    -------
    np.ndarray
        Matrix of shape (n_samples, vocab_size) with L2-normalized rows.
    """
    n = len(sequences)
    vocab_size = len(vocab)
    print(f"🔄 Encoding {n} sequences into {vocab_size}-dim k-mer vectors (k={k}) ...")

    X = np.zeros((n, vocab_size), dtype=np.float32)
    for i, seq in enumerate(sequences):
        X[i] = sequence_to_kmer_vector(seq, vocab, k)
        if (i + 1) % 500 == 0 or i == n - 1:
            print(f"   Encoded {i + 1}/{n} sequences", end='\r')

    print()  # newline after progress

    # ── L2 normalization ──
    # Normalizing each row to unit length so that sequences of different
    # lengths are comparable and gradient magnitudes stay stable.
    X = normalize(X, norm='l2', axis=1)
    print("✅ Feature matrix normalized (L2 norm per sample)")

    return X


# ──────────────────────────────────────────────
# Train / Validation / Test split
# ──────────────────────────────────────────────

def prepare_splits(X: np.ndarray, y: np.ndarray,
                   train_ratio: float = 0.8,
                   val_ratio: float = 0.1,
                   test_ratio: float = 0.1,
                   random_state: int = 42) -> Tuple:
    """
    Split the encoded features and labels into training, validation, and test sets.

    Split ratios: 80% train / 10% validation / 10% test (default).

    Parameters
    ----------
    X : np.ndarray   — feature matrix  (n_samples, n_features)
    y : np.ndarray   — labels           (n_samples,)
    train_ratio, val_ratio, test_ratio : float
        Must sum to 1.0.
    random_state : int
        Seed for reproducibility.

    Returns
    -------
    Tuple of (X_train, X_val, X_test, y_train, y_val, y_test)
    """
    assert abs(train_ratio + val_ratio + test_ratio - 1.0) < 1e-6, \
        "Split ratios must sum to 1.0"

    # First split: train vs (val + test)
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y,
        test_size=(val_ratio + test_ratio),
        random_state=random_state,
        stratify=y
    )

    # Second split: val vs test (equal halves of the remaining data)
    relative_test = test_ratio / (val_ratio + test_ratio)
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp,
        test_size=relative_test,
        random_state=random_state,
        stratify=y_temp
    )

    print(f"\n📂 Dataset splits:")
    print(f"   Training   : {X_train.shape[0]} samples")
    print(f"   Validation : {X_val.shape[0]} samples")
    print(f"   Testing    : {X_test.shape[0]} samples")

    return X_train, X_val, X_test, y_train, y_val, y_test


# ──────────────────────────────────────────────
# Quick self-test
# ──────────────────────────────────────────────
if __name__ == '__main__':
    vocab = build_kmer_vocabulary(k=6)
    test_seq = "ATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGC"
    vec = sequence_to_kmer_vector(test_seq, vocab, k=6)
    print(f"Test sequence length: {len(test_seq)}")
    print(f"Non-zero k-mer counts: {np.count_nonzero(vec)}")
    print(f"Total k-mers counted: {int(vec.sum())}")

"""
data_loader.py
==============
Handles loading and parsing of FASTA files containing DNA sequences.
Supports two modes:
  1. Directory-based labeling: Separate folders for 'safe/' and 'pathogenic/' FASTA files.
  2. Single-file mode with the NCBI dataset: All sequences from the virus dataset are
     treated as PATHOGENIC (label=1). A pool of synthetic safe sequences (label=0)
     is generated automatically so the model can learn the boundary.

Each valid DNA sequence consists only of characters: A, T, G, C (case-insensitive).
Sequences containing any other characters (N, R, Y, ambiguity codes, etc.) are skipped.
"""

import os
import re
import random
import numpy as np
from typing import List, Tuple


# ──────────────────────────────────────────────
# FASTA Parser
# ──────────────────────────────────────────────

def parse_fasta(filepath: str, max_sequences: int = None) -> List[str]:
    """
    Parse a single FASTA file and return a list of valid DNA sequences.

    Parameters
    ----------
    filepath : str
        Path to the .fna / .fasta / .fa file.
    max_sequences : int, optional
        Maximum number of sequences to read from this file. Useful for very
        large files (e.g., the 580 MB genomic.fna from NCBI).

    Returns
    -------
    List[str]
        Cleaned, uppercase DNA sequences containing only A/T/G/C.
    """
    sequences: List[str] = []
    current_seq_parts: List[str] = []
    valid_pattern = re.compile(r'^[ATGCatgc]+$')
    count = 0

    with open(filepath, 'r') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue

            # Header line signals a new sequence
            if line.startswith('>'):
                # Flush the previous sequence
                if current_seq_parts:
                    full_seq = ''.join(current_seq_parts).upper()
                    if valid_pattern.match(full_seq) and len(full_seq) >= 100:
                        sequences.append(full_seq)
                        count += 1
                        if max_sequences and count >= max_sequences:
                            return sequences
                    current_seq_parts = []
            else:
                current_seq_parts.append(line)

        # Don't forget the last sequence in the file
        if current_seq_parts:
            full_seq = ''.join(current_seq_parts).upper()
            if valid_pattern.match(full_seq) and len(full_seq) >= 100:
                sequences.append(full_seq)

    return sequences


# ──────────────────────────────────────────────
# Load from directory tree
# ──────────────────────────────────────────────

def load_fasta_from_directory(directory: str, max_per_file: int = None) -> List[str]:
    """
    Recursively find all FASTA files (*.fna, *.fasta, *.fa) in `directory`
    and return their combined sequences.
    """
    all_sequences: List[str] = []
    fasta_extensions = ('.fna', '.fasta', '.fa')

    for root, _dirs, files in os.walk(directory):
        for fname in files:
            if fname.lower().endswith(fasta_extensions):
                fpath = os.path.join(root, fname)
                print(f"  📄 Reading {fpath} ...")
                seqs = parse_fasta(fpath, max_sequences=max_per_file)
                print(f"     → Found {len(seqs)} valid sequences")
                all_sequences.extend(seqs)

    return all_sequences


# ──────────────────────────────────────────────
# Synthetic safe-sequence generator
# ──────────────────────────────────────────────

def generate_safe_sequences(count: int, min_len: int = 500, max_len: int = 5000,
                            seed: int = 42) -> List[str]:
    """
    Generate random DNA sequences to serve as **safe** (non-pathogenic) controls.

    These are uniformly random strings over {A, T, G, C}. They lack the codon
    biases, conserved domains, and regulatory motifs found in real viral genomes,
    which makes them a reasonable synthetic negative class for a demo model.

    Parameters
    ----------
    count : int
        Number of sequences to generate.
    min_len, max_len : int
        Range of random sequence lengths.
    seed : int
        Random seed for reproducibility.

    Returns
    -------
    List[str]
        List of random DNA strings.
    """
    random.seed(seed)
    bases = ['A', 'T', 'G', 'C']
    sequences = []
    for _ in range(count):
        length = random.randint(min_len, max_len)
        seq = ''.join(random.choices(bases, k=length))
        sequences.append(seq)
    return sequences


# ──────────────────────────────────────────────
# Main loading function
# ──────────────────────────────────────────────

def load_dataset(data_dir: str,
                 max_pathogenic: int = 3000,
                 max_safe: int = 3000) -> Tuple[List[str], np.ndarray]:
    """
    Load the full dataset, returning sequences and corresponding labels.

    Strategy
    --------
    • If `data_dir` contains subdirectories named 'safe/' and 'pathogenic/',
      sequences are loaded from each with the appropriate label.
    • Otherwise, every FASTA file under `data_dir` is treated as pathogenic
      (virus genomes from NCBI), and synthetic safe sequences are generated
      to balance the dataset.

    Parameters
    ----------
    data_dir : str
        Root directory containing FASTA data.
    max_pathogenic : int
        Cap on pathogenic sequences to load (keeps training fast).
    max_safe : int
        Number of safe sequences to generate (or load).

    Returns
    -------
    sequences : List[str]
        DNA strings.
    labels : np.ndarray
        0 = SAFE, 1 = PATHOGENIC.
    """
    safe_dir = os.path.join(data_dir, 'safe')
    pathogenic_dir = os.path.join(data_dir, 'pathogenic')

    if os.path.isdir(safe_dir) and os.path.isdir(pathogenic_dir):
        # ── Directory-based labeling ──
        print("🔬 Loading SAFE sequences from:", safe_dir)
        safe_seqs = load_fasta_from_directory(safe_dir)
        print(f"   Total safe sequences loaded: {len(safe_seqs)}")

        print("🦠 Loading PATHOGENIC sequences from:", pathogenic_dir)
        pathogenic_seqs = load_fasta_from_directory(pathogenic_dir)
        print(f"   Total pathogenic sequences loaded: {len(pathogenic_seqs)}")
    else:
        # ── Single NCBI dataset mode ──
        print("🦠 Loading PATHOGENIC sequences from NCBI dataset:", data_dir)
        pathogenic_seqs = load_fasta_from_directory(data_dir, max_per_file=max_pathogenic)
        if len(pathogenic_seqs) > max_pathogenic:
            random.seed(42)
            pathogenic_seqs = random.sample(pathogenic_seqs, max_pathogenic)
        print(f"   Total pathogenic sequences: {len(pathogenic_seqs)}")

        # Generate synthetic safe sequences to balance the dataset
        n_safe = min(max_safe, len(pathogenic_seqs))
        print(f"🧬 Generating {n_safe} synthetic SAFE sequences ...")
        safe_seqs = generate_safe_sequences(n_safe)
        print(f"   Total safe sequences: {len(safe_seqs)}")

    # Combine and label
    sequences = safe_seqs + pathogenic_seqs
    labels = np.array([0] * len(safe_seqs) + [1] * len(pathogenic_seqs), dtype=np.int32)

    print(f"\n📊 Dataset summary:")
    print(f"   SAFE sequences  : {len(safe_seqs)}")
    print(f"   PATHOGENIC seqs : {len(pathogenic_seqs)}")
    print(f"   Total           : {len(sequences)}")

    return sequences, labels


# ──────────────────────────────────────────────
# Quick test
# ──────────────────────────────────────────────
if __name__ == '__main__':
    import sys
    data_path = sys.argv[1] if len(sys.argv) > 1 else '../ncbi_dataset/ncbi_dataset/data'
    seqs, labels = load_dataset(data_path, max_pathogenic=200, max_safe=200)
    print(f"\nSample sequence (first 80 chars): {seqs[0][:80]}...")
    print(f"Label distribution: SAFE={sum(labels == 0)}, PATHOGENIC={sum(labels == 1)}")

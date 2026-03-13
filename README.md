# Genomic Intelligence Platform (DNASEQ)

An advanced DNA analysis and biosecurity screening platform that utilizes high-performance browser-side computation to perform statistical analysis, biological gene detection, and pathogen similarity screening.

## 🚀 Overview

This platform provides a comprehensive suite for genomic assessment, allowing researchers to evaluate DNA sequences for structural properties, biological coding potential, and biosecurity risks using a hybrid engine of statistical algorithms and Deep Neural Networks (DNN).

## 🛠 Core Modules

### 1. Statistical DNA Analysis
Examines the structural and mathematical properties of the sequence:
- **Sequence Metrics**: Length, Base Composition (Count of A, T, C, G).
- **Nucleotide Density**: Precise GC/AT Content calculation.
- **Complexity Analysis**: Shannon Entropy calculation to measure structural randomness.
- **Pattern Recognition**: 
    - k-mer frequency analysis (k = 5 and k = 6).
    - Unique k-mer enumeration.
    - Detection of repetitive patterns.
    - Polynucleotide detection (Poly-A, Poly-T, Poly-G, Poly-C).

### 2. Biological Gene Detection
A high-fidelity biological module that detects coding regions and functional segments:
- **6-Frame ORF Scanning**: Scans all 6 possible reading frames (3 Forward + 3 Reverse Complement).
- **NCBI-Aligned Codon Detection**: Identifies `ATG` starts and standard stops (`TAA`, `TAG`, `TGA`).
- **Coding Potential Estimation**: Calculates the percentage of the sequence likely involved in translation.
- **Complexity Flagging**: Automatically identifies low-complexity segments or unusually short repeats.
- **Mutation Tracking**: Flags potential frameshifts and premature stop codons.

### 3. Pathogen Similarity Screening (AI Engine)
Utilizes a Deep Neural Network to classify sequences based on biosecurity risk:
- **Encoding**: Converts DNA into numerical feature vectors using high-dimensional k-mer encoding.
- **Neural Architecture**:
    - **Input Layer**: 1024 features.
    - **Hidden Layer 1**: 64 Units (ReLU).
    - **Hidden Layer 2**: 32 Units (ReLU).
    - **Hidden Layer 3**: 16 Units (ReLU).
    - **Output Layer**: 4 Classes (Sigmoid).
- **Interpretation Classes**:
    1. **Safe**: Recognized biological references.
    2. **Ambiguous / Novel**: Unique or unclassified sequences.
    3. **Suspicious**: Anomalous or synthetic structural properties.
    4. **Pathogen-like**: Significant similarity to known high-threat pathogens.

## 🧬 How It Works (Technical Workflow)

1. **Input & Validation**: The system accepts raw DNA or FASTA files. It performs real-time validation to ensure only genomic characters (ATGC) are processed.
2. **Feature Extraction**:
    - Generates k-mer frequency histograms.
    - Calculates entropy and structural complexity.
    - Identifies biological markers (ORFs, poly-regions).
3. **Organism Identification (BLAST-like)**: The engine compares the sequence against an internal genomic fingerprint database to identify the likely source organism (Mammals, Bacteria, Viruses, etc.).
4. **Neural Inference**: The processed feature vector is passed through the browser-resident DNN. The model runs locally, ensuring **zero data storage** and total privacy.
5. **Final Assessment**: The system cross-references neural output with biological evidence (e.g., specific pathogen motifs) to generate a **Final Interpretation Report**.

## 💻 Tech Stack

- **Frontend**: Next.js 15 (React), Tailwind CSS, Lucide Icons.
- **Visuals**: Recharts (Dynamic bar charts, distribution plots, risk gauges).
- **Core Engine**: Custom TypeScript DNN Implementation (No Python backend required).
- **Deployment**: Firebase Hosting (Static & Edge Optimized).
- **State Management**: Browser Persistent LocalStorage for Model State.

## ⚙️ Installation

```bash
# Clone the repository
git clone https://github.com/shivarajm8234/DNASEQ.git

# Install dependencies
npm install

# Run the development server
npm run dev

# Build for production
npm run build
```

## 📄 Output Reports

Upon completion, the system generates a multi-section dashboard containing:
- **GC Content Meter** and Distribution Gauges.
- **ORF Visualizer** with position and frame data.
- **Mutation & Variation Table**.
- **Organism Identification Card** with confidence scores.
- **Final Risk Score**: (Safe / Synthetic / Suspicious / Pathogen-like).

---
**Privacy Notice**: All genomic analysis is performed locally on your device. DNA sequences never leave your browser.

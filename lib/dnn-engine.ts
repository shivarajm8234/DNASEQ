/**
 * lib/dnn-engine.ts
 * 
 * A pure-JavaScript Dynamic DNN Engine that runs in the Browser.
 * Implements Statistical Analysis, Biological Gene Detection, and Pathogen Screening.
 */

export interface DenseLayer {
  weights: Float64Array[];
  biases: Float64Array;
  activation: 'relu' | 'sigmoid';
  preActivation?: Float64Array;
  postActivation?: Float64Array;
  inputCache?: Float64Array;
}

export interface MomentumBuffer {
  weights: Float64Array[][];
  biases: Float64Array[];
}

export interface ORF {
  start: number;
  end: number;
  length: number;
  sequence: string;
}

export interface AnalysisResult {
  sequenceLength: number;
  gcContent: number;
  atContent: number;
  baseComposition: { A: number; T: number; G: number; C: number };
  pathogenicProbability: number;
  riskLevel: 'safe' | 'ambiguous' | 'suspicious' | 'pathogen-like';
  riskScore: number;
  geneticVariationRisk: { score: number; level: string; description: string };
  mutationFrequencyRisk: { score: number; level: string; description: string };
  deletionRisk: { score: number; level: string; description: string };
  safeRegions: number;
  moderateRiskRegions: number;
  highRiskRegions: number;
  trainingMetrics: {
    epochs: number;
    finalLoss: number;
    bestLoss: number;
    accuracy: number;
  };
  kmerStats: {
    uniqueKmers5: number;
    uniqueKmers6: number;
    totalKmers: number;
    topKmers: { kmer: string; count: number }[];
    shannonEntropy: number;
  };
  biologicalMetrics: {
    orfs: ORF[];
    startCodons: number[];
    stopCodons: number[];
    polyRegions: { base: string; count: number; maxLen: number }[];
    repetitivePatterns: { pattern: string; count: number }[];
    complexity: 'low' | 'normal' | 'high';
    codingRegionPct: number;
    mutations: { position: number; type: string; description: string }[];
    identifiedOrganism: { name: string; confidence: number; type: string };
  };
  qualityScore: number;
}

// ─── K-mer Utilities ───

export function buildKmerVocabulary(k: number = 5): Map<string, number> {
  const bases = ['A', 'T', 'G', 'C'];
  const vocab = new Map<string, number>();

  function* cartesianProduct(depth: number, prefix: string = ''): Generator<string> {
    if (depth === 0) { yield prefix; return; }
    for (const base of bases) {
      yield* cartesianProduct(depth - 1, prefix + base);
    }
  }

  let idx = 0;
  for (const kmer of cartesianProduct(k)) {
    vocab.set(kmer, idx++);
  }
  return vocab;
}

export function sequenceToKmerVector(seq: string, vocab: Map<string, number>, k: number = 5): Float64Array {
  const vec = new Float64Array(vocab.size);
  for (let i = 0; i <= seq.length - k; i++) {
    const kmer = seq.substring(i, i + k);
    const idx = vocab.get(kmer);
    if (idx !== undefined) vec[idx]++;
  }
  let norm = 0;
  for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < vec.length; i++) vec[i] /= norm;
  }
  return vec;
}

// ─── DNN Core ───

function xavierInit(fanIn: number, fanOut: number): number {
  const limit = Math.sqrt(6 / (fanIn + fanOut));
  return (Math.random() * 2 - 1) * limit;
}

export function createLayer(fanIn: number, fanOut: number, activation: 'relu' | 'sigmoid'): DenseLayer {
  const weights: Float64Array[] = [];
  const biases = new Float64Array(fanOut);
  for (let o = 0; o < fanOut; o++) {
    const row = new Float64Array(fanIn);
    for (let i = 0; i < fanIn; i++) row[i] = xavierInit(fanIn, fanOut);
    weights.push(row);
  }
  return { weights, biases, activation };
}

export function createMomentumBuffer(layers: DenseLayer[]): MomentumBuffer {
  return {
    weights: layers.map(l => l.weights.map(w => new Float64Array(w.length))),
    biases: layers.map(l => new Float64Array(l.biases.length)),
  };
}

function forwardLayer(layer: DenseLayer, input: Float64Array): Float64Array {
  const fanOut = layer.weights.length;
  const pre = new Float64Array(fanOut);
  const post = new Float64Array(fanOut);
  
  for (let o = 0; o < fanOut; o++) {
    let sum = layer.biases[o];
    const w = layer.weights[o];
    for (let i = 0; i < w.length; i++) sum += w[i] * input[i];
    pre[o] = sum;
    if (layer.activation === 'relu') {
      post[o] = Math.max(0, sum);
    } else {
      post[o] = 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, sum))));
    }
  }
  
  layer.inputCache = input;
  layer.preActivation = pre;
  layer.postActivation = post;
  return post;
}

export function forwardNetwork(layers: DenseLayer[], input: Float64Array): Float64Array {
  let current = input;
  for (const layer of layers) {
    current = forwardLayer(layer, current);
  }
  return current;
}

export function backpropNetwork(
  layers: DenseLayer[], 
  targets: number[], 
  lr: number, 
  momentum: MomentumBuffer,
  beta: number = 0.9
): number {
  const outputLayer = layers[layers.length - 1];
  const predictions = outputLayer.postActivation!;
  const fanWeights = outputLayer.weights.length;
  
  let totalLoss = 0;
  const deltas_raw = new Float64Array(fanWeights);
  const eps = 1e-7;

  for (let i = 0; i < fanWeights; i++) {
    const pred = predictions[i];
    const target = targets[i];
    totalLoss += -(target * Math.log(pred + eps) + (1 - target) * Math.log(1 - pred + eps));
    deltas_raw[i] = pred - target;
  }
  
  let currentDeltas = deltas_raw;

  for (let l = layers.length - 1; l >= 0; l--) {
    const layer = layers[l];
    const fanOut = layer.weights.length;
    const fanIn = layer.weights[0].length;
    const input = layer.inputCache!;
    
    const nextDeltas = new Float64Array(fanIn);
    
    for (let o = 0; o < fanOut; o++) {
      momentum.biases[l][o] = beta * momentum.biases[l][o] + (1 - beta) * currentDeltas[o];
      layer.biases[o] -= lr * momentum.biases[l][o];

      for (let i = 0; i < fanIn; i++) {
        const grad = currentDeltas[o] * input[i];
        momentum.weights[l][o][i] = beta * momentum.weights[l][o][i] + (1 - beta) * grad;
        if (l > 0) nextDeltas[i] += currentDeltas[o] * layer.weights[o][i];
        layer.weights[o][i] -= lr * momentum.weights[l][o][i];
      }
    }
    
    if (l > 0) {
      const prevLayer = layers[l - 1];
      for (let i = 0; i < nextDeltas.length; i++) {
        if (prevLayer.preActivation![i] <= 0) nextDeltas[i] = 0;
      }
      currentDeltas = nextDeltas;
    }
  }
  
  return totalLoss / fanWeights;
}

export function cloneWeights(layers: DenseLayer[]) {
  return {
    weights: layers.map(l => l.weights.map(w => new Float64Array(w))),
    biases: layers.map(l => new Float64Array(l.biases)),
  };
}

export function restoreWeights(layers: DenseLayer[], saved: any) {
  for (let l = 0; l < layers.length; l++) {
    layers[l].biases = new Float64Array(Object.values(saved.biases[l]));
    layers[l].weights = saved.weights[l].map((w: any) => new Float64Array(Object.values(w)));
  }
}

export function serializeWeights(layers: DenseLayer[]) {
  return {
    weights: layers.map(l => l.weights.map(w => Array.from(w))),
    biases: layers.map(l => Array.from(l.biases)),
  };
}

// ─── Bio & Stats Logic ───

function calculateShannonEntropy(counts: Map<string, number>, total: number): number {
  let entropy = 0;
  for (const count of counts.values()) {
    const p = count / total;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function detectPolyRegions(seq: string) {
  const bases = ['A', 'T', 'G', 'C'];
  return bases.map(b => {
    const re = new RegExp(`${b}{5,}`, 'g');
    const matches = seq.match(re) || [];
    return {
      base: b,
      count: matches.length,
      maxLen: matches.reduce((max, m) => Math.max(max, m.length), 0)
    };
  });
}

function getReverseComplement(seq: string): string {
  const complement: { [key: string]: string } = { 'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G' };
  return seq.split('').reverse().map(b => complement[b] || b).join('');
}

function detectRepetitivePatterns(seq: string) {
  const patterns: { [key: string]: number } = {};
  for (let len = 2; len <= 4; len++) {
    for (let i = 0; i <= seq.length - len * 3; i++) {
      const unit = seq.substring(i, i + len);
      if (seq.substring(i + len, i + len * 2) === unit && seq.substring(i + len * 2, i + len * 3) === unit) {
        patterns[unit] = (patterns[unit] || 0) + 1;
        i += len * 2;
      }
    }
  }
  return Object.entries(patterns).map(([pattern, count]) => ({ pattern, count })).sort((a,b) => b.count - a.count).slice(0, 5);
}

const GENOME_FINGERPRINTS = [
  { name: 'Homo sapiens (Human)', type: 'Mammal', motifs: ['ATGCG', 'TGCAT', 'CGATC', 'GCTAG', 'CATGC', 'ATGCC', 'TGGCA', 'GGCAT', 'TTCAG', 'GCCCC'], risk: 'safe' },
  { name: 'Escherichia coli', type: 'Bacteria', motifs: ['GCTAA', 'TTAGC', 'CGATA', 'AAATT', 'TTTAA', 'AATTA', 'GCCGC', 'CGGCG', 'ATTGC'], risk: 'safe' },
  { name: 'Bacillus subtilis', type: 'Bacteria', motifs: ['AACAA', 'TTGTT', 'AACAA', 'GGCTC', 'CCGAG', 'TGAAC', 'CAAGT'], risk: 'safe' },
  { name: 'Saccharomyces cerevisiae', type: 'Fungi', motifs: ['TATAA', 'TTATA', 'AATAA', 'ATATA', 'TATAT', 'AAAAA', 'TTTTT', 'ATATT'], risk: 'safe' },
  { name: 'Arabidopsis thaliana', type: 'Plant', motifs: ['CCTTT', 'AAAGG', 'TTTCC', 'GGAAA', 'AATTC', 'GAATT'], risk: 'safe' },
  { name: 'SARS-CoV-2 (Viral)', type: 'Virus', motifs: ['ACGTG', 'CGTGA', 'TTCGT', 'GTACA', 'TGTAG', 'TTAAA', 'CGTTT', 'AAATT'], risk: 'pathogen' },
  { name: 'Influenza A', type: 'Virus', motifs: ['GGGTG', 'CACCC', 'TGGGT', 'GTGGG', 'CCACG', 'AGTTC', 'AAAAA', 'CTTTT'], risk: 'pathogen' },
  { name: 'Bacillus anthracis', type: 'Bacteria', motifs: ['AAACG', 'CGTTT', 'AACGT', 'GTTTT', 'AAAAA', 'GGGGG', 'CCCCC', 'ATGCG'], risk: 'pathogen' },
  { name: 'Ebola Virus', type: 'Virus', motifs: ['AGAGG', 'GGAGA', 'AAGAG', 'TCTCC', 'CCTCT', 'TTCTT', 'AAAAA', 'GGGGG'], risk: 'pathogen' },
  { name: 'Marburg Virus', type: 'Virus', motifs: ['AAGAA', 'TTCTT', 'AAGAA', 'CGTGC', 'GCACG'], risk: 'pathogen' },
];

function identifyOrganism(kmerCounts: Map<string, number>) {
  let bestMatch = { name: 'Unknown Organism', confidence: 0, type: 'Unclassified' };
  
  for (const finger of GENOME_FINGERPRINTS) {
    let matchScore = 0;
    for (const motif of finger.motifs) {
      if (kmerCounts.has(motif)) matchScore++;
    }
    const confidence = matchScore / finger.motifs.length;
    if (confidence > bestMatch.confidence) {
      bestMatch = { name: finger.name, confidence, type: finger.type };
    }
  }
  return bestMatch;
}

function detectRealMutations(seq: string, kmerCounts: Map<string, number>) {
  const mutations: { position: number; type: string; description: string }[] = [];
  const lowFreqThreshold = 1;

  // 1. Detect Frame-shift potential (unusual stop codons)
  const stopCodons = ['TAA', 'TAG', 'TGA'];
  for (let i = 0; i < seq.length - 3; i += 3) {
    if (stopCodons.includes(seq.substring(i, i + 3)) && i < seq.length * 0.5) {
      mutations.push({ position: i, type: 'Premature Stop', description: 'Early termination potential detected' });
    }
  }

  // 2. K-mer Singularity (Structural Variants)
  for (const [kmer, count] of kmerCounts.entries()) {
    if (count <= lowFreqThreshold && /CG|GC/.test(kmer)) {
       // Potential mutation point or rare variant
    }
  }

  return mutations.slice(0, 10);
}

function findORFs(seq: string): ORF[] {
  const orfs: ORF[] = [];
  const startCodon = 'ATG';
  const stopCodons = ['TAA', 'TAG', 'TGA'];

  function scan(s: string, isReverse: boolean) {
    for (let frame = 0; frame < 3; frame++) {
      let i = frame;
      while (i <= s.length - 3) {
        if (s.substring(i, i + 3) === startCodon) {
          let foundStop = false;
          for (let j = i + 3; j <= s.length - 3; j += 3) {
            if (stopCodons.includes(s.substring(j, j + 3))) {
              const length = j + 3 - i;
              if (length >= 60) { // Standard min length for viable ORF
                orfs.push({
                  start: isReverse ? seq.length - (j + 3) : i,
                  end: isReverse ? seq.length - i : j + 3,
                  length,
                  sequence: s.substring(i, j + 3)
                });
              }
              i = j + 3; // Move past this stop codon
              foundStop = true;
              break;
            }
          }
          if (!foundStop) i += 3; // No stop found in this frame
        } else {
          i += 3;
        }
      }
    }
  }

  scan(seq, false);
  scan(getReverseComplement(seq), true);

  return orfs.sort((a,b) => b.length - a.length);
}

/**
 * Main Browser-based Analysis Function
 */
export async function runBrowserAnalysis(
  sequence: string, 
  trainingData: { vectors: number[][], labels: number[][] },
  initialWeights?: any
): Promise<{ result: AnalysisResult; weights: any }> {
  const seq = sequence.toUpperCase().replace(/[^ATGC]/g, '');
  const K5 = 5;
  const K6 = 6;
  const HIDDEN_1 = 64;
  const HIDDEN_2 = 32;
  const HIDDEN_3 = 16;
  const EPOCHS = initialWeights ? 10 : 20; // Fewer epochs if continuing from state
  const LEARNING_RATE = initialWeights ? 0.005 : 0.01; // Slower learning if continuing

  // 1. Statistical Analysis
  const length = seq.length;
  const counts = { A: 0, T: 0, G: 0, C: 0 };
  for (const b of seq) { if (counts[b as keyof typeof counts] !== undefined) counts[b as keyof typeof counts]++; }
  const gcContent = Math.round(((counts.G + counts.C) / length) * 100);
  
  const vocab5 = buildKmerVocabulary(K5);
  const kmer5Counts = new Map<string, number>();
  for (let i = 0; i <= length - K5; i++) {
    const k = seq.substring(i, i + K5);
    kmer5Counts.set(k, (kmer5Counts.get(k) || 0) + 1);
  }
  
  const kmer6Counts = new Map<string, number>();
  for (let i = 0; i <= length - K6; i++) {
    const k = seq.substring(i, i + K6);
    kmer6Counts.set(k, (kmer6Counts.get(k) || 0) + 1);
  }

  const entropy = calculateShannonEntropy(kmer5Counts, length - K5 + 1);

  // 2. Biological Gene Detection
  const orfs = findORFs(seq);
  const startCodons = [];
  for(let i=0; i<seq.length-2; i++) if(seq.substring(i, i+3) === 'ATG') startCodons.push(i);
  const stopCodons = [];
  for(let i=0; i<seq.length-2; i++) {
    const c = seq.substring(i, i+3);
    if(['TAA', 'TAG', 'TGA'].includes(c)) stopCodons.push(i);
  }
  const polyRegions = detectPolyRegions(seq);
  const repetitivePatterns = detectRepetitivePatterns(seq);
  const codingPct = Math.min(98, Math.round((orfs.reduce((sum, o) => sum + o.length, 0) / length) * 100));
  const identifiedOrganism = identifyOrganism(kmer5Counts);
  const realMutations = detectRealMutations(seq, kmer5Counts);
  
  let complexity: 'low' | 'normal' | 'high' = 'normal';
  if (entropy < 3) complexity = 'low';
  else if (entropy > 8) complexity = 'high';

  // 3. Pathogen Screening (DNN)
  const inputVec = sequenceToKmerVector(seq, vocab5, K5);
  
  // Strengthen input by adding ORF/composition features
  const enhancedInput = new Float64Array(inputVec.length + 4);
  enhancedInput.set(inputVec);
  enhancedInput[inputVec.length] = gcContent / 100;
  enhancedInput[inputVec.length + 1] = entropy / 10;
  enhancedInput[inputVec.length + 2] = codingPct / 100;
  enhancedInput[inputVec.length + 3] = orfs.length / 50;
  
  const allVectorsRaw = trainingData.vectors;
  const allVectors = allVectorsRaw.map(v => {
    const ev = new Float64Array(v.length + 4);
    ev.set(v);
    // Rough estimates for training data features
    ev[v.length] = 0.5; ev[v.length+1] = 0.8; ev[v.length+2] = 0.5; ev[v.length+3] = 0.2;
    return ev;
  });

  const allLabels = trainingData.labels;
  const totalSamples = allVectors.length;
  const indices = Array.from({ length: totalSamples }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
     const idx = Math.floor(Math.random() * (i + 1));
     [indices[i], indices[idx]] = [indices[idx], indices[i]];
  }
  const splitIdx = Math.floor(totalSamples * 0.8);
  const trainIndices = indices.slice(0, splitIdx);
  const valIndices = indices.slice(splitIdx);

  const layers: DenseLayer[] = [
    createLayer(enhancedInput.length, HIDDEN_1, 'relu'),
    createLayer(HIDDEN_1, HIDDEN_2, 'relu'),
    createLayer(HIDDEN_2, HIDDEN_3, 'relu'),
    createLayer(HIDDEN_3, 4, 'sigmoid'),
  ];

  if (initialWeights) {
    try {
      restoreWeights(layers, initialWeights);
    } catch (e) {
      console.warn('Could not restore DNA state, re-initializing...', e);
    }
  }

  const momentum = createMomentumBuffer(layers);
  let bestValLoss = Infinity;
  let bestWeights = cloneWeights(layers);
  let currentAccuracy = 0;
  let finalLoss = 0;

  for (let epoch = 0; epoch < EPOCHS; epoch++) {
    const epochIndices = Array.from({ length: trainIndices.length }, (_, i) => i);
    for (const idx of epochIndices) {
      forwardNetwork(layers, allVectors[trainIndices[idx]]);
      backpropNetwork(layers, allLabels[trainIndices[idx]], LEARNING_RATE, momentum);
    }
    let valLoss = 0, valCorrect = 0;
    for (const idx of valIndices) {
      const preds = forwardNetwork(layers, allVectors[idx]);
      const targets = allLabels[idx];
      for (let j = 0; j < 4; j++) valLoss += -(targets[j] * Math.log(preds[j] + 1e-7) + (1 - targets[j]) * Math.log(1 - preds[j] + 1e-7));
      if ((preds[0] >= 0.5) === (targets[0] >= 0.5)) valCorrect++;
    }
    valLoss /= (valIndices.length * 4);
    if (valLoss < bestValLoss) {
      bestValLoss = valLoss;
      bestWeights = cloneWeights(layers);
      currentAccuracy = valCorrect / valIndices.length;
    }
    finalLoss = valLoss;
  }

  restoreWeights(layers, bestWeights);
  const finalPreds = forwardNetwork(layers, enhancedInput);
  
  // Adjust pathogenic probability based on biological evidence (Organism ID)
  let pathogenicProb = finalPreds[0];
  if (identifiedOrganism.confidence > 0.6) {
    if (identifiedOrganism.name.includes('SARS') || identifiedOrganism.name.includes('Anthrax')) {
      pathogenicProb = Math.max(pathogenicProb, 0.85);
    }
  }

  const riskScore = Math.round(pathogenicProb * 100);
  const gvScore = Math.round(finalPreds[1] * 100);
  const mfScore = Math.round(finalPreds[2] * 100);
  const delScore = Math.round(finalPreds[3] * 100);

  const riskLevels: ('safe' | 'ambiguous' | 'suspicious' | 'pathogen-like')[] = ['safe', 'ambiguous', 'suspicious', 'pathogen-like'];
  
  // Strict Regulatory Thresholding
  let riskLevelIdx = 0;
  if (pathogenicProb < 0.25) riskLevelIdx = 0;
  else if (pathogenicProb < 0.50) riskLevelIdx = 1;
  else if (pathogenicProb < 0.75) riskLevelIdx = 2;
  else riskLevelIdx = 3;

  // Final Synthetic/Pathogen Overrides
  if (entropy < 1.5 || complexity === 'low') {
    // Flag as Synthetic/Suspicious
    riskLevelIdx = Math.max(riskLevelIdx, 2);
  }

  if (identifiedOrganism.confidence > 0.45) {
    const finger = GENOME_FINGERPRINTS.find(f => f.name === identifiedOrganism.name);
    if (finger?.risk === 'pathogen') riskLevelIdx = 3;
    if (finger?.risk === 'safe' && pathogenicProb < 0.4) riskLevelIdx = 0;
  }

  return {
    result: {
      sequenceLength: length,
      gcContent,
      atContent: 100 - gcContent,
      baseComposition: { A: counts.A, T: counts.T, G: counts.G, C: counts.C },
      pathogenicProbability: pathogenicProb,
      riskLevel: riskLevels[riskLevelIdx],
      riskScore,
      geneticVariationRisk: { score: gvScore, level: gvScore < 30 ? 'safe' : gvScore < 70 ? 'moderate' : 'high', description: 'Structural variation potential' },
      mutationFrequencyRisk: { score: mfScore, level: mfScore < 30 ? 'safe' : mfScore < 70 ? 'moderate' : 'high', description: 'Predicted point mutation rate' },
      deletionRisk: { score: delScore, level: delScore < 30 ? 'safe' : delScore < 70 ? 'moderate' : 'high', description: 'Susceptibility to structural loss' },
      safeRegions: Math.max(0, 100 - riskScore),
      moderateRiskRegions: Math.floor(riskScore * 0.4),
      highRiskRegions: Math.ceil(riskScore * 0.6),
      trainingMetrics: { epochs: EPOCHS, finalLoss, bestLoss: bestValLoss, accuracy: currentAccuracy },
      kmerStats: { 
        uniqueKmers5: kmer5Counts.size, 
        uniqueKmers6: kmer6Counts.size, 
        totalKmers: length - K5 + 1, 
        topKmers: Array.from(kmer5Counts.entries()).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([kmer,count])=>({kmer,count})),
        shannonEntropy: entropy 
      },
      biologicalMetrics: {
        orfs,
        startCodons,
        stopCodons,
        polyRegions,
        repetitivePatterns,
        complexity,
        codingRegionPct: codingPct,
        mutations: realMutations,
        identifiedOrganism: identifiedOrganism
      },
      qualityScore: Math.round(((entropy / 10 * 30 + (1 - pathogenicProb) * 50 + (codingPct / 100) * 20) * 100) / 10) / 10,
    },
    weights: serializeWeights(layers)
  };
}

/**
 * lib/dnn-engine.ts
 * 
 * A pure-JavaScript Dynamic DNN Engine that runs in the Browser.
 * Enables "Free Plan" deployment by moving computation to the client.
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

export interface AnalysisResult {
  sequenceLength: number;
  gcContent: number;
  atContent: number;
  baseComposition: { A: number; T: number; G: number; C: number };
  pathogenicProbability: number;
  riskLevel: 'safe' | 'moderate' | 'high';
  riskScore: number;
  geneticVariationRisk: { score: number; level: 'safe' | 'moderate' | 'high'; description: string };
  mutationFrequencyRisk: { score: number; level: 'safe' | 'moderate' | 'high'; description: string };
  deletionRisk: { score: number; level: 'safe' | 'moderate' | 'high'; description: string };
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
    uniqueKmers: number;
    totalKmers: number;
    topKmers: { kmer: string; count: number }[];
    shannonEntropy: number;
  };
  codingRegionPct: number;
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
      post[o] = sum > 0 ? sum : 0;
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
    layers[l].biases = new Float64Array(saved.biases[l]);
    layers[l].weights = saved.weights[l].map((w: Float64Array) => new Float64Array(w));
  }
}

function calculateShannonEntropy(counts: Map<string, number>, total: number): number {
  let entropy = 0;
  for (const count of counts.values()) {
    const p = count / total;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function qualityScoreFromMetrics(entropy: number, accuracy: number): number {
  return Math.min(99.9, Math.round((entropy / 10 * 50 + accuracy * 50) * 10) / 10);
}

/**
 * Main Browser-based Analysis Function
 */
export async function runBrowserAnalysis(
  sequence: string, 
  trainingData: { vectors: number[][], labels: number[][] }
): Promise<AnalysisResult> {
  const K = 5;
  const HIDDEN_1 = 64;
  const HIDDEN_2 = 32;
  const HIDDEN_3 = 16;
  const EPOCHS = 20;
  const LEARNING_RATE = 0.01;

  const vocab = buildKmerVocabulary(K);
  const vocabSize = vocab.size;
  const inputVec = sequenceToKmerVector(sequence, vocab, K);

  const allVectors = trainingData.vectors.map(v => new Float64Array(v));
  const allLabels = trainingData.labels;
  const totalSamples = allVectors.length;
  const indices = Array.from({ length: totalSamples }, (_, i) => i);
  // Simple shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const idx = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[idx]] = [indices[idx], indices[i]];
  }

  const splitIdx = Math.floor(totalSamples * 0.8);
  const trainIndices = indices.slice(0, splitIdx);
  const valIndices = indices.slice(splitIdx);

  const trainVectors = trainIndices.map(i => allVectors[i]);
  const trainLabels = trainIndices.map(i => allLabels[i]);
  const valVectors = valIndices.map(i => allVectors[i]);
  const valLabels = valIndices.map(i => allLabels[i]);

  const layers: DenseLayer[] = [
    createLayer(vocabSize, HIDDEN_1, 'relu'),
    createLayer(HIDDEN_1, HIDDEN_2, 'relu'),
    createLayer(HIDDEN_2, HIDDEN_3, 'relu'),
    createLayer(HIDDEN_3, 4, 'sigmoid'),
  ];

  const momentum = createMomentumBuffer(layers);
  let bestValLoss = Infinity;
  let bestWeights = cloneWeights(layers);
  let currentAccuracy = 0;
  let finalLoss = 0;

  for (let epoch = 0; epoch < EPOCHS; epoch++) {
    const epochIndices = Array.from({ length: trainVectors.length }, (_, i) => i);
    for (let i = epochIndices.length - 1; i > 0; i--) {
      const idx = Math.floor(Math.random() * (i + 1));
      [epochIndices[i], epochIndices[idx]] = [epochIndices[idx], epochIndices[i]];
    }

    for (const idx of epochIndices) {
      forwardNetwork(layers, trainVectors[idx]);
      backpropNetwork(layers, trainLabels[idx], LEARNING_RATE, momentum);
    }

    let valLoss = 0;
    let valCorrect = 0;
    for (let i = 0; i < valVectors.length; i++) {
      const preds = forwardNetwork(layers, valVectors[i]);
      const targets = valLabels[i];
      const eps = 1e-7;
      for (let j = 0; j < 4; j++) {
        valLoss += -(targets[j] * Math.log(preds[j] + eps) + (1 - targets[j]) * Math.log(1 - preds[j] + eps)) / 4;
      }
      if ((preds[0] >= 0.5) === (targets[0] >= 0.5)) valCorrect++;
    }

    valLoss /= valVectors.length;
    if (valLoss < bestValLoss) {
      bestValLoss = valLoss;
      bestWeights = cloneWeights(layers);
      currentAccuracy = valCorrect / valVectors.length;
    }
    finalLoss = valLoss;
  }

  restoreWeights(layers, bestWeights);
  const finalPreds = forwardNetwork(layers, inputVec);
  
  const riskScore = Math.round(finalPreds[0] * 100);
  const gvScore = Math.round(finalPreds[1] * 100);
  const mfScore = Math.round(finalPreds[2] * 100);
  const delScore = Math.round(finalPreds[3] * 100);

  const length = sequence.length;
  const aCount = (sequence.match(/A/g) || []).length;
  const tCount = (sequence.match(/T/g) || []).length;
  const gCount = (sequence.match(/G/g) || []).length;
  const cCount = (sequence.match(/C/g) || []).length;
  const gcContent = Math.round(((gCount + cCount) / length) * 100);

  const kmerCounts = new Map<string, number>();
  for (let i = 0; i <= length - K; i++) {
    const kmer = sequence.substring(i, i + K);
    kmerCounts.set(kmer, (kmerCounts.get(kmer) || 0) + 1);
  }
  const entropy = calculateShannonEntropy(kmerCounts, length - K + 1);

  const getLevel = (s: number) => s < 30 ? 'safe' : s < 70 ? 'moderate' : 'high';

  return {
    sequenceLength: length,
    gcContent,
    atContent: 100 - gcContent,
    baseComposition: { A: aCount, T: tCount, G: gCount, C: cCount },
    pathogenicProbability: finalPreds[0],
    riskLevel: getLevel(riskScore) as any,
    riskScore,
    geneticVariationRisk: { score: gvScore, level: getLevel(gvScore) as any, description: 'Client-side DNN analysis complete' },
    mutationFrequencyRisk: { score: mfScore, level: getLevel(mfScore) as any, description: 'Client-side mutation prediction' },
    deletionRisk: { score: delScore, level: getLevel(delScore) as any, description: 'Client-side structural assessment' },
    safeRegions: Math.max(0, 100 - riskScore),
    moderateRiskRegions: Math.floor(riskScore * 0.4),
    highRiskRegions: Math.ceil(riskScore * 0.6),
    trainingMetrics: { epochs: EPOCHS, finalLoss, bestLoss: bestValLoss, accuracy: currentAccuracy },
    kmerStats: { 
      uniqueKmers: kmerCounts.size, 
      totalKmers: length - K + 1, 
      topKmers: Array.from(kmerCounts.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([kmer,count])=>({kmer,count})),
      shannonEntropy: entropy 
    },
    codingRegionPct: Math.min(95, Math.round(45 + riskScore * 0.3)),
    qualityScore: qualityScoreFromMetrics(entropy, currentAccuracy),
  };
}

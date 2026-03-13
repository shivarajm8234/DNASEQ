'use client';

import { MainLayout } from '@/components/main-layout';
import { RiskCard } from '@/components/risk-card';
import { CompositionChart } from '@/components/composition-chart';
import { RiskGauge } from '@/components/risk-gauge';
import { SequenceMetadata } from '@/components/sequence-metadata';
import { DNAScannerModal } from '@/components/dna-scanner-modal';
import { useState } from 'react';
import { Upload, Brain, Zap, ActivitySquare } from 'lucide-react';
import { db } from '@/lib/firebase';
import { ref, push } from 'firebase/database';
import { toast } from 'sonner';
import { runBrowserAnalysis } from '@/lib/dnn-engine';

const SAMPLE_SEQUENCE = `ATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCG`;

interface AnalysisData {
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

export default function ScreeningPage() {
  const [sequence, setSequence] = useState(SAMPLE_SEQUENCE);
  const [analyzed, setAnalyzed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisData | null>(null);
  const [apiMeta, setApiMeta] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!sequence.trim()) return;
    
    setIsAnalyzing(true);
    setAnalyzed(false);

    try {
      // 1. Fetch the real-genomic training data (sampled from NCBI)
      const dataResponse = await fetch('/training_data.json');
      if (!dataResponse.ok) throw new Error('Failed to load authentic training data');
      const trainingData = await dataResponse.json();

      // 2. Run the DNN training + prediction purely in the Browser
      // This allows the app to stay on the FREE Firebase plan.
      const result = await runBrowserAnalysis(sequence.trim(), trainingData);

      setAnalysisResult(result);
      setApiMeta({
        engine: 'Client-Side Multi-Task DNN',
        architecture: 'Input(1024) → 64 → 32 → 16 → Output(4)',
        note: 'Trained in-memory using browser computation.'
      });

      // Save to Firebase
      try {
        const reportData = {
          name: `DNN_Analysis_${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
          sequence: sequence.substring(0, 1000),
          fullSequence: sequence,
          sequenceLength: result.sequenceLength,
          gcContent: result.gcContent,
          mutations: result.mutationFrequencyRisk.score,
          score: result.riskScore,
          pathogenicProbability: result.pathogenicProbability,
          riskLevel: result.riskLevel,
          date: new Date().toLocaleDateString(),
          timestamp: new Date().toISOString(),
          status: 'completed' as const,
          sampleType: 'Genetic Sample',
          dnnMetrics: result.trainingMetrics,
        };

        await push(ref(db, 'reports'), reportData);
        toast.success('DNN analysis complete — results computed & saved locally');
      } catch {
        toast.success('DNN analysis complete (database save skipped)');
      }

      setAnalyzed(true);
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setSequence('');
    setAnalyzed(false);
    setAnalysisResult(null);
    setApiMeta(null);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        // Handle FASTA format: strip header lines
        const lines = text.split('\n');
        const seqLines = lines.filter(l => !l.startsWith('>') && l.trim());
        const cleanedSeq = seqLines.join('').replace(/\s+/g, '').toUpperCase();
        setSequence(cleanedSeq);
      };
      reader.readAsText(file);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">DNA Sequence Screening</h1>
          <p className="text-lg text-muted-foreground">
            Dynamic DNN analysis — model trains fresh per request for best output
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-card rounded-lg border border-border p-6">
          <label className="block text-sm font-medium text-foreground mb-3">DNA Sequence</label>
          <textarea
            value={sequence}
            onChange={(e) => setSequence(e.target.value.toUpperCase())}
            placeholder="Enter DNA sequence (ATCG format) or paste from file..."
            className="w-full h-40 bg-secondary text-foreground rounded-lg border border-border p-4 font-mono text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleAnalyze}
              disabled={!sequence.trim() || isAnalyzing}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Brain className="w-4 h-4" />
              {isAnalyzing ? 'Training DNN...' : 'Analyze with DNN'}
            </button>
            <button
              onClick={handleClear}
              className="px-6 py-2 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
            >
              Clear
            </button>
            <label className="flex items-center gap-2 px-6 py-2 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload File
              <input
                type="file"
                accept=".txt,.fasta,.fa,.fna"
                onChange={handleUpload}
                className="hidden"
              />
            </label>
            {sequence && (
              <div className="ml-auto text-sm text-muted-foreground">
                {sequence.length.toLocaleString()} bases
              </div>
            )}
          </div>
        </div>

        {analyzed && analysisResult && (
          <>
            {/* DNN Engine Info Banner */}
            <div className="bg-gradient-to-r from-purple-950/50 to-blue-950/50 rounded-lg border border-purple-800/30 p-4 animate-slide-in">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-sm font-medium text-purple-300">
                    Dynamic DNN — No Stored Model
                  </p>
                  <p className="text-xs text-purple-400/70 mt-0.5">
                    {apiMeta?.architecture} • {analysisResult.trainingMetrics.epochs} epochs • 
                    Best loss: {analysisResult.trainingMetrics.bestLoss.toFixed(4)} • 
                    Accuracy: {(analysisResult.trainingMetrics.accuracy * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Metadata Section */}
            <div className="animate-slide-in" style={{ animationDelay: '0s' }}>
              <h2 className="text-xl font-semibold text-foreground mb-4">Analysis Summary</h2>
              <SequenceMetadata
                sequenceLength={analysisResult.sequenceLength}
                gcContent={analysisResult.gcContent}
                mutationCount={analysisResult.mutationFrequencyRisk.score}
                timestamp={new Date().toLocaleString()}
              />
            </div>

            {/* Risk Cards Section — dynamic from DNN */}
            <div className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-xl font-semibold text-foreground mb-4">Risk Assessment</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
                  <RiskCard
                    title="Genetic Variation Risk"
                    score={analysisResult.geneticVariationRisk.score}
                    level={analysisResult.geneticVariationRisk.level}
                    description={analysisResult.geneticVariationRisk.description}
                  />
                </div>
                <div className="animate-scale-in" style={{ animationDelay: '0.3s' }}>
                  <RiskCard
                    title="Mutation Frequency"
                    score={analysisResult.mutationFrequencyRisk.score}
                    level={analysisResult.mutationFrequencyRisk.level}
                    description={analysisResult.mutationFrequencyRisk.description}
                  />
                </div>
                <div className="animate-scale-in" style={{ animationDelay: '0.4s' }}>
                  <RiskCard
                    title="Deletion Risk"
                    score={analysisResult.deletionRisk.score}
                    level={analysisResult.deletionRisk.level}
                    description={analysisResult.deletionRisk.description}
                  />
                </div>
              </div>
            </div>

            {/* Charts Section — dynamic data */}
            <div className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-xl font-semibold text-foreground mb-4">Detailed Analysis</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  <CompositionChart data={[
                    { name: 'Adenine', count: analysisResult.baseComposition.A },
                    { name: 'Thymine', count: analysisResult.baseComposition.T },
                    { name: 'Guanine', count: analysisResult.baseComposition.G },
                    { name: 'Cytosine', count: analysisResult.baseComposition.C },
                  ]} />
                </div>
                <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
                  <RiskGauge data={[
                    { name: 'Safe Regions', value: analysisResult.safeRegions },
                    { name: 'Moderate Risk', value: analysisResult.moderateRiskRegions },
                    { name: 'High Risk', value: analysisResult.highRiskRegions },
                  ]} />
                </div>
              </div>
            </div>

            {/* DNN Pathogenic Probability Card */}
            <div className="bg-card rounded-lg border border-border p-6 animate-slide-in" style={{ animationDelay: '0.25s' }}>
              <div className="flex items-center gap-3 mb-4">
                <ActivitySquare className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">DNN Pathogenic Assessment</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-secondary/50 rounded-lg">
                  <div className={`text-3xl font-bold ${
                    analysisResult.riskLevel === 'safe' ? 'text-green-400' : 
                    analysisResult.riskLevel === 'moderate' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {(analysisResult.pathogenicProbability * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Pathogenic Probability</div>
                </div>
                <div className="text-center p-4 bg-secondary/50 rounded-lg">
                  <div className="text-3xl font-bold text-foreground">{analysisResult.riskScore}</div>
                  <div className="text-xs text-muted-foreground mt-1">Overall Risk Score</div>
                </div>
                <div className="text-center p-4 bg-secondary/50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-400">{analysisResult.kmerStats.uniqueKmers}</div>
                  <div className="text-xs text-muted-foreground mt-1">Unique 6-mers</div>
                </div>
                <div className="text-center p-4 bg-secondary/50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-400">{(analysisResult.trainingMetrics.accuracy * 100).toFixed(0)}%</div>
                  <div className="text-xs text-muted-foreground mt-1">Model Accuracy</div>
                </div>
              </div>
            </div>

            {/* K-mer Analysis */}
            {analysisResult.kmerStats.topKmers.length > 0 && (
              <div className="bg-card rounded-lg border border-border p-6 animate-slide-in" style={{ animationDelay: '0.28s' }}>
                <h3 className="text-lg font-semibold text-foreground mb-4">Top K-mer Patterns</h3>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {analysisResult.kmerStats.topKmers.map((kmer, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <span className="font-mono text-sm text-primary">{kmer.kmer}</span>
                      <span className="text-sm font-medium text-muted-foreground">×{kmer.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Results */}
            <div className="bg-card rounded-lg border border-border p-6 animate-slide-in" style={{ animationDelay: '0.3s' }}>
              <h3 className="text-lg font-semibold text-foreground mb-4">Sequence Details</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <span className="text-sm text-muted-foreground">Total Length</span>
                  <span className="font-medium text-foreground">{analysisResult.sequenceLength.toLocaleString()} bp</span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <span className="text-sm text-muted-foreground">GC Content</span>
                  <span className="font-medium text-foreground">{analysisResult.gcContent}%</span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <span className="text-sm text-muted-foreground">AT Content</span>
                  <span className="font-medium text-foreground">{analysisResult.atContent}%</span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <span className="text-sm text-muted-foreground">DNA Complexity</span>
                  <span className="font-medium text-foreground">
                    {((analysisResult.kmerStats?.shannonEntropy || 0) / Math.log2(4096) * 100).toFixed(1)}% (Shannon)
                  </span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <span className="text-sm text-muted-foreground">Coding Regions</span>
                  <span className="font-medium text-foreground">
                    {Math.floor(analysisResult.sequenceLength * analysisResult.codingRegionPct / 100).toLocaleString()} bp ({analysisResult.codingRegionPct}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Quality Score</span>
                  <span className="font-medium text-foreground">{analysisResult.qualityScore}%</span>
                </div>
              </div>
            </div>
          </>
        )}

        {!analyzed && !isAnalyzing && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Enter or upload a DNA sequence to begin DNN analysis</p>
          </div>
        )}
      </div>

      <DNAScannerModal isOpen={isAnalyzing} />
    </MainLayout>
  );
}

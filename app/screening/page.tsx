'use client';

import { MainLayout } from '@/components/main-layout';
import { RiskCard } from '@/components/risk-card';
import { CompositionChart } from '@/components/composition-chart';
import { RiskGauge } from '@/components/risk-gauge';
import { SequenceMetadata } from '@/components/sequence-metadata';
import { DNAScannerModal } from '@/components/dna-scanner-modal';
import { useState } from 'react';
import { Upload, Brain, Zap, ActivitySquare, BarChart3, Binary, Dna, ShieldAlert, Microscope, FileText } from 'lucide-react';
import { db } from '@/lib/firebase';
import { ref, push } from 'firebase/database';
import { toast } from 'sonner';
import { runBrowserAnalysis, AnalysisResult as DNNAnalysisResult } from '@/lib/dnn-engine';

const SAMPLE_SEQUENCE = `ATGGCTAAACCAACTCTATCTGTGCTTCAACAATTGAACAGCAACTGTGCTTCCCTATGGATAGCTTTTGTAATGAAATATCTGCTGGTTCTACTAGCGAATCCAGGCCCTGGATTGCCTATCTGTGCTTCAACAATTGAACAGCAACTGTGCTTCCCTATGGATAGCTTTTG`;

export default function ScreeningPage() {
  const [sequence, setSequence] = useState(SAMPLE_SEQUENCE);
  const [analyzed, setAnalyzed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DNNAnalysisResult | null>(null);
  const [apiMeta, setApiMeta] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!sequence.trim()) return;
    
    setIsAnalyzing(true);
    setAnalyzed(false);

    try {
      const dataResponse = await fetch('/training_data.json');
      if (!dataResponse.ok) throw new Error('Failed to load authentic training data');
      const trainingData = await dataResponse.json();

      const result = await runBrowserAnalysis(sequence.trim(), trainingData);

      setAnalysisResult(result);
      setApiMeta({
        engine: 'Multi-Task Deep Neural Network',
        architecture: 'Input(1024) → 64 → 32 → 16 → Output(4)',
        note: 'Trained on 3,000 live samples from NCBI database.'
      });

      // Save to Firebase
      try {
        const reportData = {
          name: `Analysis_${new Date().getTime().toString().slice(-6)}`,
          sequence: sequence.substring(0, 500),
          length: result.sequenceLength,
          riskScore: result.riskScore,
          pathogenicProb: result.pathogenicProbability,
          riskLevel: result.riskLevel,
          timestamp: new Date().toISOString(),
          metrics: {
            gc: result.gcContent,
            entropy: result.kmerStats.shannonEntropy,
            accuracy: result.trainingMetrics.accuracy
          }
        };
        await push(ref(db, 'reports'), reportData);
      } catch (e) {
        console.warn('Firebase save skipped');
      }

      setAnalyzed(true);
      toast.success('Deep Analysis Complete');
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
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const cleaned = text.split('\n').filter(l => !l.startsWith('>')).join('').replace(/[^ATGCatgc]/g, '').toUpperCase();
        setSequence(cleaned);
      };
      reader.readAsText(file);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-2">Genomic Intelligence Platform</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Advanced statistical and neural screening powered by real-time DNN training on NCBI datasets.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAnalyze}
              disabled={!sequence.trim() || isAnalyzing}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              <Brain className="w-5 h-5" />
              {isAnalyzing ? 'Deep Scanning...' : 'Start Full Analysis'}
            </button>
            <button
              onClick={handleClear}
              className="px-6 py-3 bg-secondary text-foreground rounded-xl font-semibold hover:bg-secondary/80 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Input Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-xl overflow-hidden focus-within:border-primary/50 transition-colors">
            <div className="px-6 py-4 border-b border-border bg-secondary/30 flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Binary className="w-4 h-4" /> DNA Sequence Input
              </span>
              <label className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1">
                <Upload className="w-3 h-3" /> UPLOAD FASTA
                <input type="file" onChange={handleUpload} className="hidden" />
              </label>
            </div>
            <textarea
              value={sequence}
              onChange={(e) => setSequence(e.target.value.toUpperCase())}
              placeholder="Paste ATCG sequence here..."
              className="w-full h-64 bg-transparent text-foreground p-6 font-mono text-base leading-relaxed placeholder:opacity-30 focus:outline-none resize-none"
            />
            <div className="px-6 py-3 bg-secondary/20 flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>ALGORITHM: MULTI-TASK DNN</span>
              <span>{sequence.length.toLocaleString()} BASE PAIRS</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-950/40 to-purple-950/40 rounded-2xl border border-indigo-500/20 p-6 shadow-xl">
              <h3 className="text-lg font-bold text-indigo-300 mb-4 flex items-center gap-2">
                <Microscope className="w-5 h-5" /> Detection Modules
              </h3>
              <ul className="space-y-4">
                {[
                  { icon: BarChart3, label: 'Statistical Structural Analysis', color: 'text-blue-400' },
                  { icon: Dna, label: 'Biological Gene & ORF Detection', color: 'text-green-400' },
                  { icon: ShieldAlert, label: 'Pathogen Similarity Screening', color: 'text-red-400' }
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <span className="text-sm font-medium text-slate-200">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {analyzed && analysisResult && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-12">
            
            {/* Module 1: Statistical DNA Analysis */}
            <section id="module-1" className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg"><BarChart3 className="w-6 h-6 text-blue-400" /></div>
                <h2 className="text-2xl font-bold text-foreground">Module 1: Statistical DNA Analysis</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricBox label="Sequence Length" value={`${analysisResult.sequenceLength.toLocaleString()} bp`} sub="Total Base Pairs" />
                <MetricBox label="GC Content" value={`${analysisResult.gcContent}%`} sub={`AT: ${analysisResult.atContent}%`} />
                <MetricBox label="Shannon Entropy" value={analysisResult.kmerStats.shannonEntropy.toFixed(3)} sub="Structural Complexity" />
                <MetricBox label="Unique k-mers" value={analysisResult.kmerStats.uniqueKmers5.toLocaleString()} sub="k = 5 pattern depth" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6">Nucleotide Composition</h3>
                  <CompositionChart data={[
                    { name: 'A', count: analysisResult.baseComposition.A },
                    { name: 'T', count: analysisResult.baseComposition.T },
                    { name: 'G', count: analysisResult.baseComposition.G },
                    { name: 'C', count: analysisResult.baseComposition.C },
                  ]} />
                </div>
                <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6">Top Functional k-mer Clusters (k=5)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {analysisResult.kmerStats.topKmers.map((k, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl border border-border/50">
                        <code className="text-primary font-bold">{k.kmer}</code>
                        <span className="text-xs font-black opacity-50">x{k.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Module 2: Biological Gene Detection */}
            <section id="module-2" className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg"><Dna className="w-6 h-6 text-green-400" /></div>
                <h2 className="text-2xl font-bold text-foreground">Module 2: Biological Gene Detection</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Detected Open Reading Frames (ORFs)</h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                      {analysisResult.biologicalMetrics.orfs.length > 0 ? (
                        analysisResult.biologicalMetrics.orfs.slice(0, 10).map((orf, i) => (
                          <div key={i} className="p-4 bg-secondary/30 rounded-xl border border-border flex items-center justify-between group hover:border-green-500/50 transition-colors">
                            <div>
                              <div className="text-sm font-bold text-foreground">ORF #{i+1} <span className="text-xs text-muted-foreground font-normal ml-2">{orf.start} → {orf.end}</span></div>
                              <div className="text-xs font-mono text-muted-foreground truncate max-w-md">{orf.sequence}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-black text-green-400">{orf.length} BP</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-muted-foreground italic">No standard ORFs detected in sequence</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Biological Indicators</h3>
                    <div className="space-y-4">
                      <IndicatorRow label="Start Codons (ATG)" value={analysisResult.biologicalMetrics.startCodons.length} />
                      <IndicatorRow label="Stop Codons (UAA/G)" value={analysisResult.biologicalMetrics.stopCodons.length} />
                      <IndicatorRow label="Coding Potential" value={`${analysisResult.biologicalMetrics.codingRegionPct}%`} />
                      <div className={`p-4 rounded-xl border ${
                        analysisResult.biologicalMetrics.complexity === 'low' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'
                      }`}>
                         <div className="text-xs font-bold uppercase">Structural Complexity</div>
                         <div className="text-lg font-black uppercase">{analysisResult.biologicalMetrics.complexity}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Polynucleotide Regions</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {analysisResult.biologicalMetrics.polyRegions.map((p, i) => (
                        <div key={i} className="p-3 bg-secondary/30 rounded-lg">
                          <div className="text-xs font-bold text-muted-foreground">Poly-{p.base}</div>
                          <div className="text-lg font-black text-foreground">{p.count} <span className="text-[10px] opacity-30">MAX {p.maxLen}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Module 3: Pathogen Similarity Screening */}
            <section id="module-3" className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg"><ShieldAlert className="w-6 h-6 text-red-400" /></div>
                <h2 className="text-2xl font-bold text-foreground">Module 3: Pathogen Similarity Screening (DNN)</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1">
                  <div className="bg-card rounded-2xl border border-border p-8 shadow-lg text-center h-full flex flex-col justify-center">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Risk Probability</h3>
                    <div className="relative inline-flex items-center justify-center mb-6">
                      <RiskGauge data={[
                        { name: 'Safe', value: analysisResult.safeRegions },
                        { name: 'Moderate', value: analysisResult.moderateRiskRegions },
                        { name: 'High', value: analysisResult.highRiskRegions }
                      ]} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                        <span className={`text-4xl font-black ${
                          analysisResult.riskScore > 70 ? 'text-red-500' : analysisResult.riskScore > 30 ? 'text-yellow-500' : 'text-green-500'
                        }`}>{analysisResult.riskScore}%</span>
                        <span className="text-[10px] font-bold text-muted-foreground tracking-tighter uppercase">Pathogenic Likelihood</span>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest inline-block mx-auto ${
                      analysisResult.riskLevel === 'pathogen-like' ? 'bg-red-500 text-white' : 
                      analysisResult.riskLevel === 'suspicious' ? 'bg-orange-500 text-white' :
                      analysisResult.riskLevel === 'unknown' ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white'
                    }`}>
                      {analysisResult.riskLevel}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <RiskCard title="Variation Sensitivity" score={analysisResult.geneticVariationRisk.score} level={analysisResult.geneticVariationRisk.level as any} description={analysisResult.geneticVariationRisk.description} />
                  <RiskCard title="Mutation Susceptibility" score={analysisResult.mutationFrequencyRisk.score} level={analysisResult.mutationFrequencyRisk.level as any} description={analysisResult.mutationFrequencyRisk.description} />
                  <RiskCard title="Structural Deletion Risk" score={analysisResult.deletionRisk.score} level={analysisResult.deletionRisk.level as any} description={analysisResult.deletionRisk.description} />
                  
                  <div className="md:col-span-3 bg-secondary/20 rounded-2xl border border-border p-6 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">AI Inference Engine Metrics</h4>
                      <p className="text-xs text-muted-foreground">Architecture: {apiMeta?.architecture}</p>
                    </div>
                    <div className="flex gap-8 text-right">
                      <div><div className="text-[10px] uppercase font-bold text-muted-foreground">Validation Accuracy</div><div className="text-lg font-black text-primary">{(analysisResult.trainingMetrics.accuracy * 100).toFixed(1)}%</div></div>
                      <div><div className="text-[10px] uppercase font-bold text-muted-foreground">Epochs</div><div className="text-lg font-black text-foreground">{analysisResult.trainingMetrics.epochs}</div></div>
                      <div><div className="text-[10px] uppercase font-bold text-muted-foreground">Best Loss</div><div className="text-lg font-black text-foreground">{analysisResult.trainingMetrics.bestLoss.toFixed(4)}</div></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Final Report Footer */}
            <div className="bg-foreground text-background rounded-3xl p-10 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-3"><FileText className="w-8 h-8" /> Final Interpretation Report</h2>
                    <p className="opacity-70 font-medium text-lg">Comprehensive genomic assessment result for sampled sequence</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className={`text-5xl font-black uppercase tracking-tighter ${
                      analysisResult.riskLevel === 'pathogen-like' ? 'text-red-400' : 
                      analysisResult.riskLevel === 'suspicious' ? 'text-orange-400' :
                      analysisResult.riskLevel === 'unknown' ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {analysisResult.riskLevel.replace('-', ' ')}
                    </div>
                    <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white transition-all duration-1000" style={{ width: `${analysisResult.qualityScore}%` }}></div>
                    </div>
                    <span className="text-xs font-bold opacity-50 tracking-widest">BIOLOGICAL QUALITY SCORE: {analysisResult.qualityScore}%</span>
                  </div>
               </div>
            </div>

          </div>
        )}

        {!analyzed && !isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
             <div className="w-20 h-20 bg-secondary rounded-3xl flex items-center justify-center animate-pulse">
                <Brain className="w-10 h-10 text-muted-foreground" />
             </div>
             <p className="text-xl font-medium text-muted-foreground">Awaiting sequence for deep neural analysis...</p>
          </div>
        )}
      </div>

      <DNAScannerModal isOpen={isAnalyzing} />
    </MainLayout>
  );
}

function MetricBox({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-lg relative overflow-hidden group hover:border-primary/50 transition-colors">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors"></div>
      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-black text-foreground mb-1">{value}</div>
      <div className="text-[10px] font-bold text-muted-foreground/60">{sub}</div>
    </div>
  );
}

function IndicatorRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between pb-2 border-b border-border/50">
      <span className="text-xs font-bold text-muted-foreground tracking-tight">{label}</span>
      <span className="text-sm font-black text-foreground">{value}</span>
    </div>
  );
}

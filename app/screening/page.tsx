'use client';

import { MainLayout } from '@/components/main-layout';
import { RiskCard } from '@/components/risk-card';
import { CompositionChart } from '@/components/composition-chart';
import { RiskGauge } from '@/components/risk-gauge';
import { SequenceMetadata } from '@/components/sequence-metadata';
import { DNAScannerModal } from '@/components/dna-scanner-modal';
import { useState } from 'react';
import { Upload, Brain, Zap, ActivitySquare, BarChart3, Binary, Dna, ShieldAlert, Microscope, FileText, Bug, Fingerprint, Target, Search } from 'lucide-react';
import { db } from '@/lib/firebase';
import { ref, push } from 'firebase/database';
import { toast } from 'sonner';
import { runBrowserAnalysis, AnalysisResult as DNNAnalysisResult } from '@/lib/dnn-engine';
import { useEffect } from 'react';

const SAMPLE_SEQUENCE = `ATGGCTAAACCAACTCTATCTGTGCTTCAACAATTGAACAGCAACTGTGCTTCCCTATGGATAGCTTTTGTAATGAAATATCTGCTGGTTCTACTAGCGAATCCAGGCCCTGGATTGCCTATCTGTGCTTCAACAATTGAACAGCAACTGTGCTTCCCTATGGATAGCTTTTG`;

export default function ScreeningPage() {
  const [sequence, setSequence] = useState(SAMPLE_SEQUENCE);
  const [analyzed, setAnalyzed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DNNAnalysisResult | null>(null);
  const [apiMeta, setApiMeta] = useState<any>(null);
  const [modelState, setModelState] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('dna_model_state');
    if (saved) {
      try {
        setModelState(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to parse model state');
      }
    }
  }, []);

  const handleAnalyze = async () => {
    if (!sequence.trim()) return;
    
    setIsAnalyzing(true);
    setAnalyzed(false);

    try {
      const dataResponse = await fetch('/training_data.json');
      if (!dataResponse.ok) throw new Error('Failed to load authentic training data');
      const trainingData = await dataResponse.json();

      const { result, weights } = await runBrowserAnalysis(sequence.trim(), trainingData, modelState);

      setAnalysisResult(result);
      setModelState(weights);
      localStorage.setItem('dna_model_state', JSON.stringify(weights));

      setApiMeta({
        engine: 'Multi-Task Deep Neural Network',
        architecture: 'Input(1024) → 64 → 32 → 16 → Output(4)',
        note: modelState ? 'Continuous learning enabled (state restored).' : 'Initial training session.',
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
            accuracy: result.trainingMetrics.accuracy,
            signatures: result.biologicalMetrics.signatures.length,
            organism: result.biologicalMetrics.identifiedOrganism.name
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

        {modelState && !analyzed && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-center gap-3 animate-pulse">
            <Zap className="w-5 h-5 text-indigo-400" />
            <p className="text-sm font-medium text-indigo-300">
              Persistent Model State Detected: The engine will continue learning from its previous condition.
            </p>
          </div>
        )}

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
                <h2 className="text-2xl font-bold text-foreground">Module 2: Biological Gene Detection & Identification</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Organism Identification */}
                <div className="lg:col-span-1">
                  <div className="bg-card rounded-2xl border border-border p-6 shadow-xl h-full border-t-4 border-t-primary">
                    <div className="flex items-center gap-2 mb-4 text-primary">
                      <Fingerprint className="w-5 h-5" />
                      <span className="text-sm font-bold uppercase tracking-widest">Organism ID</span>
                    </div>
                    <div className="space-y-4">
                      <div className="text-center py-4">
                        <div className="text-2xl font-black text-foreground">{analysisResult.biologicalMetrics.identifiedOrganism.name}</div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase mt-1">SIMILARITY: {(analysisResult.biologicalMetrics.identifiedOrganism.confidence * 100).toFixed(1)}%</div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Top Candidate Matches</h4>
                        {analysisResult.biologicalMetrics.identifiedOrganism.topMatches.map((match, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg border border-border/50 text-[10px]">
                            <span className="font-bold text-foreground truncate max-w-[100px]">{match.name}</span>
                            <span className="font-black text-primary">{match.similarity}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3 space-y-6">
                  <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                       <Search className="w-4 h-4" /> Detected Open Reading Frames (6-Frames)
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      {analysisResult.biologicalMetrics.orfs.length > 0 ? (
                        analysisResult.biologicalMetrics.orfs.slice(0, 15).map((orf, i) => (
                          <div key={i} className="p-3 bg-secondary/30 rounded-xl border border-border flex items-center justify-between group hover:border-green-500/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-500/10 rounded-lg text-[10px] font-black text-green-400">FRAME</div>
                              <div>
                                <div className="text-xs font-black text-foreground">POS: {orf.start}..{orf.end} ({orf.length} BP)</div>
                                <div className="text-[9px] font-mono text-muted-foreground bg-secondary/20 p-1 mt-1 rounded border border-border/30 max-w-xl break-all">AA: {orf.protein || 'N/A'}</div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-muted-foreground italic">No standard ORFs detected. Biological complexity may be low.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricBox label="Start Codons (ATG)" value={analysisResult.biologicalMetrics.startCodons.length.toString()} sub="Initiation sites" />
                <MetricBox label="Stop Codons" value={analysisResult.biologicalMetrics.stopCodons.length.toString()} sub="Termination sites" />
                <MetricBox label="Coding Potential" value={`${analysisResult.biologicalMetrics.codingRegionPct}%`} sub="Predicted exonic density" />
                <div className={`p-5 rounded-2xl border ${
                  analysisResult.biologicalMetrics.complexity === 'low' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'
                }`}>
                   <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Structural Complexity</div>
                   <div className="text-2xl font-black uppercase">{analysisResult.biologicalMetrics.complexity}</div>
                </div>
              </div>
            </section>

            {/* Pathogen Signatures & Signatures */}
            <section id="signatures" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg"><Target className="w-6 h-6 text-red-400" /></div>
                    <h2 className="text-2xl font-bold text-foreground">Pathogen Hallmark Signatures</h2>
                  </div>
                  <div className="bg-card rounded-2xl border border-border p-6 shadow-xl space-y-4">
                     {analysisResult.biologicalMetrics.signatures.length > 0 ? (
                       analysisResult.biologicalMetrics.signatures.map((sig, i) => (
                         <div key={i} className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-start gap-4">
                            <div className="p-2 bg-red-500/10 rounded-lg"><Microscope className="w-4 h-4 text-red-400" /></div>
                            <div>
                               <div className="text-sm font-black text-red-400 uppercase tracking-tighter">{sig.name}</div>
                               <div className="text-xs font-medium text-muted-foreground mb-1">{sig.description}</div>
                               <div className="text-[10px] font-mono font-bold text-red-500/50 uppercase">Position: {sig.pos} bp</div>
                            </div>
                         </div>
                       ))
                     ) : (
                       <div className="py-8 text-center text-muted-foreground italic text-sm">No high-threat virulence hallmarks detected.</div>
                     )}
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg"><BarChart3 className="w-6 h-6 text-yellow-400" /></div>
                    <h2 className="text-2xl font-bold text-foreground">Regulatory Elements (CpG/Skew)</h2>
                  </div>
                  <div className="bg-card rounded-2xl border border-border p-6 shadow-xl flex flex-col justify-center h-[260px]">
                      <div className="grid grid-cols-2 gap-8 text-center">
                          <div>
                             <div className="text-3xl font-black text-foreground">{analysisResult.kmerStats.cpgIslands}</div>
                             <div className="text-[10px] font-black uppercase text-muted-foreground mt-2 tracking-widest">CpG Island Density</div>
                          </div>
                          <div>
                             <div className="text-3xl font-black text-foreground">{(analysisResult.kmerStats.gcSkew.reduce((a,b)=>a+b,0)/analysisResult.kmerStats.gcSkew.length).toFixed(4)}</div>
                             <div className="text-[10px] font-black uppercase text-muted-foreground mt-2 tracking-widest">Mean GC Skew</div>
                          </div>
                      </div>
                  </div>
               </div>
            </section>

            {/* Mutation Analysis Table */}
            <section id="mutations" className="space-y-6">
               <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg"><Bug className="w-6 h-6 text-purple-400" /></div>
                <h2 className="text-2xl font-bold text-foreground">Mutation & Variation Analysis</h2>
              </div>
              <div className="bg-card rounded-2xl border border-border p-6 shadow-xl">
                 {analysisResult.biologicalMetrics.mutations.length > 0 ? (
                   <div className="overflow-x-auto">
                     <table className="w-full text-left">
                       <thead>
                         <tr className="border-b border-border text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                           <th className="pb-3 px-4">Position</th>
                           <th className="pb-3 px-4">Mutation Type</th>
                           <th className="pb-3 px-4">Description / Warning</th>
                           <th className="pb-3 px-4 text-right">Risk Impact</th>
                         </tr>
                       </thead>
                       <tbody className="text-sm">
                         {analysisResult.biologicalMetrics.mutations.map((m, i) => (
                           <tr key={i} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                             <td className="py-4 px-4 font-mono font-bold text-primary">BP_{m.position}</td>
                             <td className="py-4 px-4"><span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded-md text-[10px] font-black uppercase">{m.type}</span></td>
                             <td className="py-4 px-4 text-muted-foreground">{m.description}</td>
                             <td className="py-4 px-4 text-right"><Target className="inline w-4 h-4 text-red-500/50" /></td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 ) : (
                   <div className="py-12 text-center text-muted-foreground">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">No significant pathogenic mutations detected in primary scan.</p>
                   </div>
                 )}
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
                      analysisResult.riskLevel === 'ambiguous' ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white'
                    }`}>
                      {analysisResult.riskLevel === 'ambiguous' ? 'Ambiguous / Novel' : analysisResult.riskLevel}
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
                      analysisResult.riskLevel === 'ambiguous' ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {analysisResult.riskLevel === 'ambiguous' ? 'AMBIGUOUS' : analysisResult.riskLevel.replace('-', ' ')}
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
      <div className="text-[10px] font-bold text-muted-foreground/60 line-clamp-1">{sub}</div>
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

function CheckCircle({ className, ...props }: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      {...props}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

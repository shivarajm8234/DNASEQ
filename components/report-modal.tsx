'use client';

import { useEffect, useState } from 'react';
import { X, Download, Share2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Report {
  id: string;
  name: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  score: number;
  sampleType: string;
  sequenceLength: number;
  mutations: number;
  gcContent: number;
  sequence?: string;
  fullSequence?: string;
  pathogenicProbability?: number;
  dnnMetrics?: {
    epochs: number;
    finalLoss: number;
    bestLoss: number;
    accuracy: number;
  };
  biologicalMetrics?: {
    orfs: { start: number; end: number; length: number; protein?: string }[];
    signatures: { name: string; position?: number; pos?: number; description: string }[];
    [key: string]: any;
  };
}

interface ReportModalProps {
  isOpen: boolean;
  report: Report | null;
  onClose: () => void;
}

export function ReportModal({ isOpen, report, onClose }: ReportModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen || !report) {
    return null;
  }

  const getRiskLevel = (score: number) => {
    if (score < 30) return { label: 'Safe', color: 'bg-success text-white' };
    if (score < 70) return { label: 'Moderate', color: 'bg-warning text-black' };
    return { label: 'High Risk', color: 'bg-error text-white' };
  };

  const riskLevel = getRiskLevel(report.score);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl animate-scale-in">
        <div className="bg-card border border-border rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{report.name}</h2>
              <p className="text-sm text-muted-foreground">{report.date}</p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-secondary rounded"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Status and Risk Level */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    report.status === 'completed' ? 'bg-success' : 
                    report.status === 'pending' ? 'bg-warning' : 
                    'bg-error'
                  }`} />
                  <span className="font-medium text-foreground capitalize">{report.status}</span>
                </div>
              </div>
              
              <div className="bg-secondary rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Risk Level</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${riskLevel.color}`}>
                  {riskLevel.label}
                </span>
              </div>
            </div>

            {/* Risk Score */}
            <div className="bg-secondary rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-3">Risk Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{report.score}</span>
                <span className="text-muted-foreground">/100</span>
              </div>
              <div className="mt-3 w-full bg-border rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    report.score < 30 ? 'bg-success' :
                    report.score < 70 ? 'bg-warning' :
                    'bg-error'
                  }`}
                  style={{ width: `${report.score}%` }}
                />
              </div>
            </div>

            {/* Analysis Details */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Analysis Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary rounded-lg p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Sample Type</p>
                  <p className="text-foreground font-medium">{report.sampleType}</p>
                </div>
                
                <div className="bg-secondary rounded-lg p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Sequence Length</p>
                  <p className="text-foreground font-medium">{report.sequenceLength.toLocaleString()} bp</p>
                </div>
                
                <div className="bg-secondary rounded-lg p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Mutations Found</p>
                  <p className="text-foreground font-medium">{report.mutations}</p>
                </div>
                
                <div className="bg-secondary rounded-lg p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">GC Content</p>
                  <p className="text-foreground font-medium">{report.gcContent}%</p>
                </div>
              </div>
            </div>

            {/* DNN Engine Details (if available) */}
            {report.dnnMetrics && (
              <div>
                <h3 className="font-semibold text-foreground mb-4">DNN Engine Details</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-purple-950/20 border border-purple-500/20 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-purple-400 uppercase tracking-tighter mb-1">Pathogenic Prob</p>
                    <p className="text-lg font-bold text-purple-300">
                      {report.pathogenicProbability ? (report.pathogenicProbability * 100).toFixed(1) : (report.score * 1).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-blue-950/20 border border-blue-500/20 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-blue-400 uppercase tracking-tighter mb-1">Architecture</p>
                    <p className="text-sm font-bold text-blue-300">4-Layer DNN</p>
                  </div>
                  <div className="bg-purple-950/20 border border-purple-500/20 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-purple-400 uppercase tracking-tighter mb-1">Training Acc</p>
                    <p className="text-lg font-bold text-purple-300">{(report.dnnMetrics.accuracy * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-blue-950/20 border border-blue-500/20 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-blue-400 uppercase tracking-tighter mb-1">Epochs</p>
                    <p className="text-lg font-bold text-blue-300">{report.dnnMetrics.epochs}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Biological Metrics (ORFs and Signatures) */}
            {report.biologicalMetrics && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-4">Detected Open Reading Frames</h3>
                  {report.biologicalMetrics.orfs && report.biologicalMetrics.orfs.length > 0 ? (
                    <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {report.biologicalMetrics.orfs.map((orf, i) => (
                        <div key={i} className="bg-secondary rounded-lg p-3 text-sm border border-border">
                          <div className="flex justify-between font-medium mb-1">
                            <span className="text-primary">Frame POS: {orf.start}..{orf.end}</span>
                            <span className="text-muted-foreground">{orf.length} bp</span>
                          </div>
                          <div className="text-xs text-muted-foreground break-all bg-background/50 p-2 rounded">
                            AA: {orf.protein || 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No standard ORFs detected.</p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-4">Pathogen Hallmark Signatures</h3>
                  {report.biologicalMetrics.signatures && report.biologicalMetrics.signatures.length > 0 ? (
                    <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {report.biologicalMetrics.signatures.map((sig, i) => (
                        <div key={i} className="bg-error/10 border border-error/20 rounded-lg p-3 text-sm">
                          <div className="flex justify-between font-medium mb-1">
                            <span className="text-error">{sig.name}</span>
                            <span className="text-error/70 text-xs uppercase tracking-wider">POS: {sig.pos ?? sig.position ?? 'Unknown'} bp</span>
                          </div>
                          <p className="text-xs text-error/80">{sig.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No high-threat virulence hallmarks detected.</p>
                  )}
                </div>
              </div>
            )}

            {/* Warnings if high risk */}
            {report.score >= 70 && (
              <div className="bg-error/10 border border-error/20 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-error mb-1">High Risk Detected</p>
                  <p className="text-sm text-error/80">This sequence shows significant risk markers. Please consult with a genomics specialist for further evaluation.</p>
                </div>
              </div>
            )}

            {/* Sequence Preview */}
            {(report.sequence || report.fullSequence) && (
              <div>
                <h3 className="font-semibold text-foreground mb-4">Sequence Preview</h3>
                <div className="bg-secondary rounded-lg p-4 font-mono text-xs break-all max-h-32 overflow-y-auto border border-border">
                  {report.sequence || report.fullSequence?.substring(0, 1000)}
                  {report.fullSequence && report.fullSequence.length > 1000 && (
                    <span className="text-muted-foreground italic"> ... (truncated)</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-6 py-4 flex justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(report, null, 2));
              }}
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Copy Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const dataStr = JSON.stringify(report, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                const exportFileDefaultName = `${report.name.replace(/\s+/g, '_')}.json`;
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
              }}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

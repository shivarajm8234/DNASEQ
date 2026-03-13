import { MainLayout } from '@/components/main-layout';
import { CheckCircle, Zap, Shield } from 'lucide-react';

export default function AboutPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-12">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-4">About GenScreen</h1>
          <p className="text-xl text-muted-foreground">
            Advanced DNA sequence screening and risk analysis platform built for modern genomic research
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <Zap className="w-8 h-8 text-primary mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Lightning Fast</h3>
            <p className="text-sm text-muted-foreground">
              Analyze sequences in seconds with our optimized algorithms
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <Shield className="w-8 h-8 text-accent mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Secure & Private</h3>
            <p className="text-sm text-muted-foreground">
              Enterprise-grade security for your sensitive genomic data
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <CheckCircle className="w-8 h-8 text-success mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Accurate Results</h3>
            <p className="text-sm text-muted-foreground">
              94%+ accuracy with continuous model improvements
            </p>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">How It Works</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                  1
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Upload Sequence</h3>
                <p className="text-sm text-muted-foreground">
                  Paste your DNA sequence or upload a FASTA file
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                  2
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Our algorithms perform comprehensive risk assessment
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                  3
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Results</h3>
                <p className="text-sm text-muted-foreground">
                  Get detailed insights and download comprehensive reports
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Key Features</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">Real-time sequence analysis with base composition breakdown</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">Risk assessment with color-coded severity levels</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">Mutation detection and frequency analysis</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">Downloadable PDF reports with detailed findings</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">Batch processing for multiple sequences</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">Advanced data visualization and analytics</span>
            </li>
          </ul>
        </div>

        <div className="bg-card rounded-lg border border-border p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Technology Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="font-semibold text-foreground">Frontend</p>
              <p className="text-sm text-muted-foreground">Next.js, React, Tailwind CSS</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Analysis</p>
              <p className="text-sm text-muted-foreground">Custom algorithms, ML models</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Visualization</p>
              <p className="text-sm text-muted-foreground">Recharts, shadcn/ui</p>
            </div>
          </div>
        </div>

        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            GenScreen v1.0 • Built with modern web technologies • 2024
          </p>
        </div>
      </div>
    </MainLayout>
  );
}

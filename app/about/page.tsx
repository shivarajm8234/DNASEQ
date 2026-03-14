import { MainLayout } from '@/components/main-layout';
import { CheckCircle, Zap, Shield, Sparkles, Binary, Cpu, BarChart3, Globe } from 'lucide-react';

export default function AboutPage() {
  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-16 pb-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 pt-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Future of Biosecurity</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter leading-[0.9]">
            Democratizing <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-pulse">Genomic Intelligence</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            Advanced DNA sequence screening and predictive risk analysis platform empowers researchers with real-time biological insights.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Zap, title: 'In-Browser Inference', desc: 'No servers needed. Our core DNN engine runs directly in your browser using pure JS/Oklch color normalization.', color: 'text-primary' },
            { icon: Shield, title: 'Privacy First', desc: 'Your sequences never leave your machine. Analysis is performed locally, ensuring total data sovereignty.', color: 'text-accent' },
            { icon: Cpu, title: 'Multi-Task DNN', desc: 'Simultaneous prediction of pathogenicity, mutation frequency, and structural variations in one pass.', color: 'text-success' }
          ].map((feature, i) => (
            <div key={i} className="bg-card/40 backdrop-blur-xl rounded-3xl border border-white/5 p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <feature.icon className="w-16 h-16" />
              </div>
              <feature.icon className={`w-10 h-10 ${feature.color} mb-6`} />
              <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground font-medium leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* How it Works / Tech */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl font-black text-foreground flex items-center gap-3">
              <div className="p-2 bg-primary text-primary-foreground rounded-xl"><Globe className="w-6 h-6" /></div>
              How GenScreen Works
            </h2>
            <div className="space-y-6">
              {[
                { step: '01', title: 'Data Pre-processing', desc: 'Sequences are cleaned, capitalized, and non-canonical bases are filtered for consistency.' },
                { step: '02', title: 'K-mer Vectorization', desc: 'DNA is transformed into a frequency vector using a sliding window of k=5 patterns.' },
                { step: '03', title: 'Neural Inference', desc: 'A 4-layer feed-forward network classifies the sample against known pathogenic signatures.' }
              ].map((step, i) => (
                <div key={i} className="flex gap-6 group">
                  <div className="text-2xl font-black text-primary/30 group-hover:text-primary transition-colors">{step.step}</div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-1">{step.title}</h3>
                    <p className="text-muted-foreground font-medium">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary/20 via-background to-accent/20 p-px rounded-[2rem] shadow-2xl overflow-hidden">
             <div className="bg-background/80 backdrop-blur-3xl p-10 space-y-8 h-full">
                <h3 className="text-xl font-black text-foreground">Technology Stack</h3>
                <div className="grid grid-cols-2 gap-8">
                   {[
                     { label: 'Frontend', value: 'Next.js 15, React 19', icon: Globe },
                     { label: 'Styling', value: 'Vanilla CSS, Oklch', icon: Binary },
                     { label: 'ML Engine', value: 'JS Custom DNN', icon: Cpu },
                     { label: 'Database', value: 'Firebase RTDB', icon: Shield }
                   ].map((item, i) => (
                     <div key={i} className="space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                           <item.icon className="w-4 h-4" />
                           <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                        </div>
                        <div className="text-sm font-bold text-foreground">{item.value}</div>
                     </div>
                   ))}
                </div>
                <div className="pt-4 border-t border-border/50">
                   <p className="text-xs text-muted-foreground font-medium">
                      GenScreen is fully open-source and respects all ethical guidelines regarding biosecurity data handled in localized environments.
                   </p>
                </div>
             </div>
          </div>
        </div>

        <div className="text-center pt-12">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground transition-all duration-300">
             © 2026 GenScreen Genomic Intelligence System • v2.1.0-Stable
          </p>
        </div>
      </div>
    </MainLayout>
  );
}

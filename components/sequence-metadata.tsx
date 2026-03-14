interface SequenceMetadataProps {
  sequenceLength: number;
  gcContent: number;
  mutationCount: number;
  timestamp: string;
}

export function SequenceMetadata({
  sequenceLength,
  gcContent,
  mutationCount,
  timestamp,
}: SequenceMetadataProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-card/40 backdrop-blur-md rounded-2xl border border-border/50 p-6 hover:border-primary/50 transition-all duration-300">
        <div className="text-[10px] font-black text-muted-foreground mb-2 uppercase tracking-widest">
          Sequence Length
        </div>
        <div className="text-3xl font-black text-foreground">{sequenceLength.toLocaleString()}</div>
        <div className="text-[10px] font-bold text-primary/60 mt-2 uppercase tracking-tighter">Base Pairs</div>
      </div>

      <div className="bg-card/40 backdrop-blur-md rounded-2xl border border-border/50 p-6 hover:border-accent/50 transition-all duration-300">
        <div className="text-[10px] font-black text-muted-foreground mb-2 uppercase tracking-widest">
          GC Content
        </div>
        <div className="text-3xl font-black text-foreground">{gcContent}%</div>
        <div className="text-[10px] font-bold text-accent/60 mt-2 uppercase tracking-tighter">Stability Metric</div>
      </div>

      <div className="bg-card/40 backdrop-blur-md rounded-2xl border border-border/50 p-6 hover:border-success/50 transition-all duration-300">
        <div className="text-[10px] font-black text-muted-foreground mb-2 uppercase tracking-widest">
          Mutations Found
        </div>
        <div className="text-3xl font-black text-foreground">{mutationCount}</div>
        <div className="text-[10px] font-bold text-success/60 mt-2 uppercase tracking-tighter">Variant Count</div>
      </div>

      <div className="bg-card/40 backdrop-blur-md rounded-2xl border border-border/50 p-6 hover:border-warning/50 transition-all duration-300 overflow-hidden">
        <div className="text-[10px] font-black text-muted-foreground mb-2 uppercase tracking-widest">
          Analyzed On
        </div>
        <div className="text-sm font-black text-foreground truncate">{timestamp.split(',')[0]}</div>
        <div className="text-[10px] font-bold text-warning/60 mt-2 uppercase tracking-tighter">Inference Date</div>
      </div>
    </div>
  );
}

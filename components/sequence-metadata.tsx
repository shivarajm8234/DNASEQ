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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
          Sequence Length
        </div>
        <div className="text-2xl font-bold text-primary">{sequenceLength.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground mt-2">Base Pairs</div>
      </div>

      <div className="bg-card rounded-lg border border-border p-4">
        <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
          GC Content
        </div>
        <div className="text-2xl font-bold text-primary">{gcContent}%</div>
        <div className="text-xs text-muted-foreground mt-2">Healthy Range</div>
      </div>

      <div className="bg-card rounded-lg border border-border p-4">
        <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
          Mutations Found
        </div>
        <div className="text-2xl font-bold text-primary">{mutationCount}</div>
        <div className="text-xs text-muted-foreground mt-2">Variants</div>
      </div>

      <div className="bg-card rounded-lg border border-border p-4">
        <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
          Analyzed
        </div>
        <div className="text-sm font-bold text-primary truncate">{timestamp}</div>
        <div className="text-xs text-muted-foreground mt-2">Timestamp</div>
      </div>
    </div>
  );
}

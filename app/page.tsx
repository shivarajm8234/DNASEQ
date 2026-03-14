'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/main-layout';
import { BarChart3, Zap, TrendingUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

export default function Home() {
  const [stats, setStats] = useState({
    totalSequences: 0,
    riskPatterns: 0,
    avgScore: 0,
    isLoading: true
  });

  useEffect(() => {
    const reportsRef = ref(db, 'reports');
    const unsubscribe = onValue(reportsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const reportsList = Object.values(data) as any[];
        const total = reportsList.length;
        const highRisk = reportsList.filter(r => r.score >= 70).length;
        const sumScore = reportsList.reduce((acc, r) => acc + (r.score || 0), 0);
        
        setStats({
          totalSequences: total,
          riskPatterns: highRisk,
          avgScore: total > 0 ? Math.round(sumScore / total) : 0,
          isLoading: false
        });
      } else {
        setStats(s => ({ ...s, isLoading: false }));
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto flex flex-col items-center pt-8 md:pt-16 pb-12 text-center relative z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        <div className="mb-12 md:mb-20 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-2 animate-fade-in border border-primary/20">
            <Zap className="w-4 h-4" />
            <span>Next-Generation Analysis Engine v2.0</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-foreground via-foreground to-muted-foreground mb-4">
            Genomic Intelligence <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">At Your Fingertips</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Advanced DNA sequence screening and predictive risk analysis empowered by Deep Neural Networks and Statistical Biology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 w-full max-w-5xl">
          <Link href="/screening" className="group">
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-8 hover:border-primary/50 transition-all duration-500 cursor-pointer h-full shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                <Zap className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-extrabold text-2xl text-foreground mb-3 tracking-tight group-hover:text-primary transition-colors">Start Screening</h3>
              <p className="text-muted-foreground font-medium leading-relaxed">Instantly analyze DNA sequences for critical risk factors and pathogenic mutations.</p>
            </div>
          </Link>

          <Link href="/reports" className="group">
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-8 hover:border-accent/50 transition-all duration-500 cursor-pointer h-full shadow-xl hover:shadow-accent/10 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                <BarChart3 className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-extrabold text-2xl text-foreground mb-3 tracking-tight group-hover:text-accent transition-colors">View Reports</h3>
              <p className="text-muted-foreground font-medium leading-relaxed">Access historical analysis results, detailed clinical reports, and sequence metadata.</p>
            </div>
          </Link>

          <Link href="/dashboard" className="group">
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-8 hover:border-success/50 transition-all duration-500 cursor-pointer h-full shadow-xl hover:shadow-success/10 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                <TrendingUp className="w-7 h-7 text-success" />
              </div>
              <h3 className="font-extrabold text-2xl text-foreground mb-3 tracking-tight group-hover:text-success transition-colors">Insights Dashboard</h3>
              <p className="text-muted-foreground font-medium leading-relaxed">Track broad operational trends, system limits, and insights from screening data.</p>
            </div>
          </Link>
        </div>

        <div className="bg-card rounded-lg border border-border p-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Stats</h2>
          {stats.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Fetching stats...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-3xl font-bold text-primary mb-1">{stats.totalSequences}</div>
                <p className="text-sm text-muted-foreground">Sequences Analyzed</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-accent mb-1">{100 - stats.avgScore}%</div>
                <p className="text-sm text-muted-foreground">Safe Rate</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-success mb-1">{stats.riskPatterns}</div>
                <p className="text-sm text-muted-foreground">High Risk Samples</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-warning mb-1">{stats.avgScore}%</div>
                <p className="text-sm text-muted-foreground">Avg Risk Score</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}


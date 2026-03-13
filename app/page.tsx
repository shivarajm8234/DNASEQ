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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to GenScreen</h1>
          <p className="text-lg text-muted-foreground">Advanced DNA sequence screening and risk analysis</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/screening" className="group">
            <div className="bg-card rounded-lg border border-border p-6 hover:border-primary transition-colors cursor-pointer h-full">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">Start Screening</h3>
              <p className="text-sm text-muted-foreground">Analyze DNA sequences for risk factors and mutations</p>
            </div>
          </Link>

          <Link href="/reports" className="group">
            <div className="bg-card rounded-lg border border-border p-6 hover:border-accent transition-colors cursor-pointer h-full">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <BarChart3 className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">View Reports</h3>
              <p className="text-sm text-muted-foreground">Access historical analysis results and reports</p>
            </div>
          </Link>

          <Link href="/dashboard" className="group">
            <div className="bg-card rounded-lg border border-border p-6 hover:border-success transition-colors cursor-pointer h-full">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4 group-hover:bg-success/20 transition-colors">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">Dashboard</h3>
              <p className="text-sm text-muted-foreground">Track trends and insights from screening data</p>
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


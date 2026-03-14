'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/main-layout';
import { Activity, Users, BarChart3, Clock, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

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
  timestamp?: string;
  dnnMetrics?: any;
  biologicalMetrics?: any;
}

export default function DashboardPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const reportsRef = ref(db, 'reports');
    const unsubscribe = onValue(reportsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const reportsList = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...(value as any),
        }));
        // Sort by timestamp if available, newest first
        setReports(reportsList.sort((a, b) => {
          const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return timeB - timeA;
        }));
      } else {
        setReports([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Calculate metrics
  const totalReports = reports.length;
  const activeAnalyses = reports.filter(r => r.status === 'pending').length || reports.length; // Fallback to all if none pending
  const safeCount = reports.filter(r => r.score < 30).length;
  const moderateCount = reports.filter(r => r.score >= 30 && r.score < 70).length;
  const highCount = reports.filter(r => r.score >= 70).length;

  const safePercentage = totalReports > 0 ? Math.round((safeCount / totalReports) * 100) : 0;
  const moderatePercentage = totalReports > 0 ? Math.round((moderateCount / totalReports) * 100) : 0;
  const highPercentage = totalReports > 0 ? Math.round((highCount / totalReports) * 100) : 0;

  const totalBases = reports.reduce((acc, r) => acc + (r.sequenceLength || 0), 0);
  const formattedTotalBases = totalBases > 1000 ? `${(totalBases / 1000).toFixed(1)}K` : totalBases.toString();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Loading dashboard data...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-lg text-muted-foreground">System overview and key metrics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card/50 backdrop-blur-md rounded-2xl border border-border/50 p-6 shadow-lg hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/50 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Active Analyses</p>
                <p className="text-3xl font-black text-foreground drop-shadow-sm">{activeAnalyses}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-xl">
                <Activity className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="text-xs font-semibold text-primary/80">Real-time tracking</p>
          </div>

          <div className="bg-card/50 backdrop-blur-md rounded-2xl border border-border/50 p-6 shadow-lg hover:shadow-accent/5 hover:-translate-y-1 hover:border-accent/50 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Total Reports</p>
                <p className="text-3xl font-black text-foreground drop-shadow-sm">{totalReports}</p>
              </div>
              <div className="p-2 bg-accent/10 rounded-xl">
                <Users className="w-6 h-6 text-accent" />
              </div>
            </div>
            <p className="text-xs font-semibold text-muted-foreground">Processed sequences</p>
          </div>

          <div className="bg-card/50 backdrop-blur-md rounded-2xl border border-border/50 p-6 shadow-lg hover:shadow-success/5 hover:-translate-y-1 hover:border-success/50 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Total Bases</p>
                <p className="text-3xl font-black text-foreground drop-shadow-sm">{formattedTotalBases}</p>
              </div>
              <div className="p-2 bg-success/10 rounded-xl">
                <BarChart3 className="w-6 h-6 text-success" />
              </div>
            </div>
            <p className="text-xs font-semibold text-muted-foreground">Data volume analyzed</p>
          </div>

          <div className="bg-card/50 backdrop-blur-md rounded-2xl border border-border/50 p-6 shadow-lg hover:shadow-warning/5 hover:-translate-y-1 hover:border-warning/50 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Avg Score</p>
                <p className="text-3xl font-black text-foreground drop-shadow-sm">
                  {totalReports > 0 ? (reports.reduce((acc, r) => acc + r.score, 0) / totalReports).toFixed(1) : '0'}%
                </p>
              </div>
              <div className="p-2 bg-warning/10 rounded-xl">
                <Clock className="w-6 h-6 text-warning" />
              </div>
            </div>
            <p className="text-xs font-semibold text-warning/80">Mean risk level</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-card/50 backdrop-blur-xl rounded-3xl border border-border/50 p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Recent Activity</h3>
            <div className="space-y-4">
              {reports.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No recent activity found.</p>
              ) : (
                reports.slice(0, 5).map((report) => (
                  <div key={report.id} className="flex items-center gap-3 pb-4 border-b border-border last:border-b-0 last:pb-0">
                    <div className={`w-2 h-2 rounded-full ${report.score < 30 ? 'bg-success' : report.score < 70 ? 'bg-warning' : 'bg-destructive'}`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{report.name}</p>
                      <p className="text-xs text-muted-foreground">Score: {report.score} | {report.date}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {report.timestamp ? new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-xl rounded-3xl border border-border/50 p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-accent" /> Risk Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Safe (&lt;30)</span>
                <div className="flex items-center gap-2">
                  <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-success transition-all duration-500" style={{ width: `${safePercentage}%` }}></div>
                  </div>
                  <span className="text-sm font-medium text-foreground w-8">{safePercentage}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Moderate (30-70)</span>
                <div className="flex items-center gap-2">
                  <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-warning transition-all duration-500" style={{ width: `${moderatePercentage}%` }}></div>
                  </div>
                  <span className="text-sm font-medium text-foreground w-8">{moderatePercentage}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">High (&gt;70)</span>
                <div className="flex items-center gap-2">
                  <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-destructive transition-all duration-500" style={{ width: `${highPercentage}%` }}></div>
                  </div>
                  <span className="text-sm font-medium text-foreground w-8">{highPercentage}%</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground italic text-center">
                Based on {totalReports} analyzed samples
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}


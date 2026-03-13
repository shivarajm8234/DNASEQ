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
          <div className="bg-card rounded-lg border border-border p-6 hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Analyses</p>
                <p className="text-2xl font-bold text-foreground">{activeAnalyses}</p>
              </div>
              <Activity className="w-8 h-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Real-time tracking</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 hover:border-accent/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Reports</p>
                <p className="text-2xl font-bold text-foreground">{totalReports}</p>
              </div>
              <Users className="w-8 h-8 text-accent" />
            </div>
            <p className="text-xs text-muted-foreground">Processed sequences</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 hover:border-success/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Bases</p>
                <p className="text-2xl font-bold text-foreground">{formattedTotalBases}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-success" />
            </div>
            <p className="text-xs text-muted-foreground">Data volume analyzed</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 hover:border-warning/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg Score</p>
                <p className="text-2xl font-bold text-foreground">
                  {totalReports > 0 ? (reports.reduce((acc, r) => acc + r.score, 0) / totalReports).toFixed(1) : '0'}%
                </p>
              </div>
              <Clock className="w-8 h-8 text-warning" />
            </div>
            <p className="text-xs text-muted-foreground">Mean risk level</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
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

          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Risk Summary</h3>
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


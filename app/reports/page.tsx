'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/main-layout';
import { Download, Eye, Trash2, Loader2 } from 'lucide-react';
import { ReportModal } from '@/components/report-modal';
import { db } from '@/lib/firebase';
import { ref, onValue, remove } from 'firebase/database';
import { toast } from 'sonner';

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
  dnnMetrics?: any;
}

const reports: Report[] = [
  {
    id: '1',
    name: 'Sample_001_Analysis',
    date: '2024-03-10',
    status: 'completed',
    score: 25,
    sampleType: 'Whole Genome',
    sequenceLength: 8472,
    mutations: 12,
    gcContent: 48,
  },
  {
    id: '2',
    name: 'Batch_Q1_2024',
    date: '2024-03-08',
    status: 'completed',
    score: 55,
    sampleType: 'Exome Sequencing',
    sequenceLength: 5432,
    mutations: 28,
    gcContent: 51,
  },
  {
    id: '3',
    name: 'Clinical_Study_A',
    date: '2024-03-05',
    status: 'completed',
    score: 78,
    sampleType: 'Targeted Panel',
    sequenceLength: 892,
    mutations: 45,
    gcContent: 52,
  },
  {
    id: '4',
    name: 'Research_Dataset_v2',
    date: '2024-02-28',
    status: 'completed',
    score: 32,
    sampleType: 'Whole Genome',
    sequenceLength: 3156,
    mutations: 8,
    gcContent: 49,
  },
];

const getRiskColor = (score: number) => {
  if (score < 30) return 'bg-green-950 border-green-800 text-green-400';
  if (score < 70) return 'bg-yellow-950 border-yellow-800 text-yellow-400';
  return 'bg-red-950 border-red-800 text-red-400';
};

const getRiskLabel = (score: number) => {
  if (score < 30) return 'Low';
  if (score < 70) return 'Moderate';
  return 'High';
};

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
        setReports(reportsList.reverse());
      } else {
        setReports([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await remove(ref(db, `reports/${id}`));
      toast.success('Report deleted successfully');
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    }
  };
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Analysis Reports</h1>
          <p className="text-lg text-muted-foreground">View and manage your screening analysis reports</p>
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Loading reports from database...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                No reports found in the database.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Report Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Risk Score</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Risk Level</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className="border-b border-border hover:bg-secondary/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        <div className="flex flex-col gap-1">
                          {report.name}
                          {report.dnnMetrics && (
                            <span className="text-[10px] text-purple-400 font-normal flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-purple-400 animate-pulse" />
                              Dynamic DNN Engine
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{report.date}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground font-medium">{report.score}/100</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded border text-xs font-medium ${getRiskColor(report.score)}`}
                        >
                          {getRiskLabel(report.score)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 rounded bg-green-950 border border-green-800 text-green-400 text-xs font-medium capitalize">
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => {
                              setSelectedReport(report);
                              setIsModalOpen(true);
                            }}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors text-primary hover:text-accent"
                            title="View report"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              const dataStr = JSON.stringify(report, null, 2);
                              const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                              const exportFileDefaultName = `${report.name.replace(/\s+/g, '_')}.json`;
                              const linkElement = document.createElement('a');
                              linkElement.setAttribute('href', dataUri);
                              linkElement.setAttribute('download', exportFileDefaultName);
                              linkElement.click();
                            }}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors text-primary hover:text-accent"
                            title="Download report"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(report.id)}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors text-error hover:text-red-300" 
                            title="Delete report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Reports</p>
            <p className="text-3xl font-bold text-primary">{reports.length}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Sequences</p>
            <p className="text-3xl font-bold text-accent">
              {(reports.reduce((acc, report) => acc + (report.sequenceLength || 0), 0) / 1000).toFixed(1)}K
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-sm text-muted-foreground mb-1">Avg Score</p>
            <p className="text-3xl font-bold text-success">
              {reports.length > 0 ? (reports.reduce((acc, report) => acc + report.score, 0) / reports.length).toFixed(1) : '0'}%
            </p>
          </div>
        </div>
      </div>

      <ReportModal 
        isOpen={isModalOpen}
        report={selectedReport}
        onClose={() => setIsModalOpen(false)}
      />
    </MainLayout>
  );
}

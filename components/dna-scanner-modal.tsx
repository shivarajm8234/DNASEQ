'use client';

import { useEffect, useState } from 'react';

export function DNAScannerModal({ isOpen }: { isOpen: boolean }) {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);

  const statuses = [
    'Vectorizing sequence to 4,096 features...',
    'Initializing Multi-Task DNN (128x64x32)...',
    'Generating reference training set...',
    'Performing 40-epoch supervised training...',
    'Optimizing weights with Momentum SGD...',
    'Predicting Pathogenicity & Risk Heads...',
    'Finalizing dynamic analysis report...',
  ];

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setStatusIndex(0);
      return;
    }

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 99) return 99; // Cap at 99 until finished
        return prev + Math.random() * 15;
      });
    }, 300);

    const statusInterval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statuses.length);
    }, 600);

    return () => {
      clearInterval(progressInterval);
      clearInterval(statusInterval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-card rounded-xl border border-border p-8 max-w-md w-full mx-4 animate-scale-in shadow-2xl">
        {/* DNA Helix SVG */}
        <div className="flex justify-center mb-8">
          <svg
            width="200"
            height="200"
            viewBox="0 0 200 200"
            className="animate-helix-pulse"
          >
            {/* Left strand */}
            <path
              d="M 100 20 Q 70 40, 100 60 T 100 120 T 100 180"
              stroke="url(#gradientLeft)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />

            {/* Right strand */}
            <path
              d="M 100 20 Q 130 40, 100 60 T 100 120 T 100 180"
              stroke="url(#gradientRight)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />

            {/* Connection lines (base pairs) */}
            {[20, 40, 60, 80, 100, 120, 140, 160, 180].map((y) => {
              const leftX = 100 + Math.sin(y / 20) * 30;
              const rightX = 100 - Math.sin(y / 20) * 30;
              return (
                <line
                  key={`pair-${y}`}
                  x1={leftX}
                  y1={y}
                  x2={rightX}
                  y2={y}
                  stroke="#4db8ff"
                  strokeWidth="2"
                  opacity="0.6"
                  className="animate-helix-connect"
                />
              );
            })}

            {/* Scanning line */}
            <line
              x1="70"
              y1="0"
              x2="130"
              y2="0"
              stroke="#4db8ff"
              strokeWidth="2"
              filter="url(#glow)"
              className="animate-scanner-beam"
            />

            {/* Gradients */}
            <defs>
              <linearGradient id="gradientLeft" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4db8ff" stopOpacity="1" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="gradientRight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="1" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.5" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </svg>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground">Scanning Progress</span>
            <span className="text-sm font-semibold text-primary">{Math.round(Math.min(progress, 100))}%</span>
          </div>
          <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 ease-out rounded-full"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Status Text */}
        <div className="text-center min-h-12 flex items-center justify-center">
          <p className="text-sm text-muted-foreground animate-fade-in transition-all">
            {statuses[statusIndex]}
          </p>
        </div>

        {/* Activity Dots */}
        <div className="flex justify-center gap-2 mt-6">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
}

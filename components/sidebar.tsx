'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Beaker, BarChart3, Info, Settings } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/screening', label: 'Screening', icon: Beaker },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/about', label: 'About', icon: Info },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside className={`w-64 border-r border-border bg-sidebar/80 backdrop-blur-3xl min-h-full flex flex-col z-20 ${className || ''}`}>
      <div className="flex-1 px-4 py-8 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-500 ${isActive ? 'rotate-[360deg]' : 'group-hover:rotate-12'}`} />
              <span className={`font-bold text-xs uppercase tracking-widest ${isActive ? 'animate-pulse' : ''}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="px-4 py-6 border-t border-sidebar-border/50">
        <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground/60 hover:text-foreground hover:bg-sidebar-accent transition-all duration-300 w-full text-left group">
          <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
          <span className="font-bold text-xs uppercase tracking-widest">Settings</span>
        </button>
      </div>
    </aside>
  );
}

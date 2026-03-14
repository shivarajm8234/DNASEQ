'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Beaker, BarChart3, Info } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/screening', label: 'Scan', icon: Beaker },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/about', label: 'About', icon: Info },
];

export function MobileNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pb-safe ${className || ''}`}>
      <div className="flex justify-around items-center h-16 px-2 text-[10px] sm:text-xs">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 ease-in-out ${
                isActive ? 'text-primary scale-110 -translate-y-1' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className={`p-1.5 rounded-full ${isActive ? 'bg-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.5)]' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
              </div>
              <span className="font-bold tracking-tighter uppercase mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

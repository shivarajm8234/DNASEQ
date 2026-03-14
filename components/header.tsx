import Link from 'next/link';
import { Dna } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

export function Header() {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-2xl sticky top-0 z-50 shadow-sm">
      <div className="flex h-16 items-center px-4 md:px-6 gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-foreground hover:text-primary transition-all duration-300 group">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Dna className="w-5 h-5 text-primary" />
          </div>
          <span className="font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground group-hover:from-primary group-hover:to-accent transition-all">GenScreen</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 ml-auto">
          <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Dashboard
          </Link>
          <Link href="/screening" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Screening
          </Link>
          <Link href="/reports" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Reports
          </Link>
          <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            About
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

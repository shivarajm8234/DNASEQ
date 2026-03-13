import Link from 'next/link';
import { Dna } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="flex h-16 items-center px-6 gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-foreground hover:text-primary transition-colors">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Dna className="w-5 h-5 text-primary-foreground" />
          </div>
          <span>GenScreen</span>
        </Link>
        <nav className="flex items-center gap-8 ml-auto">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
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

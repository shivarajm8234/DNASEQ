import { Header } from './header';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar className="hidden md:flex" />
        <main className="flex-1 overflow-auto bg-background/50 relative">
          {/* Subtle premium gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 pointer-events-none" />
          <div className="p-4 md:p-8 relative z-10 pb-28 md:pb-8 max-w-screen-2xl mx-auto">
            {children}
          </div>
        </main>
        <MobileNav className="md:hidden" />
      </div>
    </div>
  );
}

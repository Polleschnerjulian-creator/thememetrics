'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { 
  LayoutDashboard, 
  Layers, 
  Lightbulb, 
  Settings,
  LogOut,
  TrendingUp,
  Gauge,
  CreditCard,
  Accessibility,
  Image
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { cn } from '@/lib/utils';
import { useShop } from '@/hooks/useShop';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', labelEn: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/themes', label: 'Theme Analysis', labelEn: 'Theme Analysis', icon: Layers },
  { href: '/dashboard/performance', label: 'Performance', labelEn: 'Performance', icon: Gauge },
  { href: '/dashboard/accessibility', label: 'Accessibility', labelEn: 'Accessibility', icon: Accessibility },
  { href: '/dashboard/images', label: 'Bildoptimierung', labelEn: 'Image Optimization', icon: Image },
  { href: '/dashboard/recommendations', label: 'Empfehlungen', labelEn: 'Recommendations', icon: Lightbulb },
  { href: '/dashboard/pricing', label: 'Pricing', labelEn: 'Pricing', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Einstellungen', labelEn: 'Settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { shop } = useShop();
  
  // Build href with shop param preserved
  const getHref = (baseHref: string) => {
    if (shop) {
      return `${baseHref}?shop=${shop}`;
    }
    return baseHref;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-border px-6">
            <Logo size={32} />
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={getHref(item.href)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer with Toggles */}
          <div className="border-t border-border p-4 space-y-3">
            <LanguageToggle />
            <ThemeToggle />
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pl-64">
        <div className="min-h-screen p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

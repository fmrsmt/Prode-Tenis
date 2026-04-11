import { Link, Outlet, useLocation } from 'react-router-dom';
import { Trophy, Users, Calendar, History, Menu, Star } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Ranking ATP', href: '/', icon: Trophy },
    { name: 'Palmarés', href: '/palmares', icon: Star },
    { name: 'Torneos', href: '/tournaments', icon: Calendar },
    { name: 'Participantes', href: '/participants', icon: Users },
    { name: 'Historial', href: '/history', icon: History },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-lg text-emerald-700">
          <Trophy className="w-6 h-6" />
          Prode Tenis
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "w-full md:w-64 bg-white border-r flex-shrink-0 flex-col transition-all duration-300 ease-in-out",
        isMobileMenuOpen ? "flex" : "hidden md:flex"
      )}>
        <div className="p-6 hidden md:flex items-center gap-2 font-bold text-xl text-emerald-700 border-b">
          <Trophy className="w-6 h-6" />
          Prode Tenis
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-emerald-50 text-emerald-700" 
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-emerald-600" : "text-neutral-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

import { Link, Outlet, useLocation } from 'react-router-dom';
import { Trophy, Users, Calendar, History, Menu, Star, Settings, LogIn, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useReadOnly } from '@/hooks/useReadOnly';
import { auth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { useFirebase } from './FirebaseProvider';
import { toast } from 'sonner';

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isReadOnly } = useReadOnly();
  const { user } = useFirebase();

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success('Sesión iniciada correctamente');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Error al iniciar sesión');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Sesión cerrada');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  const navigation = [
    { name: 'Ranking ATP', href: '/', icon: Trophy },
    { name: 'Palmarés', href: '/palmares', icon: Star },
    { name: 'Torneos', href: '/tournaments', icon: Calendar },
    { name: 'Participantes', href: '/participants', icon: Users, adminOnly: true },
    { name: 'Historial', href: '/history', icon: History },
    { name: 'Configuración', href: '/settings', icon: Settings, adminOnly: true },
  ].filter(item => !item.adminOnly || !isReadOnly);

  const navLink = (href: string) => {
    const search = location.search;
    return `${href}${search}`;
  };

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
                to={navLink(item.href)}
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

        <div className="p-4 border-t">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-3">
                {user.photoURL && (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                )}
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-medium text-neutral-900 truncate">{user.displayName}</span>
                  <span className="text-[10px] text-neutral-500 truncate">{user.email}</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-neutral-600 hover:text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              className="w-full justify-start text-neutral-600 border-neutral-200"
              onClick={handleLogin}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Iniciar Sesión
            </Button>
          )}
        </div>
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

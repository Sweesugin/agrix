import React, { useState } from 'react';
import {
  Sprout,
  Compass,
  CheckSquare,
  BarChart2,
  Trophy,
  Users,
  ShoppingBag,
  Bot,
  User as UserIcon,
  Flame,
  Shield,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DemoUserSwitcher } from './DemoUserSwitcher';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, onOpenCart }) => {
  const { user, cartCount, setAuthModalOpen, setAuthModalMode, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { id: 'recommendations', label: 'Recommendations', icon: Compass },
    { id: 'challenges', label: 'Challenges', icon: CheckSquare },
    { id: 'progress', label: 'Progress', icon: BarChart2 },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
  ];

  if (user?.role === 'admin') {
    navLinks.push({ id: 'admin', label: 'Admin Portal', icon: Shield });
  } else if (user?.role === 'inspector') {
    navLinks.push({ id: 'admin', label: 'Inspector Portal', icon: Shield });
  } else if (user?.role === 'expert') {
    navLinks.push({ id: 'admin', label: 'Expert Evaluation', icon: Shield });
  }

  const handleNav = (id: string) => {
    onSelectTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      {/* Top micro bar for research prototype note & demo switcher */}
      <div className="bg-emerald-900 text-emerald-100 px-4 py-1.5 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="bg-emerald-700/80 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded text-white shrink-0">
            Research Prototype
          </span>
          <span className="truncate text-emerald-200/90 text-[11px]">
            AgriX: Gamified Platform for Sustainable Agro-Ecosystems
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <DemoUserSwitcher />
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNav('landing')}
              className="flex items-center gap-2.5 text-left focus:outline-none group"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-transparent">
                  AgriX
                </span>
                <span className="hidden sm:block text-[10px] text-stone-500 -mt-1 font-medium tracking-wide">
                  Sustainable Farming
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNav(link.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 shadow-sm border border-emerald-200/60'
                      : 'text-stone-600 hover:text-emerald-700 hover:bg-stone-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-stone-400'}`} />
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons: Points, Streak, Cart, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                {/* Streak */}
                <div
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/70 text-amber-800 text-xs font-bold"
                  title={`${user.streak} days activity streak`}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  <span>{user.streak}d</span>
                </div>

                {/* Points & Level */}
                <button
                  onClick={() => handleNav('progress')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold hover:bg-emerald-100 transition-colors"
                  title="View your points and badges progress"
                >
                  <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{user.points} pts</span>
                  <span className="hidden md:inline px-1.5 py-0.5 rounded bg-emerald-200/70 text-[10px] text-emerald-800 font-semibold">
                    Lvl {user.level} {user.levelTitle}
                  </span>
                </button>

                {/* Cart trigger */}
                <button
                  onClick={onOpenCart}
                  className="relative p-2 rounded-xl text-stone-600 hover:text-emerald-700 hover:bg-stone-50 transition-colors"
                  title="Marketplace Cart"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1 pl-2 rounded-full border border-stone-200 hover:border-emerald-300 transition-colors"
                  >
                    <span className="text-xs font-semibold text-stone-700 hidden sm:inline truncate max-w-[100px]">
                      {user.name.split(' ')[0]}
                    </span>
                    <img
                      src={
                        user.avatarUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                      }
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-emerald-300"
                    />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="p-3 border-b border-stone-100">
                        <div className="text-xs font-bold text-stone-900 truncate">{user.name}</div>
                        <div className="text-[11px] text-stone-500 truncate">{user.email}</div>
                        <div className="text-[10px] text-emerald-700 font-medium mt-1">
                          {user.mainCrop} • {user.soilType} ({user.farmSize} ac)
                        </div>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            handleNav('profile');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg flex items-center gap-2"
                        >
                          <UserIcon className="w-4 h-4 text-stone-400" />
                          Farm Profile & Settings
                        </button>

                        <button
                          onClick={() => {
                            handleNav('progress');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg flex items-center gap-2"
                        >
                          <BarChart2 className="w-4 h-4 text-stone-400" />
                          Badges & Progress
                        </button>

                        {user.role === 'admin' && (
                          <button
                            onClick={() => {
                              handleNav('admin');
                              setUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg flex items-center gap-2"
                          >
                            <Shield className="w-4 h-4 text-amber-600" />
                            Admin Console
                          </button>
                        )}
                      </div>

                      <div className="pt-1 border-t border-stone-100">
                        <button
                          onClick={() => {
                            logout();
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAuthModalMode('login');
                    setAuthModalOpen(true);
                  }}
                  className="px-3 py-2 text-xs font-semibold text-emerald-800 hover:text-emerald-950"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthModalMode('register');
                    setAuthModalOpen(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm"
                >
                  Register
                </button>
              </div>
            )}

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-stone-200 bg-white px-4 pt-2 pb-6 space-y-1 animate-in slide-in-from-top-2 duration-150">
          <div className="py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-3">
              Platform Navigation
            </span>
          </div>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNav(link.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-stone-400'}`} />
                {link.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};

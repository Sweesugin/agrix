import React, { useState } from 'react';
import { Users, Shield, UserCheck, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  {
    id: 'user_ramesh',
    name: 'Ramesh Patel',
    role: 'Farmer',
    crop: 'Tomato',
    soil: 'Loamy',
    level: 'Cultivator',
    points: 820,
    avatar: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'user_ananya',
    name: 'Ananya Sharma',
    role: 'Farmer',
    crop: 'Rice',
    soil: 'Clay',
    level: 'Sustainable Farmer',
    points: 1250,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'user_priya',
    name: 'Priya Verma',
    role: 'Farmer (Beginner)',
    crop: 'Vegetables',
    soil: 'Loamy',
    level: 'Grower',
    points: 330,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'user_lakshmi',
    name: 'Lakshmi Devi',
    role: 'Farmer',
    crop: 'Banana',
    soil: 'Red soil',
    level: 'Sustainable Farmer',
    points: 980,
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'user_admin',
    name: 'Dr. Vandana Rao',
    role: 'Admin / Agri Officer',
    crop: 'Millets',
    soil: 'Red soil',
    level: 'Green Champion',
    points: 2150,
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'user_inspector',
    name: 'Inspector Rajesh Kumar',
    role: 'Inspector (Field Officer)',
    crop: 'Multi-Crop',
    soil: 'Loamy',
    level: 'Green Champion',
    points: 1500,
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'user_expert',
    name: 'Dr. Swaminathan Raman',
    role: 'Agronomy Expert (TNAU)',
    crop: 'Research',
    soil: 'Loamy',
    level: 'Sustainable Farmer',
    points: 1200,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
  },
];

export const DemoUserSwitcher: React.FC = () => {
  const { user, switchDemoUser, setAuthModalOpen, setAuthModalMode } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-100/90 hover:bg-emerald-200/80 rounded-full border border-emerald-300 transition-colors"
        title="Quick Role & Persona Switcher for Evaluation"
      >
        <Users className="w-3.5 h-3.5 text-emerald-700" />
        <span className="hidden sm:inline">Role Switcher:</span>
        <span className="font-semibold">{user ? user.name.split(' ')[0] : 'Select Demo'}</span>
        {user?.role === 'admin' && (
          <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded text-[10px] font-bold">Admin</span>
        )}
        <ChevronDown className="w-3 h-3 text-emerald-600" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-stone-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-stone-100 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Demo Persona Switcher
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">Viva / Evaluation Ready</span>
          </div>

          <div className="max-h-64 overflow-y-auto py-1 divide-y divide-stone-50">
            {DEMO_ACCOUNTS.map((account) => {
              const isSelected = user?.id === account.id;
              return (
                <button
                  key={account.id}
                  onClick={() => {
                    switchDemoUser(account.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-colors ${
                    isSelected ? 'bg-emerald-50 text-emerald-950 font-medium' : 'hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <img
                    src={account.avatar}
                    alt={account.name}
                    className="w-8 h-8 rounded-full object-cover border border-emerald-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <span className="truncate">{account.name}</span>
                      {account.id === 'user_admin' && (
                        <Shield className="w-3 h-3 text-amber-600 shrink-0" />
                      )}
                      {isSelected && <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-auto" />}
                    </div>
                    <div className="text-[11px] text-stone-500 flex items-center gap-1.5 truncate">
                      <span>{account.crop}</span> • <span>{account.soil}</span> •{' '}
                      <span className="font-semibold text-emerald-700">{account.points} pts</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-stone-100 mt-1 flex gap-2">
            <button
              onClick={() => {
                setAuthModalMode('register');
                setAuthModalOpen(true);
                setIsOpen(false);
              }}
              className="flex-1 py-1.5 text-center text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
            >
              + Register New Farmer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

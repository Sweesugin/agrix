/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BadgeUnlockModal } from './components/BadgeUnlockModal';
import { AuthModal } from './components/AuthModal';
import { CartModal } from './components/CartModal';

import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { ChallengesPage } from './pages/ChallengesPage';
import { ProgressPage } from './pages/ProgressPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { CommunityPage } from './pages/CommunityPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';

const MainApp: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const { user } = useAuth();

  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col selection:bg-emerald-200 selection:text-emerald-950">
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenCart={() => setCartModalOpen(true)}
      />

      <main className="flex-1">
        {currentTab === 'landing' && <LandingPage onSelectTab={handleSelectTab} />}
        {currentTab === 'dashboard' && <DashboardPage onSelectTab={handleSelectTab} />}
        {currentTab === 'recommendations' && (
          <RecommendationsPage onSelectTab={handleSelectTab} />
        )}
        {currentTab === 'challenges' && <ChallengesPage onSelectTab={handleSelectTab} />}
        {currentTab === 'progress' && <ProgressPage onSelectTab={handleSelectTab} />}
        {currentTab === 'leaderboard' && <LeaderboardPage onSelectTab={handleSelectTab} />}
        {currentTab === 'community' && <CommunityPage onSelectTab={handleSelectTab} />}
        {currentTab === 'marketplace' && (
          <MarketplacePage onOpenCart={() => setCartModalOpen(true)} />
        )}
        {currentTab === 'ai-assistant' && <AIAssistantPage />}
        {currentTab === 'profile' && <ProfilePage />}
        {currentTab === 'admin' && <AdminPage />}
      </main>

      <Footer onSelectTab={handleSelectTab} />

      {/* Global Modals */}
      <BadgeUnlockModal />
      <AuthModal />
      <CartModal isOpen={cartModalOpen} onClose={() => setCartModalOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

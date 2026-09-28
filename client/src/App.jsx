import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivacyModal from './components/PrivacyModal';
import GeneralVotingPage from './pages/GeneralVotingPage';
import SMVotingPage from './pages/SMVotingPage';
import VoteSuccessPage from './pages/VoteSuccessPage';
import ScannerPage from './pages/ScannerPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import { useAuth } from './context/AuthContext';
import api from './services/api';

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState({ name: 'home' });
  const [campaignStatus, setCampaignStatus] = useState(null);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [lastVoteData, setLastVoteData] = useState(null);

  // Parse path on initial load & handle back/forward navigation
  const parsePath = () => {
    const path = window.location.pathname;
    const smMatch = path.match(/^\/vote\/sm\/([^/?#]+)/i);

    if (smMatch && smMatch[1]) {
      return { name: 'sm-vote', smId: decodeURIComponent(smMatch[1]) };
    }
    if (path === '/scan' || path === '/scanner') {
      return { name: 'scanner' };
    }
    if (path.startsWith('/admin/login')) {
      return { name: 'admin-login' };
    }
    if (path.startsWith('/admin')) {
      return { name: 'admin' };
    }
    if (path === '/success') {
      return { name: 'success' };
    }
    return { name: 'home' };
  };

  useEffect(() => {
    setCurrentRoute(parsePath());

    const handlePopState = () => {
      setCurrentRoute(parsePath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync route changes to browser history
  const navigateTo = (route, updateHistory = true) => {
    setCurrentRoute(route);
    if (updateHistory) {
      let path = '/';
      if (route.name === 'sm-vote') path = `/vote/sm/${encodeURIComponent(route.smId)}`;
      else if (route.name === 'scanner') path = '/scan';
      else if (route.name === 'admin-login') path = '/admin/login';
      else if (route.name === 'admin') path = '/admin';
      else if (route.name === 'success') path = '/success';

      window.history.pushState(null, '', path);
    }
  };

  // Poll campaign status periodically
  const loadCampaignStatus = async () => {
    try {
      const res = await api.getCampaign();
      setCampaignStatus(res.status);
    } catch {
      // offline fallback
    }
  };

  useEffect(() => {
    loadCampaignStatus();
    const interval = setInterval(loadCampaignStatus, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleVoteSuccess = (voteResult) => {
    setLastVoteData(voteResult);
    navigateTo({ name: 'success' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b1329] text-slate-100">
      <Navbar
        currentRoute={currentRoute}
        setCurrentRoute={navigateTo}
        campaignStatus={campaignStatus}
      />

      <main className="flex-1">
        {currentRoute.name === 'home' && (
          <GeneralVotingPage
            onVoteSuccess={handleVoteSuccess}
            campaignStatus={campaignStatus}
          />
        )}

        {currentRoute.name === 'sm-vote' && (
          <SMVotingPage
            smId={currentRoute.smId}
            onVoteSuccess={handleVoteSuccess}
            onBackToGeneral={() => navigateTo({ name: 'home' })}
            campaignStatus={campaignStatus}
          />
        )}

        {currentRoute.name === 'scanner' && (
          <ScannerPage
            onScanSuccess={(scannedSMId) => navigateTo({ name: 'sm-vote', smId: scannedSMId })}
            onBack={() => navigateTo({ name: 'home' })}
          />
        )}

        {currentRoute.name === 'success' && (
          <VoteSuccessPage
            voteData={lastVoteData}
            onReturnHome={() => navigateTo({ name: 'home' })}
          />
        )}

        {currentRoute.name === 'admin-login' && (
          <AdminLoginPage
            onLoginSuccess={() => navigateTo({ name: 'admin' })}
          />
        )}

        {currentRoute.name === 'admin' && (
          isAuthenticated ? (
            <AdminDashboard
              onLogout={() => navigateTo({ name: 'home' })}
            />
          ) : (
            <AdminLoginPage
              onLoginSuccess={() => navigateTo({ name: 'admin' })}
            />
          )
        )}
      </main>

      <Footer onOpenPrivacy={() => setIsPrivacyOpen(true)} />

      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </div>
  );
}

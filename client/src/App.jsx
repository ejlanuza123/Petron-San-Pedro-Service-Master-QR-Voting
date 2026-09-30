import React, { useState, useEffect, Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivacyModal from './components/PrivacyModal';
import GeneralVotingPage from './pages/GeneralVotingPage';
import SMVotingPage from './pages/SMVotingPage';
import VoteSuccessPage from './pages/VoteSuccessPage';
import { useAuth } from './context/AuthContext';
import api from './services/api';

// Code-split heavy routes to keep voter bundle ultra-lightweight
const ScannerPage = lazy(() => import('./pages/ScannerPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const PairDevicePage = lazy(() => import('./pages/PairDevicePage'));

function PageLoadingFallback({ message = 'Loading interface...' }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-xs text-slate-400 font-medium tracking-wide">{message}</p>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState({ name: 'home' });
  const [campaignStatus, setCampaignStatus] = useState(null);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [lastVoteData, setLastVoteData] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine ?? true);

  // Parse path on initial load & handle back/forward navigation
  const parsePath = () => {
    const path = window.location.pathname;
    const smMatch = path.match(/^\/vote\/sm\/([^/?#]+)/i);

    if (smMatch && smMatch[1]) {
      return { name: 'sm-vote', smId: decodeURIComponent(smMatch[1]) };
    }
    if (path.startsWith('/pair-device')) {
      return { name: 'pair-device' };
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
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
      else if (route.name === 'pair-device') path = window.location.pathname + window.location.search;
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

      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-md animate-pulse">
          <span className="w-2 h-2 rounded-full bg-slate-950" />
          <span>You are currently offline. Check your internet connection to cast ballots.</span>
        </div>
      )}

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

        {currentRoute.name === 'pair-device' && (
          <Suspense fallback={<PageLoadingFallback message="Loading security device pairing..." />}>
            <PairDevicePage onReturnHome={() => navigateTo({ name: 'home' })} />
          </Suspense>
        )}

        {currentRoute.name === 'scanner' && (
          <Suspense fallback={<PageLoadingFallback message="Initializing camera scanner..." />}>
            <ScannerPage
              onScanSuccess={(scannedSMId) => navigateTo({ name: 'sm-vote', smId: scannedSMId })}
              onBack={() => navigateTo({ name: 'home' })}
            />
          </Suspense>
        )}

        {currentRoute.name === 'success' && (
          <VoteSuccessPage
            voteData={lastVoteData}
            onReturnHome={() => navigateTo({ name: 'home' })}
          />
        )}

        {currentRoute.name === 'admin-login' && (
          <Suspense fallback={<PageLoadingFallback message="Loading admin portal..." />}>
            <AdminLoginPage
              onLoginSuccess={() => navigateTo({ name: 'admin' })}
            />
          </Suspense>
        )}

        {currentRoute.name === 'admin' && (
          <Suspense fallback={<PageLoadingFallback message="Loading admin audit dashboard..." />}>
            {isAuthenticated ? (
              <AdminDashboard
                onLogout={() => navigateTo({ name: 'home' })}
              />
            ) : (
              <AdminLoginPage
                onLoginSuccess={() => navigateTo({ name: 'admin' })}
              />
            )}
          </Suspense>
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

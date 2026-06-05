import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import ParticlesBg from './components/ParticlesBg';
import Home from './pages/Home';
import Complaint from './pages/Complaint';
import Records from './pages/Records';
import Track from './pages/Track';
import Fuel from './pages/Fuel';
import Electricity from './pages/Electricity';
import Emergency from './pages/Emergency';
import Blood from './pages/Blood';
import Weather from './pages/Weather';
import Prayer from './pages/Prayer';
import News from './pages/News';
import ChatBot from './pages/Bot';
import LostFound from './pages/LostFound';

function WelcomeNotification() {
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('welcome_seen');
    if (!hasSeenWelcome) {
      const timer = setTimeout(() => {
        toast.custom(
          () => (
            <div
              className="welcome-toast scale-in"
              style={{
                background: 'var(--color-card-solid)',
                border: '1px solid var(--color-glass-border)',
                borderRadius: '16px',
                padding: '16px',
                boxShadow: '0 12px 40px var(--color-shadow)',
                maxWidth: 360,
              }}
            >
              <div className="welcome-icon">🇵🇰</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-fg)', marginBottom: 2 }}>
                  Welcome to AWAAZ360 Pro! 🎉
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-fg2)' }}>
                  Pakistan ka civic platform. File complaints, check fuel prices, weather, and more!
                </div>
              </div>
            </div>
          ),
          { duration: 5000, position: 'top-right' }
        );
        localStorage.setItem('welcome_seen', 'true');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ParticlesBg />
        <WelcomeNotification />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--color-card-solid)',
              color: 'var(--color-fg)',
              border: '1px solid var(--color-glass-border)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#2ed573', secondary: '#0a0f1a' } },
            error: { iconTheme: { primary: '#ff4757', secondary: '#0a0f1a' } },
          }}
        />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/complaint" element={<Complaint />} />
            <Route path="/records" element={<Records />} />
            <Route path="/track" element={<Track />} />
            <Route path="/fuel" element={<Fuel />} />
            <Route path="/electricity" element={<Electricity />} />
            <Route path="/emergency" element={<Emergency />} />
            <Route path="/blood" element={<Blood />} />
            <Route path="/weather" element={<Weather />} />
            <Route path="/prayer" element={<Prayer />} />
            <Route path="/news" element={<News />} />
            <Route path="/bot" element={<ChatBot />} />
            <Route path="/lost-found" element={<LostFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

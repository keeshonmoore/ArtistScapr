import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ThemeProvider } from '@/context/ThemeContext';
import App from './App.jsx';
import Dashboard from './pages/Dashboard.jsx';
import FindArtist from './pages/FindArtist.jsx';
import ScrapePlaylist from './pages/ScrapePlaylist.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Documentation from './pages/Documentation.jsx';
import Artist from './pages/Artist.jsx';
import Playlist from './pages/Playlist.jsx';
import './index.css';

function RequireAuth({ children }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(null);

  React.useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkSession();
  }, []);

  if (isAuthenticated === null) return null; // Loading state
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <App />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="find-artist" element={<FindArtist />} />
            <Route path="scrape-playlist" element={<ScrapePlaylist />} />
            <Route path="documentation" element={<Documentation />} />
            <Route path="artist" element={<Artist />} />
            <Route path="playlist" element={<Playlist />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
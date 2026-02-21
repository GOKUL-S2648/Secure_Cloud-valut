import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { LandingPage } from './components/LandingPage';

const App = () => {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('cv_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (u) => {
    localStorage.setItem('cv_user', JSON.stringify(u));
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('cv_user');
    setUser(null);
    setShowAuth(false);
  };

  // If user is logged in, show the Dashboard
  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  // If user clicked "Get Started" or is in auth flow, show Login/Signup
  if (showAuth) {
    return <LoginPage onLogin={handleLogin} onBackToLanding={() => setShowAuth(false)} />;
  }

  // Otherwise, show the Landing Page
  return <LandingPage onGetStarted={() => setShowAuth(true)} />;
};

export default App;

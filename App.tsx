import React, { useState, useEffect } from 'react';
import AdminDashboard from './components/AdminDashboard';
import OnboardingFlow from './components/OnboardingFlow';
import Login from './components/Login';
import { AgencyConfig, User } from './types';

// Default configuration based on a typical Marketing/AI agency
const DEFAULT_CONFIG: AgencyConfig = {
  name: "NexGen Marketing",
  industry: "Digital Marketing & Automation",
  description: "We help e-commerce brands scale using paid ads (FB/Google) and email marketing automation.",
  onboardingGoal: "Understand their current revenue, target audience demographics, main competitors, and advertising budget.",
  tone: "Professional & Formal",
  targetAudience: "E-commerce store owners making $10k+ monthly revenue",
  maxQuestions: 8,
  theme: {
    primaryColor: "#4f46e5", // Indigo-600
    backgroundColor: "#ffffff",
    textColor: "#111827", // Gray-900
  }
};

const App: React.FC = () => {
  const [config, setConfig] = useState<AgencyConfig>(DEFAULT_CONFIG);
  const [view, setView] = useState<'login' | 'admin' | 'preview' | 'client'>('login');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('smart_onboard_user');
    
    // Hash routing for client view takes precedence
    const handleHashChange = () => {
      if (window.location.hash === '#client') {
        setView('client');
      } else {
        // If not client view, check auth
        if (savedUser) {
          setUser(JSON.parse(savedUser));
          setView('admin');
        } else {
          setView('login');
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('smart_onboard_user', JSON.stringify(userData));
    setView('admin');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('smart_onboard_user');
    setView('login');
  };

  if (view === 'client') {
    return (
      <OnboardingFlow 
        config={config} 
        mode="client"
      />
    );
  }

  if (view === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  if (view === 'preview') {
      return (
          <OnboardingFlow
            config={config}
            mode="preview"
            onExit={() => setView('admin')}
          />
      )
  }

  if (user && view === 'admin') {
      return (
        <AdminDashboard 
            user={user}
            config={config} 
            onSave={setConfig} 
            onStart={() => setView('preview')} 
            onLogout={handleLogout}
        />
      );
  }

  return null;
};

export default App;

import React, { useState, useEffect } from 'react';
import { 
  signUpWithEmail, 
  signInWithEmail, 
  subscribeToAuthChanges,
  getFirebaseApp 
} from '../firebase.js';
import { Mail, Lock, Database, ArrowRight, ShieldCheck, Info } from 'lucide-react';

export default function AuthPage({ firebaseConfig, setFirebaseConfig, onLoginSuccess, onSkipAuth }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [configInput, setConfigInput] = useState(firebaseConfig || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfigSetup, setShowConfigSetup] = useState(!firebaseConfig);

  // Validate and save Firebase config
  const handleSaveConfig = (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const cleanConfig = configInput.trim();
      if (!cleanConfig) {
        throw new Error("Configuration cannot be empty.");
      }
      
      const parsed = JSON.parse(cleanConfig);
      if (!parsed.apiKey || !parsed.projectId || !parsed.authDomain) {
        throw new Error("Missing critical Firebase properties (apiKey, projectId, authDomain).");
      }
      
      // Test initialize
      const app = getFirebaseApp(cleanConfig);
      if (!app) {
        throw new Error("Failed to initialize Firebase with the provided configuration.");
      }
      
      setFirebaseConfig(cleanConfig);
      setShowConfigSetup(false);
    } catch (err) {
      setError(err.message || "Invalid JSON configuration format.");
    }
  };

  // Submit sign in / sign up
  const handleSubmitAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all credentials.");
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      if (isSignUp) {
        const user = await signUpWithEmail(firebaseConfig, email, password);
        onLoginSuccess(user);
      } else {
        const user = await signInWithEmail(firebaseConfig, email, password);
        onLoginSuccess(user);
      }
    } catch (err) {
      console.error(err);
      let friendlyMessage = err.message || "Authentication failed.";
      if (friendlyMessage.includes("auth/invalid-credential")) {
        friendlyMessage = "Invalid email or password. Please verify your credentials.";
      } else if (friendlyMessage.includes("auth/email-already-in-use")) {
        friendlyMessage = "This email is already registered. Try logging in instead.";
      } else if (friendlyMessage.includes("auth/weak-password")) {
        friendlyMessage = "Password must be at least 6 characters long.";
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top left, #1e1b4b 0%, #09090b 100%)',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#e4e4e7'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '480px',
        width: '100%',
        padding: '40px',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(9, 9, 11, 0.65)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        textAlign: 'center'
      }}>
        {/* App Title */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            padding: '12px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            boxShadow: '0 8px 24px rgba(79, 70, 229, 0.25)',
            color: 'white',
            marginBottom: '16px'
          }}>
            <ShieldCheck size={32} />
          </div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ffffff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            CareerCraft Workspace
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#a1a1aa', lineHeight: '1.4' }}>
            AI-driven job application suite with client-side Firestore synchronization
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{
            fontSize: '12px',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#f87171',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {showConfigSetup ? (
          /* Firebase config onboarding */
          <form onSubmit={handleSaveConfig}>
            <div style={{ textAlign: 'left', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Database size={16} style={{ color: 'var(--primary)' }} />
                <label className="form-label" style={{ margin: 0, fontWeight: '600' }}>Bring Your Own Firebase (BYOF)</label>
              </div>
              <p style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                Paste your Firebase Project Configuration JSON below to unlock account creation, secure sign-in, and cross-device cloud synchronization.
              </p>
              
              <textarea
                className="form-control"
                style={{
                  minHeight: '150px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  lineHeight: '1.4',
                  background: 'rgba(0,0,0,0.2)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '12px'
                }}
                placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "your-app.firebaseapp.com",\n  "projectId": "your-app-id",\n  "storageBucket": "your-app.appspot.com",\n  "messagingSenderId": "...",\n  "appId": "..."\n}`}
                value={configInput}
                onChange={(e) => setConfigInput(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', borderRadius: '8px' }}>
              Save & Initialize Workspace <ArrowRight size={14} style={{ marginLeft: '6px' }} />
            </button>

            <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
              <button type="button" onClick={onSkipAuth} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '13px', fontWeight: '500', textDecoration: 'underline' }}>
                Continue in Local Mode (Local Storage Only)
              </button>
            </div>
          </form>
        ) : (
          /* Login / Signup form */
          <form onSubmit={handleSubmitAuth}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', textAlign: 'left' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Lock size={14} /> Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', borderRadius: '8px' }}
              disabled={loading}
            >
              {loading ? (isSignUp ? 'Creating Account...' : 'Logging In...') : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>

            <div style={{ marginTop: '24px', fontSize: '13px', color: '#a1a1aa' }}>
              {isSignUp ? "Already have an account? " : "New to cloud sync? "}
              <button
                type="button"
                onClick={() => { setError(''); setIsSignUp(!isSignUp); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline', padding: 0 }}
                disabled={loading}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>

            <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <button type="button" onClick={() => setShowConfigSetup(true)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', textDecoration: 'underline' }}>
                Change Firebase Config
              </button>
              <button type="button" onClick={onSkipAuth} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '500', textDecoration: 'underline' }}>
                Use Local Storage Mode
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

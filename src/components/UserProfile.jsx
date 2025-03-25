import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Login } from './Login';

export function UserProfile() {
  const { user, signOut, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLogoutLoading(false);
    }
  };

  if (loading) {
    return <div className="user-profile-loading">Loading...</div>;
  }

  if (showLogin) {
    return (
      <div className="modal-backdrop">
        <div className="modal-content">
          <Login onClose={() => setShowLogin(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile">
      {user ? (
        <>
          <div className="user-info">
            <span className="user-email">{user.email}</span>
          </div>
          <button 
            className="logout-button"
            onClick={handleLogout}
            disabled={logoutLoading}
          >
            {logoutLoading ? 'Signing out...' : 'Sign Out'}
          </button>
        </>
      ) : (
        <button 
          className="login-button"
          onClick={() => setShowLogin(true)}
        >
          Sign In
        </button>
      )}
    </div>
  );
}

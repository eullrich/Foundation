import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export function Login({ onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('signin'); // signin, signup, or reset

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setMessage(null);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        // Sign in flow
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        onClose();
      } else if (mode === 'signup') {
        // Sign up flow
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }

        const { error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        
        setMessage('Sign up successful! Please check your email for verification.');
      } else if (mode === 'reset') {
        // Reset password flow
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        
        setMessage('Password reset email sent. Please check your inbox.');
      }
    } catch (error) {
      setError(error.message || `Failed to ${mode === 'signin' ? 'sign in' : mode === 'signup' ? 'sign up' : 'reset password'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        <h2>
          {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Reset Password'}
        </h2>
        
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          
          {mode !== 'reset' && (
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={mode !== 'reset'}
                placeholder="Enter your password"
                minLength={6}
              />
            </div>
          )}
          
          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm your password"
                minLength={6}
              />
            </div>
          )}
          
          <div className="form-actions">
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading 
                ? (mode === 'signin' ? 'Signing in...' : mode === 'signup' ? 'Signing up...' : 'Sending...') 
                : (mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Send Reset Link')}
            </button>
          </div>
        </form>
        
        <div className="auth-options">
          {mode === 'signin' && (
            <>
              <button 
                type="button" 
                className="text-button"
                onClick={() => switchMode('reset')}
              >
                Forgot password?
              </button>
              <p className="auth-switch">
                Don't have an account?
                <button 
                  type="button" 
                  className="text-button"
                  onClick={() => switchMode('signup')}
                >
                  Sign Up
                </button>
              </p>
            </>
          )}
          
          {mode === 'signup' && (
            <p className="auth-switch">
              Already have an account?
              <button 
                type="button" 
                className="text-button"
                onClick={() => switchMode('signin')}
              >
                Sign In
              </button>
            </p>
          )}
          
          {mode === 'reset' && (
            <p className="auth-switch">
              <button 
                type="button" 
                className="text-button"
                onClick={() => switchMode('signin')}
              >
                Back to Sign In
              </button>
            </p>
          )}
        </div>
        
        <button 
          className="close-button"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

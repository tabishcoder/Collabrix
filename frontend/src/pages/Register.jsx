import React, { useState } from 'react';
import API from '../api';
import { useNavigate, Link } from 'react-router-dom';

export default function Register({ setUser }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await API.post('/auth/register', { name, email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      nav('/chat');
    } catch (err) {
      alert(err.response?.data?.msg || 'Register error');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    card: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      padding: '40px',
      width: '100%',
      maxWidth: '400px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      animation: 'slideUp 0.6s ease-out'
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#2d3748',
      textAlign: 'center',
      marginBottom: '8px',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    },
    subtitle: {
      fontSize: '16px',
      color: '#718096',
      textAlign: 'center',
      marginBottom: '32px'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    },
    inputGroup: {
      position: 'relative'
    },
    input: {
      width: '100%',
      padding: '16px 20px',
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      fontSize: '16px',
      transition: 'all 0.3s ease',
      background: '#f8fafc',
      outline: 'none',
      boxSizing: 'border-box'
    },
    inputFocus: {
      borderColor: '#667eea',
      background: '#ffffff',
      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
    },
    button: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      padding: '16px',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
      marginTop: '8px'
    },
    buttonHover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)'
    },
    buttonDisabled: {
      opacity: '0.7',
      cursor: 'not-allowed',
      transform: 'none'
    },
    loginLink: {
      textAlign: 'center',
      marginTop: '24px',
      fontSize: '14px',
      color: '#718096'
    },
    loginLinkText: {
      color: '#667eea',
      textDecoration: 'none',
      fontWeight: '500',
      transition: 'color 0.3s ease'
    },
    loadingSpinner: {
      width: '20px',
      height: '20px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderTop: '2px solid white',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginRight: '8px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.subtitle}>Join us and start collaborating</p>
        
        <form onSubmit={submit} style={styles.form}>
          <div style={styles.inputGroup}>
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={e => setName(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          
          <div style={styles.inputGroup}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          
          <div style={styles.inputGroup}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...styles.button,
              ...(isLoading ? styles.buttonDisabled : {})
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                Object.assign(e.target.style, styles.buttonHover);
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'none';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            {isLoading ? (
              <>
                <span style={styles.loadingSpinner}></span>
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
        
        <div style={styles.loginLink}>
          Already have an account?{' '}
          <Link to="/login" style={styles.loginLinkText}>
            Sign in here
          </Link>
        </div>
      </div>
      
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        input:focus {
          border-color: #667eea !important;
          background: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
        }
        
        a:hover {
          color: #764ba2 !important;
        }
      `}</style>
    </div>
  );
}

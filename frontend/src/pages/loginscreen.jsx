import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';


const roles = ['customer', 'shopkeeper', 'delivery_agent'];

export default function LoginScreen() {
  const [role, setRole] = useState('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('https://asia-south1-aroundu-473113.cloudfunctions.net/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.msg || 'Login failed');
      } else {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('Logged in user:', data.user); // Log user details to console
        console.log('Full response from server:', data); // This will show both token and user
        setSuccess('Login successful!'); // Show success message
        /*setTimeout(() => {
          if (data.user.role === 'customer') {
            navigate('/customer-dashboard');
          } else if (data.user.role === 'shopkeeper') {
            navigate('/shopkeeper-dashboard');
          } else if (data.user.role === 'delivery_agent') {
            navigate('/delivery-dashboard');
          } else {
            navigate('/'); // fallback
          }
        }, 1200);*/
    }
    } catch (err) {
      setError('Server error');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f7f9fa',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '32px 48px 0 48px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src={"/LOGO.png"}
            alt="AroundU Logo"
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              objectFit: 'contain',
            }}
          />
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <a href="#" style={{ color: '#222', textDecoration: 'none', fontWeight: 500 }}>Home</a>
          {/* <a href="#" style={{ color: '#222', textDecoration: 'none', fontWeight: 500 }}>Contact</a> */}
          <button
            style={{
              background: '#19c37d',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 24px',
              fontWeight: 600,
              fontSize: 16,
              marginLeft: 16,
              cursor: 'pointer'
            }}
            onClick={() => navigate('/signup')}
          >
            Sign Up
          </button>
        </nav>
      </header>
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <form
          onSubmit={handleSubmit}
          style={{
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            padding: 40,
            width: 370,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch'
          }}
        >
          <h2 style={{
            fontWeight: 700,
            fontSize: 28,
            marginBottom: 8,
            textAlign: 'center'
          }}>Welcome Back!</h2>
          <div style={{
            color: '#666',
            fontSize: 15,
            marginBottom: 28,
            textAlign: 'center'
          }}>
            Login to continue your journey with AroundU.
          </div>
          <label style={{ fontWeight: 600, marginBottom: 6, fontSize: 15 }}>I am a</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            style={{
              marginBottom: 18,
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #e4e4e4',
              background: '#f7f9fa',
              fontSize: 15,
              outline: 'none'
            }}
          >
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <label style={{ fontWeight: 600, marginBottom: 6, fontSize: 15 }}>Email Address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{
              marginBottom: 18,
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #e4e4e4',
              background: '#f7f9fa',
              fontSize: 15,
              outline: 'none'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontWeight: 600, marginBottom: 6, fontSize: 15 }}>Password</label>
            <a href="#" style={{ color: '#19c37d', fontSize: 13, textDecoration: 'none' }}>Forgot password?</a>
          </div>
          <input
            type="password"
            placeholder="********"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{
              marginBottom: 18,
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #e4e4e4',
              background: '#f7f9fa',
              fontSize: 15,
              outline: 'none'
            }}
          />
          {error && <div style={{ color: 'red', marginBottom: 10, fontSize: 14 }}>{error}</div>}
          {success && <div style={{ color: 'green', marginBottom: 10, fontSize: 14 }}>{success}</div>}
          <button
            type="submit"
            disabled={loading}
            
            style={{
              background: '#19c37d',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px 0',
              fontWeight: 700,
              fontSize: 17,
              marginBottom: 10,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <div style={{
            textAlign: 'center',
            fontSize: 14,
            color: '#888',
            marginTop: 8
          }}>
            Don't have an account?{' '}
            <a
              href="#"
              style={{ color: '#19c37d', textDecoration: 'none', fontWeight: 500 }}
              onClick={e => { e.preventDefault(); navigate('/signup'); }}
            >
              Sign up
            </a>
          </div>
        </form>
      </main>
    </div>
  );
}

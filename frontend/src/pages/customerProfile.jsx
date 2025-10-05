import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CustomerProfile() {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://asia-south1-aroundu-473113.cloudfunctions.net/customer-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fullName, phoneNumber, homeAddress ,deliveryLocation}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.msg || 'Profile update failed');
      } else {
        setSuccess('Profile saved successfully!');
        // Optionally redirect after a delay
        // setTimeout(() => navigate('/customer-dashboard'), 1200);
      }
    } catch (err) {
      setError('Server error');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fafcfa',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header with logo and AroundU */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        padding: '32px 0 0 48px'
      }}>
        <img
          src="/LOGO.png"
          alt="AroundU Logo"
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            objectFit: 'contain',
            marginRight: 10
          }}
        />
        <span style={{ fontWeight: 700, fontSize: 20, color: '#222', fontFamily: 'Poppins, sans-serif' }}>
          AroundU
        </span>
      </header>
      {/* Main content */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h2 style={{
          fontWeight: 700,
          fontSize: 32,
          marginBottom: 8,
          textAlign: 'center',
          fontFamily: 'Poppins, sans-serif'
        }}>
          Complete Your Profile
        </h2>
        <div style={{
          color: '#666',
          fontSize: 16,
          marginBottom: 32,
          textAlign: 'center',
          fontFamily: 'Raleway, sans-serif'
        }}>
          Help us get to know you better.
        </div>
        <form
          onSubmit={handleSubmit}
          style={{
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            padding: 40,
            width: 400,
            maxWidth: '90vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch'
          }}
        >
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
            style={{
              marginBottom: 18,
              padding: '14px 16px',
              borderRadius: 10,
              border: '1.5px solid #e4e4e4',
              background: '#fafcfa',
              fontSize: 16,
              outline: 'none'
            }}
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            required
            style={{
              marginBottom: 18,
              padding: '14px 16px',
              borderRadius: 10,
              border: '1.5px solid #e4e4e4',
              background: '#fafcfa',
              fontSize: 16,
              outline: 'none'
            }}
          />
              
            <div style={{ position: 'relative', marginBottom: 18 }}>
              <span style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#bdbdbd',
                fontSize: 18
              }}>🏠</span>
              <input
                type="text"
                placeholder="Home Address"
                value={homeAddress}
                onChange={e => setHomeAddress(e.target.value)}
                required
                style={{
                  padding: '14px 16px 14px 40px',
                  borderRadius: 10,
                  border: '1.5px solid #e4e4e4',
                  background: '#fafcfa',
                  fontSize: 16,
                  outline: 'none',
                  width: '100%'
                }}
              />
            </div>
           <input
              type="text"
              placeholder="Delivery Location"
              value={deliveryLocation}
              onChange={e => setDeliveryLocation(e.target.value)}
              required
              style={{
                marginBottom: 18,
                padding: '14px 16px',
                borderRadius: 10,
                border: '1.5px solid #e4e4e4',
                background: '#fafcfa',
                fontSize: 16,
                outline: 'none',
                width: '100%'
              }}
            />

          {error && <div style={{ color: 'red', marginBottom: 10, fontSize: 15 }}>{error}</div>}
          {success && <div style={{ color: 'green', marginBottom: 10, fontSize: 15 }}>{success}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#19c37d',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '14px 0',
              fontWeight: 700,
              fontSize: 18,
              marginTop: 8,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </main>
    </div>
  );
}

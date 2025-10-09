import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CustomerProfile() {
  // State for form fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  
  // State for UI feedback
  const [loading, setLoading] = useState(true); // Start as true to show loading while fetching
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // --- NEW: useEffect to fetch and pre-fill data on page load ---
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError("Not logged in. Please log in to view your profile.");
          setLoading(false);
          return;
        }

        // Use the customer-feed API to get existing data
        const res = await fetch('https://asia-south1-aroundu-473113.cloudfunctions.net/customer-feed', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // This handles cases where the profile is new and has no location yet (a 400 error from the backend)
        if (!res.ok && res.status !== 400) {
            throw new Error('Failed to fetch profile data.');
        }
        
        const data = await res.json();

        // Pre-fill the form with existing data, if available
        if (data.customerProfile) {
          setFullName(data.customerProfile.name || '');
          setPhoneNumber(data.customerProfile.phoneNumber || '');
          setHomeAddress(data.customerProfile.homeAddress || '');
          // We don't pre-fill deliveryLocation as it's an input for geocoding a new address string
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false); // Stop loading once data is fetched or an error occurs
      }
    };

    fetchProfileData();
  }, []); // Empty dependency array means this runs once when the component mounts

  // --- UPDATED: handleSubmit to post to the correct update endpoint ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      // POST to the dedicated customer-profile endpoint
      const res = await fetch('https://asia-south1-aroundu-473113.cloudfunctions.net/customer-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fullName, phoneNumber, homeAddress, deliveryLocation }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.msg || 'Profile update failed');
      } else {
        setSuccess('Profile saved successfully!');
        // You can redirect the user after a successful save
        setTimeout(() => navigate('/customer-map'), 1500);
      }
    } catch (err) {
      setError('An unexpected server error occurred.');
    }
    setLoading(false);
  };

  // Show a loading screen while initially fetching data
  if (loading && !success && !error) {
      return <div style={{textAlign: 'center', marginTop: '40vh', fontFamily: 'Poppins, sans-serif'}}><h2>Loading Your Profile...</h2></div>
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fafcfa',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
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
        justifyContent: 'center',
        padding: '20px'
      }}>
        <h2 style={{
          fontWeight: 700,
          fontSize: 32,
          marginBottom: 8,
          textAlign: 'center',
          fontFamily: 'Poppins, sans-serif'
        }}>
          Your Profile
        </h2>
        <div style={{
          color: '#666',
          fontSize: 16,
          marginBottom: 32,
          textAlign: 'center',
          fontFamily: 'Raleway, sans-serif'
        }}>
          Update your details and set a delivery location to find nearby shops.
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
            style={{ marginBottom: 18, padding: '14px 16px', borderRadius: 10, border: '1.5px solid #e4e4e4', background: '#fafcfa', fontSize: 16, outline: 'none' }}
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            required
            style={{ marginBottom: 18, padding: '14px 16px', borderRadius: 10, border: '1.5px solid #e4e4e4', background: '#fafcfa', fontSize: 16, outline: 'none' }}
          />
          <div style={{ position: 'relative', marginBottom: 18 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#bdbdbd', fontSize: 18 }}>🏠</span>
            <input
              type="text"
              placeholder="Home Address"
              value={homeAddress}
              onChange={e => setHomeAddress(e.target.value)}
              required
              style={{ padding: '14px 16px 14px 40px', borderRadius: 10, border: '1.5px solid #e4e4e4', background: '#fafcfa', fontSize: 16, outline: 'none', width: '100%' }}
            />
          </div>
          <input
            type="text"
            placeholder="Set Your Delivery Location (e.g., 'Lulu Mall, Kochi')"
            value={deliveryLocation}
            onChange={e => setDeliveryLocation(e.target.value)}
            required
            style={{ marginBottom: 18, padding: '14px 16px', borderRadius: 10, border: '1.5px solid #e4e4e4', background: '#fafcfa', fontSize: 16, outline: 'none', width: '100%' }}
          />
          {error && <div style={{ color: '#d32f2f', marginBottom: 10, fontSize: 15, textAlign: 'center' }}>{error}</div>}
          {success && <div style={{ color: '#388e3c', marginBottom: 10, fontSize: 15, textAlign: 'center' }}>{success}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#9e9e9e' : '#19c37d',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '14px 0',
              fontWeight: 700,
              fontSize: 18,
              marginTop: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </main>
    </div>
  );
}

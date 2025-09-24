import React from 'react';

const backgroundColor = '#144139ff'; // Use the dark green from your logo

export default function SplashScreen() {
  return (
    <div
      style={{
        background: backgroundColor,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}
    >
      <img
        src={'LOGO.png'}
        alt="AroundU Logo"
        style={{
          marginTop: '40px',
          width: '350px',
          maxWidth: '80vw',
        }}
      />
      <div style={{ marginTop: '60px', display: 'flex', gap: '20px' }}>
        <button
          style={{
            padding: '12px 32px',
            fontSize: '1.2rem',
            borderRadius: '8px',
            border: 'none',
            background: '#C8A46B',
            color: '#184C43',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Login
        </button>
        <button
          style={{
            padding: '12px 32px',
            fontSize: '1.2rem',
            borderRadius: '8px',
            border: 'none',
            background: '#184C43',
            color: '#C8A46B',
            fontWeight: 'bold',
            cursor: 'pointer',
            border: '2px solid #C8A46B',
          }}
        >
          Signup
        </button>
      </div>
    </div>
  );
}
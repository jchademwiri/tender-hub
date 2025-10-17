import React from 'react';

export const PasswordChangedEmail: React.FC = () => (
  <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <h1 style={{ color: '#333', textAlign: 'center' }}>Password Changed</h1>
    <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.5' }}>
      Your password was recently changed.
    </p>
    <div style={{
      backgroundColor: '#fff3cd',
      border: '1px solid #ffeaa7',
      padding: '15px',
      borderRadius: '4px',
      margin: '20px 0'
    }}>
      <p style={{ color: '#856404', margin: 0, fontWeight: 'bold' }}>
        Security Notice
      </p>
      <p style={{ color: '#856404', margin: '5px 0 0 0' }}>
        If this wasn't you, contact support immediately.
      </p>
    </div>
  </div>
);
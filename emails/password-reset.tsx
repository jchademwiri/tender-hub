import React from 'react';

interface PasswordResetEmailProps {
  url: string;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({ url }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <h1 style={{ color: '#333', textAlign: 'center' }}>Password Reset Request</h1>
    <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.5' }}>
      Click the link below to reset your password:
    </p>
    <div style={{ textAlign: 'center', margin: '30px 0' }}>
      <a
        href={url}
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          padding: '12px 24px',
          textDecoration: 'none',
          borderRadius: '4px',
          display: 'inline-block'
        }}
      >
        Reset Password
      </a>
    </div>
    <p style={{ color: '#999', fontSize: '14px' }}>
      This link expires in 1 hour.
    </p>
    <p style={{ color: '#999', fontSize: '14px' }}>
      If you didn't request this, please ignore this email.
    </p>
  </div>
);
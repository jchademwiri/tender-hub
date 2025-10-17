import React from 'react';

interface EmailVerificationEmailProps {
  url: string;
}

export const EmailVerificationEmail: React.FC<EmailVerificationEmailProps> = ({ url }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <h1 style={{ color: '#333', textAlign: 'center' }}>Welcome to Tender Hub!</h1>
    <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.5' }}>
      Click the link below to verify your email:
    </p>
    <div style={{ textAlign: 'center', margin: '30px 0' }}>
      <a
        href={url}
        style={{
          backgroundColor: '#28a745',
          color: 'white',
          padding: '12px 24px',
          textDecoration: 'none',
          borderRadius: '4px',
          display: 'inline-block'
        }}
      >
        Verify Email
      </a>
    </div>
    <p style={{ color: '#999', fontSize: '14px' }}>
      This link expires in 1 hour.
    </p>
  </div>
);
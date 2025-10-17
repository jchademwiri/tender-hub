import React from 'react';

interface AccountDeletionEmailProps {
  url: string;
}

export const AccountDeletionEmail: React.FC<AccountDeletionEmailProps> = ({ url }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <h1 style={{ color: '#dc3545', textAlign: 'center' }}>Account Deletion Request</h1>
    <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.5' }}>
      Click the link below to confirm account deletion:
    </p>
    <div style={{ textAlign: 'center', margin: '30px 0' }}>
      <a
        href={url}
        style={{
          backgroundColor: '#dc3545',
          color: 'white',
          padding: '12px 24px',
          textDecoration: 'none',
          borderRadius: '4px',
          display: 'inline-block'
        }}
      >
        Confirm Deletion
      </a>
    </div>
    <p style={{ color: '#dc3545', fontSize: '14px', fontWeight: 'bold' }}>
      This action cannot be undone.
    </p>
  </div>
);
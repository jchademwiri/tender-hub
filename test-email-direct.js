require('dotenv').config();
const { Resend } = require('resend');

async function testEmailDirect() {
  try {
    console.log('Testing Resend API directly...');
    console.log('RESEND_API_KEY from env:', process.env.RESEND_API_KEY ? 'Set (length: ' + process.env.RESEND_API_KEY.length + ')' : 'Not set');
    console.log('RESEND_FROM_EMAIL from env:', process.env.RESEND_FROM_EMAIL || 'Not set');

    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not defined in environment variables');
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    console.log('RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL);

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Tender Hub <noreply@tenderhub.com>',
      to: ['test@example.com'],
      subject: 'Direct Test Email - Tender Hub',
      html: '<h1>Direct Test</h1><p>This is a direct test of the Resend API.</p>',
    });

    console.log('Email sent successfully:', result);
  } catch (error) {
    console.error('Failed to send email directly:', error.message);
    console.error('Full error:', error);
  }
}

testEmailDirect();
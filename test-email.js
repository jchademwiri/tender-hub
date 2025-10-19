require('dotenv').config();
const { sendEmail } = require('./src/lib/email');

async function testEmail() {
  try {
    console.log('Testing email functionality...');
    console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Set' : 'Not set');
    console.log('RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || 'Not set');

    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test Email - Tender Hub',
      html: '<h1>Test Email</h1><p>This is a test email to verify email functionality.</p>',
    });

    console.log('Email sent successfully:', result);
  } catch (error) {
    console.error('Failed to send email:', error.message);
    console.error('Full error:', error);
  }
}

testEmail();
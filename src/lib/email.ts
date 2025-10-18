import { Resend } from 'resend';
import React from 'react';
import { render } from '@react-email/render';
import PasswordResetEmail from '@emails/password-reset';
import EmailVerificationEmail from '@emails/email-verification';
import AccountDeletionEmail from '@emails/account-deletion';
import PasswordChangedEmail from '@emails/password-changed';


const resend = new Resend(process.env.RESEND_API_KEY);

// Simple email component for HTML content
const SimpleEmailComponent = ({ html, text }: { html?: string; text?: string }) => {
  if (html) {
    return React.createElement('div', {
      dangerouslySetInnerHTML: { __html: html }
    });
  }
  if (text) {
    return React.createElement('div', {}, text);
  }
  return React.createElement('div', {}, 'No content');
};

export async function sendEmail({
  to,
  subject,
  html,
  text
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}) {
  try {
    const renderedHtml = await render(React.createElement(SimpleEmailComponent, { html, text }));

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Tender Hub <noreply@tenderhub.com>',
      to: [to],
      subject,
      html: renderedHtml,
    });

    return result;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Email service unavailable');
  }
}

export async function sendPasswordResetEmail(to: string, url: string) {
  try {
    const renderedHtml = await render(React.createElement(PasswordResetEmail, {
      userEmail: to,
      resetUrl: url,
      expirationTime: "1 hour"
    }));

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Tender Hub <noreply@tenderhub.com>',
      to: [to],
      subject: 'Reset Your Password - Tender Hub',
      html: renderedHtml,
    });

    return result;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Email service unavailable');
  }
}

export async function sendEmailVerification(to: string, url: string) {
  try {
    const renderedHtml = await render(React.createElement(EmailVerificationEmail, {
      userEmail: to,
      verificationUrl: url,
      expirationTime: "1 hour"
    }));

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Tender Hub <noreply@tenderhub.com>',
      to: [to],
      subject: 'Verify Your Email - Tender Hub',
      html: renderedHtml,
    });

    return result;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Email service unavailable');
  }
}

export async function sendAccountDeletionEmail(to: string, url: string) {
  try {
    const renderedHtml = await render(React.createElement(AccountDeletionEmail, {
      userEmail: to,
      confirmationUrl: url,
      expirationTime: "24 hours"
    }));

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Tender Hub <noreply@tenderhub.com>',
      to: [to],
      subject: 'Confirm Account Deletion - Tender Hub',
      html: renderedHtml,
    });

    return result;
  } catch (error) {
    console.error('Failed to send account deletion email:', error);
    throw new Error('Email service unavailable');
  }
}

export async function sendPasswordChangedEmail(to: string) {
  try {
    const renderedHtml = await render(React.createElement(PasswordChangedEmail, {
      userEmail: to
    }));

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Tender Hub <noreply@tenderhub.com>',
      to: [to],
      subject: 'Password Changed - Tender Hub',
      html: renderedHtml,
    });

    return result;
  } catch (error) {
    console.error('Failed to send password changed email:', error);
    throw new Error('Email service unavailable');
  }
}
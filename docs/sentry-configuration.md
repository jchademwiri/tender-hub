# Sentry Configuration Guide

This document explains how to configure Sentry error tracking and monitoring for the Tender Hub application.

## Overview

Sentry has been implemented with comprehensive error tracking, performance monitoring, alerting, and security event tracking. The implementation includes:

- **Error Tracking**: Automatic capture of API errors, database errors, authentication failures, and business logic errors
- **Performance Monitoring**: Response time tracking, slow query detection, and performance alerts
- **Session Replay**: User session recording for debugging (with privacy controls)
- **Security Monitoring**: Suspicious activity detection and security event tracking
- **Alerting System**: Email and webhook notifications for critical issues
- **Health Monitoring**: Sentry connectivity checks in the health API

## Environment Variables

### Required Configuration

```bash
# Sentry DSN (Data Source Name) - Get this from your Sentry project
SENTRY_DSN="https://your-dsn@sentry.io/project-id"
NEXT_PUBLIC_SENTRY_DSN="https://your-dsn@sentry.io/project-id"

# Environment identification
SENTRY_ENVIRONMENT="production"  # or "staging", "development"

# Release tracking
APP_VERSION="1.0.0-beta"
SERVER_NAME="tender-hub-production"
```

### Optional Configuration (Recommended for Production)

```bash
# Sentry organization and project (for source map uploads)
SENTRY_ORG="your-sentry-org"
SENTRY_PROJECT="your-sentry-project"
SENTRY_AUTH_TOKEN="your-sentry-auth-token"

# Performance monitoring settings
SENTRY_TRACES_SAMPLE_RATE="0.1"  # 10% of transactions in production
SENTRY_REPLAYS_SESSION_SAMPLE_RATE="0.01"  # 1% of sessions
SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE="1.0"  # 100% of error sessions
SENTRY_DEBUG="false"  # Disable debug logging in production
SENTRY_RELEASE_HEALTH="true"  # Enable release health tracking

# Alerting configuration
SENTRY_ALERT_EMAIL="admin@your-domain.com"
SENTRY_ALERT_WEBHOOK="https://your-webhook-url.com/alerts"
SENTRY_ERROR_THRESHOLD="10"  # Alert after 10 errors in 5 minutes
SENTRY_PERFORMANCE_THRESHOLD="500"  # Alert if avg response time > 500ms
```

## Sentry Project Setup

1. **Create Sentry Account**: Go to [sentry.io](https://sentry.io) and create an account
2. **Create Project**: Create a new Next.js project in Sentry
3. **Get DSN**: Copy the DSN from your project settings
4. **Configure Alerts**: Set up alert rules in the Sentry dashboard
5. **Create Auth Token**: Generate an auth token for source map uploads

## Features Implemented

### 1. Error Tracking

The system automatically tracks:
- API endpoint errors with context (user, endpoint, status code)
- Database connection and query errors
- Authentication and authorization failures
- Business logic errors with feature context
- Unhandled exceptions and promise rejections

### 2. Performance Monitoring

- API response time tracking
- Database query performance monitoring
- Slow operation detection and alerting
- Performance degradation alerts

### 3. Security Monitoring

- Suspicious login attempt tracking
- Rate limiting violation detection
- Unauthorized access attempt logging
- Security event alerting

### 4. Session Replay

- User session recording for debugging
- Privacy-first configuration (masks sensitive data)
- Automatic recording on errors
- Configurable sampling rates

### 5. Alerting System

- Email notifications for critical errors
- Webhook integration for external systems
- Configurable alert thresholds
- Cooldown periods to prevent spam

### 6. Health Monitoring

- Sentry connectivity health checks
- Integration with `/api/health` endpoint
- Monitoring system status reporting

## Privacy and Security

The Sentry implementation includes comprehensive privacy protections:

- **No PII Logging**: Email addresses, passwords, and sensitive data are filtered out
- **Data Sanitization**: Request/response data is sanitized before sending
- **Masked Session Replay**: All text inputs and sensitive elements are masked
- **IP Address Filtering**: IP addresses are not sent to Sentry
- **Secure Headers**: Authorization headers and cookies are removed

## Testing

Use the built-in test scripts to validate your Sentry configuration:

```bash
# Validate Sentry configuration
npm run sentry:validate

# Check Sentry status and connectivity
npm run sentry:status

# Run comprehensive Sentry integration tests
npm run sentry:test
```

## Production Deployment

1. **Set Environment Variables**: Configure all required Sentry environment variables
2. **Validate Configuration**: Run `npm run sentry:validate` to check configuration
3. **Test Connectivity**: Run `npm run sentry:status` to verify connection
4. **Deploy Application**: Deploy with Sentry configuration
5. **Verify Monitoring**: Check Sentry dashboard for incoming events
6. **Configure Alerts**: Set up alert rules in Sentry dashboard

## Monitoring Dashboard

After deployment, monitor your application through:

1. **Sentry Dashboard**: View errors, performance, and releases
2. **Health Check API**: `GET /api/health` includes Sentry status
3. **Alert Notifications**: Receive email/webhook alerts for issues
4. **Performance Metrics**: Track response times and error rates

## Troubleshooting

### Common Issues

1. **No Events in Sentry**
   - Check DSN configuration
   - Verify network connectivity
   - Check environment variable loading

2. **High Event Volume**
   - Adjust sample rates
   - Review error filtering rules
   - Check for error loops

3. **Missing Source Maps**
   - Verify SENTRY_AUTH_TOKEN
   - Check build process
   - Ensure org/project settings

4. **Alert Spam**
   - Adjust alert thresholds
   - Increase cooldown periods
   - Review alert rules

### Debug Commands

```bash
# Check environment loading
node -e "console.log(process.env.SENTRY_DSN)"

# Test Sentry connectivity
npm run sentry:status

# Run full integration test
npm run sentry:test
```

## Best Practices

1. **Sample Rates**: Use lower sample rates in production to control costs
2. **Alert Thresholds**: Set appropriate thresholds to avoid alert fatigue
3. **Error Filtering**: Filter out expected errors and noise
4. **Release Tracking**: Use proper versioning for release tracking
5. **Privacy**: Regularly audit data being sent to ensure privacy compliance

## Support

For issues with Sentry configuration:
1. Check the troubleshooting section above
2. Review Sentry documentation
3. Run the test scripts to identify issues
4. Check application logs for Sentry-related errors
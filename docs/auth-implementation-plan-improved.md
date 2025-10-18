
# Better Auth Integration - Improved Implementation Plan
## Critical Security Fixes & Enhanced Architecture

> **Status**: This document supersedes the original implementation plan with critical security fixes and architectural improvements based on Better Auth best practices.

---

## 🚨 CRITICAL SECURITY LOOPHOLES IDENTIFIED

### 1. Missing Email Verification (HIGH PRIORITY)
**Current Risk**: Unverified email accounts enable spam, account takeover, and unauthorized access.

**Required Implementation**:
```typescript
// In src/lib/auth.ts
emailVerification: {
  sendVerificationEmail: async ({ user, url, token }, request) => {
    await sendEmail({
      to: user.email,
      subject: "Verify your email address",
      html: `Click to verify: ${url}`
    });
  },
  sendOnSignUp: true,
  autoSignInAfterVerification: true,
  expiresIn: 3600 // 1 hour
}
```

**Action Items**:
- [ ] Set up email service (Resend, SendGrid, or AWS SES)
- [ ] Create email templates
- [ ] Add `EMAIL_SERVICE_API_KEY` to environment variables
- [ ] Test verification flow end-to-end

---

### 2. Missing Password Reset (HIGH PRIORITY)
**Current Risk**: Users cannot recover accounts - support burden and user frustration.

**Required Implementation**:
```typescript
emailAndPassword: {
  enabled: true,
  minPasswordLength: 12, // Increased from default 8
  maxPasswordLength: 128,
  requireEmailVerification: true,
  sendResetPassword: async ({ user, url, token }, request) => {
    await sendEmail({
      to: user.email,
      subject: "Reset your password",
      html: `Reset link (valid 1 hour): ${url}`
    });
  },
  resetPasswordTokenExpiresIn: 3600, // 1 hour
  onPasswordReset: async ({ user }, request) => {
    // Log password reset for security audit
    await auditLog.create({
      userId: user.id,
      action: "password_reset",
      timestamp: new Date()
    });
  }
}
```

---

### 3. Inadequate Rate Limiting (HIGH PRIORITY)
**Current Risk**: 100 requests/15min allows brute force attacks.

**Required Implementation**:
```typescript
rateLimit: {
  enabled: true,
  window: 60, // 1 minute
  max: 10,
  customRules: {
    "/sign-in/email": {
      window: 60,
      max: 3 // Only 3 login attempts per minute
    },
    "/sign-up/email": {
      window: 60,
      max: 5
    },
    "/forget-password": {
      window: 300, // 5 minutes
      max: 3
    }
  },
  storage: "database", // Critical for distributed systems
  modelName: "rateLimit"
}
```

**Database Migration Required**:
```bash
npx @better-auth/cli migrate
```

---

### 4. Missing Database Indexes (MEDIUM PRIORITY - PERFORMANCE)
**Current Risk**: Severe performance degradation as user base grows.

**Required Schema Updates**:
```typescript
// Add to src/db/schema.ts

export const user = pgTable("user", {
  // ... existing fields
}, (table) => ({
  emailIdx: index("user_email_idx").on(table.email) // CRITICAL
}));

export const account = pgTable("account", {
  // ... existing fields
}, (table) => ({
  userIdIdx: index("account_user_id_idx").on(table.userId) // CRITICAL
}));

export const session = pgTable("session", {
  // ... existing fields
}, (table) => ({
  userIdIdx: index("session_user_id_idx").on(table.userId), // CRITICAL
  tokenIdx: index("session_token_idx").on(table.token) // CRITICAL
}));

export const verification = pgTable("verification", {
  // ... existing fields
}, (table) => ({
  identifierIdx: index("verification_identifier_idx").on(table.identifier) // CRITICAL
}));

export const invitation = pgTable("invitation", {
  // ... existing fields
}, (table) => ({
  emailIdx: index("invitation_email_idx").on(table.email),
  inviterIdIdx: index("invitation_inviter_id_idx").on(table.inviterId)
}));
```

---

### 5. Missing OAuth Token Encryption (MEDIUM PRIORITY)
**Current Risk**: OAuth tokens stored in plaintext - database breach exposes user accounts.

**Required Implementation**:
```typescript
account: {
  encryptOAuthTokens: true, // Encrypt before storing
  accountLinking: {
    enabled: true,
    trustedProviders: ["google", "github"],
    allowDifferentEmails: false // Security: require same email
  }
}
```

---

### 6. Weak CSRF Protection (MEDIUM PRIORITY)
**Current Risk**: Single trusted origin insufficient for production.

**Required Implementation**:
```typescript
trustedOrigins: [
  process.env.BETTER_AUTH_URL || "http://localhost:3000",
  process.env.NEXT_PUBLIC_APP_URL,
  // Add all production domains
  "https://tenderhub.com",
  "https://www.tenderhub.com",
  "https://app.tenderhub.com"
],
advanced: {
  disableCSRFCheck: false, // Explicitly ensure CSRF protection
  useSecureCookies: process.env.NODE_ENV === "production"
}
```

---

### 7. Missing IP Address Configuration (MEDIUM PRIORITY)
**Current Risk**: Rate limiting ineffective behind proxies/CDN.

**Required Implementation**:
```typescript
advanced: {
  ipAddress: {
    ipAddressHeaders: [
      "x-forwarded-for",
      "cf-connecting-ip", // Cloudflare
      "x-real-ip" // Nginx
    ],
    disableIpTracking: false
  }
}
```

---

### 8. No Session Freshness Requirements (LOW PRIORITY)
**Current Risk**: Stale sessions can perform sensitive operations.

**Required Implementation**:
```typescript
session: {
  cookieCache: {
    enabled: true,
    maxAge: 5 * 60
  },
  expiresIn: 60 * 60 * 24 * 7, // 7 days
  updateAge: 60 * 60 * 24, // Update daily
  freshAge: 60 * 5, // 5 minutes - require fresh session for sensitive ops
  disableSessionRefresh: false
}
```

---

### 9. Missing Client-Side Auth Configuration (CRITICAL)
**Current Risk**: No client-side authentication interface - app cannot function.

**Required Files**:

**File 1**: `src/lib/auth-client.ts`
```typescript
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { ac, admin, manager, user, owner } from "@/lib/permissions";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  plugins: [
    adminClient({
      ac,
      roles: { owner, admin, user, manager }
    })
  ],
  fetchOptions: {
    onError: async (context) => {
      const { response } = context;
      if (response.status === 429) {
        const retryAfter = response.headers.get("X-Retry-After");
        console.error(`Rate limited. Retry after ${retryAfter}s`);
      }
    }
  }
});

export const { signIn, signOut, signUp, useSession } = authClient;
```

**File 2**: `src/app/api/auth/[...all]/route.ts`
```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

---

### 10. Incomplete Permission System (MEDIUM PRIORITY)
**Current Risk**: Only "project" permissions - insufficient for full application.

**Required Enhancement**:
```typescript
// In src/lib/permissions.ts
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc, ownerAc } from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements, // Include default admin permissions
  project: ["create", "read", "update", "delete", "share"],
  publisher: ["create", "read", "update", "delete", "publish"],
  province: ["create", "read", "update", "delete"],
  analytics: ["view", "export", "delete"],
  invitation: ["create", "cancel", "resend"],
  organization: ["create", "read", "update", "delete"]
} as const;

const ac = createAccessControl(statement);

const user = ac.newRole({
  project: ["read", "share"],
  publisher: ["read"],
  province: ["read"],
  analytics: ["view"]
});

const manager = ac.newRole({
  project: ["create", "read", "update", "share"],
  publisher: ["create", "read", "update"],
  province: ["read"],
  analytics: ["view", "export"],
  invitation: ["create"]
});

const admin = ac.newRole({
  ...adminAc.statements, // Include default admin permissions
  project: ["create", "read", "update", "delete", "share"],
  publisher: ["create", "read", "update", "delete", "publish"],
  province: ["create", "read", "update", "delete"],
  analytics: ["view", "export", "delete"],
  invitation: ["create", "cancel", "resend"]
});

const owner = ac.newRole({
  ...ownerAc.statements, // Include default owner permissions
  project: ["create", "read", "update", "delete", "share"],
  publisher: ["create", "read", "update", "delete", "publish"],
  province: ["create", "read", "update", "delete"],
  analytics: ["view", "export", "delete"],
  invitation: ["create", "cancel", "resend"],
  organization: ["create", "read", "update", "delete"]
});

export { ac, admin, manager, user, owner, statement };
```

---

## 📊 REVISED IMPLEMENTATION PLAN

### Phase 0: IMMEDIATE CRITICAL FIXES (Week 1)

#### 0.1 Security Fundamentals
- [ ] **Email Verification Setup** (Day 1-2)
  - Install email service SDK (Resend recommended)
  - Configure email templates
  - Implement `sendVerificationEmail` function
  - Test verification flow
  
- [ ] **Password Reset Implementation** (Day 2-3)
  - Implement `sendResetPassword` function
  - Add password reset UI components
  - Test reset flow
  
- [ ] **Rate Limiting Enhancement** (Day 3-4)
  - Update rate limit configuration
  - Run database migration for rate limit table
  - Test rate limiting on all auth endpoints
  
- [ ] **Database Indexes** (Day 4-5)
  - Add all recommended indexes to schema
  - Generate and run migration
  - Verify query performance improvements

#### 0.2 Essential Infrastructure
- [ ] **Client-Side Auth Setup** (Day 5-6)
  - Create `src/lib/auth-client.ts`
  - Create API route handler
  - Update all components to use auth client
  - Test authentication flows
  
- [ ] **Environment Configuration** (Day 6-7)
  - Update `.env.example` with all required variables
  - Document each environment variable
  - Set up development and production environments

---

### Phase 1: Core Authentication Enhancement (Week 2-3)

#### 1.1 Enhanced Security Configuration
```typescript
// Complete auth.ts configuration
export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url, token }, request) => {
      await sendPasswordResetEmail(user.email, url);
    },
    onPasswordReset: async ({ user }, request) => {
      await auditLog.create({
        userId: user.id,
        action: "password_reset",
        timestamp: new Date()
      });
    }
  },
  
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      await sendVerificationEmail(user.email, url);
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 3600
  },
  
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update daily
    freshAge: 60 * 5, // 5 minutes for sensitive operations
    disableSessionRefresh: false
  },
  
  account: {
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
      allowDifferentEmails: false
    }
  },
  
  user: {
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url, token }, request) => {
        await sendAccountDeletionEmail(user.email, url);
      },
      beforeDelete: async (user, request) => {
        // GDPR compliance - delete all user data
        await deleteUserAnalytics(user.id);
        await deleteUserConsent(user.id);
      }
    },
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ user, newEmail, url, token }, request) => {
        await sendEmailChangeVerification(user.email, newEmail, url);
      }
    }
  },
  
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
    customRules: {
      "/sign-in/email": { window: 60, max: 3 },
      "/sign-up/email": { window: 60, max: 5 },
      "/forget-password": { window: 300, max: 3 }
    },
    storage: "database",
    modelName: "rateLimit"
  },
  
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "cf-connecting-ip", "x-real-ip"],
      disableIpTracking: false
    },
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "tender-hub",
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true
    },
    disableCSRFCheck: false
  },
  
  plugins: [
    adminPlugin({
      ac,
      roles: { owner, admin, user, manager },
      defaultRole: "user",
      adminRoles: ["admin", "owner"]
    })
  ],
  
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await auditLog.create({
            action: "user_created",
            userId: user.id,
            timestamp: new Date()
          });
        }
      },
      delete: {
        before: async (user) => {
          // GDPR compliance
          await deleteUserAnalytics(user.id);
          await deleteUserConsent(user.id);
        }
      }
    },
    session: {
      create: {
        after: async (session) => {
          await auditLog.create({
            action: "session_created",
            userId: session.userId,
            metadata: {
              ipAddress: session.ipAddress,
              userAgent: session.userAgent
            },
            timestamp: new Date()
          });
        }
      }
    }
  },
  
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Log all authentication events
      if (ctx.path.startsWith("/sign-in") || ctx.path.startsWith("/sign-up")) {
        await logAuthEvent({
          userId: ctx.context.newSession?.user.id,
          action: ctx.path,
          ipAddress: ctx.request.headers.get("x-forwarded-for"),
          userAgent: ctx.request.headers.get("user-agent"),
          success: !ctx.context.returned?.error,
          timestamp: new Date()
        });
      }
    })
  },
  
  onAPIError: {
    throw: false,
    onError: (error, ctx) => {
      console.error("Auth error:", error, "Path:", ctx.path);
      // Send to error tracking service (Sentry, etc.)
    }
  },
  
  logger: {
    disabled: false,
    level: process.env.NODE_ENV === "production" ? "error" : "info"
  },
  
  telemetry: {
    enabled: true,
    debug: process.env.NODE_ENV === "development"
  },
  
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    process.env.NEXT_PUBLIC_APP_URL,
    "https://tenderhub.com",
    "https://www.tenderhub.com",
    "https://app.tenderhub.com"
  ]
});
```

---

#### 1.2 Enhanced Permission System
```typescript
// Complete src/lib/permissions.ts
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc, ownerAc } from "better-auth/plugins/admin/access";

export const statement = {
  ...defaultStatements,
  project: ["create", "read", "update", "delete", "share"],
  publisher: ["create", "read", "update", "delete", "publish"],
  province: ["create", "read", "update", "delete"],
  analytics: ["view", "export", "delete"],
  invitation: ["create", "cancel", "resend"],
  organization: ["create", "read", "update", "delete"],
  member: ["invite", "read", "update", "remove"]
} as const;

export const ac = createAccessControl(statement);

export const user = ac.newRole({
  project: ["read", "share"],
  publisher: ["read"],
  province: ["read"],
  analytics: ["view"]
});

export const manager = ac.newRole({
  project: ["create", "read", "update", "share"],
  publisher: ["create", "read", "update"],
  province: ["read"],
  analytics: ["view", "export"],
  invitation: ["create"]
});

export const admin = ac.newRole({
  ...adminAc.statements,
  project: ["create", "read", "update", "delete", "share"],
  publisher: ["create", "read", "update", "delete", "publish"],
  province: ["create", "read", "update", "delete"],
  analytics: ["view", "export", "delete"],
  invitation: ["create", "cancel", "resend"]
});

export const owner = ac.newRole({
  ...ownerAc.statements,
  project: ["create", "read", "update", "delete", "share"],
  publisher: ["create", "read", "update", "delete", "publish"],
  province: ["create", "read", "update", "delete"],
  analytics: ["view", "export", "delete"],
  invitation: ["create", "cancel", "resend"],
  organization: ["create", "read", "update", "delete"],
  member: ["invite", "read", "update", "remove"]
});
```

---

### Phase 2: Social Authentication (Week 3-4)

#### 2.1 Social Provider Configuration
**Providers to Implement**:
1. **Google OAuth** (Primary)
2. **GitHub OAuth** (Developer-friendly)
3. **Microsoft** (Enterprise users)
4. **Apple** (iOS compatibility - if mobile app planned)

**Implementation**:
```typescript
socialProviders: {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`,
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
    accessType: "offline" // Get refresh tokens
  },
  
  github: {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/github`,
    scope: ["user:email", "read:user"]
  },
  
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID!,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
    redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/microsoft`,
    tenantId: "common",
    prompt: "select_account"
  }
}
```

**Environment Variables Required**:
```bash
# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Microsoft OAuth
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
```

**Setup Steps**:
1. Create OAuth apps in each provider's console
2. Configure callback URLs: `{baseURL}/api/auth/callback/{provider}`
3. Add credentials to environment variables
4. Test each provider's authentication flow

---

### Phase 3: Multi-Factor Authentication (Week 4-5)

#### 3.1 Two-Factor Authentication Plugin
```typescript
import { twoFactor } from "better-auth/plugins";

plugins: [
  // ... existing plugins
  twoFactor({
    issuer: "Tender Hub",
    otpOptions: {
      sendOTP: async ({ user, otp }, request) => {
        await sendOTPEmail(user.email, otp);
      },
      period: 3, // 3 minutes validity
      storeOTP: "hashed" // Hash OTPs in database
    },
    backupCodeOptions: {
      amount: 10,
      length: 10,
      storeBackupCodes: "encrypted"
    }
  })
]
```

**Client Plugin**:
```typescript
import { twoFactorClient } from "better-auth/client/plugins";

plugins: [
  // ... existing plugins
  twoFactorClient({
    onTwoFactorRedirect() {
      window.location.href = "/auth/verify-2fa";
    }
  })
]
```

---

### Phase 4: Organization Management (Week 5-7)

#### 4.1 Organization Plugin Setup
```typescript
import { organization } from "better-auth/plugins";

plugins: [
  // ... existing plugins
  organization({
    allowUserToCreateOrganization: async (user) => {
      // Only verified users can create organizations
      return user.emailVerified === true;
    },
    organizationLimit: 5,
    creatorRole: "owner",
    membershipLimit: 100,
    
    sendInvitationEmail: async (data) => {
      const inviteLink = `${process.env.BETTER_AUTH_URL}/invite/${data.id}`;
      await sendOrganizationInvite({
        email: data.email,
        inviterName: data.inviter.user.name,
        organizationName: data.organization.name,
        inviteLink
      });
    },
    
    invitationExpiresIn: 60 * 60 * 24 * 7, // 7 days
    requireEmailVerificationOnInvitation: true,
    
    ac, // Use existing access control
    roles: { owner, admin, manager, user }
  })
]
```

**Required Schema Updates**:
```typescript
// Add to src/db/schema.ts

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  slugIdx: index("organization_slug_idx").on(table.slug)
}));

export const member = pgTable("member", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  userIdIdx: index("member_user_id_idx").on(table.userId),
  orgIdIdx: index("member_org_id_idx").on(table.organizationId)
}));

// Update invitation table to support organizations
export const invitation = pgTable("invitation", {
  // ... existing fields
  organizationId: text("organization_id").references(() => organization.id, { onDelete: "cascade" })
}, (table) => ({
  emailIdx: index("invitation_email_idx").on(table.email),
  inviterIdIdx: index("invitation_inviter_id_idx").on(table.inviterId),
  orgIdIdx: index("invitation_org_id_idx").on(table.organizationId)
}));

// Update session table for active organization
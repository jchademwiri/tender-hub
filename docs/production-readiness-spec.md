# Tender Hub Production Readiness Specification
## Beta Release Preparation - Stage-by-Stage Implementation

**Target:** Production-ready beta version with zero errors, warnings, or mock data  
**Timeline:** 4 stages over 2-3 weeks  
**Success Criteria:** Clean build, full functionality, production security, comprehensive testing

---

## 🎯 Overview

This specification outlines the systematic preparation of Tender Hub for production beta testing. Each stage must be completed successfully before proceeding to the next, ensuring a robust, secure, and fully functional application.

### **Quality Gates**
- ✅ Zero build errors or warnings
- ✅ All tests passing
- ✅ No mock or placeholder data
- ✅ Production-grade security
- ✅ Performance benchmarks met
- ✅ Full audit trail compliance

---

## 📋 Stage 1: Foundation & Environment Setup
**Duration:** 2-3 days  
**Priority:** Critical  
**Goal:** Establish production-ready foundation

### **1.1 Environment Configuration**
```bash
# Create production environment files
touch .env.production
touch .env.staging
```

**Tasks:**
- [ ] **Environment Variables Audit**
  - Remove all development-specific URLs
  - Configure production database connection
  - Set up production email service (Resend)
  - Configure OAuth providers (Google, GitHub)
  - Set secure session secrets

- [ ] **Production Environment File (.env.production)**
```env
# Database - Production
DATABASE_URL="postgresql://[PROD_USER]:[PROD_PASS]@[PROD_HOST]/[PROD_DB]?sslmode=require"

# Authentication - Production
BETTER_AUTH_SECRET="[SECURE_64_CHAR_SECRET]"
BETTER_AUTH_URL="https://your-production-domain.com"
NEXT_PUBLIC_BETTER_AUTH_URL="https://your-production-domain.com"

# Email Service - Production
RESEND_API_KEY="[PRODUCTION_RESEND_KEY]"
RESEND_FROM_EMAIL="noreply@your-domain.com"
RESEND_REPLY_TO_EMAIL="support@your-domain.com"
RESEND_NAME="Tender Hub"


# Security & Monitoring
SENTRY_DSN="[SENTRY_DSN_FOR_ERROR_TRACKING]"
ANALYTICS_ID="[GOOGLE_ANALYTICS_ID]"
```

- [ ] **Staging Environment File (.env.staging)**
```env
# Mirror production but with staging resources
DATABASE_URL="postgresql://[STAGING_USER]:[STAGING_PASS]@[STAGING_HOST]/[STAGING_DB]?sslmode=require"
BETTER_AUTH_URL="https://staging.your-domain.com"
# ... staging-specific configurations
```

**Validation Criteria:**
- [ ] All environment variables defined and validated
- [ ] No hardcoded development URLs in codebase
- [ ] Environment-specific configurations working
- [ ] Build succeeds with production environment

### **1.2 Database Production Setup**

**Tasks:**
- [ ] **Production Database Migration**
```bash
# Verify all migrations are applied
npm run db:migrate
npm run db:studio  # Verify schema
```

- [ ] **Create Initial Admin User Script**
```typescript
// src/scripts/create-production-admin.ts
import { db } from "@/db";
import { user } from "@/db/schema";
import { hash } from "better-auth/crypto";

async function createProductionAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set");
  }

  const hashedPassword = await hash(adminPassword);
  
  await db.insert(user).values({
    id: crypto.randomUUID(),
    name: "System Administrator",
    email: adminEmail,
    role: "admin",
    status: "active",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  console.log("Production admin user created successfully");
}

createProductionAdmin().catch(console.error);
```

- [ ] **Database Backup Configuration**
```typescript
// src/lib/database-backup-production.ts
export const PRODUCTION_BACKUP_CONFIG = {
  schedule: "0 2 * * *", // Daily at 2 AM
  retention: 30, // Keep 30 days
  encryption: true,
  compression: true,
  notificationEmail: "admin@your-domain.com"
};
```

**Validation Criteria:**
- [ ] Production database schema matches development
- [ ] All migrations applied successfully
- [ ] Admin user creation script tested
- [ ] Backup system configured and tested

### **1.3 Security Hardening**

**Tasks:**
- [ ] **Update Authentication Configuration**
```typescript
// src/lib/auth-production.ts
export const PRODUCTION_AUTH_CONFIG = {
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update daily
    freshAge: 60 * 5, // 5 minutes for sensitive ops
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 5, // Stricter for production
    customRules: {
      "/sign-in/email": { window: 60, max: 3 },
      "/sign-up/email": { window: 300, max: 3 }, // More restrictive
      "/forget-password": { window: 900, max: 2 }, // 15 minutes, 2 attempts
    },
  },
  security: {
    useSecureCookies: true,
    sameSite: "strict",
    httpOnly: true,
    disableCSRFCheck: false,
  }
};
```

- [ ] **Security Headers Configuration**
```typescript
// next.config.ts - Add security headers
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },
  // ... existing config
};
```

**Validation Criteria:**
- [ ] Security headers implemented and tested
- [ ] Rate limiting configured for production
- [ ] Session security hardened
- [ ] CSRF protection verified

---

## 📋 Stage 2: Code Quality & Error Resolution
**Duration:** 3-4 days  
**Priority:** Critical  
**Goal:** Eliminate all errors, warnings, and technical debt

### **2.1 Build System Optimization**

**Tasks:**
- [ ] **Resolve Build Warnings**
```bash
# Run build and capture all warnings
npm run build 2>&1 | tee build-output.log

# Address each warning systematically
# Common issues to fix:
# - PostCSS deprecation warnings
# - TypeScript strict mode violations
# - Unused imports and variables
# - Missing dependencies
```

- [ ] **TypeScript Strict Mode Compliance**
```json
// tsconfig.json - Ensure strict configuration
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  }
}
```

- [ ] **Biome Configuration Enhancement**
```json
// biome.json - Production-ready linting
{
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "error",
        "useExhaustiveDependencies": "error"
      },
      "security": {
        "noDangerouslySetInnerHtml": "error"
      },
      "performance": {
        "noAccumulatingSpread": "error"
      }
    }
  }
}
```

**Validation Criteria:**
- [ ] Zero build warnings or errors
- [ ] All TypeScript strict mode checks passing
- [ ] Biome linting passes with zero issues
- [ ] Build time under 30 seconds

### **2.2 API Completeness & Error Handling**

**Tasks:**
- [ ] **Complete Manager Approval API**
```typescript
// src/app/api/manager/approvals/route.ts - Complete implementation
export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireManagerAuth();
    
    // Get pending profile update requests
    const pendingRequests = await db
      .select({
        id: profileUpdateRequest.id,
        userId: profileUpdateRequest.userId,
        requestedChanges: profileUpdateRequest.requestedChanges,
        requestedAt: profileUpdateRequest.requestedAt,
        userName: user.name,
        userEmail: user.email,
      })
      .from(profileUpdateRequest)
      .leftJoin(user, eq(profileUpdateRequest.userId, user.id))
      .where(eq(profileUpdateRequest.status, "pending"))
      .orderBy(desc(profileUpdateRequest.requestedAt));

    return NextResponse.json({ requests: pendingRequests });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await requireManagerAuth();
    const { requestId, action, rejectionReason } = await request.json();
    
    // Validate input
    if (!requestId || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    // Process approval/rejection
    await db.transaction(async (tx) => {
      if (action === "approve") {
        // Apply the requested changes
        const request = await tx
          .select()
          .from(profileUpdateRequest)
          .where(eq(profileUpdateRequest.id, requestId))
          .limit(1);

        if (request.length === 0) {
          throw new Error("Request not found");
        }

        const changes = request[0].requestedChanges as any;
        await tx
          .update(user)
          .set({
            ...changes,
            updatedAt: new Date(),
          })
          .where(eq(user.id, request[0].userId));
      }

      // Update request status
      await tx
        .update(profileUpdateRequest)
        .set({
          status: action === "approve" ? "approved" : "rejected",
          reviewedBy: currentUser.id,
          reviewedAt: new Date(),
          rejectionReason: action === "reject" ? rejectionReason : null,
        })
        .where(eq(profileUpdateRequest.id, requestId));
    });

    // Audit log
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      userId: currentUser.id,
      action: `profile_update_${action}`,
      targetUserId: requestId,
      metadata: JSON.stringify({ action, rejectionReason }),
      ipAddress: request.headers.get("x-forwarded-for") || null,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

- [ ] **Standardize Error Handling**
```typescript
// src/lib/api-error-handler.ts
export function handleAPIError(error: unknown): NextResponse {
  console.error("API Error:", error);

  if (error instanceof APIError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }

  if (error instanceof Error) {
    // Don't expose internal errors in production
    const message = process.env.NODE_ENV === "production" 
      ? "Internal server error" 
      : error.message;
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "Unknown error occurred" },
    { status: 500 }
  );
}
```

**Validation Criteria:**
- [ ] All API endpoints fully implemented
- [ ] Consistent error handling across all routes
- [ ] No TODO comments in production code
- [ ] All API responses properly typed

### **2.3 Database Connection Stability**

**Tasks:**
- [ ] **Implement Connection Retry Logic**
```typescript
// src/lib/database-connection.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL!;

// Create connection with retry logic
export const createDatabaseConnection = () => {
  const sql = neon(connectionString, {
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });

  return drizzle(sql, {
    logger: process.env.NODE_ENV === "development",
  });
};

// Connection health check
export async function checkDatabaseHealth() {
  try {
    const db = createDatabaseConnection();
    await db.execute(sql`SELECT 1`);
    return { healthy: true };
  } catch (error) {
    console.error("Database health check failed:", error);
    return { healthy: false, error: error.message };
  }
}
```

- [ ] **Database Connection Monitoring**
```typescript
// src/app/api/health/database/route.ts
export async function GET() {
  const health = await checkDatabaseHealth();
  
  return NextResponse.json(health, {
    status: health.healthy ? 200 : 503
  });
}
```

**Validation Criteria:**
- [ ] Database connections stable under load
- [ ] Connection retry logic tested
- [ ] Health check endpoint functional
- [ ] No connection timeout errors

---

## 📋 Stage 3: Production Features & Data Management
**Duration:** 4-5 days  
**Priority:** High  
**Goal:** Implement production-grade features and eliminate mock data

### **3.1 Real Data Population**

**Tasks:**
- [ ] **South African Provinces Data**
```typescript
// src/scripts/populate-provinces.ts
const SOUTH_AFRICAN_PROVINCES = [
  { name: "Eastern Cape", code: "EC", description: "Eastern Cape Province" },
  { name: "Free State", code: "FS", description: "Free State Province" },
  { name: "Gauteng", code: "GP", description: "Gauteng Province" },
  { name: "KwaZulu-Natal", code: "KZN", description: "KwaZulu-Natal Province" },
  { name: "Limpopo", code: "LP", description: "Limpopo Province" },
  { name: "Mpumalanga", code: "MP", description: "Mpumalanga Province" },
  { name: "Northern Cape", code: "NC", description: "Northern Cape Province" },
  { name: "North West", code: "NW", description: "North West Province" },
  { name: "Western Cape", code: "WC", description: "Western Cape Province" },
];

export async function populateProvinces() {
  for (const province of SOUTH_AFRICAN_PROVINCES) {
    await db.insert(provinces).values({
      id: crypto.randomUUID(),
      name: province.name,
      code: province.code,
      description: province.description,
      createdAt: new Date(),
    }).onConflictDoNothing();
  }
  console.log("Provinces populated successfully");
}
```

- [ ] **Real Publisher Data**
```typescript
// src/scripts/populate-publishers.ts
const REAL_PUBLISHERS = [
  {
    name: "Government Tender Bulletin",
    website: "https://www.gov.za/documents/government-tender-bulletin",
    province: "Gauteng"
  },
  {
    name: "City of Cape Town Tenders",
    website: "https://www.capetown.gov.za/work%20and%20business/doing-business-with-the-city/tenders",
    province: "Western Cape"
  },
  {
    name: "eThekwini Municipality Tenders",
    website: "https://www.durban.gov.za/discover-durban/tenders",
    province: "KwaZulu-Natal"
  },
  // Add more real publishers...
];

export async function populatePublishers() {
  for (const publisher of REAL_PUBLISHERS) {
    const province = await db
      .select()
      .from(provinces)
      .where(eq(provinces.name, publisher.province))
      .limit(1);

    if (province.length > 0) {
      await db.insert(publishers).values({
        id: crypto.randomUUID(),
        name: publisher.name,
        website: publisher.website,
        province_id: province[0].id,
        createdAt: new Date(),
      }).onConflictDoNothing();
    }
  }
  console.log("Publishers populated successfully");
}
```

**Validation Criteria:**
- [ ] All provinces populated with real data
- [ ] Real publisher data loaded
- [ ] No mock or placeholder data in production
- [ ] Data validation scripts pass

### **3.2 Email System Production Setup**

**Tasks:**
- [ ] **Production Email Templates**
```typescript
// src/lib/email-templates-production.ts
export const PRODUCTION_EMAIL_TEMPLATES = {
  invitation: {
    subject: "Welcome to Tender Hub - Complete Your Registration",
    template: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to Tender Hub</h1>
        <p>You've been invited to join Tender Hub as a <strong>{{role}}</strong>.</p>
        <p>Tender Hub is South Africa's premier platform for discovering tender opportunities across all provinces.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{invitationUrl}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Complete Registration</a>
        </div>
        <p><strong>What you can do with Tender Hub:</strong></p>
        <ul>
          <li>Browse tender publishers from all 9 South African provinces</li>
          <li>Bookmark your favorite publishers</li>
          <li>Track your tender discovery activities</li>
          <li>Access comprehensive tender databases</li>
        </ul>
        <p>This invitation expires in 7 days.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          Tender Hub - Your Gateway to South African Tender Opportunities<br>
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
    `
  },
  passwordReset: {
    subject: "Reset Your Tender Hub Password",
    template: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Password Reset Request</h1>
        <p>We received a request to reset your Tender Hub password.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{resetUrl}}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </div>
        <p>This link expires in 1 hour for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
      </div>
    `
  }
};
```

- [ ] **Email Service Configuration**
```typescript
// src/lib/email-production.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendProductionEmail({
  to,
  subject,
  html,
  replyTo = process.env.RESEND_REPLY_TO_EMAIL,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  try {
    const result = await resend.emails.send({
      from: `${process.env.RESEND_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
      to,
      subject,
      html,
      replyTo,
    });

    // Log email sending for audit
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      userId: "system",
      action: "email_sent",
      metadata: JSON.stringify({
        to,
        subject,
        emailId: result.data?.id,
      }),
      createdAt: new Date(),
    });

    return result;
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
}
```

**Validation Criteria:**
- [ ] Production email templates tested
- [ ] Email delivery confirmed
- [ ] Email audit logging functional
- [ ] Unsubscribe mechanisms implemented

### **3.3 Performance Optimization**

**Tasks:**
- [ ] **Database Query Optimization**
```typescript
// src/lib/optimized-queries.ts
export const OPTIMIZED_QUERIES = {
  // Dashboard data with single query
  getDashboardData: async (userId: string) => {
    return await db
      .select({
        provinceCount: sql<number>`(SELECT COUNT(*) FROM provinces)`,
        publisherCount: sql<number>`(SELECT COUNT(*) FROM publishers)`,
        userBookmarkCount: sql<number>`(SELECT COUNT(*) FROM user_bookmarks WHERE user_id = ${userId})`,
        recentPublishers: sql<any>`(
          SELECT json_agg(
            json_build_object(
              'id', p.id,
              'name', p.name,
              'website', p.website,
              'provinceName', pr.name,
              'createdAt', p.created_at
            )
          )
          FROM (
            SELECT * FROM publishers 
            ORDER BY created_at DESC 
            LIMIT 5
          ) p
          LEFT JOIN provinces pr ON p.province_id = pr.id
        )`,
      })
      .from(sql`(SELECT 1) as dummy`);
  },

  // Paginated publishers with search
  getPublishersOptimized: async (params: {
    page: number;
    limit: number;
    search?: string;
    provinceId?: string;
  }) => {
    const { page, limit, search, provinceId } = params;
    const offset = (page - 1) * limit;

    const whereConditions = [];
    if (search) {
      whereConditions.push(ilike(publishers.name, `%${search}%`));
    }
    if (provinceId) {
      whereConditions.push(eq(publishers.province_id, provinceId));
    }

    const [data, countResult] = await Promise.all([
      db
        .select({
          id: publishers.id,
          name: publishers.name,
          website: publishers.website,
          provinceName: provinces.name,
          createdAt: publishers.createdAt,
        })
        .from(publishers)
        .leftJoin(provinces, eq(publishers.province_id, provinces.id))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(publishers.createdAt))
        .limit(limit)
        .offset(offset),
      
      db
        .select({ count: count() })
        .from(publishers)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    ]);

    return {
      data,
      total: countResult[0].count,
      pages: Math.ceil(countResult[0].count / limit),
    };
  },
};
```

- [ ] **Caching Implementation**
```typescript
// src/lib/cache-production.ts
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ProductionCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const cache = new ProductionCache();
```

**Validation Criteria:**
- [ ] Database queries optimized for performance
- [ ] Caching implemented for frequently accessed data
- [ ] Page load times under 2 seconds
- [ ] API response times under 500ms

---

## 📋 Stage 4: Testing, Monitoring & Deployment
**Duration:** 3-4 days  
**Priority:** Critical  
**Goal:** Comprehensive testing and production deployment readiness

### **4.1 Comprehensive Testing Suite**

**Tasks:**
- [ ] **End-to-End Testing**
```typescript
// tests/e2e/user-workflows.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Workflows', () => {
  test('complete user registration flow', async ({ page }) => {
    // Test invitation acceptance
    await page.goto('/invite/test-invitation-id');
    await page.fill('[data-testid="name-input"]', 'Test User');
    await page.fill('[data-testid="password-input"]', 'SecurePassword123');
    await page.click('[data-testid="accept-invitation"]');
    
    // Verify dashboard access
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-name"]')).toContainText('Test User');
  });

  test('publisher browsing and bookmarking', async ({ page }) => {
    // Login as test user
    await page.goto('/sign-in');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="sign-in-button"]');

    // Browse publishers
    await page.goto('/dashboard/publishers');
    await expect(page.locator('[data-testid="publisher-list"]')).toBeVisible();

    // Bookmark a publisher
    await page.click('[data-testid="bookmark-button"]:first-child');
    await expect(page.locator('[data-testid="bookmark-success"]')).toBeVisible();
  });

  test('admin user management', async ({ page }) => {
    // Login as admin
    await page.goto('/sign-in');
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'adminpassword');
    await page.click('[data-testid="sign-in-button"]');

    // Navigate to admin panel
    await page.goto('/admin/team');
    await expect(page.locator('[data-testid="team-table"]')).toBeVisible();

    // Send invitation
    await page.click('[data-testid="invite-user-button"]');
    await page.fill('[data-testid="invite-email"]', 'newuser@example.com');
    await page.selectOption('[data-testid="invite-role"]', 'user');
    await page.click('[data-testid="send-invitation"]');
    
    await expect(page.locator('[data-testid="invitation-success"]')).toBeVisible();
  });
});
```

- [ ] **API Testing**
```typescript
// tests/api/endpoints.test.ts
import { describe, it, expect, beforeAll } from 'vitest';

describe('API Endpoints', () => {
  let authToken: string;

  beforeAll(async () => {
    // Get auth token for testing
    const response = await fetch('/api/auth/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password'
      })
    });
    const data = await response.json();
    authToken = data.token;
  });

  it('should get user profile', async () => {
    const response = await fetch('/api/user/profile', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('test@example.com');
  });

  it('should create publisher (admin only)', async () => {
    const response = await fetch('/api/admin/publishers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: 'Test Publisher',
        website: 'https://test.com',
        province_id: 'test-province-id'
      })
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.publisher.name).toBe('Test Publisher');
  });
});
```

- [ ] **Performance Testing**
```typescript
// tests/performance/load-test.ts
import { check } from 'k6';
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
  },
};

export default function () {
  // Test homepage
  let response = http.get('https://your-domain.com/');
  check(response, {
    'homepage loads': (r) => r.status === 200,
    'homepage fast': (r) => r.timings.duration < 1000,
  });

  // Test API endpoints
  response = http.get('https://your-domain.com/api/publishers');
  check(response, {
    'API responds': (r) => r.status === 200,
    'API fast': (r) => r.timings.duration < 500,
  });
}
```

**Validation Criteria:**
- [ ] All E2E tests passing
- [ ] API tests covering all endpoints
- [ ] Performance tests meeting benchmarks
- [ ] Security tests passing

### **4.2 Monitoring & Observability**

**Tasks:**
- [ ] **Application Monitoring**
```typescript
// src/lib/monitoring-production.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // Filter out sensitive information
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }
    return event;
  },
});

export function trackEvent(eventName: string, properties?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message: eventName,
    data: properties,
    level: 'info',
  });
}

export function trackError(error: Error, context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    if (context) {
      Object.keys(context).forEach(key => {
        scope.setTag(key, context[key]);
      });
    }
    Sentry.captureException(error);
  });
}
```

- [ ] **Health Check Endpoints**
```typescript
// src/app/api/health/route.ts
export async function GET() {
  const checks = await Promise.allSettled([
    checkDatabaseHealth(),
    checkEmailService(),
    checkExternalServices(),
  ]);

  const results = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: checks[0].status === 'fulfilled' ? checks[0].value : { healthy: false },
      email: checks[1].status === 'fulfilled' ? checks[1].value : { healthy: false },
      external: checks[2].status === 'fulfilled' ? checks[2].value : { healthy: false },
    },
  };

  const isHealthy = Object.values(results.checks).every(check => check.healthy);
  results.status = isHealthy ? 'healthy' : 'unhealthy';

  return NextResponse.json(results, {
    status: isHealthy ? 200 : 503
  });
}
```

**Validation Criteria:**
- [ ] Error tracking configured and tested
- [ ] Health checks functional
- [ ] Performance monitoring active
- [ ] Alert systems configured

### **4.3 Production Deployment**

**Tasks:**
- [ ] **Docker Configuration**
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN corepack enable pnpm && pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

- [ ] **CI/CD Pipeline**
```yaml
# .github/workflows/production-deploy.yml
name: Production Deployment

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - run: corepack enable pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm run lint
      - run: pnpm run build
      - run: pnpm run test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Production
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          BETTER_AUTH_SECRET: ${{ secrets.BETTER_AUTH_SECRET }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
        run: |
          # Deploy to your hosting platform
          # This could be Vercel, Railway, or custom server
          echo "Deploying to production..."
```

**Validation Criteria:**
- [ ] Docker build successful
- [ ] CI/CD pipeline functional
- [ ] Production deployment tested
- [ ] Rollback procedures documented

---

## 🎯 Final Validation Checklist

### **Pre-Production Verification**
- [ ] **Build & Deployment**
  - [ ] Clean build with zero errors/warnings
  - [ ] All tests passing (unit, integration, E2E)
  - [ ] Performance benchmarks met
  - [ ] Security scans passed

- [ ] **Functionality**
  - [ ] All user workflows tested end-to-end
  - [ ] Admin functions fully operational
  - [ ] Email system working in production
  - [ ] Database operations stable

- [ ] **Security**
  - [ ] All environment variables secured
  - [ ] Authentication/authorization tested
  - [ ] Rate limiting functional
  - [ ] Audit logging complete

- [ ] **Data**
  - [ ] Real data populated (no mock data)
  - [ ] Database migrations applied
  - [ ] Backup system operational
  - [ ] Data validation passed

- [ ] **Monitoring**
  - [ ] Error tracking active
  - [ ] Performance monitoring configured
  - [ ] Health checks functional
  - [ ] Alert systems tested

### **Go-Live Criteria**
- [ ] All validation items completed
- [ ] Production admin user created
- [ ] DNS and SSL certificates configured
- [ ] Monitoring dashboards active
- [ ] Support documentation ready
- [ ] Rollback plan documented

---

## 📞 Support & Maintenance

### **Post-Launch Monitoring**
- Monitor error rates and performance metrics
- Review audit logs for security issues
- Track user adoption and feature usage
- Maintain regular database backups

### **Maintenance Schedule**
- **Daily:** Monitor health checks and error rates
- **Weekly:** Review audit logs and performance metrics
- **Monthly:** Security updates and dependency updates
- **Quarterly:** Comprehensive security audit

---

*This specification ensures a production-ready Tender Hub application with enterprise-grade security, performance, and reliability for successful beta testing.*
// src/db/schema.ts
import {
  bigint,
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// User status enum
export const userStatusEnum = pgEnum("user_status", [
  "active",
  "suspended",
  "pending",
]);

export const role = pgEnum("role", ["owner", "admin", "manager", "user"]);

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    role: role("role").default("user").notNull(),
    banned: boolean("banned").default(false),
    banReason: text("ban_reason"),
    banExpires: timestamp("ban_expires"),
    status: userStatusEnum("status").default("active"),
    invitedBy: text("invited_by").references((): any => user.id),
    invitedAt: timestamp("invited_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => ({
    emailIdx: index("user_email_idx").on(table.email), // ✅ CRITICAL
    roleIdx: index("user_role_idx").on(table.role),
    statusIdx: index("user_status_idx").on(table.status),
  }),
);

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

/**
 * Provinces Table
 * Stores a list of provinces (e.g. Gauteng, Mpumalanga).
 */
export const provinces = pgTable("provinces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  code: varchar("code", { length: 10 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Publishers Table
 * Each publisher belongs to one province.
 */
export const publishers = pgTable(
  "publishers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    website: text("website"),
    province_id: uuid("province_id")
      .notNull()
      .references(() => provinces.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    provinceIdx: index("publishers_province_idx").on(table.province_id),
  }),
);

/**
 * User Bookmarks Table
 * Stores user bookmarks/favorites for publishers
 */
export const userBookmarks = pgTable(
  "user_bookmarks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    publisherId: uuid("publisher_id")
      .notNull()
      .references(() => publishers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("user_bookmarks_user_idx").on(table.userId),
    publisherIdx: index("user_bookmarks_publisher_idx").on(table.publisherId),
    uniqueBookmark: index("user_bookmarks_unique_idx").on(
      table.userId,
      table.publisherId,
    ),
  }),
);

// Invitation status enum for better type safety
export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "sent",
  "opened",
  "accepted",
  "expired",
  "cancelled",
  "declined",
]);

export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    role: text("role"),
    status: invitationStatusEnum("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Enhanced tracking fields
    sentAt: timestamp("sent_at"),
    openedAt: timestamp("opened_at"),
    acceptedAt: timestamp("accepted_at"),
    expiredAt: timestamp("expired_at"),
    cancelledAt: timestamp("cancelled_at"),
    declinedAt: timestamp("declined_at"),
    // Email tracking
    emailSubject: text("email_subject"),
    emailTemplate: text("email_template"),
    // Response tracking
    responseTime: integer("response_time"), // in hours
    reminderSent: boolean("reminder_sent").default(false),
    reminderSentAt: timestamp("reminder_sent_at"),
    // Metadata
    metadata: jsonb("metadata"), // Additional context data
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => ({
    emailIdx: index("invitation_email_idx").on(table.email),
    statusIdx: index("invitation_status_idx").on(table.status),
    inviterIdx: index("invitation_inviter_idx").on(table.inviterId),
    createdAtIdx: index("invitation_created_at_idx").on(table.createdAt),
    expiresAtIdx: index("invitation_expires_at_idx").on(table.expiresAt),
  }),
);

/**
 * Analytics Tables
 */

// Enhanced session tracking for analytics
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: text("session_id").notNull().unique(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    referrer: text("referrer"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    utmTerm: text("utm_term"),
    utmContent: text("utm_content"),
    deviceType: text("device_type"),
    browser: text("browser"),
    browserVersion: text("browser_version"),
    os: text("os"),
    osVersion: text("os_version"),
    screenResolution: text("screen_resolution"),
    timezone: text("timezone"),
    language: text("language"),
    country: text("country"),
    region: text("region"),
    city: text("city"),
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    endedAt: timestamp("ended_at"),
    duration: integer("duration"), // in seconds
    pageViews: integer("page_views").default(0),
    interactions: integer("interactions").default(0),
    isBounce: boolean("is_bounce").default(false),
    exitPage: text("exit_page"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    userIdx: index("sessions_user_idx").on(table.userId),
    sessionIdIdx: index("sessions_session_id_idx").on(table.sessionId),
    startedAtIdx: index("sessions_started_at_idx").on(table.startedAt),
  }),
);

// Individual page visit records
export const pageViews = pgTable(
  "page_views",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: text("session_id").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    url: text("url").notNull(),
    path: text("path").notNull(),
    title: text("title"),
    referrer: text("referrer"),
    queryParams: jsonb("query_params"),
    timeOnPage: integer("time_on_page"), // in seconds
    scrollDepth: integer("scroll_depth"), // percentage
    viewportWidth: integer("viewport_width"),
    viewportHeight: integer("viewport_height"),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    sessionIdx: index("page_views_session_idx").on(table.sessionId),
    userIdx: index("page_views_user_idx").on(table.userId),
    urlIdx: index("page_views_url_idx").on(table.url),
    timestampIdx: index("page_views_timestamp_idx").on(table.timestamp),
  }),
);

// Click tracking and user actions
export const userInteractions = pgTable(
  "user_interactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: text("session_id").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    interactionType: text("interaction_type").notNull(), // click, scroll, form_submit, etc.
    element: text("element"), // button, link, form, etc.
    elementId: text("element_id"),
    elementClass: text("element_class"),
    elementText: text("element_text"),
    pageUrl: text("page_url").notNull(),
    pagePath: text("page_path").notNull(),
    xCoordinate: integer("x_coordinate"),
    yCoordinate: integer("y_coordinate"),
    viewportX: integer("viewport_x"),
    viewportY: integer("viewport_y"),
    metadata: jsonb("metadata"), // additional context data
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    sessionIdx: index("interactions_session_idx").on(table.sessionId),
    userIdx: index("interactions_user_idx").on(table.userId),
    typeIdx: index("interactions_type_idx").on(table.interactionType),
    timestampIdx: index("interactions_timestamp_idx").on(table.timestamp),
  }),
);

// Generic event tracking system
export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: text("session_id"),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    eventType: text("event_type").notNull(),
    eventName: text("event_name").notNull(),
    properties: jsonb("properties"),
    value: decimal("value", { precision: 15, scale: 2 }),
    currency: text("currency"),
    pageUrl: text("page_url"),
    pagePath: text("page_path"),
    referrer: text("referrer"),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    deviceType: text("device_type"),
    browser: text("browser"),
    os: text("os"),
    country: text("country"),
    region: text("region"),
    city: text("city"),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("events_user_idx").on(table.userId),
    sessionIdx: index("events_session_idx").on(table.sessionId),
    eventTypeIdx: index("events_event_type_idx").on(table.eventType),
    eventNameIdx: index("events_event_name_idx").on(table.eventName),
    timestampIdx: index("events_timestamp_idx").on(table.timestamp),
  }),
);

// Pre-calculated daily metrics
export const dailyAnalytics = pgTable(
  "daily_analytics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    date: timestamp("date").notNull(), // date only (no time)
    metricType: text("metric_type").notNull(), // page_views, users, sessions, etc.
    metricName: text("metric_name").notNull(),
    value: decimal("value", { precision: 20, scale: 2 }).notNull(),
    metadata: jsonb("metadata"), // dimensions, filters, etc.
    calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    dateIdx: index("daily_analytics_date_idx").on(table.date),
    metricTypeIdx: index("daily_analytics_metric_type_idx").on(
      table.metricType,
    ),
    metricNameIdx: index("daily_analytics_metric_name_idx").on(
      table.metricName,
    ),
    compositeIdx: index("daily_analytics_composite_idx").on(
      table.date,
      table.metricType,
      table.metricName,
    ),
  }),
);

// High-performance caching for analytics queries
export const analyticsCache = pgTable(
  "analytics_cache",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cacheKey: text("cache_key").notNull().unique(),
    queryHash: text("query_hash").notNull(),
    data: jsonb("data").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    hitCount: integer("hit_count").default(0),
    lastAccessed: timestamp("last_accessed").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    cacheKeyIdx: index("analytics_cache_key_idx").on(table.cacheKey),
    expiresAtIdx: index("analytics_cache_expires_idx").on(table.expiresAt),
    queryHashIdx: index("analytics_cache_query_hash_idx").on(table.queryHash),
  }),
);

// GDPR compliance tracking
export const userConsent = pgTable(
  "user_consent",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    sessionId: text("session_id"),
    consentType: text("consent_type").notNull(), // analytics, marketing, necessary
    granted: boolean("granted").notNull(),
    version: text("version").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata"),
    grantedAt: timestamp("granted_at").defaultNow().notNull(),
    revokedAt: timestamp("revoked_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("user_consent_user_idx").on(table.userId),
    sessionIdx: index("user_consent_session_idx").on(table.sessionId),
    consentTypeIdx: index("user_consent_type_idx").on(table.consentType),
    grantedAtIdx: index("user_consent_granted_at_idx").on(table.grantedAt),
  }),
);

// Data cleanup configuration
export const retentionPolicies = pgTable(
  "retention_policies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tableName: text("table_name").notNull(),
    policyName: text("policy_name").notNull(),
    retentionDays: integer("retention_days").notNull(),
    condition: text("condition"), // SQL condition for selective deletion
    enabled: boolean("enabled").default(true).notNull(),
    lastRun: timestamp("last_run"),
    nextRun: timestamp("next_run"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    tableNameIdx: index("retention_policies_table_idx").on(table.tableName),
    enabledIdx: index("retention_policies_enabled_idx").on(table.enabled),
    nextRunIdx: index("retention_policies_next_run_idx").on(table.nextRun),
  }),
);

// Audit trail for analytics access
export const analyticsAccessLog = pgTable(
  "analytics_access_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    sessionId: text("session_id"),
    action: text("action").notNull(), // view, export, delete, etc.
    resource: text("resource").notNull(), // dashboard, report, data_export
    resourceId: text("resource_id"),
    parameters: jsonb("parameters"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    success: boolean("success").notNull(),
    errorMessage: text("error_message"),
    processingTime: integer("processing_time"), // in milliseconds
    resultCount: integer("result_count"),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("access_log_user_idx").on(table.userId),
    actionIdx: index("access_log_action_idx").on(table.action),
    resourceIdx: index("access_log_resource_idx").on(table.resource),
    timestampIdx: index("access_log_timestamp_idx").on(table.timestamp),
    successIdx: index("access_log_success_idx").on(table.success),
  }),
);

/**
 * TypeScript types
 */

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Role = (typeof role.enumValues)[number];
export type InvitationStatus = (typeof invitationStatusEnum.enumValues)[number];
export type Invitation = typeof invitation.$inferSelect;
export type NewInvitation = typeof invitation.$inferInsert;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;
export type Province = typeof provinces.$inferSelect;
export type Publisher = typeof publishers.$inferSelect;
export type NewPublisher = typeof publishers.$inferInsert;
export type UserBookmark = typeof userBookmarks.$inferSelect;
export type NewUserBookmark = typeof userBookmarks.$inferInsert;

// Analytics Types
export type AnalyticsSession = typeof sessions.$inferSelect;
export type NewAnalyticsSession = typeof sessions.$inferInsert;
export type PageView = typeof pageViews.$inferSelect;
export type NewPageView = typeof pageViews.$inferInsert;
export type UserInteraction = typeof userInteractions.$inferSelect;
export type NewUserInteraction = typeof userInteractions.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type DailyAnalytic = typeof dailyAnalytics.$inferSelect;
export type NewDailyAnalytic = typeof dailyAnalytics.$inferInsert;
export type AnalyticsCache = typeof analyticsCache.$inferSelect;
export type NewAnalyticsCache = typeof analyticsCache.$inferInsert;
export type UserConsent = typeof userConsent.$inferSelect;
export type NewUserConsent = typeof userConsent.$inferInsert;
export type RetentionPolicy = typeof retentionPolicies.$inferSelect;
export type NewRetentionPolicy = typeof retentionPolicies.$inferInsert;
export type AnalyticsAccessLog = typeof analyticsAccessLog.$inferSelect;
export type NewAnalyticsAccessLog = typeof analyticsAccessLog.$inferInsert;

// ✅ Rate limit table (created by Better Auth migration)
export const rateLimit = pgTable(
  "rate_limit",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull(),
    count: integer("count").notNull(),
    lastRequest: bigint("last_request", { mode: "number" }).notNull(),
  },
  (table) => ({
    keyIdx: index("rate_limit_key_idx").on(table.key),
  }),
);

// ✅ Audit log table
export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id"),
    action: text("action").notNull(),
    targetUserId: text("target_user_id"),
    ipAddress: text("ip_address"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("audit_log_user_idx").on(table.userId),
    actionIdx: index("audit_log_action_idx").on(table.action),
    createdAtIdx: index("audit_log_created_at_idx").on(table.createdAt),
  }),
);

// ✅ Profile update request table (for approval workflow)
export const profileUpdateRequest = pgTable(
  "profile_update_request",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    requestedChanges: jsonb("requested_changes").notNull(),
    status: text("status").notNull().default("pending"),
    requestedAt: timestamp("requested_at").defaultNow().notNull(),
    reviewedBy: text("reviewed_by").references(() => user.id),
    reviewedAt: timestamp("reviewed_at"),
    rejectionReason: text("rejection_reason"),
  },
  (table) => ({
    userIdIdx: index("profile_update_user_idx").on(table.userId),
    statusIdx: index("profile_update_status_idx").on(table.status),
  }),
);

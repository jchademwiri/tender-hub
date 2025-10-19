import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { events, invitation } from "@/db/schema";
import { AuditLogger } from "@/lib/audit-logger";

export interface InvitationEventData {
  invitationId: string;
  email: string;
  role?: string;
  inviterId?: string;
  metadata?: Record<string, any>;
}

export interface InvitationTrackingService {
  trackSent(data: InvitationEventData): Promise<void>;
  trackOpened(
    data: InvitationEventData & { ipAddress?: string; userAgent?: string },
  ): Promise<void>;
  trackAccepted(
    data: InvitationEventData & { userId: string; acceptedAt?: Date },
  ): Promise<void>;
  trackExpired(data: InvitationEventData): Promise<void>;
  trackCancelled(
    data: InvitationEventData & { cancelledBy: string },
  ): Promise<void>;
  trackDeclined(data: InvitationEventData): Promise<void>;
  trackResent(data: InvitationEventData & { resentBy: string }): Promise<void>;
  updateInvitationStatus(
    invitationId: string,
    status: string,
    additionalData?: Record<string, any>,
  ): Promise<void>;
}

/**
 * Track invitation events for analytics and monitoring
 */
export const invitationTracking: InvitationTrackingService = {
  async trackSent(data: InvitationEventData): Promise<void> {
    try {
      // Track the event
      await db.insert(events).values({
        sessionId: data.metadata?.sessionId,
        userId: data.inviterId,
        eventType: "invitation",
        eventName: "sent",
        properties: {
          invitationId: data.invitationId,
          email: data.email,
          role: data.role,
          ...data.metadata,
        },
        pageUrl: data.metadata?.pageUrl,
        pagePath: data.metadata?.pagePath,
        userAgent: data.metadata?.userAgent,
        ipAddress: data.metadata?.ipAddress,
        deviceType: data.metadata?.deviceType,
        browser: data.metadata?.browser,
        os: data.metadata?.os,
        country: data.metadata?.country,
        region: data.metadata?.region,
        city: data.metadata?.city,
        timestamp: new Date(),
      });

      // Update invitation record
      await this.updateInvitationStatus(data.invitationId, "sent", {
        sentAt: new Date(),
        emailSubject: data.metadata?.emailSubject,
        emailTemplate: data.metadata?.emailTemplate,
      });

      // Log audit event
      await AuditLogger.logInvitationCreated(
        data.email,
        data.role || "user",
        data.inviterId || "system",
        {
          userId: data.inviterId,
          resourceId: data.invitationId,
          metadata: {
            action: "invitation_sent",
            invitationId: data.invitationId,
            ...data.metadata,
          },
        },
      );
    } catch (error) {
      console.error("Failed to track invitation sent event:", error);
      throw error;
    }
  },

  async trackOpened(
    data: InvitationEventData & { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    try {
      // Track the event
      await db.insert(events).values({
        sessionId: data.metadata?.sessionId,
        eventType: "invitation",
        eventName: "opened",
        properties: {
          invitationId: data.invitationId,
          email: data.email,
          role: data.role,
          ...data.metadata,
        },
        pageUrl: data.metadata?.pageUrl,
        pagePath: data.metadata?.pagePath,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        deviceType: data.metadata?.deviceType,
        browser: data.metadata?.browser,
        os: data.metadata?.os,
        country: data.metadata?.country,
        region: data.metadata?.region,
        city: data.metadata?.city,
        timestamp: new Date(),
      });

      // Update invitation record
      await this.updateInvitationStatus(data.invitationId, "opened", {
        openedAt: new Date(),
      });
    } catch (error) {
      console.error("Failed to track invitation opened event:", error);
      throw error;
    }
  },

  async trackAccepted(
    data: InvitationEventData & { userId: string; acceptedAt?: Date },
  ): Promise<void> {
    try {
      const acceptedAt = data.acceptedAt || new Date();

      // Calculate response time if invitation was created
      let responseTime: number | undefined;
      if (data.metadata?.createdAt) {
        const createdAt = new Date(data.metadata.createdAt);
        responseTime = Math.floor(
          (acceptedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60),
        ); // hours
      }

      // Track the event
      await db.insert(events).values({
        sessionId: data.metadata?.sessionId,
        userId: data.userId,
        eventType: "invitation",
        eventName: "accepted",
        properties: {
          invitationId: data.invitationId,
          email: data.email,
          role: data.role,
          newUserId: data.userId,
          responseTime,
          ...data.metadata,
        },
        pageUrl: data.metadata?.pageUrl,
        pagePath: data.metadata?.pagePath,
        userAgent: data.metadata?.userAgent,
        ipAddress: data.metadata?.ipAddress,
        deviceType: data.metadata?.deviceType,
        browser: data.metadata?.browser,
        os: data.metadata?.os,
        country: data.metadata?.country,
        region: data.metadata?.region,
        city: data.metadata?.city,
        timestamp: acceptedAt,
      });

      // Update invitation record
      await this.updateInvitationStatus(data.invitationId, "accepted", {
        acceptedAt,
        responseTime,
      });

      // Log audit event
      await AuditLogger.logInvitationAccepted(data.userId, data.invitationId, {
        userId: data.userId,
        resourceId: data.invitationId,
        metadata: {
          action: "invitation_accepted",
          invitationId: data.invitationId,
          responseTime,
          ...data.metadata,
        },
      });
    } catch (error) {
      console.error("Failed to track invitation accepted event:", error);
      throw error;
    }
  },

  async trackExpired(data: InvitationEventData): Promise<void> {
    try {
      // Track the event
      await db.insert(events).values({
        sessionId: data.metadata?.sessionId,
        userId: data.inviterId,
        eventType: "invitation",
        eventName: "expired",
        properties: {
          invitationId: data.invitationId,
          email: data.email,
          role: data.role,
          ...data.metadata,
        },
        pageUrl: data.metadata?.pageUrl,
        pagePath: data.metadata?.pagePath,
        userAgent: data.metadata?.userAgent,
        ipAddress: data.metadata?.ipAddress,
        timestamp: new Date(),
      });

      // Update invitation record
      await this.updateInvitationStatus(data.invitationId, "expired", {
        expiredAt: new Date(),
      });
    } catch (error) {
      console.error("Failed to track invitation expired event:", error);
      throw error;
    }
  },

  async trackCancelled(
    data: InvitationEventData & { cancelledBy: string },
  ): Promise<void> {
    try {
      // Track the event
      await db.insert(events).values({
        sessionId: data.metadata?.sessionId,
        userId: data.cancelledBy,
        eventType: "invitation",
        eventName: "cancelled",
        properties: {
          invitationId: data.invitationId,
          email: data.email,
          role: data.role,
          cancelledBy: data.cancelledBy,
          ...data.metadata,
        },
        pageUrl: data.metadata?.pageUrl,
        pagePath: data.metadata?.pagePath,
        userAgent: data.metadata?.userAgent,
        ipAddress: data.metadata?.ipAddress,
        timestamp: new Date(),
      });

      // Update invitation record
      await this.updateInvitationStatus(data.invitationId, "cancelled", {
        cancelledAt: new Date(),
      });

      // Log audit event
      await AuditLogger.logInvitationCancelled(
        data.email,
        data.invitationId,
        data.cancelledBy,
        {
          userId: data.cancelledBy,
          resourceId: data.invitationId,
          metadata: {
            action: "invitation_cancelled",
            invitationId: data.invitationId,
            ...data.metadata,
          },
        },
      );
    } catch (error) {
      console.error("Failed to track invitation cancelled event:", error);
      throw error;
    }
  },

  async trackDeclined(data: InvitationEventData): Promise<void> {
    try {
      // Track the event
      await db.insert(events).values({
        sessionId: data.metadata?.sessionId,
        eventType: "invitation",
        eventName: "declined",
        properties: {
          invitationId: data.invitationId,
          email: data.email,
          role: data.role,
          ...data.metadata,
        },
        pageUrl: data.metadata?.pageUrl,
        pagePath: data.metadata?.pagePath,
        userAgent: data.metadata?.userAgent,
        ipAddress: data.metadata?.ipAddress,
        timestamp: new Date(),
      });

      // Update invitation record
      await this.updateInvitationStatus(data.invitationId, "declined", {
        declinedAt: new Date(),
      });
    } catch (error) {
      console.error("Failed to track invitation declined event:", error);
      throw error;
    }
  },

  async trackResent(
    data: InvitationEventData & { resentBy: string },
  ): Promise<void> {
    try {
      // Track the event
      await db.insert(events).values({
        sessionId: data.metadata?.sessionId,
        userId: data.resentBy,
        eventType: "invitation",
        eventName: "resent",
        properties: {
          invitationId: data.invitationId,
          email: data.email,
          role: data.role,
          resentBy: data.resentBy,
          ...data.metadata,
        },
        pageUrl: data.metadata?.pageUrl,
        pagePath: data.metadata?.pagePath,
        userAgent: data.metadata?.userAgent,
        ipAddress: data.metadata?.ipAddress,
        timestamp: new Date(),
      });

      // Update invitation record
      await this.updateInvitationStatus(data.invitationId, "sent", {
        sentAt: new Date(),
        resentAt: new Date(),
      });

      // Log audit event
      await AuditLogger.logInvitationResent(
        data.email,
        data.invitationId,
        data.resentBy,
        {
          userId: data.resentBy,
          resourceId: data.invitationId,
          metadata: {
            action: "invitation_resent",
            invitationId: data.invitationId,
            ...data.metadata,
          },
        },
      );
    } catch (error) {
      console.error("Failed to track invitation resent event:", error);
      throw error;
    }
  },

  async updateInvitationStatus(
    invitationId: string,
    status: string,
    additionalData?: Record<string, any>,
  ): Promise<void> {
    try {
      const updateData: Record<string, any> = {
        status,
        updatedAt: new Date(),
      };

      // Map status to specific timestamp fields
      switch (status) {
        case "sent":
          updateData.sentAt = new Date();
          break;
        case "opened":
          updateData.openedAt = new Date();
          break;
        case "accepted":
          updateData.acceptedAt = new Date();
          break;
        case "expired":
          updateData.expiredAt = new Date();
          break;
        case "cancelled":
          updateData.cancelledAt = new Date();
          break;
        case "declined":
          updateData.declinedAt = new Date();
          break;
      }

      // Add any additional data
      if (additionalData) {
        Object.assign(updateData, additionalData);
      }

      await db
        .update(invitation)
        .set(updateData)
        .where(eq(invitation.id, invitationId));
    } catch (error) {
      console.error("Failed to update invitation status:", error);
      throw error;
    }
  },
};

/**
 * Utility functions for invitation tracking
 */
export const invitationTrackingUtils = {
  /**
   * Extract tracking data from request context
   */
  extractTrackingContext(request: Request): {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    pageUrl?: string;
    pagePath?: string;
  } {
    const url = new URL(request.url);
    return {
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || undefined,
      sessionId: request.headers.get("x-session-id") || undefined,
      pageUrl: url.href,
      pagePath: url.pathname,
    };
  },

  /**
   * Generate invitation tracking metadata
   */
  generateMetadata(additionalData?: Record<string, any>): Record<string, any> {
    return {
      timestamp: new Date().toISOString(),
      source: "invitation_system",
      ...additionalData,
    };
  },

  /**
   * Check if invitation needs expiration processing
   */
  async processExpiredInvitations(): Promise<number> {
    try {
      const now = new Date();
      const expiredInvitations = await db
        .select()
        .from(invitation)
        .where(
          and(
            eq(invitation.status, "pending"),
            sql`${invitation.expiresAt} < ${now.toISOString()}`,
          ),
        );

      let processedCount = 0;

      for (const inv of expiredInvitations) {
        await invitationTracking.trackExpired({
          invitationId: inv.id,
          email: inv.email,
          role: inv.role || "user",
          inviterId: inv.inviterId || undefined,
          metadata: invitationTrackingUtils.generateMetadata({
            originalStatus: inv.status,
            expiredAt: now.toISOString(),
          }),
        });
        processedCount++;
      }

      return processedCount;
    } catch (error) {
      console.error("Failed to process expired invitations:", error);
      throw error;
    }
  },
};

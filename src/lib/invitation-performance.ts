import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { dailyAnalytics, invitation } from "@/db/schema";

export interface PerformanceMetrics {
  responseTime: {
    average: number;
    median: number;
    p95: number;
    p99: number;
    trend: Array<{ date: string; average: number }>;
  };
  successRate: {
    overall: number;
    byRole: Record<string, number>;
    trend: Array<{ date: string; rate: number }>;
  };
  volume: {
    daily: Array<{ date: string; count: number }>;
    weekly: Array<{ week: string; count: number }>;
    byRole: Record<string, number>;
  };
  bottlenecks: {
    expiredRate: number;
    pendingRate: number;
    averageTimeToExpire: number;
  };
}

export interface PerformanceAlert {
  type: "response_time" | "success_rate" | "volume_spike" | "bottleneck";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  metric: string;
  currentValue: number;
  threshold: number;
  trend: "improving" | "declining" | "stable";
}

/**
 * Comprehensive invitation performance tracking and analysis
 */
export const invitationPerformanceTracker = {
  /**
   * Calculate comprehensive performance metrics
   */
  async calculateMetrics(timeRange: {
    from: Date;
    to: Date;
  }): Promise<PerformanceMetrics> {
    try {
      const { from, to } = timeRange;

      // Response time metrics
      const responseTimeMetrics = await this.calculateResponseTimeMetrics(
        from,
        to,
      );

      // Success rate metrics
      const successRateMetrics = await this.calculateSuccessRateMetrics(
        from,
        to,
      );

      // Volume metrics
      const volumeMetrics = await this.calculateVolumeMetrics(from, to);

      // Bottleneck analysis
      const bottleneckMetrics = await this.calculateBottleneckMetrics(from, to);

      return {
        responseTime: responseTimeMetrics,
        successRate: successRateMetrics,
        volume: volumeMetrics,
        bottlenecks: bottleneckMetrics,
      };
    } catch (error) {
      console.error("Error calculating performance metrics:", error);
      throw new Error("Failed to calculate performance metrics");
    }
  },

  /**
   * Calculate response time metrics
   */
  async calculateResponseTimeMetrics(from: Date, to: Date) {
    // Get all accepted invitations with response times
    const responseTimeData = await db
      .select({
        responseTime: invitation.responseTime,
        acceptedAt: invitation.acceptedAt,
        createdAt: invitation.createdAt,
        role: invitation.role,
      })
      .from(invitation)
      .where(
        and(
          eq(invitation.status, "accepted"),
          gte(invitation.createdAt, from),
          lte(invitation.createdAt, to),
        ),
      );

    const validResponseTimes = responseTimeData
      .filter((row) => row.responseTime !== null)
      .map((row) => Number(row.responseTime))
      .sort((a, b) => a - b);

    if (validResponseTimes.length === 0) {
      return {
        average: 0,
        median: 0,
        p95: 0,
        p99: 0,
        trend: [],
      };
    }

    const average =
      validResponseTimes.reduce((sum, time) => sum + time, 0) /
      validResponseTimes.length;
    const median =
      validResponseTimes[Math.floor(validResponseTimes.length / 2)] || 0;
    const p95Index = Math.floor(validResponseTimes.length * 0.95);
    const p99Index = Math.floor(validResponseTimes.length * 0.99);
    const p95 = validResponseTimes[p95Index] || 0;
    const p99 = validResponseTimes[p99Index] || 0;

    // Calculate trend over time
    const dailyResponseTimes = await db
      .select({
        date: sql<string>`date(${invitation.createdAt})`,
        avgResponseTime: sql<number>`avg(${invitation.responseTime})`,
      })
      .from(invitation)
      .where(
        and(
          eq(invitation.status, "accepted"),
          gte(invitation.createdAt, from),
          lte(invitation.createdAt, to),
          sql`${invitation.responseTime} is not null`,
        ),
      )
      .groupBy(sql`date(${invitation.createdAt})`)
      .orderBy(sql`date(${invitation.createdAt})`);

    const trend = dailyResponseTimes.map((day: any) => ({
      date: day.date,
      average: Number(day.avgResponseTime || 0),
    }));

    return {
      average: Math.round(average * 100) / 100,
      median: Math.round(median * 100) / 100,
      p95: Math.round(p95 * 100) / 100,
      p99: Math.round(p99 * 100) / 100,
      trend,
    };
  },

  /**
   * Calculate success rate metrics
   */
  async calculateSuccessRateMetrics(from: Date, to: Date) {
    // Overall success rate
    const totalInvitations = await db
      .select({ count: sql<number>`count(*)` })
      .from(invitation)
      .where(
        and(gte(invitation.createdAt, from), lte(invitation.createdAt, to)),
      );

    const acceptedInvitations = await db
      .select({ count: sql<number>`count(*)` })
      .from(invitation)
      .where(
        and(
          eq(invitation.status, "accepted"),
          gte(invitation.createdAt, from),
          lte(invitation.createdAt, to),
        ),
      );

    const totalCount = Number(totalInvitations[0]?.count || 0);
    const acceptedCount = Number(acceptedInvitations[0]?.count || 0);
    const overall = totalCount > 0 ? (acceptedCount / totalCount) * 100 : 0;

    // Success rate by role
    const roleStats = await db
      .select({
        role: invitation.role,
        total: sql<number>`count(*)`,
        accepted: sql<number>`sum(case when ${invitation.status} = 'accepted' then 1 else 0 end)`,
      })
      .from(invitation)
      .where(
        and(gte(invitation.createdAt, from), lte(invitation.createdAt, to)),
      )
      .groupBy(invitation.role);

    const byRole: Record<string, number> = {};
    roleStats.forEach((row: any) => {
      const role = row.role || "user";
      const total = Number(row.total || 0);
      const accepted = Number(row.accepted || 0);
      byRole[role] = total > 0 ? (accepted / total) * 100 : 0;
    });

    // Success rate trend
    const dailySuccessRates = await db
      .select({
        date: sql<string>`date(${invitation.createdAt})`,
        total: sql<number>`count(*)`,
        accepted: sql<number>`sum(case when ${invitation.status} = 'accepted' then 1 else 0 end)`,
        rate: sql<number>`round(
          (sum(case when ${invitation.status} = 'accepted' then 1 else 0 end)::numeric /
           nullif(count(*), 0)) * 100, 2
        )`,
      })
      .from(invitation)
      .where(
        and(gte(invitation.createdAt, from), lte(invitation.createdAt, to)),
      )
      .groupBy(sql`date(${invitation.createdAt})`)
      .orderBy(sql`date(${invitation.createdAt})`);

    const trend = dailySuccessRates.map((day: any) => ({
      date: day.date,
      rate: Number(day.rate || 0),
    }));

    return {
      overall: Math.round(overall * 100) / 100,
      byRole,
      trend,
    };
  },

  /**
   * Calculate volume metrics
   */
  async calculateVolumeMetrics(from: Date, to: Date) {
    // Daily volume
    const dailyVolume = await db
      .select({
        date: sql<string>`date(${invitation.createdAt})`,
        count: sql<number>`count(*)`,
      })
      .from(invitation)
      .where(
        and(gte(invitation.createdAt, from), lte(invitation.createdAt, to)),
      )
      .groupBy(sql`date(${invitation.createdAt})`)
      .orderBy(sql`date(${invitation.createdAt})`);

    // Weekly volume
    const weeklyVolume = await db
      .select({
        week: sql<string>`date_trunc('week', ${invitation.createdAt})`,
        count: sql<number>`count(*)`,
      })
      .from(invitation)
      .where(
        and(gte(invitation.createdAt, from), lte(invitation.createdAt, to)),
      )
      .groupBy(sql`date_trunc('week', ${invitation.createdAt})`)
      .orderBy(sql`date_trunc('week', ${invitation.createdAt})`);

    // Volume by role
    const roleVolume = await db
      .select({
        role: invitation.role,
        count: sql<number>`count(*)`,
      })
      .from(invitation)
      .where(
        and(gte(invitation.createdAt, from), lte(invitation.createdAt, to)),
      )
      .groupBy(invitation.role);

    const byRole: Record<string, number> = {};
    roleVolume.forEach((row: any) => {
      const role = row.role || "user";
      byRole[role] = Number(row.count || 0);
    });

    return {
      daily: dailyVolume.map((day: any) => ({
        date: day.date,
        count: Number(day.count || 0),
      })),
      weekly: weeklyVolume.map((week: any) => ({
        week: week.week,
        count: Number(week.count || 0),
      })),
      byRole,
    };
  },

  /**
   * Calculate bottleneck metrics
   */
  async calculateBottleneckMetrics(from: Date, to: Date) {
    const totalInvitations = await db
      .select({ count: sql<number>`count(*)` })
      .from(invitation)
      .where(
        and(gte(invitation.createdAt, from), lte(invitation.createdAt, to)),
      );

    const expiredInvitations = await db
      .select({ count: sql<number>`count(*)` })
      .from(invitation)
      .where(
        and(
          eq(invitation.status, "expired"),
          gte(invitation.createdAt, from),
          lte(invitation.createdAt, to),
        ),
      );

    const pendingInvitations = await db
      .select({ count: sql<number>`count(*)` })
      .from(invitation)
      .where(
        and(
          eq(invitation.status, "pending"),
          gte(invitation.createdAt, from),
          lte(invitation.createdAt, to),
        ),
      );

    const totalCount = Number(totalInvitations[0]?.count || 0);
    const expiredCount = Number(expiredInvitations[0]?.count || 0);
    const pendingCount = Number(pendingInvitations[0]?.count || 0);

    // Calculate average time to expire for expired invitations
    const expiredWithTimes = await db
      .select({
        createdAt: invitation.createdAt,
        expiredAt: invitation.expiredAt,
      })
      .from(invitation)
      .where(
        and(
          eq(invitation.status, "expired"),
          gte(invitation.createdAt, from),
          lte(invitation.createdAt, to),
          sql`${invitation.expiredAt} is not null`,
        ),
      );

    const timeToExpireValues = expiredWithTimes.map((row) => {
      const created = new Date(row.createdAt).getTime();
      const expired = new Date(row.expiredAt!).getTime();
      return (expired - created) / (1000 * 60 * 60 * 24); // days
    });

    const averageTimeToExpire =
      timeToExpireValues.length > 0
        ? timeToExpireValues.reduce((sum, time) => sum + time, 0) /
          timeToExpireValues.length
        : 0;

    return {
      expiredRate: totalCount > 0 ? (expiredCount / totalCount) * 100 : 0,
      pendingRate: totalCount > 0 ? (pendingCount / totalCount) * 100 : 0,
      averageTimeToExpire: Math.round(averageTimeToExpire * 100) / 100,
    };
  },

  /**
   * Detect performance alerts and anomalies
   */
  async detectAlerts(
    currentMetrics: PerformanceMetrics,
    _historicalMetrics: PerformanceMetrics[],
  ): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = [];

    // Response time alerts
    if (currentMetrics.responseTime.average > 72) {
      // More than 3 days
      alerts.push({
        type: "response_time",
        severity: "high",
        message: `Average response time is ${currentMetrics.responseTime.average.toFixed(1)} hours, which is above the 72-hour threshold`,
        metric: "response_time",
        currentValue: currentMetrics.responseTime.average,
        threshold: 72,
        trend: this.calculateTrend(currentMetrics.responseTime.trend),
      });
    }

    // Success rate alerts
    if (currentMetrics.successRate.overall < 25) {
      // Less than 25% success rate
      alerts.push({
        type: "success_rate",
        severity: "critical",
        message: `Success rate has dropped to ${currentMetrics.successRate.overall.toFixed(1)}%, which is below the 25% threshold`,
        metric: "success_rate",
        currentValue: currentMetrics.successRate.overall,
        threshold: 25,
        trend: this.calculateTrend(currentMetrics.successRate.trend),
      });
    }

    // Volume spike detection
    const recentVolume = currentMetrics.volume.daily.slice(-3);
    const avgVolume =
      recentVolume.reduce((sum, day) => sum + day.count, 0) /
      recentVolume.length;
    const maxVolume = Math.max(...recentVolume.map((day) => day.count));

    if (maxVolume > avgVolume * 3) {
      // 3x spike in volume
      alerts.push({
        type: "volume_spike",
        severity: "medium",
        message: `Detected volume spike: ${maxVolume} invitations in a single day`,
        metric: "volume",
        currentValue: maxVolume,
        threshold: avgVolume * 3,
        trend: "stable",
      });
    }

    // Bottleneck alerts
    if (currentMetrics.bottlenecks.pendingRate > 60) {
      alerts.push({
        type: "bottleneck",
        severity: "high",
        message: `${currentMetrics.bottlenecks.pendingRate.toFixed(1)}% of invitations are pending, indicating potential bottlenecks`,
        metric: "pending_rate",
        currentValue: currentMetrics.bottlenecks.pendingRate,
        threshold: 60,
        trend: "stable",
      });
    }

    return alerts;
  },

  /**
   * Calculate trend direction from data points
   */
  calculateTrend(
    dataPoints: Array<{ date: string; average?: number; rate?: number }>,
  ): "improving" | "declining" | "stable" {
    if (dataPoints.length < 2) return "stable";

    const values = dataPoints.map((point) => point.average || point.rate || 0);
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const change = (secondAvg - firstAvg) / firstAvg;

    if (change > 0.1) return "improving";
    if (change < -0.1) return "declining";
    return "stable";
  },

  /**
   * Store performance metrics in cache/analytics table
   */
  async storeMetrics(
    metrics: PerformanceMetrics,
    period: { from: Date; to: Date },
  ): Promise<void> {
    try {
      const timestamp = new Date();

      // Store key metrics in daily analytics table
      const metricsToStore = [
        {
          date: timestamp,
          metricType: "invitation_performance",
          metricName: "response_time_avg",
          value: metrics.responseTime.average.toString(),
          metadata: {
            period: `${period.from.toISOString()} to ${period.to.toISOString()}`,
          },
        },
        {
          date: timestamp,
          metricType: "invitation_performance",
          metricName: "success_rate",
          value: metrics.successRate.overall.toString(),
          metadata: {
            period: `${period.from.toISOString()} to ${period.to.toISOString()}`,
          },
        },
        {
          date: timestamp,
          metricType: "invitation_performance",
          metricName: "volume_total",
          value: metrics.volume.daily
            .reduce((sum, day) => sum + day.count, 0)
            .toString(),
          metadata: {
            period: `${period.from.toISOString()} to ${period.to.toISOString()}`,
          },
        },
      ];

      // Insert metrics into daily analytics table
      for (const metric of metricsToStore) {
        await db.insert(dailyAnalytics).values({
          date: metric.date,
          metricType: metric.metricType,
          metricName: metric.metricName,
          value: metric.value,
          metadata: metric.metadata,
          calculatedAt: timestamp,
        });
      }
    } catch (error) {
      console.error("Error storing performance metrics:", error);
      // Don't throw - this is not critical for the main functionality
    }
  },
};

export interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    emailVerificationRequired: boolean;
  };
  security: {
    passwordMinLength: number;
    sessionTimeout: number;
    maxLoginAttempts: number;
    twoFactorRequired: boolean;
    forcePasswordChange: boolean;
  };
  database: {
    backupFrequency: "daily" | "weekly" | "monthly";
    retentionDays: number;
    autoOptimize: boolean;
    monitoringEnabled: boolean;
  };
}

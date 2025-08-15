/**
 * CONFIGURAÇÃO CENTRALIZADA DE SEGURANÇA
 */

// Type definitions for security config
export interface FileValidationConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  scanForMalware: boolean;
  quarantineOnSuspicion: boolean;
}

export interface RateLimitConfig {
  windowMs: number;
  limit: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

export const SECURITY_CONFIG = {
  SESSION: {
    TIMEOUT_MINUTES: 60,
    REFRESH_THRESHOLD_MINUTES: 10,
    MAX_CONCURRENT_SESSIONS: 3,
    REQUIRE_REAUTH_FOR_SENSITIVE: true,
  },

  AUTH: {
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION_MINUTES: 15,
    PASSWORD_MIN_LENGTH: 8,
    REQUIRE_2FA_FOR_ADMIN: true,
    JWT_EXPIRY_HOURS: 24,
  },

  EMAIL_VERIFICATION: {
    REQUIRED_FOR_CRITICAL_ACTIONS: true,
    VERIFICATION_VALIDITY_HOURS: 24,
    MAX_VERIFICATION_ATTEMPTS: 3,
    RESEND_COOLDOWN_MINUTES: 5,
    CRITICAL_ACTIONS: [
      'financial_transaction',
      'data_export',
      'admin_action',
      'sensitive_data_access',
      'account_deletion',
      'password_change',
      'email_change',
      'service_order_creation',
      'budget_approval',
    ] as const,
  },

  MONITORING: {
    ENABLE_REAL_TIME_ALERTS: true,
    SUSPICIOUS_ACTIVITY_THRESHOLD: 10,
    AUTO_BLOCK_SUSPICIOUS_IPS: true,
    LOG_ALL_API_CALLS: true,
    ALERT_ADMIN_ON_CRITICAL: true,
  },

  DATA_PROTECTION: {
    ENCRYPT_PII: true,
    MASK_SENSITIVE_LOGS: true,
    AUTO_DELETE_TEMP_FILES: true,
    SECURE_HEADERS_REQUIRED: true,
  },

  COMPLIANCE: {
    LGPD_ENABLED: true,
    AUDIT_ALL_ACTIONS: true,
    DATA_RETENTION_DAYS: 90,
    REQUIRE_CONSENT_TRACKING: true,
  },

  RATE_LIMITS: {
    LOGIN: {
      windowMs: 15 * 60 * 1000,
      limit: 5,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
    SIGNUP: {
      windowMs: 60 * 60 * 1000,
      limit: 3,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
    PASSWORD_RESET: {
      windowMs: 60 * 60 * 1000,
      limit: 3,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
    EMAIL_VERIFICATION: {
      windowMs: 60 * 60 * 1000,
      limit: 5,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
    API_GENERAL: {
      windowMs: 15 * 60 * 1000,
      limit: 100,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
    API_SENSITIVE: {
      windowMs: 15 * 60 * 1000,
      limit: 20,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
    FILE_UPLOAD: {
      windowMs: 60 * 60 * 1000,
      limit: 10,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
    CREATE_BUDGET: {
      windowMs: 60 * 60 * 1000,
      limit: 20,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
    DATA_EXPORT: {
      windowMs: 24 * 60 * 60 * 1000,
      limit: 5,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
    SEARCH: {
      windowMs: 60 * 1000,
      limit: 30,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
    ADMIN_ACTION: {
      windowMs: 60 * 60 * 1000,
      limit: 50,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
  },
} as const;

export const FILE_SECURITY_CONFIG: Record<string, FileValidationConfig> = {
  COMPANY_LOGO: {
    maxFileSize: 3 * 1024 * 1024, // 3MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    scanForMalware: true,
    quarantineOnSuspicion: true,
  },
  SERVICE_ATTACHMENTS: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ],
    allowedExtensions: [
      '.jpg', '.jpeg', '.png', '.webp', '.gif',
      '.pdf', '.doc', '.docx', '.txt',
    ],
    scanForMalware: true,
    quarantineOnSuspicion: true,
  },
};

export const AUDIT_CONFIG = {
  CRITICAL_EVENTS: [
    'user_login',
    'user_logout', 
    'password_change',
    'email_change',
    'permission_change',
    'data_export',
    'file_upload',
    'file_download',
    'admin_action',
    'security_violation',
    'suspicious_activity',
  ] as const,
  
  RETENTION: {
    CRITICAL_EVENTS_DAYS: 365,
    NORMAL_EVENTS_DAYS: 90,
    SYSTEM_LOGS_DAYS: 30,
  },
  
  ALERTS: {
    ENABLE_REAL_TIME: true,
    CRITICAL_THRESHOLD: 1,
    SUSPICIOUS_THRESHOLD: 5,
    ADMIN_EMAIL_ALERTS: true,
    WEBHOOK_ALERTS: true,
  },
} as const;

export type SecurityEventType = typeof AUDIT_CONFIG.CRITICAL_EVENTS[number];
export type CriticalAction = typeof SECURITY_CONFIG.EMAIL_VERIFICATION.CRITICAL_ACTIONS[number];

export function isCriticalAction(action: string): action is CriticalAction {
  return SECURITY_CONFIG.EMAIL_VERIFICATION.CRITICAL_ACTIONS.includes(action as CriticalAction);
}

export default {
  SECURITY_CONFIG,
  FILE_SECURITY_CONFIG,
  AUDIT_CONFIG,
};
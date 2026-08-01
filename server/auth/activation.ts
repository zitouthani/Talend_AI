/**
 * Book Activation Code & Rate Limiting System (Partie 2)
 * 
 * Functions:
 * 1. Activation code validation & user linking (Part 2.2)
 * 2. Rate limiting engine (40 requests/day default, configurable) (Part 2.3)
 * 3. Account sharing detector (> 3-4 distinct IPs in 24-48h window raises flag) (Part 2.3)
 */

export interface ActivationCode {
  code: string;
  isActivated: boolean;
  activatedByEmail?: string;
  activatedAt?: string;
  maxActivations: number;
  activationCount: number;
}

export interface UserAccount {
  email: string;
  authMethod: 'email-link' | 'password' | 'google' | 'linkedin';
  isActivated: boolean;
  activationCode?: string;
  createdAt: string;
  dailyQuota: number; // default 40
}

export interface UsageLog {
  userEmail: string;
  dateStr: string; // YYYY-MM-DD
  requestCount: number;
  ipAddresses: string[];
  lastRequestAt: string;
  isFlaggedSuspicious: boolean;
  flagReason?: string;
}

// Memory / Storage tables initialized with default book activation codes
const ACTIVATION_CODES_DB = new Map<string, ActivationCode>([
  ['TALEND-BOOK-2026-001', { code: 'TALEND-BOOK-2026-001', isActivated: false, maxActivations: 1, activationCount: 0 }],
  ['TALEND-BOOK-2026-002', { code: 'TALEND-BOOK-2026-002', isActivated: false, maxActivations: 1, activationCount: 0 }],
  ['TALEND-MASTER-2026-X89', { code: 'TALEND-MASTER-2026-X89', isActivated: false, maxActivations: 1, activationCount: 0 }],
  ['PASCAL-TALEND-2026', { code: 'PASCAL-TALEND-2026', isActivated: false, maxActivations: 5, activationCount: 0 }],
  ['DEMO-TALEND-CODE', { code: 'DEMO-TALEND-CODE', isActivated: false, maxActivations: 100, activationCount: 0 }]
]);

const USER_ACCOUNTS_DB = new Map<string, UserAccount>();
const USAGE_LOGS_DB = new Map<string, UsageLog>(); // key: `email:YYYY-MM-DD`

export const DEFAULT_DAILY_QUOTA = 40;
export const MAX_ALLOWED_IPS_24H = 3;

/**
 * Validates and activates a book code for a user email.
 */
export function activateBookCode(email: string, rawCode: string, authMethod: string = 'email-link'): {
  success: boolean;
  message: string;
  user?: UserAccount;
} {
  if (!email || !rawCode) {
    return { success: false, message: "L'adresse e-mail et le code d'activation sont requis." };
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = rawCode.toUpperCase().trim();

  const codeEntry = ACTIVATION_CODES_DB.get(cleanCode);
  if (!codeEntry) {
    return { success: false, message: "Code d'activation inexistant ou invalide. Vérifiez le code imprimé dans votre livre." };
  }

  if (codeEntry.activationCount >= codeEntry.maxActivations && codeEntry.activatedByEmail !== cleanEmail) {
    return { success: false, message: "Ce code d'activation a déjà été utilisé sur un autre compte." };
  }

  // Mark code as activated
  codeEntry.isActivated = true;
  codeEntry.activatedByEmail = cleanEmail;
  codeEntry.activatedAt = new Date().toISOString();
  codeEntry.activationCount += 1;
  ACTIVATION_CODES_DB.set(cleanCode, codeEntry);

  // Create or update user account
  const existingUser = USER_ACCOUNTS_DB.get(cleanEmail);
  const userAccount: UserAccount = {
    email: cleanEmail,
    authMethod: (authMethod as any) || 'email-link',
    isActivated: true,
    activationCode: cleanCode,
    createdAt: existingUser?.createdAt || new Date().toISOString(),
    dailyQuota: existingUser?.dailyQuota || DEFAULT_DAILY_QUOTA,
  };

  USER_ACCOUNTS_DB.set(cleanEmail, userAccount);

  return {
    success: true,
    message: "Félicitations ! Votre code d'activation livre a été validé. Vous disposez d'un accès complet à l'assistant RAG.",
    user: userAccount,
  };
}

/**
 * Checks if a user is activated and enforces the 40 requests/day rate limit.
 * Also tracks client IP for suspicious sharing detection.
 */
export function checkRateLimitAndQuota(email: string, clientIp: string = '127.0.0.1'): {
  allowed: boolean;
  reason?: string;
  remainingQuota: number;
  dailyQuota: number;
  isFlaggedSuspicious: boolean;
} {
  const cleanEmail = email.toLowerCase().trim();
  const user = USER_ACCOUNTS_DB.get(cleanEmail);

  // Require valid book activation
  if (!user || !user.isActivated) {
    return {
      allowed: false,
      reason: "Accès réservé aux lecteurs du livre. Veuillez saisir votre code d'activation livre.",
      remainingQuota: 0,
      dailyQuota: DEFAULT_DAILY_QUOTA,
      isFlaggedSuspicious: false,
    };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const logKey = `${cleanEmail}:${todayStr}`;

  let usage = USAGE_LOGS_DB.get(logKey);

  if (!usage) {
    usage = {
      userEmail: cleanEmail,
      dateStr: todayStr,
      requestCount: 0,
      ipAddresses: [clientIp],
      lastRequestAt: new Date().toISOString(),
      isFlaggedSuspicious: false,
    };
  }

  // Check IP sharing anomaly
  if (!usage.ipAddresses.includes(clientIp)) {
    usage.ipAddresses.push(clientIp);
  }

  if (usage.ipAddresses.length > MAX_ALLOWED_IPS_24H) {
    usage.isFlaggedSuspicious = true;
    usage.flagReason = `Alerte partage de compte : ${usage.ipAddresses.length} adresses IP différentes détectées en 24h (${usage.ipAddresses.join(', ')})`;
    console.warn(`⚠️ [SECURITY ALERT] ${usage.flagReason} pour l'utilisateur ${cleanEmail}`);
  }

  // Enforce daily request limit (Part 2.3)
  const maxQuota = user.dailyQuota || DEFAULT_DAILY_QUOTA;
  if (usage.requestCount >= maxQuota) {
    USAGE_LOGS_DB.set(logKey, usage);
    return {
      allowed: false,
      reason: `Quota quotidien atteint (${maxQuota} requêtes/jour). Réessayez demain !`,
      remainingQuota: 0,
      dailyQuota: maxQuota,
      isFlaggedSuspicious: usage.isFlaggedSuspicious,
    };
  }

  // Increment request counter
  usage.requestCount += 1;
  usage.lastRequestAt = new Date().toISOString();
  USAGE_LOGS_DB.set(logKey, usage);

  const remainingQuota = maxQuota - usage.requestCount;

  return {
    allowed: true,
    remainingQuota,
    dailyQuota: maxQuota,
    isFlaggedSuspicious: usage.isFlaggedSuspicious,
  };
}

/**
 * Returns account activation status and remaining daily requests for UI display.
 */
export function getUserActivationStatus(email: string): {
  isActivated: boolean;
  activationCode?: string;
  dailyQuota: number;
  usedToday: number;
  remainingQuota: number;
  isFlaggedSuspicious: boolean;
} {
  const cleanEmail = email ? email.toLowerCase().trim() : '';
  const user = USER_ACCOUNTS_DB.get(cleanEmail);

  if (!user || !user.isActivated) {
    return {
      isActivated: false,
      dailyQuota: DEFAULT_DAILY_QUOTA,
      usedToday: 0,
      remainingQuota: 0,
      isFlaggedSuspicious: false,
    };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const logKey = `${cleanEmail}:${todayStr}`;
  const usage = USAGE_LOGS_DB.get(logKey);
  const usedToday = usage ? usage.requestCount : 0;

  return {
    isActivated: true,
    activationCode: user.activationCode,
    dailyQuota: user.dailyQuota,
    usedToday,
    remainingQuota: Math.max(0, user.dailyQuota - usedToday),
    isFlaggedSuspicious: usage?.isFlaggedSuspicious || false,
  };
}

/**
 * Admin utility to list or add activation codes
 */
export function getAllActivationCodes(): ActivationCode[] {
  return Array.from(ACTIVATION_CODES_DB.values());
}

export function generateNewCode(customCode?: string, maxUses: number = 1): ActivationCode {
  const code = customCode ? customCode.toUpperCase().trim() : `TALEND-${Math.random().toString(36).substring(2, 8).toUpperCase()}-2026`;
  const entry: ActivationCode = {
    code,
    isActivated: false,
    maxActivations: maxUses,
    activationCount: 0,
  };
  ACTIVATION_CODES_DB.set(code, entry);
  return entry;
}

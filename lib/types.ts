/**
 * Canonical type definitions for DishLens table/session management.
 * 
 * Naming conventions:
 * - TableAccessToken: Rotating QR token (short-lived, 10-30min TTL)
 * - TableSession: Server-issued session (longer-lived, 90min TTL)
 * - tableSessionId: UUID of the session
 * - tableNumber: Display string (e.g., "5", "Table 12")
 * - sessionSecret: Cryptographically secure secret for order authentication
 */

/**
 * Table session returned from API after resolving access token or guest flow.
 */
export type TableSession = {
  /** UUID of the table session (required) */
  tableSessionId: string;
  /** Display table number (required) */
  tableNumber: string;
  /** Session secret for order authentication (required for secure orders) */
  sessionSecret: string | null;
  /** Expiration timestamp (ISO string) */
  expiresAt: string | null;
};

/**
 * Table access token (QR token) - used to resolve to a TableSession.
 * This is the token embedded in QR codes.
 */
export type TableAccessToken = string;

/**
 * Legacy QR token format (deprecated, kept for backward compatibility).
 * New QR codes should use TableAccessToken instead.
 */
export type LegacyQrToken = string;

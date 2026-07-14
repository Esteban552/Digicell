/**
 * Logging Client — Digicell POS → LogsDigicell
 * 
 * Cliente para enviar logs desde el frontend del POS al servidor LogsDigicell.
 * 
 * DOS MODOS:
 *   - En desarrollo: usa VITE_LOGS_URL (default: http://localhost:3001)
 *   - En producción con reverse proxy: usa la misma origen (relative path /api/logs)
 *   - En producción standalone: usa VITE_LOGS_URL
 * 
 * USO:
 *   import { log } from '../lib/logging-client';
 *   await log.event('app.login.success', { user: 'admin', path: '/login' });
 */

function getApiBase(): string {
  // Solo intenta enviar logs si hay VITE_LOGS_URL configurado explícitamente
  if (import.meta.env.VITE_LOGS_URL) {
    return import.meta.env.VITE_LOGS_URL;
  }
  // Sin servidor configurado — silencioso
  return '';
}

/**
 * Registra un evento en LogsDigicell.
 * Es "fire and forget" — no lanza error si falla.
 */
async function sendLog(entry: {
  event: string;
  ip?: string;
  user?: string | null;
  user_id?: string | null;
  path?: string;
  method?: string;
  status_code?: number;
  severity?: string;
  details?: Record<string, unknown>;
}) {
  try {
    const base = getApiBase();
    if (!base) return; // Sin servidor configurado

    const ip = entry.ip
      || (typeof window !== 'undefined'
        ? (window as any).__LOGS_CLIENT_IP__ as string
        : undefined)
      || '0.0.0.0';

    const payload = {
      timestamp: new Date().toISOString(),
      ip,
      user: entry.user || null,
      user_id: entry.user_id || null,
      event: entry.event,
      severity: entry.severity || 'info',
      path: entry.path || window.location.pathname,
      method: entry.method || 'CLIENT',
      status_code: entry.status_code || 200,
      user_agent: navigator.userAgent || '',
      details: {
        ...entry.details,
        url: window.location.href,
        referrer: document.referrer || undefined,
        screen: `${window.screen.width}x${window.screen.height}`,
      },
    };

    await fetch(`${base}/api/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // Timeout corto — no bloquear la app
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // FIRE AND FORGET — si falla el log, no debe afectar la app
  }
}

/**
 * API pública del logging client.
 */
export const log = {
  /** Evento genérico */
  event: (event: string, ctx?: {
    user?: string | null;
    user_id?: string | null;
    path?: string;
    method?: string;
    status_code?: number;
    severity?: string;
    details?: Record<string, unknown>;
  }) => sendLog({ event, ...ctx }),

  /** Atajo para login exitoso */
  loginSuccess: (user: string, userId: string) =>
    sendLog({
      event: 'app.login.success',
      user,
      user_id: userId,
      path: '/login',
      method: 'POST',
      status_code: 200,
    }),

  /** Atajo para login fallido */
  loginFailed: (email: string) =>
    sendLog({
      event: 'app.login.failed',
      user: email,
      path: '/login',
      method: 'POST',
      status_code: 401,
      severity: 'warning',
    }),

  /** Atajo para logout */
  logout: (user: string, userId: string) =>
    sendLog({
      event: 'app.logout',
      user,
      user_id: userId,
      path: '/logout',
      method: 'POST',
      status_code: 200,
    }),

  /** Atajo para venta */
  saleCreated: (user: string, userId: string, details: Record<string, unknown>) =>
    sendLog({
      event: 'app.sale.created',
      user,
      user_id: userId,
      path: '/pos/checkout',
      method: 'POST',
      status_code: 201,
      details,
    }),

  /** Atajo para error */
  error: (error: string, details?: Record<string, unknown>) =>
    sendLog({
      event: 'app.error.general',
      severity: 'error',
      status_code: 500,
      details: { error, ...details },
    }),

  /** Atajo para acceso denegado */
  accessDenied: (user: string | null, path: string) =>
    sendLog({
      event: 'app.access.denied',
      user,
      path,
      status_code: 403,
      severity: 'warning',
    }),

  /** Atajo para movimiento de caja */
  cashMovement: (user: string, userId: string, details: Record<string, unknown>) =>
    sendLog({
      event: 'app.cash.movement',
      user,
      user_id: userId,
      path: '/cash',
      method: 'POST',
      status_code: 201,
      details,
    }),
};

export default log;

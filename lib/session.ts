import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const SESSION_COOKIE = 'mt_session';
const SESSION_DURATION = 5 * 60 * 1000; // 5 minutes

interface SessionData {
  role: 'editor' | 'viewer';
  expiresAt: number;
}

function getSecret(): string {
  return process.env.SESSION_SECRET || 'default-secret-change-me-in-production';
}

// Simple sync hash for Edge runtime compatibility (no Node crypto)
function simpleHash(data: string, secret: string): string {
  let hash = 0;
  const combined = data + secret;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Create a longer hash by running multiple rounds
  let hash2 = 0;
  const combined2 = secret + data + hash.toString();
  for (let i = 0; i < combined2.length; i++) {
    const char = combined2.charCodeAt(i);
    hash2 = ((hash2 << 7) - hash2) + char;
    hash2 = hash2 & hash2;
  }
  return Math.abs(hash).toString(36) + Math.abs(hash2).toString(36);
}

function encode(session: SessionData): string {
  const payload = JSON.stringify(session);
  const signature = simpleHash(payload, getSecret());
  // Use btoa for Edge compatibility
  return btoa(`${payload}.${signature}`);
}

function decode(token: string): SessionData | null {
  try {
    const decoded = atob(token);
    const lastDot = decoded.lastIndexOf('.');
    if (lastDot === -1) return null;

    const payload = decoded.substring(0, lastDot);
    const signature = decoded.substring(lastDot + 1);

    if (simpleHash(payload, getSecret()) !== signature) return null;

    const data = JSON.parse(payload) as SessionData;
    return data;
  } catch {
    return null;
  }
}

export function createSessionToken(role: 'editor' | 'viewer'): {
  token: string;
  session: SessionData;
} {
  const session: SessionData = {
    role,
    expiresAt: Date.now() + SESSION_DURATION,
  };
  return { token: encode(session), session };
}

export function refreshSessionToken(role: 'editor' | 'viewer'): {
  token: string;
  session: SessionData;
} {
  return createSessionToken(role);
}

export function validateSessionToken(token: string): SessionData | null {
  const session = decode(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) return null;
  return session;
}

export function getSessionFromRequest(request: NextRequest): SessionData | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return validateSessionToken(token);
}

export async function getSessionFromCookies(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return validateSessionToken(token);
}

export { SESSION_COOKIE, SESSION_DURATION };
export type { SessionData };

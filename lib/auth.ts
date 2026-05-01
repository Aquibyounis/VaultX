import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, SessionData } from './session';

export function requireSession(request: NextRequest): SessionData | NextResponse {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return session;
}

export function requireEditor(request: NextRequest): SessionData | NextResponse {
  const result = requireSession(request);
  if (result instanceof NextResponse) return result;
  if (result.role !== 'editor') {
    return NextResponse.json({ error: 'Forbidden: Editor access required' }, { status: 403 });
  }
  return result;
}

export function isErrorResponse(result: SessionData | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}

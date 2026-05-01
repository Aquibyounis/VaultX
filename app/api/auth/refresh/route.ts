import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, createSessionToken, SESSION_COOKIE, SESSION_DURATION } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Refresh the token
    const { token, session: newSession } = createSessionToken(session.role);

    const response = NextResponse.json({
      success: true,
      expiresAt: newSession.expiresAt
    });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_DURATION / 1000,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}

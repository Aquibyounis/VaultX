import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, SESSION_COOKIE, SESSION_DURATION } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();

    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ error: 'PIN required' }, { status: 400 });
    }

    const editorPin = process.env.EDITOR_PIN || '0079';
    const viewerPin = process.env.VIEWER_PIN || '0808';

    let role: 'editor' | 'viewer' | null = null;

    if (pin === editorPin) {
      role = 'editor';
    } else if (pin === viewerPin) {
      role = 'viewer';
    }

    if (!role) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    const { token, session } = createSessionToken(role);

    const response = NextResponse.json({
      role: session.role,
      expiresAt: session.expiresAt,
    });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_DURATION / 1000,
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

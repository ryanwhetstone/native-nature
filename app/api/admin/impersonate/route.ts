import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    // Only admins can impersonate
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify the user exists
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Store impersonation in a cookie
    const cookieStore = await cookies();
    cookieStore.set('impersonating', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error starting impersonation:', error);
    return NextResponse.json(
      { error: 'Failed to start impersonation' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    
    // Only admins who are currently impersonating can stop
    if (!session?.user || !session.user.isImpersonating || !session.user.realAdminId) {
      return NextResponse.json(
        { error: 'Not currently impersonating' },
        { status: 401 }
      );
    }

    // Remove impersonation cookie
    const cookieStore = await cookies();
    cookieStore.delete('impersonating');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error stopping impersonation:', error);
    return NextResponse.json(
      { error: 'Failed to stop impersonation' },
      { status: 500 }
    );
  }
}

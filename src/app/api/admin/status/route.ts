import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserById } from '@/db/queries';

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { isAdmin: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await getUserById(userId);

    if (!user) {
      return NextResponse.json(
        { isAdmin: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      isAdmin: Boolean(user.isAdmin),
      userId: user.id,
    });
  } catch (error) {
    console.error('Error checking admin status from session:', error);
    return NextResponse.json(
      { error: 'Internal server error', isAdmin: false },
      { status: 500 }
    );
  }
}

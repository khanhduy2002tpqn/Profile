import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await verifyAuth(req);

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(user);
}

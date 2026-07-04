import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
      include: { organization: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET || 'summercamp-secret-key-change-me';
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      orgId: user.organizationId,
    };

    const token = jwt.sign(payload, secret, { expiresIn: '7d' });

    return NextResponse.json({
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 });
  }
}

import { headers } from 'next/headers';
import * as jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  email: string;
  role: 'OWNER' | 'ADMIN';
  organizationId: string;
}

export async function verifyAuth(req?: Request): Promise<AuthUser | null> {
  try {
    let authHeader = '';
    if (req) {
      authHeader = req.headers.get('Authorization') || '';
    } else {
      const reqHeaders = await headers();
      authHeader = reqHeaders.get('Authorization') || '';
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'summercamp-secret-key-change-me';
    const decoded = jwt.verify(token, secret) as any;

    return {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      organizationId: decoded.orgId,
    };
  } catch (err) {
    console.error('JWT validation error:', err);
    return null;
  }
}

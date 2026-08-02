import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({ where: { username } });
    
    if (!admin || admin.password !== password) {
      return NextResponse.json({ error: 'Username atau password admin salah!' }, { status: 401 });
    }

    return NextResponse.json({ success: true, admin: { username: admin.username } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({ where: { username } });
    if (!teacher || teacher.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Refresh token on login if empty (should not be empty but just in case)
    let token = teacher.token;
    if (!token) {
      token = uuidv4().substring(0, 8).toUpperCase();
      await prisma.teacher.update({ where: { id: teacher.id }, data: { token } });
    }

    return NextResponse.json({ success: true, teacher: { username: teacher.username, name: teacher.name, token } });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

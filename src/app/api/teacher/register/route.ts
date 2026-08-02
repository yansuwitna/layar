import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const { username, name, password } = await req.json();

    if (!username || !password || !name) {
      return NextResponse.json({ error: 'Username, name, and password required' }, { status: 400 });
    }

    const existing = await prisma.teacher.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const token = uuidv4().substring(0, 8).toUpperCase(); // Simple 8 character token
    const teacher = await prisma.teacher.create({
      data: {
        username,
        name,
        password, // In a real app, hash this!
        token,
      },
    });

    return NextResponse.json({ success: true, teacher: { username: teacher.username, name: teacher.name, token: teacher.token } });
  } catch (error: any) {
    console.error('Error at Teacher Register:', error);
    return NextResponse.json({ error: 'Internal server error: ' + (error.message || String(error)) }, { status: 500 });
  }
}

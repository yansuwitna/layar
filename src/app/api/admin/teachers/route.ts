import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const teachers = await prisma.teacher.findMany({
      select: {
        id: true,
        username: true,
        token: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ teachers });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

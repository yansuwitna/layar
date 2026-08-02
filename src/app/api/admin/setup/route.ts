import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const adminCount = await prisma.admin.count();
    return NextResponse.json({ needsSetup: adminCount === 0 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminCount = await prisma.admin.count();
    if (adminCount > 0) {
      return NextResponse.json({ error: 'Admin sudah ada, tidak bisa membuat admin baru dari halaman setup.' }, { status: 400 });
    }

    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 });
    }

    const newAdmin = await prisma.admin.create({
      data: { username, password }
    });

    return NextResponse.json({ success: true, admin: { username: newAdmin.username } });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

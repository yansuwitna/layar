import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Reset Password
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { newPassword } = await req.json();
    
    if (!newPassword) {
      return NextResponse.json({ error: 'New password is required' }, { status: 400 });
    }

    const teacher = await prisma.teacher.update({
      where: { id: params.id },
      data: { password: newPassword },
    });

    return NextResponse.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}

// Delete Teacher
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.teacher.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete teacher' }, { status: 500 });
  }
}

import { AccessToken } from 'livekit-server-sdk';
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Use a global variable to store room IPs (since this is a long-running Node process)
const globalStore = global as any;
if (!globalStore.roomIps) {
  globalStore.roomIps = {};
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const room = url.searchParams.get('room');
    const username = url.searchParams.get('username');
    const isTeacher = url.searchParams.get('role') === 'teacher';

    if (!room || !username) {
      return NextResponse.json({ error: 'Missing room or username' }, { status: 400 });
    }

    // Get IP
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    let clientIp = req.ip || forwardedFor || realIp || 'Jaringan Lokal';
    if (clientIp.includes(',')) clientIp = clientIp.split(',')[0].trim();
    
    // Force IPv4 format
    if (clientIp === '::1') {
      clientIp = '127.0.0.1';
    } else if (clientIp.includes('::ffff:')) {
      clientIp = clientIp.replace('::ffff:', '');
    }

    if (isTeacher) {
      globalStore.roomIps[room] = clientIp;
    }
    const teacherIp = globalStore.roomIps[room] || 'Menunggu Guru...';

    // Ambil konfigurasi dari database
    const settings = await prisma.setting.findMany();
    const config: Record<string, string> = {};
    settings.forEach(s => { config[s.key] = s.value; });

    const apiKey = config['LIVEKIT_API_KEY'];
    const apiSecret = config['LIVEKIT_API_SECRET'];
    const serverUrl = config['LIVEKIT_URL'];
    const useLiveKit = config['USE_LIVEKIT'] !== 'false';

    if (!useLiveKit) {
      return NextResponse.json({ useLiveKit: false, clientIp, teacherIp });
    }

    if (!apiKey || !apiSecret || !serverUrl) {
      return NextResponse.json({ error: 'Konfigurasi LiveKit belum diatur oleh Admin' }, { status: 500 });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: username,
    });

    at.addGrant({ 
      roomJoin: true, 
      room: room, 
      canPublish: isTeacher,
      canPublishData: true,
      canSubscribe: true 
    });

    return NextResponse.json({ token: await at.toJwt(), serverUrl, clientIp, teacherIp });
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}

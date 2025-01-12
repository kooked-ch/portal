import { alert } from '@/lib/kuma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
	const token = req.headers.get('authorization');
	if (!token) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
	}

	if (token !== process.env.KUMA_TOKEN) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
	}

	const body = await req.json();

	alert(body);

	return NextResponse.json({ message: 'Hello' });
}

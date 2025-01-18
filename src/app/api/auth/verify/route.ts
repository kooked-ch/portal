import db from '@/lib/mongo';
import { UserModel } from '@/models/User';
import { NextResponse } from 'next/server';
import { EmailModel } from '@/models/Email';

export async function POST(req: Request, res: Response) {
	try {
		const { code, email } = await req.json();
		await db.connect();

		const user = await UserModel.findOne({ email }).exec();
		if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

		const mail = await EmailModel.findOne({ email, token: code }).exec();
		if (!mail) return NextResponse.json({ error: 'Invalid code' }, { status: 400 });

		await UserModel.updateOne({ email }, { verified: true }).exec();

		const userUpdated = await UserModel.findOne({
			email,
		}).exec();

		return NextResponse.json({ message: 'User verified' });
	} catch (error) {
		console.error('Error during validation:', error);
		return NextResponse.json({ error: 'Error during validation' });
	}
}

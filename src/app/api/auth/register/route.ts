import { sendEmail } from '@/lib/mail';
import db from '@/lib/mongo';
import { AccreditationModel } from '@/models/Accreditation';
import { ResourcesPolicyModel } from '@/models/ResourcesPolicy';
import { UserModel } from '@/models/User';
import { NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import bcryt from 'bcrypt';
import { EmailModel } from '@/models/Email';
import { generateRandomString } from '@/lib/utils';

export async function POST(req: Request, res: Response) {
	try {
		const { email, password, name } = await req.json();

		await db.connect();

		const user = await UserModel.findOne({ email }).exec();

		if (user) return NextResponse.json({ error: 'User already exists' }, { status: 400 });

		const defaultAccreditation = await AccreditationModel.findOne({ slug: 'std', accessLevel: 0 }).exec();
		if (!defaultAccreditation) return NextResponse.json({ error: 'Error during registration' }, { status: 500 });

		const defaultResourcesPolicy = await ResourcesPolicyModel.findOne({ slug: 'dpl', accessLevel: 0 }).exec();
		if (!defaultResourcesPolicy) return NextResponse.json({ error: 'Error during registration' }, { status: 500 });

		const passwordHash = bcryt.hashSync(password, 10);

		await UserModel.create({
			email,
			id: uuid().replace(/-/g, ''),
			provider: 'credentials',
			name,
			password: passwordHash,
			verified: false,
			accreditation: defaultAccreditation._id,
			resourcesPolicy: defaultResourcesPolicy._id,
		});

		const userCreated = await UserModel.findOne({ email }).exec();

		const token = generateRandomString(6);

		await EmailModel.create({
			email,
			type: 'verify',
			token,
		});

		await sendEmail(email, 'verify', { token });

		return NextResponse.json({ message: 'User created' });
	} catch (error) {
		console.error('Error during registration:', error);
		return NextResponse.json({ error: 'Error during registration' });
	}
}

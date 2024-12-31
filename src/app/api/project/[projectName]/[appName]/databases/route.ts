import { NextRequest, NextResponse } from 'next/server';
import { checkAccreditation, getUser } from '@/lib/auth';
import { log } from '@/lib/log';
import { databaseSchema } from '@/types/database';
import { createDatabase } from '@/lib/database';

export async function POST(req: NextRequest, { params }: { params: { projectName: string; appName: string } }) {
	try {
		const user = await getUser();

		if (!user || !(await checkAccreditation('databases:2:create', `${params.projectName}/${params.appName}`))) {
			log(`Unauthorized: Create database`, 'info', params.projectName, params.appName);
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
		}

		const { name, provider, username, password } = await req.json();

		const validationResult = databaseSchema.safeParse({ name, provider, username, password });
		if (!validationResult.success) {
			return NextResponse.json({ message: 'Invalid request', details: validationResult.error.errors }, { status: 400 });
		}

		const database = await createDatabase(params.projectName, params.appName, { name, provider, username, password });

		return NextResponse.json({ message: database.message }, { status: database.status });
	} catch (error) {
		console.error('Error creating database:', error);
		return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
	}
}

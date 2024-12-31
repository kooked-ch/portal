import { NextRequest, NextResponse } from 'next/server';
import { checkAccreditation, getUser } from '@/lib/auth';
import { log } from '@/lib/log';
import { databaseSchema } from '@/types/database';
import { deleteDatabase, updateDatabase } from '@/lib/database';

export async function PUT(req: NextRequest, { params }: { params: { projectName: string; appName: string; databaseName: string } }) {
	try {
		const user = await getUser();

		if (!user || !(await checkAccreditation('databases:2:update', `${params.projectName}/${params.appName}`))) {
			log(`Unauthorized: Update database`, 'info', params.projectName, params.appName);
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
		}

		const { name, provider, username, password } = await req.json();

		const validationResult = databaseSchema.safeParse({ name, provider, username, password });
		if (!validationResult.success) {
			return NextResponse.json({ message: 'Invalid request', details: validationResult.error.errors }, { status: 400 });
		}

		const database = await updateDatabase(params.projectName, params.appName, { name, provider, username, password });
		return NextResponse.json({ message: database.message }, { status: database.status });
	} catch (error) {
		console.error('Error creating project:', error);
		return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, { params }: { params: { projectName: string; appName: string; databaseName: string } }) {
	try {
		const user = await getUser();

		if (!user || !(await checkAccreditation('databases:2:delete', `${params.projectName}/${params.appName}`))) {
			log(`Unauthorized: Delete database`, 'info', params.projectName, params.appName);
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
		}

		const database = await deleteDatabase(params.projectName, params.appName, params.databaseName);

		return NextResponse.json({ message: database.message }, { status: database.status });
	} catch (error) {
		console.error('Error creating project:', error);
		return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
	}
}

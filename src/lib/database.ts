import { customObjectsApi } from './api';
import { ErrorType } from '@/types/error';
import { log } from './log';
import { DatabaseType } from '@/types/database';

export async function createDatabase(projectName: string, appName: string, data: DatabaseType): Promise<ErrorType> {
	try {
		const app: any = await customObjectsApi.getNamespacedCustomObject({
			group: 'kooked.ch',
			version: 'v1',
			namespace: projectName,
			plural: 'kookedapps',
			name: appName,
		});

		if (!app) {
			return {
				message: 'App not found',
				status: 404,
			};
		}

		const databases = app?.spec?.databases || [];
		const existingDatabase = databases.find((database: any) => database.name === data.name && database.provider === data.provider);

		if (existingDatabase) {
			return { message: 'Database already exists', status: 400 };
		}

		const patch = [
			{
				op: databases.length > 0 ? 'replace' : 'add',
				path: '/spec/databases',
				value: [
					...databases,
					{
						name: data.name,
						provider: data.provider,
						user: data.username,
						password: data.password,
					},
				],
			},
		];

		console.log(JSON.stringify(patch));

		await customObjectsApi.patchNamespacedCustomObject({
			group: 'kooked.ch',
			version: 'v1',
			namespace: projectName,
			plural: 'kookedapps',
			name: appName,
			body: patch,
		});
		await log(`Created ${data.provider} database: ${data.name}`, 'info', projectName, appName);

		return {
			message: 'Database created',
			status: 201,
		};
	} catch (error: unknown) {
		console.error('Error creating database:', error);
		return { message: 'An unexpected error occurred', status: 500 };
	}
}

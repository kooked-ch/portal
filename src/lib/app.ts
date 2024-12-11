import { AppType } from '@/types/app';
import { customObjectsApi } from './api';
import { checkAccreditation } from './auth';
import { getRepository } from './utils';
import { ErrorType } from '@/types/error';
import { AppModel } from '@/models/App';
import { ProjectModel } from '@/models/Project';
import { AccreditationModel } from '@/models/Accreditation';

export async function getApp(projectName: string, appname: string): Promise<AppType | null> {
	const hasAccess = await checkAccreditation('apps:2:read', `${projectName}/${appname}`);

	if (!hasAccess) {
		return null;
	}

	try {
		const app: any = await customObjectsApi.getNamespacedCustomObject('kooked.ch', 'v1', projectName, 'kookedapps', appname);
		return {
			name: app.body.metadata.name,
			description: app.body.metadata.annotations?.description,
			createdAt: app.body.metadata.creationTimestamp,
			repository: await getRepository(app.body.metadata.annotations?.repository),
			replicas: app.body.spec.replicas,
			domains: app.body.spec.domains,
			databases: app.body.spec.databases,
			containers: app.body.spec.containers,
		};
	} catch (error) {
		console.error('Error fetching app:', error);
		return null;
	}
}

export async function createApp(userId: string, { name, description, repository, projectName }: { name: string; description: string; repository: string | null; projectName: string }): Promise<ErrorType> {
	const existingApp = await AppModel.findOne({ name });
	if (existingApp) {
		return {
			message: 'App already exists',
			status: 400,
		};
	}

	await customObjectsApi.createNamespacedCustomObject('kooked.ch', 'v1', projectName, 'kookedapps', {
		apiVersion: 'kooked.ch/v1',
		kind: 'KookedApp',
		metadata: {
			name,
			annotations: {
				description,
				repository,
			},
		},
	});

	const project = await ProjectModel.findOne({ slug: projectName }).exec();
	const defaultAccreditation = await AccreditationModel.findOne({ slug: 'own', accessLevel: 2 }).exec();
	if (!defaultAccreditation) {
		throw new Error('Default accreditation not found');
	}

	await AppModel.create({
		name,
		projectId: project?._id,
		image: '',
		collaborators: [{ userId, accreditation: defaultAccreditation._id }],
	});

	return {
		message: 'App created',
		status: 200,
	};
}

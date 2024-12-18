import { AppType } from '@/types/app';
import { appsApi, coreV1Api, customObjectsApi } from './api';
import { checkAccreditation } from './auth';
import { getRepository } from './utils';
import { ErrorType } from '@/types/error';
import { AppModel, IApp } from '@/models/App';
import { ProjectModel } from '@/models/Project';
import { AccreditationModel, IAccreditation } from '@/models/Accreditation';
import { IUser } from '@/models/User';

export async function getApp(projectName: string, appName: string): Promise<AppType | null> {
	const hasAccess = await checkAccreditation('apps:2:read', `${projectName}/${appName}`);
	if (!hasAccess) {
		return null;
	}

	const hasEnvAccess = await checkAccreditation('env:2:read', `${projectName}/${appName}`);

	const app = await AppModel.findOne<IApp>({ name: appName })
		.populate<{ collaborators: Array<{ userId: IUser }> }>({
			path: 'collaborators.userId',
			select: 'username image',
		})
		.exec();

	if (!app) {
		return null;
	}

	try {
		const podsResponse = await coreV1Api.listNamespacedPod(projectName, undefined, undefined, undefined, undefined, `app=${appName}`);

		const podStatuses = podsResponse.body.items.map((pod) => ({
			name: pod.metadata?.name || '',
			phase: pod.status?.phase,
			metadata: pod.metadata,
			conditions: pod.status?.conditions?.map((condition) => ({
				type: condition.type,
				status: condition.status,
				reason: condition.reason,
				message: condition.message,
			})),
			containerStatuses: pod.status?.containerStatuses?.map((containerStatus) => ({
				name: containerStatus.name,
				ready: containerStatus.ready,
				state: Object.keys(containerStatus.state || {})[0] || 'unknown',
				stateDetails: JSON.parse(JSON.stringify(containerStatus.state)),
				restartCount: containerStatus.restartCount,
			})),
		}));

		const appData: any = await customObjectsApi.getNamespacedCustomObject('kooked.ch', 'v1', projectName, 'kookedapps', appName);
		const deploymentData: any = await appsApi.readNamespacedDeployment(appName, projectName);

		const deploymentStatus = {
			conditions: deploymentData.body?.status?.conditions?.map((condition: any) => ({
				type: condition.type,
				status: condition.status,
				reason: condition.reason,
				message: condition.message,
			})),
			replicas: {
				desired: deploymentData.body?.spec?.replicas || 0,
				available: deploymentData.body?.status?.availableReplicas || 0,
				ready: deploymentData.body?.status?.readyReplicas || 0,
				updated: deploymentData.body?.status?.updatedReplicas || 0,
			},
			phase: deploymentData.body?.metadata?.deletionTimestamp ? 'Terminating' : deploymentData.body?.status?.conditions?.some((c: any) => c.type === 'Available' && c.status === 'True') ? 'Running' : 'Progressing',
		};

		const databaseStatuses = await Promise.all(
			(appData.body?.spec?.databases || []).map(async (db: any) => {
				try {
					const statefulSet = await appsApi.readNamespacedStatefulSet(`${appName}-${db.provider}`, projectName);
					const databasePod = podStatuses.find((pod) => pod.metadata?.labels?.type === db.provider);

					return {
						name: db.name,
						provider: db.provider,
						status: {
							state: databasePod?.phase || 'Unknown',
							replicas: {
								desired: statefulSet.body?.spec?.replicas || 0,
								current: statefulSet.body?.status?.currentReplicas || 0,
								ready: statefulSet.body?.status?.readyReplicas || 0,
							},
						},
					};
				} catch (error) {
					console.error(`Error fetching StatefulSet for database ${db.name}:`, error);
					return {
						name: db.name,
						provider: db.provider,
						status: null,
					};
				}
			})
		);

		console.log('appData:', appData.body.metadata.annotations);

		return {
			name: appData.body.metadata.name,
			description: appData.body.metadata.annotations?.description || '',
			createdAt: appData.body.metadata.creationTimestamp,
			repository: {
				url: appData.body.metadata.annotations?.repository || '',
				image: '',
				version: '',
			},
			replicas: {
				desired: deploymentStatus.replicas.desired || 0,
				available: deploymentStatus.replicas.available || 0,
				ready: deploymentStatus.replicas.ready || 0,
				updated: deploymentStatus.replicas.updated || 0,
				asked: appData.body?.spec?.replicas || 0,
			},
			domains: appData.body?.spec?.domains || [],
			databases: databaseStatuses,
			containers:
				appData.body?.spec?.containers.map((container: any) => ({
					name: container.name,
					image: container.image,
					env: hasEnvAccess ? container.env : container.env.map((env: any) => ({ name: env.name, value: '********' })),
					status: podStatuses
						.filter((pod) => pod.metadata?.labels?.type === 'container')
						.map((pod) => pod?.containerStatuses?.find((status) => status.name === container.name))
						.map((status) => ({
							ready: status?.ready || false,
							state: status?.state || 'unknown',
							stateDetails: status?.stateDetails || {},
							restartCount: status?.restartCount || 0,
						})),
				})) || [],
			collaborators:
				app.collaborators.map((collaborator) => ({
					username: collaborator.userId.username || '',
					image: collaborator.userId.image || '',
				})) || [],
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

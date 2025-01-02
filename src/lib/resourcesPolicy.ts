import { AppModel } from '@/models/App';
import { ProjectModel } from '@/models/Project';
import { ResourcesPolicyModel } from '@/models/ResourcesPolicy';
import { AppResourcesPolicy, ProjectResourcesPolicy } from '@/types/resourcesPolicy';
import { customObjectsApi } from './api';

export async function getProjectResourcesPolicy(projectName: string): Promise<ProjectResourcesPolicy> {
	const project = await ProjectModel.findOne({ slug: projectName }).populate('resourcesPolicy');
	if (!project) return { name: '', description: '', totalLimit: 0, remainingLimit: 0 };

	const apps = await AppModel.find({ projectId: project._id }).exec();

	const resourcesPolicy = project.resourcesPolicy;
	return {
		name: resourcesPolicy.name,
		description: resourcesPolicy.description,
		totalLimit: resourcesPolicy.limitation.apps,
		remainingLimit: resourcesPolicy.limitation.apps - (apps ? apps.length : 0),
	};
}

export async function getProjectsResourcesPolicy(): Promise<ProjectsResourcesPolicy> {
	const session = await getServerSession();
	if (!session?.user?.email) return { name: '', description: '', totalLimit: 0, remainingLimit: 0 };

	const user = await UserModel.findOne({ email: session.user.email }).populate('resourcesPolicy');
	const projects = await ProjectModel.find({ 'members.userId': user._id }).exec();

	const resourcesPolicy = user.resourcesPolicy;
	return {
		name: resourcesPolicy.name,
		description: resourcesPolicy.description,
		totalLimit: resourcesPolicy.limitation.projects,
		remainingLimit: resourcesPolicy.limitation.projects - (projects ? projects.length : 0),
	};
}

export async function getAppResourcesPolicy(projectName: string, appName: string): Promise<AppResourcesPolicy> {
	const project = await ProjectModel.findOne({ slug: projectName }).exec();
	if (!project) {
		return {
			containers: { name: '', description: '', totalLimit: 0, remainingLimit: 0 },
			domains: { name: '', description: '', totalLimit: 0, remainingLimit: 0 },
			databases: { name: '', description: '', totalLimit: 0, remainingLimit: 0 },
		};
	}

	const appData = await customObjectsApi.getNamespacedCustomObject({ group: 'kooked.ch', version: 'v1', namespace: projectName, plural: 'kookedapps', name: appName });
	const app = await AppModel.findOne({ name: appName, projectId: project._id }).exec();
	if (!appData) {
		return {
			containers: { name: '', description: '', totalLimit: 0, remainingLimit: 0 },
			domains: { name: '', description: '', totalLimit: 0, remainingLimit: 0 },
			databases: { name: '', description: '', totalLimit: 0, remainingLimit: 0 },
		};
	}

	const resourcesPolicy = await Promise.all([ResourcesPolicyModel.findOne({ _id: app.resourcesPolicy.container }).exec(), ResourcesPolicyModel.findOne({ _id: app.resourcesPolicy.domain }).exec(), ResourcesPolicyModel.findOne({ _id: app.resourcesPolicy.database }).exec()]);

	return {
		containers: {
			name: resourcesPolicy[0]?.name || '',
			description: resourcesPolicy[0]?.description || '',
			totalLimit: resourcesPolicy[0]?.limitation.containers || 0,
			remainingLimit: resourcesPolicy[0]?.limitation.containers - (appData.spec.containers ? appData.spec.containers.length : 0),
		},
		domains: {
			name: resourcesPolicy[1]?.name || '',
			description: resourcesPolicy[1]?.description || '',
			totalLimit: resourcesPolicy[1]?.limitation.domains || 0,
			remainingLimit: resourcesPolicy[1]?.limitation.domains - (appData.spec.domains ? appData.spec.domains.length : 0),
		},
		databases: {
			name: resourcesPolicy[2]?.name || '',
			description: resourcesPolicy[2]?.description || '',
			totalLimit: resourcesPolicy[2]?.limitation.databases || 0,
			remainingLimit: resourcesPolicy[2]?.limitation.databases - (appData.spec.databases ? appData.spec.databases.length : 0),
		},
	};
}

export async function checkResourcesPolicy(projectName: string, appName: string, action: string): Promise<boolean> {
	const project = await ProjectModel.findOne({
		slug: projectName,
	}).exec();
	if (!project) return false;

	const app = await AppModel.findOne({
		name: appName,
		projectId: project._id,
	}).exec();
	if (!app) return false;

	const resourcesPolicy = await getAppResourcesPolicy(projectName, appName);

	switch (action) {
		case 'containers':
			return resourcesPolicy.containers.remainingLimit > 0;
		case 'domains':
			return resourcesPolicy.domains.remainingLimit > 0;
		case 'databases':
			return resourcesPolicy.databases.remainingLimit > 0;
		default:
			return false;
	}
}

import { AppModel } from '@/models/App';
import { ProjectModel } from '@/models/Project';
import { ResourcesPolicyModel } from '@/models/ResourcesPolicy';
import { AppResourcesPolicy, ProjectResourcesPolicy, ProjectsResourcesPolicy } from '@/types/resourcesPolicy';
import { customObjectsApi } from './api';
import { getServerSession } from 'next-auth';
import { UserModel } from '@/models/User';

const blankApp = {
	containers: { name: '', description: '', totalLimit: 0, remainingLimit: 0 },
	domains: { name: '', description: '', totalLimit: 0, remainingLimit: 0 },
	databases: { name: '', description: '', totalLimit: 0, remainingLimit: 0 },
	volumes: { name: '', description: '', totalLimit: 0, remainingLimit: 0 },
};

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
		return blankApp;
	}

	const appData = await customObjectsApi.getNamespacedCustomObject({ group: 'kooked.ch', version: 'v1', namespace: projectName, plural: 'kookedapps', name: appName });
	const app = await AppModel.findOne({ name: appName, projectId: project._id }).exec();
	if (!appData) {
		return blankApp;
	}

	const resourcesPolicy = await Promise.all([ResourcesPolicyModel.findOne({ _id: app.resourcesPolicy.container }).exec(), ResourcesPolicyModel.findOne({ _id: app.resourcesPolicy.domain }).exec(), ResourcesPolicyModel.findOne({ _id: app.resourcesPolicy.database }).exec(), ResourcesPolicyModel.findOne({ _id: app.resourcesPolicy.volume }).exec()]);

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
		volumes: {
			name: resourcesPolicy[3]?.name || '',
			description: resourcesPolicy[3]?.description || '',
			totalLimit: resourcesPolicy[3]?.limitation.volumes || 0,
			remainingLimit: resourcesPolicy[3]?.limitation.volumes - (appData.spec.containers ? appData.spec.containers.map((container: any) => container.volumes || []).reduce((acc: any[], volumes: any[]) => acc.concat(volumes), []).length : 0),
		},
	};
}

export async function checkResourcesPolicy(action: string, projectName?: string, appName?: string): Promise<boolean> {
	const project = await ProjectModel.findOne({ slug: projectName }).exec();
	if (!project && projectName) return false;

	const app = await AppModel.findOne({
		name: appName,
		projectId: project?._id,
	}).exec();
	if (!app && appName) return false;

	let resourcesPolicy;

	switch (action) {
		case 'containers':
			if (!appName || !projectName) return false;
			resourcesPolicy = await getAppResourcesPolicy(projectName, appName);
			return resourcesPolicy.containers.totalLimit === -1 || resourcesPolicy.containers.remainingLimit > 0;

		case 'domains':
			if (!appName || !projectName) return false;
			resourcesPolicy = await getAppResourcesPolicy(projectName, appName);
			return resourcesPolicy.domains.totalLimit === -1 || resourcesPolicy.domains.remainingLimit > 0;

		case 'databases':
			if (!appName || !projectName) return false;
			resourcesPolicy = await getAppResourcesPolicy(projectName, appName);
			return resourcesPolicy.databases.totalLimit === -1 || resourcesPolicy.databases.remainingLimit > 0;

		case 'volumes':
			if (!appName || !projectName) return false;
			resourcesPolicy = await getAppResourcesPolicy(projectName, appName);
			return resourcesPolicy.volumes.totalLimit === -1 || resourcesPolicy.volumes.remainingLimit > 0;

		case 'apps':
			if (!projectName) return false;
			resourcesPolicy = await getProjectResourcesPolicy(projectName);
			return resourcesPolicy.totalLimit === -1 || resourcesPolicy.remainingLimit > 0;

		case 'projects':
			resourcesPolicy = await getProjectsResourcesPolicy();
			return resourcesPolicy.totalLimit === -1 || resourcesPolicy.remainingLimit > 0;

		default:
			return false;
	}
}

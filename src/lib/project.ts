import { AccreditationModel } from '@/models/Accreditation';
import { IProject, ProjectModel } from '@/models/Project';
import { ErrorType } from '@/types/error';
import { customObjectsApi, k3sApi } from './api';
import { ProjectsType, ProjectType } from '@/types/project';
import { checkAccreditation } from './auth';
import { getRepository } from './utils';
import { AppModel } from '@/models/App';
import { getApp } from './app';
import { ResourcesPolicyModel } from '@/models/ResourcesPolicy';
import { getProjectResourcesPolicy } from './resourcesPolicy';

export async function createProject(userId: string, project: { name: string; description: string }): Promise<ErrorType> {
	try {
		const slug = project.name.toLowerCase().replace(/ /g, '-');

		if (['cert-manager', 'default', 'databases', 'kube-public', 'kube-system', 'kube-node-lease', 'monitoring', 'nfs-provisioner'].includes(slug)) {
			return { message: { name: { message: 'Project name is reserved' } }, status: 409 };
		}

		const existingProject = await ProjectModel.findOne({ slug }).exec();
		if (existingProject) {
			return { message: { name: { message: 'Project already exists' } }, status: 409 };
		}

		const defaultAccreditation = await AccreditationModel.findOne({ slug: 'own', accessLevel: 1 }).exec();
		if (!defaultAccreditation) {
			throw new Error('Default accreditation not found');
		}

		const defaultresourcesPolicy = await ResourcesPolicyModel.findOne({ slug: 'dal', accessLevel: 1 }).exec();
		if (!defaultresourcesPolicy) {
			throw new Error('Default resource policy not found');
		}

		await ProjectModel.create({
			...project,
			slug,
			resourcesPolicy: defaultresourcesPolicy?._id,
			members: [{ userId, accreditation: defaultAccreditation._id }],
		});

		await k3sApi.createNamespace({ body: { metadata: { name: slug } } });

		return { message: 'Project created successfully', status: 201 };
	} catch (error) {
		console.error('Error creating project:', error);
		return { message: 'An unexpected error occurred', status: 500 };
	}
}

export async function getProjects(userId: string): Promise<ProjectsType[] | null> {
	try {
		const hasAccessAll = await checkAccreditation('projects:0:read');
		const filter = hasAccessAll ? {} : { 'members.userId': userId };
		const projects = await ProjectModel.find<IProject>(filter).populate<{ members: Array<{ userId: { image: string; username: string } }> }>('members.userId', 'username image').exec();

		return projects.map((project) => ({
			name: project.name,
			description: project.description,
			slug: project.slug,
			createdAt: project.createdAt,
			members: project.members.map((member) => ({
				username: member.userId?.username ?? 'Unknown',
				image: member.userId?.image ?? 'default-image.png',
			})),
		}));
	} catch (error: unknown) {
		console.error('Error fetching projects:', (error as Error).message);
		return null;
	}
}

export async function getProject(slug: string): Promise<ProjectType | null> {
	try {
		const hasAccess = await checkAccreditation('projects:1:read', slug);
		if (!hasAccess) {
			return null;
		}

		const project = await ProjectModel.findOne<IProject>({ slug });
		if (!project) {
			return null;
		}

		const appsData: any = await customObjectsApi.listNamespacedCustomObject({ group: 'kooked.ch', version: 'v1', namespace: project.slug, plural: 'kookedapps' });
		const apps = await AppModel.find({ projectId: project._id }).exec();
		const resourcesPolicy = await getProjectResourcesPolicy(project.slug);

		const filteredApps = appsData.items
			.filter((app: any) => apps.some((dbApp) => dbApp.name === app.metadata.name))
			.map(async (app: any) => {
				const appData = await getApp(project.slug, app.metadata.name);
				return {
					name: app.metadata.name,
					description: app.metadata.annotations?.description || '',
					repository: await getRepository(app.metadata.annotations?.repository || ''),
					createdAt: app.metadata.creationTimestamp,
					containers:
						appData?.containers.map((container) => ({
							name: container.name,
							image: container.image,
							status: container.status.map((status) => ({
								ready: status.state == 'ContainerCreating' ? true : status.ready,
								stateDetails: status.stateDetails,
							})),
						})) || [],
					domains: appData?.domains || [],
					databases: appData?.databases || [],
				};
			});

		const resolvedApps = await Promise.all(filteredApps);

		return {
			name: project.name,
			description: project.description,
			slug: project.slug,
			createdAt: project.createdAt,
			apps: resolvedApps,
			resourcesPolicy: resourcesPolicy,
		};
	} catch (error) {
		console.error('Error fetching project:', (error as Error).message);
		return null;
	}
}

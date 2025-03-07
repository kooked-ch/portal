import { AccreditationModel } from '@/models/Accreditation';
import { IProject, ProjectModel } from '@/models/Project';
import { ErrorType } from '@/types/error';
import { customObjectsApi, k3sApi } from './api';
import { ProjectsType, ProjectType } from '@/types/project';
import { checkAccreditation, getUser } from './auth';
import { getRepository } from './utils';
import { AppModel } from '@/models/App';
import { deleteApp, getApp } from './app';
import { ResourcesPolicyModel } from '@/models/ResourcesPolicy';
import { getProjectResourcesPolicy } from './resourcesPolicy';
import { UserModel } from '@/models/User';
import { getProjectAuthorization } from './authorization';

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

		const defaultResourcesPolicy = await ResourcesPolicyModel.findOne({ slug: 'dal', accessLevel: 1 }).exec();
		if (!defaultResourcesPolicy) {
			throw new Error('Default resource policy not found');
		}

		await ProjectModel.create({
			...project,
			slug,
			resourcesPolicy: defaultResourcesPolicy?._id,
			members: [{ userId, accreditation: defaultAccreditation._id }],
		});

		await k3sApi.createNamespace({ body: { metadata: { name: slug } } });

		return { message: 'Project created successfully', status: 201 };
	} catch (error) {
		console.error('Error creating project:', error);
		return { message: 'An unexpected error occurred', status: 500 };
	}
}

export async function getProjects(): Promise<ProjectsType[] | null> {
	try {
		const user = await getUser();
		if (!user) return null;
		const userData = await UserModel.findOne({ email: user.email }).exec();
		const hasAccessAll = await checkAccreditation('projects:0:read');
		const filter = hasAccessAll ? {} : { 'members.userId': userData._id };
		const projects = await ProjectModel.find<IProject>(filter).populate<{ members: Array<{ userId: { image: string; username: string; name: string } }> }>('members.userId', 'username image name').exec();

		return projects.map((project) => ({
			name: project.name,
			description: project.description,
			slug: project.slug,
			createdAt: project.createdAt,
			members: project.members.map((member) => ({
				username: member.userId?.username ?? member.userId.name ?? 'Unknown',
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

		const authorizations = await getProjectAuthorization(slug);

		return {
			name: project.name,
			description: project.description,
			slug: project.slug,
			createdAt: project.createdAt,
			apps: resolvedApps,
			resourcesPolicy: resourcesPolicy,
			authorizations,
		};
	} catch (error) {
		console.error('Error fetching project:', (error as Error).message);
		return null;
	}
}

export async function updateProject(slug: string, data: { name: string; description: string }): Promise<ErrorType> {
	try {
		const project = await ProjectModel.findOneAndUpdate({ slug }, data).exec();
		if (!project) {
			return { message: 'Project not found', status: 404 };
		}

		return { message: 'Project updated successfully', status: 200 };
	} catch (error) {
		console.error('Error updating project:', error);
		return { message: 'An unexpected error occurred', status: 500 };
	}
}

export async function deleteProject(slug: string): Promise<ErrorType> {
	try {
		const project = await ProjectModel.findOne({
			slug,
		}).exec();
		if (!project) {
			return { message: 'Project not found', status: 404 };
		}

		const apps = await AppModel.find({ projectId: project._id }).exec();

		await Promise.all(
			apps.map(async (app) => {
				await deleteApp(project.slug, app.name);
			})
		);

		await ProjectModel.deleteOne({
			slug,
		}).exec();

		await k3sApi.deleteNamespace({ name: slug });

		return { message: 'Project deleted successfully', status: 200 };
	} catch (error) {
		console.error('Error deleting project:', error);
		return { message: 'An unexpected error occurred', status: 500 };
	}
}

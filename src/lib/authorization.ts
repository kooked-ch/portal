import { IProject, ProjectModel } from '@/models/Project';
import { checkAccreditation, getUser } from './auth';
import { AppAuthorizationsType, ProjectAuthorizationsType, UserAuthorizationsType } from '@/types/authorization';
import { IUser, UserModel } from '@/models/User';
import { AccreditationModel, IAccreditation } from '@/models/Accreditation';
import { AppModel, IApp } from '@/models/App';

const blankApp = {
	containers: [],
	domains: [],
	databases: [],
	secrets: [],
	collaborators: [],
	volumes: [],
	apps: [],
};

export async function getAppAuthorization(projectName: string, appName: string): Promise<AppAuthorizationsType> {
	const user = await getUser();
	if (!user) {
		return blankApp;
	}

	const userData = await UserModel.findOne({
		email: user.email,
	}).exec();

	const project = await ProjectModel.findOne({ slug: projectName, 'members.userId': userData._id }).exec();
	if (!project) {
		return blankApp;
	}

	const app = await AppModel.findOne<IApp>({ name: appName, projectId: project._id }).exec();
	if (!app) {
		return blankApp;
	}

	const collaborator = app.collaborators.find((collaborator) => collaborator.userId.toString() === userData._id.toString());
	if (!collaborator) {
		return blankApp;
	}

	const accreditationId = collaborator.accreditation;
	const accreditation = await AccreditationModel.findOne({ _id: accreditationId }).exec();
	if (!accreditation) {
		return blankApp;
	}

	return {
		containers: accreditation.authorizations.containers,
		domains: accreditation.authorizations.domains,
		databases: accreditation.authorizations.databases,
		secrets: accreditation.authorizations.secrets || [],
		collaborators: accreditation.authorizations.collaborators || [],
		volumes: accreditation.authorizations.volumes || [],
		apps: accreditation.authorizations.apps || [],
	};
}

export async function getUserAuthorization(): Promise<UserAuthorizationsType> {
	const user = await getUser();
	if (!user) return {};

	const userData = await UserModel.findOne({ email: user.email }).exec();

	if (!userData) return {};

	const accreditation = await AccreditationModel.findOne({ _id: userData.accreditation }).exec();

	return accreditation.authorizations;
}

export async function getProjectAuthorization(projectName: string): Promise<ProjectAuthorizationsType> {
	const user = await getUser();
	if (!user) return {};

	const userData = await UserModel.findOne<IUser>({ email: user.email });
	if (!userData) return {};

	const userAccreditation = await getUserAuthorization();

	if (await checkAccreditation('projects:0:read')) {
		return userAccreditation;
	}

	const project = await ProjectModel.findOne<IProject>({ slug: projectName, 'members.userId': userData._id }).exec();
	if (!project) return {};

	const projectAccreditation = await AccreditationModel.findOne<IAccreditation>({ _id: project.members.find((member) => member.userId.toString() === userData._id.toString())?.accreditation });
	if (!projectAccreditation) return {};

	return {
		...userAccreditation,
		...projectAccreditation?.authorizations,
	};
}

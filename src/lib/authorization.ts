import { ProjectModel } from '@/models/Project';
import { getUser } from './auth';
import { AppAuthorizationsType } from '@/types/authorization';
import { UserModel } from '@/models/User';
import { AccreditationModel } from '@/models/Accreditation';
import { AppModel, IApp } from '@/models/App';

const blankApp = {
	containers: [],
	domains: [],
	databases: [],
	secrets: [],
	collaborators: [],
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
	};
}

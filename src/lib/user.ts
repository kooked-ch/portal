import { IProject, ProjectModel } from '@/models/Project';
import { AllProjectUsers } from '@/types/user';
import { checkAccreditation, getUser } from './auth';
import { IUser, UserModel } from '@/models/User';
import { getAccreditations } from './accreditation';
import { IAccreditation } from '@/models/Accreditation';
import { AccreditationType } from '@/types/accreditations';

export async function getAllProjectUsers(projectName: string): Promise<AllProjectUsers | null> {
	if (!(await checkAccreditation('members:1:read', projectName))) return null;

	const user = await getUser();
	if (!user) return null;

	const userData = await UserModel.findOne({ email: user.email }).exec();
	if (!userData) return null;

	const project = await ProjectModel.findOne<IProject>({
		slug: projectName,
		'members.userId': userData._id,
	})
		.populate<{ members: Array<{ userId: IUser; accreditation: IAccreditation }> }>({
			path: 'members.userId members.accreditation',
			select: 'username image id name description slug authorizations',
		})
		.exec();

	if (!project || !project.members) return null;

	const accreditationsList = await getAccreditations(1);

	return {
		users: project.members.map((member) => {
			return {
				username: member.userId.username || member.userId.name || 'Unknown',
				image: member.userId.image || '',
				id: member.userId.id,
				accreditation: {
					name: member.accreditation.name,
					description: member.accreditation.description,
					slug: member.accreditation.slug,
					accessLevel: member.accreditation.accessLevel,
					authorizations: {
						...member.accreditation.authorizations,
						level: Array.isArray(member.accreditation.authorizations.level) ? member.accreditation.authorizations.level.length : member.accreditation.authorizations.level || 0,
					},
				} as AccreditationType,
			};
		}),
		accreditationsList,
	};
}

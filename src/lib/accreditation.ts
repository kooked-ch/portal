import { AccreditationModel } from '@/models/Accreditation';
import { AccreditationType } from '@/types/accreditations';

export async function getAccreditations(level: number): Promise<AccreditationType[]> {
	const accreditations = await AccreditationModel.find({ accessLevel: level }, { _id: 0 }).exec();
	if (!accreditations) return [];

	return accreditations.map((accreditation) => ({
		name: accreditation.name,
		description: accreditation.description,
		slug: accreditation.slug,
		accessLevel: accreditation.accessLevel,
	}));
}

import mongoose, { Document } from 'mongoose';

export interface IAccreditation extends Document {
	_id: string;
	name: string;
	description: string;
	slug: string;
	accessLevel: number;
	authorizations: {
		[key: string]: string[];
	};
}

const accreditationSchema = new mongoose.Schema<IAccreditation>({
	name: { type: String, required: true },
	description: { type: String, required: true },
	accessLevel: { type: Number, required: true },
	slug: { type: String, required: true },
	authorizations: { type: Object, required: true },
});

export const AccreditationModel = mongoose.models.Accreditation || mongoose.model<IAccreditation>('Accreditation', accreditationSchema);

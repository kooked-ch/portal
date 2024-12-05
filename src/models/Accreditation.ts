import mongoose, { Document } from 'mongoose';

export interface IAccreditation extends Document {
	_id: string;
	name: string;
	description: string;
	accessLevel: number;
	authorizations: object;
}

const accreditationSchema = new mongoose.Schema<IAccreditation>({
	name: { type: String, required: true },
	description: { type: String, required: true },
	accessLevel: { type: Number, required: true },
	authorizations: { type: Object, required: true },
});

export const Accreditation = mongoose.models.Accreditation || mongoose.model<IAccreditation>('Accreditation', accreditationSchema);

import mongoose, { Document } from 'mongoose';

export interface IProject extends Document {
	_id: string;
	name: string;
	description: string;
	members: {
		userId: string;
		accreditation: string;
	}[];
}

const projectSchema = new mongoose.Schema<IProject>({
	name: { type: String, required: true },
	description: { type: String, required: true },
	owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	members: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, accreditation: { type: mongoose.Schema.Types.ObjectId, ref: 'Accreditation' } }],
});

export const Project = mongoose.models.Project || mongoose.model<IProject>('Project', projectSchema);

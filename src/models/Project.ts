import mongoose, { Document } from 'mongoose';

export interface IProject extends Document {
	_id: string;
	name: string;
	description: string;
	slug: string;
	createdAt: Date;
	resourcesPolicy: String;
	members: {
		userId: string;
		accreditation: string;
	}[];
}

const projectSchema = new mongoose.Schema<IProject>({
	name: { type: String, required: true },
	description: { type: String, required: true },
	slug: { type: String, required: true },
	createdAt: { type: Date, required: true, default: Date.now },
	resourcesPolicy: { type: mongoose.Schema.Types.ObjectId, ref: 'ResourcesPolicy' },
	members: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, accreditation: { type: mongoose.Schema.Types.ObjectId, ref: 'Accreditation' } }],
});

export const ProjectModel = mongoose.models.Project || mongoose.model<IProject>('Project', projectSchema);

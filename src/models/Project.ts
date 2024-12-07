import mongoose, { Document } from 'mongoose';

export interface IProject extends Document {
	_id: string;
	name: string;
	description: string;
	slug: string;
	createDate: Date;
	members: {
		userId: string;
		accreditation: string;
	}[];
}

const projectSchema = new mongoose.Schema<IProject>({
	name: { type: String, required: true },
	description: { type: String, required: true },
	slug: { type: String, required: true },
	createDate: { type: Date, required: true, default: Date.now },
	members: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, accreditation: { type: mongoose.Schema.Types.ObjectId, ref: 'Accreditation' } }],
});

export const ProjectModel = mongoose.models.Project || mongoose.model<IProject>('Project', projectSchema);

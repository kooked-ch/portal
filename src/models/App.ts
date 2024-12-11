import mongoose, { Document } from 'mongoose';

export interface IApp extends Document {
	_id: string;
	name: string;
	collaborators: {
		userId: string;
		accreditation: string;
	}[];
}

const appSchema = new mongoose.Schema<IApp>({
	name: { type: String, required: true },
	collaborators: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, accreditation: { type: mongoose.Schema.Types.ObjectId, ref: 'Accreditation' } }],
});

export const AppModel = mongoose.models.App || mongoose.model<IApp>('App', appSchema);

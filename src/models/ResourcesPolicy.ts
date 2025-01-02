import mongoose, { Document } from 'mongoose';

export interface IResourcesPolicy extends Document {
	_id: string;
	name: string;
	description: string;
	accessLevel: number;
	slug: string;
	limitation: object;
}

const resourcesPolicySchema = new mongoose.Schema<IResourcesPolicy>({
	name: { type: String, required: true },
	description: { type: String, required: true },
	accessLevel: { type: Number, required: true },
	slug: { type: String, required: true },
	limitation: { type: Object, required: true },
});

export const ResourcesPolicyModel = mongoose.models.ResourcesPolicy || mongoose.model<IResourcesPolicy>('ResourcesPolicy', resourcesPolicySchema);

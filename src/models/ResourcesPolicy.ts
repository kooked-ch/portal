import mongoose, { Document } from 'mongoose';

export interface IResourcesPolicy extends Document {
	_id: string;
	name: string;
	description: string;
	accessLevel: number;
	authorizations: object;
}

const resourcesPolicySchema = new mongoose.Schema<IResourcesPolicy>({
	name: { type: String, required: true },
	description: { type: String, required: true },
	accessLevel: { type: Number, required: true },
	authorizations: { type: Object, required: true },
});

export const ResourcesPolicyModel = mongoose.models.ResourcesPolicy || mongoose.model<IResourcesPolicy>('ResourcesPolicy', resourcesPolicySchema);

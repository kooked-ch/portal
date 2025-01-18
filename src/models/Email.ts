import mongoose, { Document } from 'mongoose';

export interface IEmail extends Document {
	_id: string;
	email: string;
	type: 'reset' | 'verification' | 'welcome' | 'invitation';
	token: string;
	createdAt: Date;
	data?: any;
}

const emailSchema = new mongoose.Schema<IEmail>({
	email: { type: String, required: true },
	type: { type: String, required: true },
	token: { type: String, required: true },
	createdAt: { type: Date, required: true, default: Date.now },
	data: { type: Object },
});

export const EmailModel = mongoose.models.Email || mongoose.model<IEmail>('Email', emailSchema);

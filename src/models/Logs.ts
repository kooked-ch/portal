import mongoose, { Document } from 'mongoose';

export interface ILogs extends Document {
	_id: string;
	message: string;
	type: string;
	userId: String;
	appId: String;
	timestamp: Date;
}

const logsSchema = new mongoose.Schema<ILogs>({
	message: { type: String, required: true },
	type: { type: String, required: true, default: 'info' },
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	appId: { type: mongoose.Schema.Types.ObjectId, ref: 'App' },
	timestamp: { type: Date, required: true, default: Date.now },
});

export const LogsModel = mongoose.models.Logs || mongoose.model<ILogs>('Logs', logsSchema);

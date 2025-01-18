export interface InvitationType {
	project: {
		name: string;
		description: string;
	};
	app: {
		name: string;
		description: string;
	};
	token: string;
}

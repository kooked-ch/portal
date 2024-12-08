export interface AppsType {
	name: string;
	description: string;
	createdAt: Date;
	repository: {
		url: string;
		image: string;
		version: string;
	};
}

export interface AppType {
	name: string;
	description: string;
	createdAt: Date;
	repository: {
		url: string;
		image: string;
		version: string;
	} | null;
	replicas: number;
	domains: {
		url: string;
		port: number;
		container: string;
	}[];
	databases: {
		name: string;
		password: string;
		provider: string;
		user: string;
	}[];
	containers: {
		name: string;
		image: string;
		env: {
			key: string;
			value: string;
		}[];
	}[];
}

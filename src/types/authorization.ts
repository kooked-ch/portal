export interface AppAuthorizationsType {
	containers: string[];
	domains: string[];
	databases: string[];
	secrets: string[];
	collaborators: string[];
	volumes: string[];
}

export interface ProjectAuthorizationsType {
	projects?: string[];
	resourcesPolicy?: string[];
	members?: string[];
	apps?: string[];
}

export interface UserAuthorizationsType {
	projects?: string[];
	apps?: string[];
	users?: string[];
	containers?: string[];
	domains?: string[];
	databases?: string[];
	volumes?: string[];
	resourcesPolicy?: string[];
}

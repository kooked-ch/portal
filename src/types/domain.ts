export interface DomainType {
	url: string;
	port: number;
	container: string;
	monitor?: DomainMonitorType;
}

export interface DomainMonitorType {
	responseTime: number;
	averageReponseTime: number;
	uptime: number;
	responseTimeHistory: {
		id: number;
		time: string;
		value: number;
		status: boolean;
	}[];
}

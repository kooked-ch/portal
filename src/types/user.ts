import { AccreditationType } from './accreditations';

export interface AllProjectUsers {
	users: {
		username: string;
		image: string;
		id: string;
		accreditation: AccreditationType;
	}[];
	accreditationsList: AccreditationType[];
}

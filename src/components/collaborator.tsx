import React from 'react';
import { Container, Globe, Database, KeyRound, UsersRound, Text } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppType } from '@/types/app';
import { AccreditationType } from '@/types/accreditations';

export default function CollaboratorsTab({ collaborators, accreditations }: { collaborators: AppType['collaborators']; accreditations: AccreditationType[] }) {
	return (
		<ul className="space-y-2">
			{collaborators.map((collaborator) => {
				return (
					<li key={collaborator.username} className="bg-[#18181a] rounded-lg flex justify-between px-4 py-3 items-center h-[68px] border-l-4 border-blue-500">
						<div className="flex items-center space-x-3">
							<Avatar className="h-8 w-8">
								<AvatarImage src={collaborator.image} />
								<AvatarFallback>{collaborator.username.slice(0, 2).toUpperCase()}</AvatarFallback>
							</Avatar>
							<div>
								<span className="text-white font-medium">{collaborator.username}</span>
							</div>
						</div>
						<div className="flex items-center space-x-3 text-gray-500">
							{collaborator.accreditation.authorizations.containers.length === 4 && <Container className="w-5 h-5" />}
							{collaborator.accreditation.authorizations.databases.length === 4 && <Database className="w-5 h-5" />}
							{collaborator.accreditation.authorizations.domains.length === 4 && <Globe className="w-5 h-5" />}
							{collaborator.accreditation.authorizations.secrets.length === 2 && <KeyRound className="w-5 h-5" />}
							{collaborator.accreditation.authorizations.logs.length === 1 && <Text className="w-5 h-5" />}
							{collaborator.accreditation.authorizations.collaborators.length === 4 && <UsersRound className="w-5 h-5" />}
						</div>
						<Select defaultValue={collaborator.accreditation.slug} onValueChange={(value) => console.log(value)}>
							<SelectTrigger className="w-40">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{accreditations.map((accreditation) => (
									<SelectItem key={accreditation.slug} value={accreditation.slug}>
										{accreditation.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</li>
				);
			})}
		</ul>
	);
}

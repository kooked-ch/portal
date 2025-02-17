'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import { AllProjectUsers } from '@/types/user';
import { usePathname, useRouter } from 'next/navigation';

export default function UsersEditor({ allProjectUsers }: { allProjectUsers: AllProjectUsers }) {
	const [selectedAccreditations, setSelectedAccreditations] = useState<{ [userId: string]: string }>({});
	const [loading, setLoading] = useState<{ [userId: string]: boolean }>({});
	const [searchQuery, setSearchQuery] = useState('');
	const pathname = usePathname();
	const router = useRouter();

	const handleAccreditationChange = async (userId: string, newValue: string) => {
		setSelectedAccreditations((prev) => ({
			...prev,
			[userId]: newValue,
		}));
		setLoading((prev) => ({ ...prev, [userId]: true }));

		try {
			const response = await fetch(`/api/project/${pathname.split('/')[1]}/users/${userId}/accreditation`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ accreditation: newValue }),
			});

			if (!response.ok || response.status !== 200) {
				const error = await response.json();
				console.error('API Error:', error);
			} else {
				router.refresh();
			}
		} catch (error) {
			console.error('API Error:', error);
		} finally {
			setLoading((prev) => ({ ...prev, [userId]: false }));
		}
	};

	const filteredUsers = allProjectUsers.users.filter((user) => user.username.toLowerCase().includes(searchQuery.toLowerCase()));

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between mt-3 sm:mt-0">
				<h1 className="text-3xl font-bold">Project Users</h1>
				<div className="sm:flex relative hidden">
					<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8" />
				</div>
			</div>

			<ScrollArea className="h-[600px]">
				<div className="space-y-4">
					{filteredUsers.map((user) => (
						<div key={user.id} className="flex items-center justify-between p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
							<div className="flex items-center sm:space-x-4 space-x-2">
								<Avatar className="sm:size-10 size-8">
									<AvatarImage src={user.image} alt={user.username} />
									<AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
								</Avatar>
								<div>
									<h3 className="sm:text-base text-xs font-medium">{user.username}</h3>
								</div>
							</div>

							<div className="flex items-center space-x-4">
								<p className="text-sm text-muted-foreground hidden sm:flex">{user.accreditation.description}</p>
								<Select value={selectedAccreditations[user.id] || user.accreditation.slug} onValueChange={(newValue) => handleAccreditationChange(user.id, newValue)} disabled={loading[user.id] || user.accreditation.slug === 'own'}>
									<SelectTrigger className="w-40">
										<SelectValue placeholder="Select role" />
									</SelectTrigger>
									<SelectContent>
										{allProjectUsers.accreditationsList
											.filter((accreditation) => accreditation.slug !== 'own' || user.accreditation.slug === 'own')
											.map((accreditation) => (
												<SelectItem key={accreditation.slug} value={accreditation.slug}>
													{accreditation.name}
												</SelectItem>
											))}
									</SelectContent>
								</Select>
							</div>
						</div>
					))}
				</div>
			</ScrollArea>
		</div>
	);
}

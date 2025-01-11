'use client';

import { useState } from 'react';
import { ArrowUpRight, GitBranch, Globe, HardDrive, FileJson, Bell, Plus, Container, Info, UserRound, Text } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AppType } from '@/types/app';
import Link from 'next/link';
import CreateContainerDialog from './forms/CreateContainerForm';
import { ContainerItem } from './container';
import { DomainStatus } from './domain';
import useFetch from '@/hooks/useFetch';
import { usePathname } from 'next/navigation';
import CreateDomainDialog from './forms/CreateDomainForm';
import LogViewer from './log';
import CreateDatabaseDialog from './forms/CreateDatabaseForm';
import { DatabaseItem } from './database';
import CollaboratorsTab from './collaborator';
import InviteCollaboratorsDialog from './forms/InviteCollaboratorsDialog';

type Tab = 'Containers' | 'Domains' | 'Logs' | 'Info' | 'Volumes' | 'Notifications' | 'Collaborators';

const TabButton = ({ tab, selectedTab, onClick, className = '' }: { tab: Tab; selectedTab: Tab; onClick: () => void; className?: string }) => (
	<button className={cn('px-3 py-2 text-sm whitespace-nowrap flex items-center gap-2', selectedTab === tab ? 'border-b-2 border-purple-500 text-white' : 'text-[#666] hover:text-white', className)} onClick={onClick}>
		{tab === 'Containers' && <Container className="w-4 h-4" />}
		{tab === 'Domains' && <Globe className="w-4 h-4" />}
		{tab === 'Volumes' && <HardDrive className="w-4 h-4" />}
		{tab === 'Notifications' && <Bell className="w-4 h-4" />}
		{tab === 'Logs' && <Text className="w-4 h-4" />}
		{tab === 'Info' && <Info className="w-4 h-4" />}
		{tab === 'Collaborators' && <UserRound className="w-4 h-4" />}
		{tab}
	</button>
);

export default function AppView({ app }: { app: AppType }) {
	const [selectedTab, setSelectedTab] = useState<Tab>('Containers');
	const pathname = usePathname();
	const { data: domainsDetails, loading: domainsLoading, error: domainsError, refetch: domainRefetch } = useFetch(`/api/project${pathname}/domains`);

	const VolumeCard = ({ name, used, total }: { name: string; used: number; total: number }) => {
		const percentage = (used / total) * 100;
		const isHighUsage = percentage > 80;

		return (
			<Card className="p-6 bg-gradient-to-br from-[#1E1E20] to-[#1A1A1C] border-none hover:shadow-lg transition-all duration-200">
				<div className="flex justify-between items-center mb-4">
					<div className="flex items-center gap-2">
						<HardDrive className="w-5 h-5 text-purple-400" />
						<h3 className="font-medium">{name}</h3>
					</div>
					<span className={cn('text-sm font-medium px-3 py-1 rounded-full', isHighUsage ? 'bg-red-500/20 text-red-400' : 'bg-purple-500/20 text-purple-400')}>
						{used}GB / {total}GB
					</span>
				</div>
				<div className="space-y-2">
					<Progress value={percentage} className={cn('h-2 transition-all duration-500', isHighUsage ? 'bg-red-500/20' : 'bg-purple-500/20')} />
					<p className="text-xs text-[#666] text-right">{percentage.toFixed(1)}% used</p>
				</div>
			</Card>
		);
	};

	const NotificationSettings = () => (
		<div className="space-y-6">
			<Card className="bg-gradient-to-br from-[#1E1E20] to-[#1A1A1C] border-none p-6 space-y-4">
				<div className="flex items-center gap-3 mb-2">
					<div className="p-2 rounded-lg bg-purple-500/20">
						<Bell className="w-5 h-5 text-purple-400" />
					</div>
					<h3 className="font-medium text-lg">Telegram Notifications</h3>
				</div>
				<div className="grid sm:grid-cols-2 gap-4">
					<div className="space-y-2">
						<label className="text-sm text-[#666]">Bot Token</label>
						<input type="text" placeholder="Enter bot token" className="w-full bg-black/20 border border-[#2A2A2C]/50 rounded-lg p-3 text-sm placeholder:text-[#666] focus:border-purple-500/50 focus:outline-none transition-colors" />
					</div>
					<div className="space-y-2">
						<label className="text-sm text-[#666]">Chat ID</label>
						<input type="text" placeholder="Enter chat ID" className="w-full bg-black/20 border border-[#2A2A2C]/50 rounded-lg p-3 text-sm placeholder:text-[#666] focus:border-purple-500/50 focus:outline-none transition-colors" />
					</div>
				</div>
			</Card>

			<Card className="bg-gradient-to-br from-[#1E1E20] to-[#1A1A1C] border-none p-6 space-y-4">
				<div className="flex items-center gap-3 mb-2">
					<div className="p-2 rounded-lg bg-purple-500/20">
						<Bell className="w-5 h-5 text-purple-400" />
					</div>
					<h3 className="font-medium text-lg">Email Notifications</h3>
				</div>
				<div className="space-y-4">
					{['Deployment Status', 'Resource Usage', 'Security Alerts'].map((setting) => (
						<label key={setting} className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-[#2A2A2C]/50 hover:border-purple-500/30 transition-colors">
							<input type="checkbox" className="rounded bg-[#2A2A2C] border-none text-purple-500 focus:ring-purple-500/50 focus:ring-offset-0" />
							<span className="text-sm">{setting}</span>
						</label>
					))}
				</div>
			</Card>
		</div>
	);

	const mainTabs: Tab[] = ['Containers', 'Domains', 'Volumes', 'Notifications', ...(app.logs.length > 0 ? (['Logs'] as Tab[]) : []), ...(app.collaborators.length > 0 ? (['Collaborators'] as Tab[]) : [])];
	const asideTabs: Tab[] = ['Info'];
	const allTabs = [...mainTabs, ...asideTabs];

	const renderContent = () => {
		switch (selectedTab) {
			case 'Volumes':
				return (
					<div className="space-y-4">
						<div className="flex justify-between items-center gap-4">
							<h2 className="text-xl font-semibold">Storage Volumes</h2>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							<VolumeCard name="Primary Storage" used={150} total={500} />
							<VolumeCard name="Backup Storage" used={75} total={200} />
						</div>
					</div>
				);
			case 'Notifications':
				return (
					<div className="space-y-4">
						<h2 className="text-xl font-semibold">Notification Settings</h2>
						<NotificationSettings />
					</div>
				);

			case 'Info':
				return (
					<div className="space-y-6">
						{app?.repository?.url.trim() && (
							<div className="space-y-2">
								<div className="text-sm text-[#666] uppercase font-medium">Repository</div>
								<a href={app.repository.url} target="_blank" className="flex items-center space-x-2 text-white hover:text-purple-400 break-all">
									<GitBranch className="w-4 h-4 flex-shrink-0" />
									<span>{app.repository.url.replace('https://github.com/', '').replace(/\/$/, '')}</span>
									<ArrowUpRight className="w-4 h-4 flex-shrink-0" />
								</a>
							</div>
						)}

						{app.domains.length > 0 && (
							<div className="space-y-2">
								<div className="text-sm text-[#666] uppercase font-medium">Domains</div>
								{app.domains.map((domain, index) => (
									<Link key={'domain' + index} href={`https://${domain.url}`} target="_blank" className="flex gap-1 justify-start items-center text-purple-500 break-all">
										<Globe className="w-4 h-4 mt-[0.2rem] flex-shrink-0" />
										<p className="hover:underline">{domain.url}</p>
									</Link>
								))}
							</div>
						)}

						{app.collaborators.length > 0 && (
							<div className="space-y-2">
								<div className="text-sm text-[#666] uppercase font-medium">Collaborators</div>
								<div className="flex flex-wrap items-center gap-2">
									{app.collaborators.map((collaborator, index) => (
										<Avatar key={'collaborator' + index} className="border shadow-sm w-8 sm:w-10 h-8 sm:h-10">
											<AvatarImage src={collaborator.image} alt={collaborator.username} />
											<AvatarFallback>
												{collaborator.username
													?.split(' ')
													.map((word) => word.charAt(0).toUpperCase())
													.join('')}
											</AvatarFallback>
										</Avatar>
									))}
								</div>
							</div>
						)}
					</div>
				);

			case 'Containers':
				return (
					<div className="space-y-4">
						<div className="flex justify-between items-center gap-4">
							<h2 className="text-xl font-semibold">Containers</h2>
							{app.authorizations.containers.includes('create') && <CreateContainerDialog disabled={app.resourcesPolicy.containers.remainingLimit === 0} />}
						</div>
						{app.containers.length === 0 ? (
							<div className="bg-[#1E1E20] p-4 rounded-lg text-[#666] text-sm">No containers found</div>
						) : (
							<ul className="space-y-2">
								{app.containers.map((container, index) => (
									<ContainerItem key={'containerStatus' + index} container={container} authorizations={app.authorizations} />
								))}
							</ul>
						)}

						<div className="flex justify-between items-center gap-4 mt-6">
							<h2 className="text-xl font-semibold">Databases</h2>
							{app.authorizations.databases.includes('create') && <CreateDatabaseDialog disabled={app.resourcesPolicy.databases.remainingLimit === 0} />}
						</div>
						{app.databases.length === 0 ? (
							<div className="bg-[#1E1E20] p-4 rounded-lg text-[#666] text-sm">No databases found</div>
						) : (
							<ul className="space-y-2">
								{app.databases.map((database, index) => (
									<DatabaseItem key={'databaseItem' + index} database={database} authorizations={app.authorizations} />
								))}
							</ul>
						)}
					</div>
				);

			case 'Domains':
				return (
					<div className="space-y-4">
						<div className="flex justify-between items-center gap-4">
							<h2 className="text-xl font-semibold">Domains</h2>
							{app.authorizations.domains.includes('create') && <CreateDomainDialog disabled={app.resourcesPolicy.domains.remainingLimit === 0 || app.containers.length === 0} containersList={app.containers.map((container) => container.name)} refetch={domainRefetch} />}
						</div>
						{app.domains.length === 0 ? (
							<div className="bg-[#1E1E20] p-4 rounded-lg text-[#666] text-sm">No domains found</div>
						) : (
							<ul className="space-y-2">
								{app.domains.map((domain, index) => (
									<DomainStatus key={'domainStatus' + index} domain={domain} containersList={app.containers.map((container) => container.name)} monitoringData={Array.isArray(domainsDetails) ? domainsDetails.find((details: any) => details.url === domain.url)?.monitor : {}} authorizations={app.authorizations} />
								))}
							</ul>
						)}
					</div>
				);

			case 'Logs':
				return (
					<div className="space-y-4">
						<h2 className="text-xl font-semibold">Logs</h2>
						<LogViewer logs={app.logs} collaborators={app.collaborators} />
					</div>
				);
			case 'Collaborators':
				return (
					<div className="space-y-4">
						<div className="flex justify-between items-center gap-4">
							<h2 className="text-xl font-semibold">Collaborators</h2>
							{app.authorizations.collaborators.includes('invite') && <InviteCollaboratorsDialog />}
						</div>
						<CollaboratorsTab collaborators={app.collaborators} accreditations={app.accreditations} />
					</div>
				);
		}
	};

	return (
		<div className="mx-auto p-4 sm:p-6 sm:pt-0 pt-0">
			<div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
				<div className="space-y-6">
					<div className="flex flex-col sm:flex-row justify-between gap-4">
						<div>
							<h1 className="text-3xl sm:text-4xl font-bold break-words">{app?.name}</h1>
							<p className="text-muted-foreground md:mt-2">{app?.description}</p>
						</div>
					</div>

					<div className="flex space-x-1 border-b border-[#1F1F23] overflow-x-auto">
						{allTabs.map((tab) => (
							<TabButton key={tab} tab={tab} selectedTab={selectedTab} onClick={() => setSelectedTab(tab)} className={cn(asideTabs.includes(tab) && 'lg:hidden')} />
						))}
					</div>

					<div className="lg:hidden">{renderContent()}</div>
					<div className="hidden lg:block">{mainTabs.includes(selectedTab) && renderContent()}</div>
				</div>

				<aside className="hidden lg:block space-y-6">
					<div className="space-y-6">
						<Card className="bg-[#0E1E25] border-none overflow-hidden">
							<div className="aspect-video bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
								<div className="grid grid-cols-3 gap-2">
									{Array.from({ length: 9 }).map((_, i) => (
										<div key={'image' + i} className="w-4 h-4 rounded-full" style={{ backgroundColor: `hsla(${220 + i * 20}, 70%, 60%, ${0.5 + i * 0.05})` }} />
									))}
								</div>
							</div>
						</Card>

						{app?.repository?.url.trim() && (
							<div className="space-y-2">
								<div className="text-sm text-[#666] uppercase font-medium">Repository</div>
								<a href={app.repository.url} target="_blank" className="flex items-center space-x-2 text-white hover:text-purple-400 break-all">
									<GitBranch className="w-4 h-4 flex-shrink-0" />
									<span>{app.repository.url.replace('https://github.com/', '').replace(/\/$/, '')}</span>
									<ArrowUpRight className="w-4 h-4 flex-shrink-0" />
								</a>
							</div>
						)}

						{app.domains.length > 0 && (
							<div className="space-y-2">
								<div className="text-sm text-[#666] uppercase font-medium">Domains</div>
								{app.domains.map((domain, index) => (
									<Link key={'domain' + index} href={`https://${domain.url}`} target="_blank" className="flex gap-1 justify-start items-center text-purple-500 break-all">
										<Globe className="w-4 h-4 mt-[0.2rem] flex-shrink-0" />
										<p className="hover:underline">{domain.url}</p>
									</Link>
								))}
							</div>
						)}

						{app.collaborators.length > 0 && (
							<div className="space-y-2">
								<div className="text-sm text-[#666] uppercase font-medium">Collaborators</div>
								<div className="flex flex-wrap items-center gap-2">
									{app.collaborators.map((collaborator, index) => (
										<Avatar key={'collaborator' + index} className="border shadow-sm w-8 sm:w-10 h-8 sm:h-10">
											<AvatarImage src={collaborator.image} alt={collaborator.username} />
											<AvatarFallback>
												{collaborator.username
													?.split(' ')
													.map((word) => word.charAt(0).toUpperCase())
													.join('')}
											</AvatarFallback>
										</Avatar>
									))}
								</div>
							</div>
						)}
					</div>
				</aside>
			</div>
		</div>
	);
}

'use client';

import { useState } from 'react';
import { ArrowUpRight, GitBranch, Globe, Edit2, Trash2, Plus, Server, Database, CircleX } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AppType } from '@/types/app';
import Link from 'next/link';
import CreateContainerDialog from './forms/CreateContainerForm';
import { ContainerStatus } from './container';
import { DomainStatus } from './domain';
import useFetch from '@/hooks/useFetch';
import { usePathname } from 'next/navigation';
import CreateDomainDialog from './forms/CreateDomainForm';
import LogViewer from './log';

export default function DeploymentInterface({ app }: { app: AppType }) {
	const [selectedTab, setSelectedTab] = useState<Tab>('Containers');
	const pathname = usePathname();
	const { data: domainsDetails, loading: domainsLoading, error: domainsError, refetch: domainRefetch } = useFetch(`/api/project${pathname}/domains`);

	const TABS = ['Containers', 'Domains', ...(app.logs.length > 0 ? ['Logs'] : [])] as const;
	type Tab = (typeof TABS)[number];

	return (
		<div className="mx-auto p-6 pt-0">
			<div className="grid grid-cols-[2fr,1fr] gap-6">
				<div className="space-y-6">
					<div className="flex justify-between">
						<div className="space-y-6">
							<div>
								<h1 className="text-4xl font-bold">{app?.name}</h1>
								<p className="text-muted-foreground mt-2">{app?.description}</p>
							</div>
						</div>
					</div>

					<div className="flex space-x-1 border-b border-[#1F1F23]">
						{TABS.map((tab, index) => (
							<button key={'tabs' + index} className={cn('px-4 py-2 text-sm', selectedTab === tab ? 'border-b-2 border-purple-500 text-white' : 'text-[#666] hover:text-white')} onClick={() => setSelectedTab(tab)}>
								{tab}
							</button>
						))}
					</div>

					<div>
						{selectedTab === 'Containers' && (
							<div className="space-y-4">
								<div className="flex justify-between items-center">
									<h2 className="text-xl font-semibold">Containers</h2>
									<CreateContainerDialog />
								</div>
								{app.containers.length === 0 && <div className="bg-[#1E1E20] p-4 rounded-lg text-[#666] text-sm">No containers found</div>}
								<ul className="space-y-2">
									{app.containers.map((container, index) => (
										<ContainerStatus key={'container' + index} container={container} />
									))}
								</ul>
								<div className="flex justify-between items-center">
									<h2 className="text-xl font-semibold mt-6">Databases</h2>
									<Button variant="outline" size="sm" className="mt-4">
										<Plus className="w-4 h-4" /> Add Database
									</Button>
								</div>
								{app.databases.length === 0 && <div className="bg-[#1E1E20] p-4 rounded-lg text-[#666] text-sm">No databases found</div>}
								<ul className="space-y-2">
									{app.databases.map((database, index) => {
										const dbStatus = database.status;
										const isRunning = dbStatus.state === 'Running';

										return (
											<li key={'databases' + index} className={cn('flex justify-between bg-[#1E1E20] px-4 py-3 rounded-lg items-center', isRunning ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500')}>
												<div className="flex items-center space-x-3">
													<Database className={cn('w-5 h-5', isRunning ? 'text-green-500' : 'text-red-500')} />
													<div className="flex flex-col">
														<span className="text-white font-medium">{database.name}</span>
														<p className="text-[#666] text-sm">{database.provider}</p>
													</div>
												</div>
												<div className="flex items-center space-x-3">
													<span className={cn('text-sm font-medium', isRunning ? 'text-green-500' : 'text-red-500')}>{dbStatus.state}</span>
													<div className="flex space-x-2">
														<Button variant="ghost" size="icon">
															<Edit2 className="w-4 h-4" />
														</Button>
														<Button variant="ghost" size="icon">
															<Trash2 className="w-4 h-4" />
														</Button>
													</div>
												</div>
											</li>
										);
									})}
								</ul>
							</div>
						)}

						{selectedTab === 'Domains' && (
							<div className="space-y-4">
								<div className="flex justify-between items-center">
									<h2 className="text-xl font-semibold">Domains</h2>
									<CreateDomainDialog containersList={app.containers.map((container) => container.name)} refetch={domainRefetch} />
								</div>
								{app.domains.length === 0 && <div className="bg-[#1E1E20] p-4 rounded-lg text-[#666] text-sm">No domains found</div>}
								<ul className="space-y-2">
									{app.domains.map((domain, index) => (
										<DomainStatus key={'domain' + index} domain={domain} monitoringData={Array.isArray(domainsDetails) ? domainsDetails.find((details: any) => details.url === domain.url)?.monitor : {}} />
									))}
								</ul>
							</div>
						)}

						{selectedTab === 'Logs' && (
							<div className="space-y-4">
								<h2 className="text-xl font-semibold">Logs</h2>
								<LogViewer logs={app.logs} collaborators={app.collaborators} />
							</div>
						)}
					</div>
				</div>

				<div>
					<Card className="bg-[#0E1E25] border-none overflow-hidden">
						<div className="aspect-video bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
							<div className="grid grid-cols-3 gap-2">
								{Array.from({ length: 9 }).map((_, i) => (
									<div
										key={i}
										className="w-4 h-4 rounded-full"
										style={{
											backgroundColor: `hsla(${220 + i * 20}, 70%, 60%, ${0.5 + i * 0.05})`,
										}}
									/>
								))}
							</div>
						</div>
					</Card>
					{app?.repository?.url.trim() != '' && (
						<div className="space-y-2 mt-6">
							<div className="text-sm text-[#666] uppercase font-medium">Repository</div>
							<a href={app?.repository?.url} target="_blank" className="flex items-center space-x-2 text-white hover:text-purple-400">
								<GitBranch className="w-4 h-4" />
								<span>{app?.repository?.url.replace('https://github.com/', '').replace(/\/$/, '')}</span>
								<ArrowUpRight className="w-4 h-4" />
							</a>
						</div>
					)}
					{app.domains.length > 0 && (
						<div className="space-y-2 mt-6">
							<div className="text-sm text-[#666] uppercase font-medium">Domains</div>
							{app.domains.map((domain, index) => (
								<Link key={'domain' + index} href={'https://' + domain.url} target="_blank" className="flex gap-1 justify-start items-center text-purple-500">
									<Globe className="w-4 h-4 mt-[0.2rem]" />
									<p className="hover:underline">{domain.url}</p>
								</Link>
							))}
						</div>
					)}
					{app.collaborators.length > 0 && (
						<div className="space-y-2 mt-6">
							<div className="text-sm text-[#666] uppercase font-medium">Collaborators</div>
							<div className="flex items-center space-x-2">
								{app.collaborators.map((collaborator, index) => (
									<Avatar className="border shadow-sm w-10 h-10" key={'collaborator' + index}>
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
			</div>
		</div>
	);
}

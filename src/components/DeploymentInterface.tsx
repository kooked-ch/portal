'use client';

import { useState } from 'react';
import { ArrowUpRight, GitBranch, Globe, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AppType } from '@/types/app';
import Link from 'next/link';

const TABS = ['Containers', 'Domains', 'Logs'] as const;
type Tab = (typeof TABS)[number];

export default function DeploymentInterface({ app }: { app: AppType }) {
	const [selectedTab, setSelectedTab] = useState<Tab>('Containers');

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
						{TABS.map((tab) => (
							<button className={cn('px-4 py-2 text-sm', selectedTab === tab ? 'border-b-2 border-purple-500 text-white' : 'text-[#666] hover:text-white')} key={tab} onClick={() => setSelectedTab(tab)}>
								{tab}
							</button>
						))}
					</div>

					<div>
						{selectedTab === 'Containers' && (
							<div className="space-y-4">
								<h2 className="text-xl font-semibold">Containers</h2>
								<ul className="space-y-2">
									{app.containers.map((container, index) => (
										<li key={index} className="flex justify-between bg-[#1E1E20] px-4 py-2 rounded-lg">
											<span className="text-white">{container.name}</span>
											<span className="text-[#666]">{container.image}</span>
										</li>
									))}
								</ul>
								<h2 className="text-xl font-semibold">Databases</h2>
								<ul className="space-y-2">
									{app.databases.map((database, index) => (
										<li key={index} className="flex justify-between bg-[#1E1E20] px-4 py-2 rounded-lg">
											<span className="text-white">{database.name}</span>
											<span className="text-[#666]">{database.provider}</span>
										</li>
									))}
								</ul>
							</div>
						)}

						{selectedTab === 'Domains' && (
							<div className="space-y-4">
								<h2 className="text-xl font-semibold">Domains</h2>
								<ul className="space-y-2">
									{app.domains.map((domain, index) => (
										<li key={index} className="flex justify-between bg-[#1E1E20] px-4 py-2 rounded-lg">
											<span className="text-white">{domain.url}</span>
											<span className="text-[#666]">Port: {domain.port}</span>
										</li>
									))}
								</ul>
							</div>
						)}

						{selectedTab === 'Logs' && (
							<div className="space-y-4">
								<h2 className="text-xl font-semibold">Logs</h2>
								<div className="bg-[#1E1E20] p-4 rounded-lg h-48 overflow-y-auto">
									<pre className="text-sm text-[#666]">
										{`2024-12-02T12:01:15Z: Container web started successfully.
2024-12-02T12:05:22Z: Connected to database.
2024-12-02T12:10:05Z: GET request received on /convert
2024-12-02T12:11:33Z: Conversion completed successfully.`}
									</pre>
								</div>
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
							<a href={app?.repository?.url} className="flex items-center space-x-2 text-white hover:text-purple-400">
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
								<Link key={'domain' + index} href={'https://' + domain.url} target="_blank" className="flex gap-2 items-center text-purple-500">
									<Globe className="w-4 h-4" />
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

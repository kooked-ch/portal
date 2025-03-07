'use client';
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LayoutGrid, List, Search, ArrowUpCircle, ArrowDownCircle, Activity, Database, Globe, SortAsc, ArrowUpDown, SortDesc } from 'lucide-react';
import { ProjectType } from '@/types/project';
import { CreateAppForm } from './forms/CreateAppFrom';
import { useRouter } from 'next/navigation';
import { AppsType } from '@/types/app';
import { ProjectDropdown } from './projectDropdown';

const getAppStatus = (app: AppsType) => {
	const containersReady = app.containers.every((container) => container.status.every((status) => status.ready));
	const databasesReady = app.databases.every((db) => db.status.replicas.ready === db.status.replicas.desired);
	const domainsReady = app.domains.every((domain) => domain.status);
	return containersReady && databasesReady && domainsReady;
};

const calculateUptime = (app: AppsType) => {
	const totalComponents = app.containers.length + app.databases.length + app.domains.length;
	const readyComponents = app.containers.filter((container) => container.status.every((status) => status.ready)).length + app.databases.filter((db) => db.status.replicas.ready === db.status.replicas.desired).length + app.domains.filter((domain) => domain.status).length;
	if (totalComponents === 0) return null;
	return (readyComponents / totalComponents) * 100;
};

export default function ProjectView({ project }: { project: ProjectType }) {
	const [view, setView] = useState('list');
	const [searchQuery, setSearchQuery] = useState('');
	const [sortBy, setSortBy] = useState('name');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
	const [statusFilter, setStatusFilter] = useState('all');

	const router = useRouter();

	const totalApps = project.apps.length;
	const onlineApps = project.apps.filter((app) => getAppStatus(app)).length;
	const offlineApps = totalApps - onlineApps;
	const totalDatabases = project.apps.reduce((acc, app) => acc + app.databases.length, 0);
	const totalDomains = project.apps.reduce((acc, app) => acc + app.domains.length, 0);
	const validUptimes = project.apps.map(calculateUptime).filter((uptime) => uptime !== null);
	const uptimes = validUptimes.length === 0 ? 100 : validUptimes.reduce((acc, uptime) => acc + uptime, 0) / validUptimes.length;
	const averageUptime = project.apps.length === 0 ? 100 : uptimes;

	const handleAppCreated = () => {
		router.refresh();
	};

	const filteredAndSortedApps = project.apps
		.filter((app) => {
			const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || app.description.toLowerCase().includes(searchQuery.toLowerCase());
			const appStatus = getAppStatus(app);
			const matchesStatus = statusFilter === 'all' ? true : statusFilter === 'online' ? appStatus : !appStatus;
			return matchesSearch && matchesStatus;
		})
		.sort((a, b) => {
			let comparison = 0;
			switch (sortBy) {
				case 'name':
					comparison = a.name.localeCompare(b.name);
					break;
				case 'status':
					comparison = Number(getAppStatus(b)) - Number(getAppStatus(a));
					break;
				case 'date':
					comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
					break;
				case 'uptime':
					if (calculateUptime(a) === null) return 1;
					comparison = (calculateUptime(b) as number) - (calculateUptime(a) as number);
					break;
				default:
					comparison = 0;
			}
			return sortOrder === 'asc' ? comparison : -comparison;
		});

	const AppCard = ({ app }: { app: AppsType }) => {
		const isOnline = getAppStatus(app);

		return (
			<Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/${project.slug}/${app.name}`)}>
				<CardHeader>
					<div className="flex justify-between items-start">
						<div>
							<CardTitle className="text-xl">{app.name}</CardTitle>
							<CardDescription>{app.description}</CardDescription>
						</div>
						<Badge variant={isOnline ? 'outline' : 'destructive'}>{isOnline ? 'Online' : 'Offline'}</Badge>
					</div>
				</CardHeader>
			</Card>
		);
	};

	const AppList = ({ app }: { app: AppsType }) => {
		const isOnline = getAppStatus(app);

		return (
			<Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/${project.slug}/${app.name}`)}>
				<CardContent className="py-4">
					<div className="flex justify-between items-center">
						<div className="flex items-center gap-4">
							<Activity className="w-5 h-5" />
							<div>
								<div className="font-medium">{app.name}</div>
								<div className="text-sm text-gray-500">{app.description}</div>
							</div>
						</div>
						<Badge variant={isOnline ? 'outline' : 'destructive'}>{isOnline ? 'Online' : 'Offline'}</Badge>
					</div>
				</CardContent>
			</Card>
		);
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">{project.name}</h1>
					<p className="text-gray-500 md:mt-1">
						Managing {totalApps} application{totalApps > 1 && 's'}
					</p>
				</div>
				<div className="flex gap-2">
					{project.authorizations.apps?.includes('create') && <CreateAppForm onAppCreated={handleAppCreated} disabled={project.resourcesPolicy.remainingLimit === 0} />}
					<ProjectDropdown project={project} />
				</div>
			</div>

			<div className="grid grid-cols-6 grid-rows-2 md:grid-rows-1 md:grid-cols-4 xl:grid-cols-5 md:gap-4 gap-2">
				<Card className="col-span-2 md:col-span-1">
					<CardContent className="md:pt-4 md:p-6 pb-0 p-2 pl-3">
						<div className="flex flex-col">
							<span className="md:text-sm text-xs text-gray-500">Online Apps</span>
							<div className="flex items-center md:gap-2 gap-1.5">
								<ArrowUpCircle className="size-4 text-green-500" />
								<span className="md:text-2xl text-lg font-bold">{onlineApps}</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="col-span-2 col-start-3 md:col-span-1 md:col-start-2">
					<CardContent className="md:pt-4 md:p-6 pb-0 p-2 pl-3">
						<div className="flex flex-col">
							<span className="md:text-sm text-xs text-gray-500">Offline Apps</span>
							<div className="flex items-center md:gap-2 gap-1.5">
								<ArrowDownCircle className="size-4 text-red-500" />
								<span className="md:text-2xl text-lg font-bold">{offlineApps}</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="col-span-2 col-start-5 md:col-span-1 md:col-start-3">
					<CardContent className="md:pt-4 md:p-6 pb-0 p-2 pl-3">
						<div className="flex flex-col">
							<span className="md:text-sm text-xs text-gray-500">Average Uptime</span>
							<div className="flex items-center md:gap-2 gap-1.5">
								<Activity className="size-4 text-blue-500" />
								<span className="md:text-2xl text-lg font-bold">{averageUptime === 100 ? averageUptime : averageUptime.toFixed(2)}%</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="col-span-3 row-start-2 md:row-start-1 md:col-span-1 md:col-start-4">
					<CardContent className="md:pt-4 md:p-6 pb-0 p-2 pl-3">
						<div className="flex flex-col">
							<span className="md:text-sm text-xs text-gray-500">Total Databases</span>
							<div className="flex items-center md:gap-2 gap-1.5">
								<Database className="size-4 text-purple-500" />
								<span className="md:text-2xl text-lg font-bold">{totalDatabases}</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="col-span-3 col-start-4 row-start-2 md:row-start-1 md:col-span-1 md:col-start-5">
					<CardContent className="md:pt-4 md:p-6 pb-0 p-2 pl-3">
						<div className="flex flex-col">
							<span className="md:text-sm text-xs text-gray-500">Total Domains</span>
							<div className="flex items-center md:gap-2 gap-1.5">
								<Globe className="size-4 text-orange-500" />
								<span className="md:text-2xl text-lg font-bold">{totalDomains}</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="flex gap-2 flex-wrap md:flex-nowrap">
				<div className="w-full">
					<div className="relative">
						<Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
						<Input placeholder="Search applications..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
					</div>
				</div>
				<div className="flex gap-2 w-full md:w-min">
					<Select value={sortBy} onValueChange={setSortBy}>
						<SelectTrigger className="w-full md:w-[180px]">
							<div className="flex items-center gap-2">
								{sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4 transform rotate-180" />}
								<SelectValue placeholder="Sort by" />
							</div>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="name">Name</SelectItem>
							<SelectItem value="status">Status</SelectItem>
							<SelectItem value="date">Created Date</SelectItem>
							<SelectItem value="uptime">Uptime</SelectItem>
						</SelectContent>
					</Select>

					<div className="flex gap-2">
						<Button variant="outline" size="icon" onClick={() => setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'))}>
							<ArrowUpDown className="h-4 w-4" />
						</Button>
					</div>

					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-full md:w-[180px]">
							<div className="flex items-center gap-2">
								<Activity className="h-4 w-4" />
								<SelectValue placeholder="Filter by status" />
							</div>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Status</SelectItem>
							<SelectItem value="online">Online</SelectItem>
							<SelectItem value="offline">Offline</SelectItem>
						</SelectContent>
					</Select>

					<div className="md:flex gap-2 hidden ">
						<Button variant={view === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setView('grid')}>
							<LayoutGrid className="h-4 w-4" />
						</Button>
						<Button variant={view === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setView('list')}>
							<List className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
			<div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>{filteredAndSortedApps.map((app, index) => (view === 'grid' ? <AppCard key={index} app={app} /> : <AppList key={index} app={app} />))}</div>
		</div>
	);
}

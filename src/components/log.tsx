'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectItem, SelectTrigger, SelectContent, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, Search } from 'lucide-react';
import { logType } from '@/types/log';
import { AppType } from '@/types/app';

export default function LogViewer({ logs, collaborators }: { logs: logType[]; collaborators: AppType['collaborators'] }) {
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCollaborator, setSelectedCollaborator] = useState<string | null>(null);
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const [dateRange, setDateRange] = useState<number>(7);

	const filteredLogs = useMemo(() => {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - dateRange);

		return logs
			.filter((log) => {
				const matchesQuery = log.message.toLowerCase().includes(searchQuery.toLowerCase());
				const matchesCollaborator = selectedCollaborator === 'all' ? true : selectedCollaborator ? log.user === selectedCollaborator : true;
				const matchesDate = new Date(log.date) >= startDate;

				return matchesQuery && matchesCollaborator && matchesDate;
			})
			.sort((a, b) => {
				return sortOrder === 'asc' ? new Date(a.date).getTime() - new Date(b.date).getTime() : new Date(b.date).getTime() - new Date(a.date).getTime();
			});
	}, [logs, searchQuery, selectedCollaborator, sortOrder, dateRange]);

	return (
		<div className="space-y-4">
			<div className="flex gap-2 md:flex-row flex-col">
				<div className="flex flex-row md:flex-col gap-2 md:max-w-[22rem] w-full">
					<div className="w-full">
						<div className="relative h-10">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10 -mt-0.5 w-4 h-4" />
							<Input placeholder="Search logs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 pl-8 py-2" />
						</div>
					</div>
					<Button variant="outline" size="sm" className="flex md:hidden items-center justify-start h-9 w-32" onClick={() => setDateRange((prev) => (prev === 7 ? 30 : 7))}>
						<Calendar className="w-4 h-4" />
						<span>{dateRange === 7 ? 'Last 30 Days' : 'Last 7 Days'}</span>
					</Button>
				</div>
				<div className="flex gap-2">
					<Select onValueChange={(value) => setSelectedCollaborator(value)} defaultValue="">
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Filter by collaborator" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Collaborators</SelectItem>
							{collaborators.map((collaborator, index) => (
								<SelectItem key={index} value={collaborator.username}>
									{collaborator.username}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')} defaultValue="desc">
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Sort by date" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="asc">Ascending</SelectItem>
							<SelectItem value="desc">Descending</SelectItem>
						</SelectContent>
					</Select>

					<Button variant="outline" size="sm" className="hidden md:flex items-center justify-start h-9 w-32" onClick={() => setDateRange((prev) => (prev === 7 ? 30 : 7))}>
						<Calendar className="w-4 h-4" />
						<span>{dateRange === 7 ? 'Last 30 Days' : 'Last 7 Days'}</span>
					</Button>
				</div>
			</div>

			<div className="bg-[#1E1E20] p-4 rounded-lg overflow-y-auto max-h-96">
				{filteredLogs.length > 0 ? (
					<ul className="space-y-2">
						{filteredLogs.map((log, index) => (
							<li key={index} className="flex md:items-center items-start md:justify-between justify-start flex-col md:flex-row border-b border-[#333] pb-2">
								<span className="text-sm text-white">{log.message}</span>
								<span className="text-xs text-[#666]">
									{log.user} - {new Date(log.date).toLocaleString()}
								</span>
							</li>
						))}
					</ul>
				) : (
					<div className="text-sm text-[#666]">No logs match your criteria.</div>
				)}
			</div>
		</div>
	);
}

import React from 'react';
import { Globe, Timer } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DomainMonitorType } from '@/types/domain';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import { cn } from '@/lib/utils';
import DeleteDomainDialog from './forms/DeleteDomainForm';
import EditDomainDialog from './forms/UpdateDomainForm';
import { AppAuthorizationsType } from '@/types/authorization';

const LoadingState = () => (
	<Card className="bg-[#18181a] border-0">
		<CardContent className="p-2 md:p-4 space-y-4">
			<div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between">
				<div className="flex items-center space-x-3">
					<Skeleton className="w-5 h-5 rounded-full" />
					<div className="space-y-2">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-3 w-24" />
					</div>
				</div>
				<div className="grid grid-cols-3 gap-2 w-full md:w-auto">
					{[1, 2, 3].map((i) => (
						<div key={i} className="flex flex-col items-center md:items-end space-y-1">
							<Skeleton className="h-3 w-24" />
							<Skeleton className="h-4 w-16" />
						</div>
					))}
				</div>
			</div>
			<Skeleton className="h-[200px] w-full" />
		</CardContent>
	</Card>
);

const config = {
	value: {
		label: 'Time (ms)',
		color: 'hsl(var(--chart-1))',
		icon: Timer,
	},
};

export const DomainStatus = ({ domain, monitoringData, containersList, authorizations }: { domain: { url: string; port: number; container: string }; monitoringData?: DomainMonitorType; containersList: string[]; authorizations: AppAuthorizationsType }) => {
	if (!monitoringData || Object.keys(monitoringData).length === 0) {
		return <LoadingState />;
	}

	const chartData = monitoringData.responseTimeHistory.map((item) => ({
		time: item.time.split('T')[1].slice(0, 5),
		value: item.value,
		status: item.status,
	}));

	const maxResponseTime = Math.max(...chartData.map((item) => item.value));
	const isHealthy = monitoringData.responseTime !== null;

	const stats = [
		{
			label: 'Current',
			value: monitoringData.responseTime ? `${monitoringData.responseTime}ms` : '-',
			healthy: monitoringData.responseTime < 500,
		},
		{
			label: 'Average',
			value: `${monitoringData.averageReponseTime}ms`,
			healthy: monitoringData.averageReponseTime < 500,
		},
		{
			label: 'Uptime',
			value: `${Math.round(monitoringData.uptime)}%`,
			healthy: monitoringData.uptime > 99,
		},
	];

	return (
		<Card className="bg-[#18181a] border-0">
			<CardContent className="p-3 md:pl-4 md:p-4 space-y-4 md:space-y-6">
				<div className="flex flex-col space-y-4">
					<div className="flex items-start justify-between flex-col md:flex-row md:items-center space-y-4 md:space-y-0">
						<div className="flex items-center space-x-3 w-full md:w-auto">
							<div className={cn('p-2 rounded-lg shrink-0', isHealthy ? 'bg-blue-500/10' : 'bg-red-500/10')}>
								<Globe className={cn('w-5 h-5', isHealthy ? 'text-blue-500' : 'text-red-500')} />
							</div>
							<div className="flex flex-col">
								<div className="flex items-center space-x-2">
									<span className={cn('font-medium text-lg truncate', isHealthy ? 'text-white' : 'text-red-500')}>{domain.url}</span>
								</div>
								<div className="flex items-center space-x-2 -mt-1">
									<p className="text-[#666] text-sm">
										{domain.container}: {domain.port}
									</p>
									<span className="text-[#666]">•</span>
									{authorizations.domains.includes('update') && <EditDomainDialog domain={domain} containersList={containersList} />}
									{authorizations.domains.includes('delete') && <DeleteDomainDialog url={domain.url} />}
								</div>
							</div>
						</div>

						<div className="grid grid-cols-3 gap-3 w-full md:w-auto">
							{stats.map((stat) => (
								<div key={stat.label} className="flex flex-col items-center md:items-end">
									<span className="text-xs md:text-sm text-[#666] truncate">{stat.label}</span>
									<span className={cn('font-medium text-sm md:text-base truncate', stat.healthy ? 'text-white' : 'text-red-400')}>{stat.value}</span>
								</div>
							))}
						</div>
					</div>
				</div>

				<div className="h-[200px] w-full">
					<ChartContainer config={config} className="w-full h-full">
						<ResponsiveContainer>
							<AreaChart data={chartData}>
								<defs>
									<linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
										<stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
									</linearGradient>
									<pattern id="downtime-pattern" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
										<rect width="2" height="10" fill="rgba(239, 68, 68, 0.6)" x="0" y="0" />
									</pattern>
								</defs>
								<CartesianGrid strokeDasharray="3 3" stroke="#333" />
								<XAxis dataKey="time" stroke="#666" tick={{ fill: '#666', fontSize: 12 }} tickLine={{ stroke: '#666' }} interval="preserveStartEnd" />
								<YAxis
									stroke="#666"
									tick={{ fill: '#666', fontSize: 12 }}
									tickLine={{ stroke: '#666' }}
									label={{
										value: 'Response Time',
										angle: -90,
										position: 'insideLeft',
										fill: '#666',
										style: { fontSize: 12, textAnchor: 'middle' },
									}}
								/>
								<ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
								<Area type="monotone" dataKey="value" stroke="#3B82F6" fill="url(#colorValue)" strokeWidth={2} />
								{chartData.map((entry, index) => {
									if ((!entry.status && index > 0) || (entry.status && index > 0 && !chartData[index - 1].status)) {
										const previousEntry = chartData[index - 1];
										return <ReferenceArea key={entry.time} x1={previousEntry.time} x2={entry.time} height={0.8 * maxResponseTime} fill="url(#downtime-pattern)" />;
									}
									return null;
								})}
							</AreaChart>
						</ResponsiveContainer>
					</ChartContainer>
				</div>
			</CardContent>
		</Card>
	);
};

export default DomainStatus;

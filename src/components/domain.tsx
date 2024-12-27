import React from 'react';
import { Globe, Edit2, Trash2, Timer } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DomainMonitorType } from '@/types/domain';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import { cn } from '@/lib/utils';
import DeleteDomainDialog from './forms/DeleteDomainForm';

const LoadingState = () => (
	<Card className="bg-[#18181a] border-0">
		<CardContent className="p-4 space-y-4">
			<div className="flex justify-between">
				<div className="flex items-center space-x-3">
					<Skeleton className="w-5 h-5 rounded-full" />
					<div className="space-y-2">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-3 w-24" />
					</div>
				</div>
				<div className="flex flex-col items-end space-y-2">
					<div className="flex space-x-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className="flex flex-col items-end space-y-1">
								<Skeleton className="h-3 w-24" />
								<Skeleton className="h-4 w-16" />
							</div>
						))}
					</div>
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

export const DomainStatus = ({
	domain,
	monitoringData,
}: {
	domain: {
		url: string;
		port: number;
		container: string;
	};
	monitoringData?: DomainMonitorType;
}) => {
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
			label: 'Current Response',
			value: monitoringData.responseTime ? `${monitoringData.responseTime}ms` : '-',
			healthy: monitoringData.responseTime < 500,
		},
		{
			label: 'Average Response',
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
			<CardContent className="p-4 space-y-6">
				<div>
					<div className="flex justify-between">
						<div className="flex items-center space-x-3">
							<div className={cn('p-2 rounded-lg', isHealthy ? 'bg-blue-500/10' : 'bg-red-500/10')}>
								<Globe className={cn('w-5 h-5', isHealthy ? 'text-blue-500' : 'text-red-500')} />
							</div>
							<div className="flex flex-col">
								<div className="flex items-center space-x-2">
									<span className={cn('font-medium text-lg flex gap-2', isHealthy ? 'text-white' : 'text-red-500')}>{domain.url}</span>
								</div>
								<div className="flex items-center space-x-2">
									<p className="text-[#666] text-sm">
										{domain.container}: {domain.port}
									</p>
									<span className="text-[#666]">•</span>
									<Button variant="link" className="text-[#666] px-0 py-0 h-1">
										Edit
									</Button>
									<DeleteDomainDialog url={domain.url} />
								</div>
							</div>
						</div>
						<div className="flex flex-col items-end space-y-4">
							<div className="flex gap-3">
								{stats.map((stat) => (
									<div key={stat.label} className="flex flex-col items-end">
										<span className="text-sm text-[#666]">{stat.label}</span>
										<span className={`font-medium ${stat.healthy ? 'text-white' : 'text-red-400'}`}>{stat.value}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				<div className="h-[200px] w-full">
					<ChartContainer config={config} className="w-full h-full">
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
							<XAxis dataKey="time" stroke="#666" tick={{ fill: '#666' }} tickLine={{ stroke: '#666' }} />
							<YAxis
								stroke="#666"
								tick={{ fill: '#666' }}
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
					</ChartContainer>
				</div>
			</CardContent>
		</Card>
	);
};

export default DomainStatus;

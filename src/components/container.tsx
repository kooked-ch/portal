import { cn } from '@/lib/utils';
import { CircleX, Edit2, Server } from 'lucide-react';
import { Button } from './ui/button';
import DeleteContainerDialog from './forms/DeleteContainerForm';
import EditContainerDialog from './forms/UpdateContainerForm';
import { useState } from 'react';
import { ContainerType } from '@/types/container';
import ContainerLogsDialog from './ui/container-logs-dialog';

type ContainerStatus = {
	ready: boolean;
	state: string;
	message?: string;
};

interface StatusConfig {
	colorClass: string;
	icon: JSX.Element;
	message: string;
}

const getContainerStatusDetails = (totalCount: number, statuses: ContainerStatus[], customStatus: string): StatusConfig => {
	const runningCount = statuses.filter((status) => status.ready).length;
	const percentageRunning = (runningCount / totalCount) * 100;
	const errorStatus = statuses.find((status) => !status.ready && status.state !== 'ContainerCreating');
	const currentState = statuses.find((status) => !status.ready)?.state || 'Running';

	if (customStatus == 'ContainerUpdating') {
		return {
			colorClass: 'text-orange-500 border-orange-500',
			icon: <Server className="w-5 h-5 text-orange-500" />,
			message: 'Updating container',
		};
	}

	if (errorStatus) {
		const errorConfigs: Record<string, StatusConfig> = {
			ErrImagePull: {
				colorClass: 'text-red-500 border-red-500',
				icon: <CircleX className="w-5 h-5 text-red-500" />,
				message: 'Failed pulling image',
			},
			ImagePullBackOff: {
				colorClass: 'text-red-500 border-red-500',
				icon: <CircleX className="w-5 h-5 text-red-500" />,
				message: 'Failed pulling image',
			},
			CrashLoopBackOff: {
				colorClass: 'text-red-500 border-red-500',
				icon: <CircleX className="w-5 h-5 text-red-500" />,
				message: 'Crash loop back off',
			},
		};

		return (
			errorConfigs[errorStatus.state] || {
				colorClass: 'text-red-500 border-red-500',
				icon: <CircleX className="w-5 h-5 text-red-500" />,
				message: errorStatus.message || errorStatus.state || 'Unknown Error',
			}
		);
	}

	if (currentState === 'ContainerCreating' || totalCount === 0) {
		return {
			colorClass: 'text-orange-500 border-orange-500',
			icon: <Server className="w-5 h-5 text-orange-500" />,
			message: 'Starting container',
		};
	}

	if (percentageRunning === 100) {
		return {
			colorClass: 'text-green-500 border-green-500',
			icon: <Server className="w-5 h-5 text-green-500" />,
			message: `${runningCount}/${totalCount} Running`,
		};
	}

	if (percentageRunning >= 75) {
		return {
			colorClass: 'text-yellow-500 border-yellow-500',
			icon: <Server className="w-5 h-5 text-yellow-500" />,
			message: `${runningCount}/${totalCount} Running`,
		};
	}

	return {
		colorClass: 'text-red-500 border-red-500',
		icon: <Server className="w-5 h-5 text-red-500" />,
		message: `${runningCount}/${totalCount} Running`,
	};
};

export const ContainerItem = ({ container }: { container: ContainerType }) => {
	const totalCount = container.status.length;
	const [customStatus, setCustomStatus] = useState<string>('');

	const { colorClass, icon, message } = getContainerStatusDetails(totalCount, container.status, customStatus);
	const errorStatus = container.status.find((status) => !status.ready && status.state !== 'ContainerCreating');

	return (
		<li key={'container' + container.name} className={cn('flex justify-between bg-[#18181a] px-4 py-3 rounded-lg items-center border-l-4', colorClass)}>
			<div className="flex items-center space-x-3">
				{icon}
				<div className="flex flex-col">
					<span className={cn('text-white font-medium', errorStatus && 'text-red-500')}>{container.name}</span>
					<p className={cn('text-sm', errorStatus ? 'text-red-500' : 'text-[#666]')}>{container.image}</p>
					{errorStatus && <span className="text-xs text-red-400">{message}</span>}
				</div>
			</div>
			<div className="flex items-center space-x-3">
				<div className="flex flex-col items-end">
					<span className={cn('text-sm font-medium', colorClass)}>{message}</span>
				</div>
				<div className="flex space-x-1 text-white">
					<ContainerLogsDialog container={container} />
					<EditContainerDialog container={container} setCustomStatus={setCustomStatus} />
					<DeleteContainerDialog containerName={container.name} />
				</div>
			</div>
		</li>
	);
};

import { cn } from '@/lib/utils';
import { AppType } from '@/types/app';
import { DatabaseType } from '@/types/database';
import { Database } from 'lucide-react';
import DisplayDatabaseDialog from './forms/DisplayDatabase';
import DeleteDatabaseDialog from './forms/DeleteDatabaseForm';
import { AppAuthorizationsType } from '@/types/authorization';

export const DatabaseItem = ({ database, authorizations }: { database: AppType['databases'][0]; authorizations: AppAuthorizationsType }) => {
	const dbStatus = database.status;
	const color =
		{
			Running: 'green-500',
			Pending: 'orange-500',
			Error: 'red-500',
		}[dbStatus?.state] || 'red-500';

	const providerNames = {
		mongodb: 'MongoDB',
		mariadb: 'MariaDB',
		postgresql: 'PostgreSQL',
	};

	return (
		<li className={cn('flex justify-between bg-[#1E1E20] px-4 py-3 rounded-lg items-center h-[68px] border-l-4', 'border-' + color)}>
			<div className="flex items-center space-x-3">
				<Database className={cn('w-5 h-5', 'text-' + color)} />
				<div className="flex flex-col">
					<span className="text-white font-medium">{database.name}</span>
					<p className="text-[#666] text-sm">{providerNames[database.provider as keyof typeof providerNames]}</p>
				</div>
			</div>
			<div className="flex items-center space-x-3">
				<span className={cn('text-sm font-medium', 'text-' + color)}>{dbStatus?.state ? (dbStatus?.state === 'Pending' ? 'Starting database' : dbStatus?.state) : 'unknown'}</span>
				<div className="flex space-x-2">
					{authorizations.secrets.includes('read') && <DisplayDatabaseDialog database={database} />}
					{authorizations.databases.includes('delete') && <DeleteDatabaseDialog databaseName={database.name} />}
				</div>
			</div>
		</li>
	);
};

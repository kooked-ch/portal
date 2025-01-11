import React from 'react';
import { VolumeType } from '@/types/volume';
import { Card, CardContent } from '@/components/ui/card';
import { HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import DeleteVolumeDialog from './forms/DeleteVolumeDialog';
import { AppAuthorizationsType } from '@/types/authorization';

export default function VolumeTab({ volumes, authorizations }: { volumes: VolumeType[]; authorizations: AppAuthorizationsType }) {
	return (
		<div className="space-y-3">
			{volumes.map((volume) => (
				<li className="flex justify-between bg-[#1E1E20] px-4 py-3 rounded-lg h-[68px] items-center border-l-4 border-blue-500">
					<div className="flex items-center space-x-3">
						<HardDrive className="w-5 h-5 text-blue-500" />
						<div className="flex flex-col">
							<span className="text-white font-medium">{volume.name}</span>
							<div className="flex items-center text-sm text-[#666] space-x-2">
								<span className="truncate">{volume.container}</span>
								<span>•</span>
								<span className="truncate">{volume.mountPath}</span>
							</div>
						</div>
					</div>
					<div className="flex items-center space-x-3">
						<div className="flex space-x-2">{authorizations.volumes.includes('delete') && <DeleteVolumeDialog volumeName={volume.name} />}</div>
					</div>
				</li>
			))}
		</div>
	);
}

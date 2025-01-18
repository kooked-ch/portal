import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal } from 'lucide-react';
import { ContainerType } from '@/types/container';
import { Label } from '@/components/ui/label';

const ContainerLogsDialog: React.FC<{ container: ContainerType }> = ({ container }) => {
	const [selectedPod, setSelectedPod] = useState<string>(container.logs[0]?.podName || '');

	const currentLogs = selectedPod ? container.logs.find((log) => log.podName === selectedPod)?.logs || ['No logs available'] : ['Select a pod to view logs'];

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="ghost" size="icon">
					<Terminal className="w-4 h-4" />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-6xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Terminal className="w-5 h-5" />
						Logs for {container.name}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label>Select Pod</Label>
						<Select value={selectedPod} onValueChange={setSelectedPod}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select a pod" />
							</SelectTrigger>
							<SelectContent>
								{container.logs.map((log) => (
									<SelectItem key={log.podName} value={log.podName}>
										{log.podName}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="bg-secondary/50 rounded-md">
						<ScrollArea className="h-96 rounded-md">
							<pre className="p-4 text-xs font-mono text-slate-50 whitespace-pre-wrap break-words">{currentLogs.join('\n')}</pre>
						</ScrollArea>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default ContainerLogsDialog;

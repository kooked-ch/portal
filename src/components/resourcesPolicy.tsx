'use client';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AllProjectResourcesPolicy } from '@/types/resourcesPolicy';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';

type ResourceType = 'containers' | 'databases' | 'domains' | 'volumes';

export default function ResourcePolicyEditor({ allProjectResourcesPolicy }: { allProjectResourcesPolicy: AllProjectResourcesPolicy }) {
	const [selectedPolicies, setSelectedPolicies] = useState<{ [appName: string]: { [key in ResourceType]?: string } }>({});
	const [loading, setLoading] = useState<{ [appName: string]: { [key in ResourceType]?: boolean } }>({});
	const router = useRouter();
	const pathname = usePathname();

	const handlePolicyChange = async (appName: string, resourceKey: ResourceType, newValue: string) => {
		setSelectedPolicies((prev) => ({
			...prev,
			[appName]: { ...prev[appName], [resourceKey]: newValue },
		}));
		setLoading((prev) => ({
			...prev,
			[appName]: { ...prev[appName], [resourceKey]: true },
		}));

		try {
			const response = await fetch(`/api/project/${pathname.split('/')[1]}/${appName}/resources-policy`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ resource: resourceKey, policy: allProjectResourcesPolicy.resourcesPolicyList.find((policy) => policy.name === newValue)?.slug }),
			});

			if (!response.ok) {
				const error = await response.json();
				console.error('Erreur API:', error);
			} else {
				router.refresh();
			}
		} catch (error) {
			console.error('Erreur API:', error);
		} finally {
			setLoading((prev) => ({
				...prev,
				[appName]: { ...prev[appName], [resourceKey]: false },
			}));
		}
	};

	return (
		<div>
			<h1 className="text-3xl font-bold mb-4 mt-3 sm:mt-0">Resources policy</h1>
			<Accordion type="single" collapsible>
				{allProjectResourcesPolicy.apps.map((app) => (
					<AccordionItem key={app.name} value={app.name}>
						<AccordionTrigger className="text-xl">{app.name}</AccordionTrigger>
						<AccordionContent>
							<ul>
								{Object.keys(app.policy).map((resource, index) => {
									const resourceKey = resource as ResourceType;
									const policy = app.policy[resourceKey];

									return (
										<li key={resourceKey} className={cn('flex items-center justify-between text-sm p-1 py-2', index !== Object.keys(app.policy).length - 1 && 'border-b')}>
											<Select value={selectedPolicies[app.name]?.[resourceKey] || policy.name} onValueChange={(newValue) => handlePolicyChange(app.name, resourceKey, newValue)} disabled={loading[app.name]?.[resourceKey]}>
												<SelectTrigger className="sm:w-1/4 w-2/3 font-medium">
													<SelectValue placeholder="Change" />
												</SelectTrigger>
												<SelectContent>
													{allProjectResourcesPolicy.resourcesPolicyList
														.filter((resourcePolicy) => resourcePolicy.limitation[resourceKey] !== undefined)
														.sort((a, b) => a.limitation.level - b.limitation.level)
														.map((resourcePolicy) => (
															<SelectItem key={resourcePolicy.slug} value={resourcePolicy.name}>
																{resourcePolicy.name}
															</SelectItem>
														))}
												</SelectContent>
											</Select>
											<span className="w-1/3 sm:flex hidden text-gray-500 truncate">{policy.description}</span>
											<div className="w-1/6 text-right">
												<span className="font-bold">{policy.totalLimit === -1 ? policy.remainingLimit * -1 - 1 : policy.totalLimit - policy.remainingLimit}</span> / {policy.totalLimit === -1 ? '∞' : policy.totalLimit}
											</div>
										</li>
									);
								})}
							</ul>
						</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>
		</div>
	);
}

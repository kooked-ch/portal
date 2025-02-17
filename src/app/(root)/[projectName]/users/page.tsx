'use server';
import UsersEditor from '@/components/users';
import { checkAccreditation } from '@/lib/auth';
import { getAllProjectUsers } from '@/lib/user';

export default async function UsersPage({ params }: { params: { projectName: string } }) {
	if (!(await checkAccreditation('members:1:read', params.projectName))) {
		return <div className="text-muted-foreground text-center justify-center flex items-center h-[calc(100vh-100px)]">Unable to access this page</div>;
	}

	const AllProjectUsers = await getAllProjectUsers(params.projectName);

	if (!AllProjectUsers) {
		return <div className="text-muted-foreground text-center justify-center flex items-center h-[calc(100vh-100px)]">Failed to load resource policy</div>;
	}

	return (
		<div className="xl:container mx-auto px-3 xl:px-28 md:py-8 py-3">
			<UsersEditor allProjectUsers={AllProjectUsers} />
		</div>
	);
}

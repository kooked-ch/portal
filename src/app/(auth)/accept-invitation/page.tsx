'use server';
import InvitationAccept from '@/components/invitation';
import { getInvitation } from '@/lib/collaborator';

export default async function AcceptInvitationPage({ params, searchParams }: { params: any; searchParams?: { [key: string]: string | string[] | undefined } }) {
	const token = searchParams?.token;

	if (!token || typeof token !== 'string') {
		return <div>Invalid invitation</div>;
	}

	const invitation = await getInvitation(token);
	if (!invitation) {
		return <div>Invalid invitation</div>;
	}

	return <InvitationAccept invitation={invitation} />;
}

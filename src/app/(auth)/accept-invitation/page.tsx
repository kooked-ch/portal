'use server';
import InvalidInvitation from '@/components/invalidInvitation';
import AcceptInvitation from '@/components/acceptInvitation';
import { getInvitation } from '@/lib/member';

export default async function AcceptInvitationPage({ params, searchParams }: { params: any; searchParams?: { [key: string]: string | string[] | undefined } }) {
	const token = searchParams?.token;

	if (!token || typeof token !== 'string') {
		return <InvalidInvitation />;
	}

	const invitation = await getInvitation(token);
	if (!invitation) {
		return <InvalidInvitation />;
	}

	return <AcceptInvitation invitation={invitation} />;
}

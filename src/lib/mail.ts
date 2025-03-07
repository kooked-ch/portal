import { readFileSync } from 'fs';
import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import path from 'path';

export async function sendEmail(email: string, type: string, data?: any): Promise<void> {
	let htmlContent: string | undefined;

	switch (type) {
		case 'down':
			htmlContent = getTemplateContent('./templates/down.html', data);
			await send(email, `${data.url} is DOWN`, htmlContent);
			break;

		case 'up':
			htmlContent = getTemplateContent('./templates/up.html', data);
			await send(email, `${data.url} is UP`, htmlContent);
			break;

		case 'invitation':
			htmlContent = getTemplateContent('./templates/invitation.html', data);
			await send(email, `Invitation to ${data.projectName} on Kooked Portal`, htmlContent);
			break;

		case 'welcome':
			htmlContent = getTemplateContent('./templates/welcome.html', data);
			await send(email, 'Welcome to Kooked Portal', htmlContent);
			break;

		case 'password_reset':
			htmlContent = getTemplateContent('./templates/password_reset.html', data);
			await send(email, 'Password reset request', htmlContent);
			break;

		case 'verify':
			htmlContent = getTemplateContent('./templates/verify.html', data);
			await send(email, 'Verify your email address', htmlContent);
			break;

		default:
			console.warn(`Unknown email type: ${type}`);
			break;
	}
}

function getTemplateContent(templatePath: string, data?: any): string {
	let htmlContent = readFileSync(path.resolve(templatePath), 'utf8');
	const placeholders = {
		'{website_name}': `${data?.url} website`,
		'{project_name}': data?.projectName,
		'{url}': data?.url,
		'{app_name}': data?.appName,
		'{current_time}': data?.time,
		'{portal_url}': `${process.env.NEXTAUTH_URL}/${data?.projectName}/${data?.appName}`,
		'{username}': data?.username,
		'{invitation_link}': `${process.env.NEXTAUTH_URL}/accept-invitation?token=${data?.token}`,
		'{portal_link}': `${process.env.NEXTAUTH_URL}/`,
		'{verification_code}': data?.token,
	};

	for (const [placeholder, value] of Object.entries(placeholders)) {
		htmlContent = htmlContent.replaceAll(placeholder, value);
	}

	return htmlContent;
}

async function send(email: string, subject: string, htmlContent: string): Promise<void> {
	const transporter: Transporter = nodemailer.createTransport({
		host: 'mail.infomaniak.com',
		port: 465,
		secure: true,
		auth: {
			user: process.env.MAIL_USER || '',
			pass: process.env.MAIL_PASSWORD || '',
		},
	});

	const mailOptions: SendMailOptions = {
		from: `"Kooked Portal" <${process.env.MAIL_USER || ''}>`,
		to: email,
		subject,
		html: htmlContent,
	};

	try {
		const info = await transporter.sendMail(mailOptions);
		console.info('E-mail sent:', info.response);
	} catch (error) {
		console.error('Error sending email:', error);
	}
}

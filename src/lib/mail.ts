import { readFileSync } from 'fs';
import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import path from 'path';

export async function sendEmail(email: string, type: string, data: any): Promise<void> {
	let htmlContent;
	switch (type) {
		case 'welcome':
			break;
		case 'down':
			htmlContent = readFileSync(path.resolve('./templates/down.html'), 'utf8');
			htmlContent = htmlContent.replaceAll('{website_name}', `${data.url} website`);
			htmlContent = htmlContent.replaceAll('{project_name}', data.projectName);
			htmlContent = htmlContent.replaceAll('{url}', data.url);
			htmlContent = htmlContent.replaceAll('{app_name}', data.appName);
			htmlContent = htmlContent.replaceAll('{current_time}', data.time);
			htmlContent = htmlContent.replaceAll('{portal_url}', `${process.env.NEXTAUTH_URL}${data.project_name}/${data.app_name}`);
			htmlContent = htmlContent.replaceAll('{username}', data.username);
			send(email, `${data.url} is DOWN`, htmlContent);
			break;
		case 'up':
			htmlContent = readFileSync(path.resolve('./templates/up.html'), 'utf8');
			htmlContent = htmlContent.replaceAll('{website_name}', `${data.url} website`);
			htmlContent = htmlContent.replaceAll('{project_name}', data.projectName);
			htmlContent = htmlContent.replaceAll('{url}', data.url);
			htmlContent = htmlContent.replaceAll('{app_name}', data.appName);
			htmlContent = htmlContent.replaceAll('{current_time}', data.time);
			htmlContent = htmlContent.replaceAll('{portal_url}', `${process.env.NEXTAUTH_URL}${data.project_name}/${data.app_name}`);
			htmlContent = htmlContent.replaceAll('{username}', data.username);
			send(email, `${data.url} is UP`, htmlContent);
			break;
		default:
			break;
	}
}

async function send(email: string, subject: string, htmlContent: string): Promise<void> {
	const from = 'Kooked Portal support';

	const secret = {
		user: process.env.MAIL_USER || '',
		pass: process.env.MAIL_PASSWORD || '',
		from: from,
		subject: subject,
	};

	const transporter: Transporter = nodemailer.createTransport({
		host: 'mail.infomaniak.com',
		port: 465,
		secure: true,
		auth: {
			user: secret.user,
			pass: secret.pass,
		},
	});

	const mailOptions: SendMailOptions = {
		from: secret.user,
		to: email,
		subject: secret.subject,
		html: htmlContent,
	};

	transporter.sendMail(mailOptions, (error: Error | null, info) => {
		if (error) {
			console.error('Error sending email:', error);
		} else {
			console.log('E-mail sent:', info.response);
		}
	});
}

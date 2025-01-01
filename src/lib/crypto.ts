import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const INPUT_ENCODING = 'utf8';
const OUTPUT_ENCODING = 'hex';
const IV_LENGTH = 12;
const REQUIRED_KEY_LENGTH = 32;

function validateKey(key: string): Buffer {
	const keyBuffer = Buffer.from(key, 'latin1');
	if (keyBuffer.length !== REQUIRED_KEY_LENGTH) {
		throw new Error(`Key must be ${REQUIRED_KEY_LENGTH} bytes (got ${keyBuffer.length})`);
	}
	return keyBuffer;
}

export function symmetricEncrypt(text: string, key: string): string {
	const _key = validateKey(key);
	const iv = crypto.randomBytes(IV_LENGTH);
	const cipher = crypto.createCipheriv(ALGORITHM, _key, iv);

	let ciphered = cipher.update(text, INPUT_ENCODING, OUTPUT_ENCODING);
	ciphered += cipher.final(OUTPUT_ENCODING);

	const authTag = cipher.getAuthTag();

	return [iv.toString(OUTPUT_ENCODING), authTag.toString(OUTPUT_ENCODING), ciphered].join(':');
}

export function symmetricDecrypt(text: string, key: string): string {
	const _key = validateKey(key);

	const parts = text.split(':');
	if (parts.length !== 3) {
		console.error('Invalid ciphertext format:', parts);
		throw new Error('Invalid ciphertext format');
	}

	const [ivHex, authTagHex, ciphertext] = parts;
	const iv = Buffer.from(ivHex, OUTPUT_ENCODING);
	const authTag = Buffer.from(authTagHex, OUTPUT_ENCODING);

	const decipher = crypto.createDecipheriv(ALGORITHM, _key, iv);
	decipher.setAuthTag(authTag);

	try {
		let deciphered = decipher.update(ciphertext, OUTPUT_ENCODING, INPUT_ENCODING);
		deciphered += decipher.final(INPUT_ENCODING);

		return deciphered;
	} catch (error) {
		console.error('Decryption Error:', error);
		throw new Error('Decryption failed: Data may be corrupted or tampered');
	}
}

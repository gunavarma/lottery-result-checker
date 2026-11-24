const encoder = new TextEncoder();

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function encodeBase64(value: Uint8Array): string {
  let binary = '';
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function normalizeWhatsAppPhone(value: string): string | null {
  let normalized = value.trim().replace(/[\s().-]/g, '');
  if (normalized.startsWith('00')) normalized = `+${normalized.slice(2)}`;
  if (!normalized.startsWith('+')) return null;
  const digits = normalized.slice(1);
  return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null;
}

async function deriveKeys(secret: string) {
  const raw = decodeBase64(secret);
  if (raw.byteLength !== 32) throw new Error('Invalid WhatsApp data encryption key');

  const material = await crypto.subtle.importKey('raw', raw, 'HKDF', false, ['deriveKey']);
  const derive = (info: string, algorithm: AlgorithmIdentifier | HmacImportParams, usages: KeyUsage[]) =>
    crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: encoder.encode('keraladraws-whatsapp-v1'),
        info: encoder.encode(info),
      },
      material,
      algorithm,
      false,
      usages,
    );

  const [encryptionKey, lookupKey] = await Promise.all([
    derive('phone-encryption', { name: 'AES-GCM', length: 256 }, ['encrypt', 'decrypt']),
    derive('phone-lookup', { name: 'HMAC', hash: 'SHA-256', length: 256 }, ['sign']),
  ]);

  return { encryptionKey, lookupKey };
}

export async function hashWhatsAppPhone(phone: string, secret: string): Promise<string> {
  const { lookupKey } = await deriveKeys(secret);
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', lookupKey, encoder.encode(phone)));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function encryptWhatsAppPhone(phone: string, secret: string): Promise<string> {
  const { encryptionKey } = await deriveKeys(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, encryptionKey, encoder.encode(phone)),
  );
  return `${encodeBase64(iv)}.${encodeBase64(ciphertext)}`;
}

export async function decryptWhatsAppPhone(value: string, secret: string): Promise<string> {
  const [encodedIv, encodedCiphertext] = value.split('.');
  if (!encodedIv || !encodedCiphertext) throw new Error('Invalid encrypted WhatsApp phone number');
  const { encryptionKey } = await deriveKeys(secret);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: decodeBase64(encodedIv) },
    encryptionKey,
    decodeBase64(encodedCiphertext),
  );
  return new TextDecoder().decode(plaintext);
}

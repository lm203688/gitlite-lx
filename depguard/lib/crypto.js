'use strict';

const crypto = require('crypto');

/** Derive AES-256 key from password via scrypt. */
function deriveKey(password) {
  return crypto.scryptSync(password, 'depguard-salt-v1', 32);
}

/** Encrypt plaintext Buffer → Buffer[IV|ciphertext]. */
function encrypt(plaintext, password) {
  const iv      = crypto.randomBytes(16);
  const key     = deriveKey(password);
  const cipher  = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return Buffer.concat([iv, encrypted]);
}

/** Decrypt Buffer[IV|ciphertext] → original plaintext Buffer. */
function decrypt(data, password) {
  if (data.length < 17) throw new Error('Encrypted data too short');
  const iv      = data.slice(0, 16);
  const ciphertext = data.slice(16);
  const key     = deriveKey(password);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

module.exports = { encrypt, decrypt };

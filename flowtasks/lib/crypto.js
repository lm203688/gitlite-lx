'use strict';

const crypto = require('crypto');

/** AES-256-CBC encrypt a string; returns hex {iv, ct}. */
function encrypt(plaintext, password) {
  const iv     = crypto.randomBytes(16);
  const key    = crypto.scryptSync(password, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { iv: iv.toString('hex'), ct: encrypted };
}

/** AES-256-CBC decrypt; returns plaintext string. */
function decrypt({ iv, ct }, password) {
  const ivBuf   = Buffer.from(iv, 'hex');
  const key     = crypto.scryptSync(password, 'salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, ivBuf);
  let decrypted = decipher.update(ct, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };

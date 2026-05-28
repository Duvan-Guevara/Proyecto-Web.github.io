import { Injectable } from '@nestjs/common';
import { createHmac, randomBytes } from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

@Injectable()
export class TotpService {
  private readonly issuer = 'FoodSync';
  private readonly step = 30;
  private readonly digits = 6;

  generateSecret(length = 20): string {
    return this.base32Encode(randomBytes(length));
  }

  buildOtpAuthUrl(email: string, secret: string): string {
    const label = encodeURIComponent(`${this.issuer}:${email}`);
    const issuer = encodeURIComponent(this.issuer);
    return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=${this.digits}&period=${this.step}`;
  }

  buildQrCodeUrl(otpAuthUrl: string): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(otpAuthUrl)}`;
  }

  verifyToken(secret: string, token: string, window = 1): boolean {
    const normalizedToken = token.replace(/\s+/g, '');

    if (!/^\d{6}$/.test(normalizedToken)) {
      return false;
    }

    const currentCounter = Math.floor(Date.now() / 1000 / this.step);

    for (let offset = -window; offset <= window; offset += 1) {
      if (this.generateToken(secret, currentCounter + offset) === normalizedToken) {
        return true;
      }
    }

    return false;
  }

  private generateToken(secret: string, counter: number): string {
    const key = this.base32Decode(secret);
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(BigInt(counter));

    const hmac = createHmac('sha1', key).update(buffer).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    return (code % 10 ** this.digits).toString().padStart(this.digits, '0');
  }

  private base32Encode(buffer: Buffer): string {
    let bits = 0;
    let value = 0;
    let output = '';

    for (const byte of buffer) {
      value = (value << 8) | byte;
      bits += 8;

      while (bits >= 5) {
        output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
    }

    return output;
  }

  private base32Decode(input: string): Buffer {
    const normalized = input.toUpperCase().replace(/=+$/g, '');
    let bits = 0;
    let value = 0;
    const bytes: number[] = [];

    for (const character of normalized) {
      const index = BASE32_ALPHABET.indexOf(character);

      if (index === -1) {
        throw new Error('Secret TOTP invalido');
      }

      value = (value << 5) | index;
      bits += 5;

      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return Buffer.from(bytes);
  }
}

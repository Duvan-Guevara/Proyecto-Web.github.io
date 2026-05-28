import { Injectable } from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

@Injectable()
export class PasswordService {
  hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  verifyPassword(password: string, storedHash: string): boolean {
    const [salt, currentHash] = storedHash.split(':');

    if (!salt || !currentHash) {
      return false;
    }

    const candidateHash = scryptSync(password, salt, 64);
    const originalHash = Buffer.from(currentHash, 'hex');

    if (candidateHash.length !== originalHash.length) {
      return false;
    }

    return timingSafeEqual(candidateHash, originalHash);
  }
}

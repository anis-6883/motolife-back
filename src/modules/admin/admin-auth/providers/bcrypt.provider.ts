import { Injectable } from '@nestjs/common';
import { HashingProvider } from './hashing.provider';
import bcrypt from 'bcryptjs';

@Injectable()
export class BcryptProvider extends HashingProvider {
  public async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  }

  public async comparePasswords(
    candidatePassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }
}

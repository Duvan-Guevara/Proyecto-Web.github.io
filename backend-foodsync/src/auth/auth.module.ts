import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TotpService } from './totp.service';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, TotpService],
  exports: [AuthService],
})
export class AuthModule {}

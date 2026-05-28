import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import type {
  LoginDto,
  VerifyLoginTwoFactorDto,
  VerifyTotpCodeDto,
} from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Post('login/verify-2fa')
  verifyLoginTwoFactor(@Body() body: VerifyLoginTwoFactorDto) {
    return this.authService.verifyTwoFactorLogin(
      body.challengeToken,
      body.code,
    );
  }

  @Get('me')
  me(@Headers('authorization') authorization?: string) {
    return this.authService.getCurrentUser(this.extractToken(authorization));
  }

  @Post('2fa/setup')
  setupTwoFactor(@Headers('authorization') authorization?: string) {
    return this.authService.setupTwoFactor(this.extractToken(authorization));
  }

  @Post('2fa/verify')
  verifyTwoFactorSetup(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: VerifyTotpCodeDto,
  ) {
    return this.authService.verifyTwoFactorSetup(
      this.extractToken(authorization),
      body.code,
    );
  }

  @Post('2fa/disable')
  disableTwoFactor(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: VerifyTotpCodeDto,
  ) {
    return this.authService.disableTwoFactor(
      this.extractToken(authorization),
      body.code,
    );
  }

  private extractToken(authorization?: string) {
    const [scheme, token] = authorization?.split(' ') ?? [];

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return '';
    }

    return token;
  }
}

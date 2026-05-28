import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PasswordService } from './password.service';
import { TotpService } from './totp.service';
import { RegisterDto } from './auth.types';
import { UsersService } from '../users/users.service';
import { SafeUser } from '../users/users.types';

interface LoginChallenge {
  userId: string;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  private readonly sessions = new Map<string, string>();
  private readonly loginChallenges = new Map<string, LoginChallenge>();

  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly totpService: TotpService,
  ) {}

  async register(data: RegisterDto) {
    return this.usersService.create(data);
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const isValidPassword = this.passwordService.verifyPassword(
      password,
      user.password,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const challengeToken = randomUUID();
      this.loginChallenges.set(challengeToken, {
        userId: user._id.toString(),
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      return {
        requiresTwoFactor: true,
        challengeToken,
        user: this.usersService.toSafeUser(user),
        message: 'Codigo de Google Authenticator requerido',
      };
    }

    return this.createSessionResponse(this.usersService.toSafeUser(user));
  }

  async verifyTwoFactorLogin(challengeToken: string, code: string) {
    const challenge = this.loginChallenges.get(challengeToken);

    if (!challenge || challenge.expiresAt < Date.now()) {
      this.loginChallenges.delete(challengeToken);
      throw new UnauthorizedException('El desafio de autenticacion expiro');
    }

    const user = await this.usersService.findById(challenge.userId);

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException('No fue posible validar el segundo factor');
    }

    const isValidCode = this.totpService.verifyToken(user.twoFactorSecret, code);

    if (!isValidCode) {
      throw new UnauthorizedException('Codigo de Google Authenticator invalido');
    }

    this.loginChallenges.delete(challengeToken);
    return this.createSessionResponse(this.usersService.toSafeUser(user));
  }

  async getCurrentUser(sessionToken: string) {
    const userId = this.requireSession(sessionToken);
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Sesion invalida');
    }

    return {
      user: this.usersService.toSafeUser(user),
    };
  }

  async setupTwoFactor(sessionToken: string) {
    const userId = this.requireSession(sessionToken);
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Sesion invalida');
    }

    const secret = this.totpService.generateSecret();
    await this.usersService.storeTwoFactorTempSecret(userId, secret);

    const otpAuthUrl = this.totpService.buildOtpAuthUrl(user.email, secret);

    return {
      secret,
      otpAuthUrl,
      qrCodeUrl: this.totpService.buildQrCodeUrl(otpAuthUrl),
      message:
        'Escanea el codigo con Google Authenticator y confirma con un codigo TOTP',
    };
  }

  async verifyTwoFactorSetup(sessionToken: string, code: string) {
    const userId = this.requireSession(sessionToken);
    const user = await this.usersService.findById(userId);

    if (!user || !user.twoFactorTempSecret) {
      throw new BadRequestException(
        'Primero debes iniciar la configuracion del autenticador',
      );
    }

    const isValidCode = this.totpService.verifyToken(
      user.twoFactorTempSecret,
      code,
    );

    if (!isValidCode) {
      throw new UnauthorizedException('Codigo de Google Authenticator invalido');
    }

    const updatedUser = await this.usersService.enableTwoFactor(userId);

    if (!updatedUser) {
      throw new UnauthorizedException('No fue posible activar el segundo factor');
    }

    return {
      message: 'Google Authenticator activado correctamente',
      user: this.usersService.toSafeUser(updatedUser),
    };
  }

  async disableTwoFactor(sessionToken: string, code: string) {
    const userId = this.requireSession(sessionToken);
    const user = await this.usersService.findById(userId);

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('El usuario no tiene segundo factor activo');
    }

    const isValidCode = this.totpService.verifyToken(user.twoFactorSecret, code);

    if (!isValidCode) {
      throw new UnauthorizedException('Codigo de Google Authenticator invalido');
    }

    const updatedUser = await this.usersService.disableTwoFactor(userId);

    if (!updatedUser) {
      throw new UnauthorizedException(
        'No fue posible desactivar el segundo factor',
      );
    }

    return {
      message: 'Google Authenticator desactivado correctamente',
      user: this.usersService.toSafeUser(updatedUser),
    };
  }

  buildSessionFromUser(user: SafeUser) {
    const token = randomUUID();
    this.sessions.set(token, user.id);

    return {
      token,
      user,
    };
  }

  private createSessionResponse(user: SafeUser) {
    return {
      message: 'Inicio de sesion exitoso',
      ...this.buildSessionFromUser(user),
    };
  }

  private requireSession(sessionToken: string) {
    const token = sessionToken?.trim();
    const userId = this.sessions.get(token);

    if (!userId) {
      throw new UnauthorizedException('Sesion invalida o expirada');
    }

    return userId;
  }
}

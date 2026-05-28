export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  nombre: string;
  email: string;
  password: string;
  tipo: string;
}

export interface VerifyLoginTwoFactorDto {
  challengeToken: string;
  code: string;
}

export interface VerifyTotpCodeDto {
  code: string;
}

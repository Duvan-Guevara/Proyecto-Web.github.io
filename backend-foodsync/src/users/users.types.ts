export interface UserDocument {
  _id: string;
  nombre: string;
  email: string;
  password: string;
  tipo: string;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string | null;
  twoFactorTempSecret?: string | null;
}

export interface CreateUserDto {
  nombre: string;
  email: string;
  password: string;
  tipo: string;
}

export interface SafeUser {
  id: string;
  nombre: string;
  email: string;
  tipo: string;
  twoFactorEnabled: boolean;
}

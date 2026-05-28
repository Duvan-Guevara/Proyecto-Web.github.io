import { Schema } from 'mongoose';

export const UserSchema = new Schema({
  nombre: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  tipo: String,
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, default: null },
  twoFactorTempSecret: { type: String, default: null },
});

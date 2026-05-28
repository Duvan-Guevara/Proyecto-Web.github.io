import { Schema } from 'mongoose';

export const UserSchema = new Schema({
  nombre: String,
  email: String,
  password: String,
  tipo: String,
});
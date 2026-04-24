import { Schema } from 'mongoose';

export const DonationSchema = new Schema({
  nombreAlimento: String,
  cantidad: Number,
  fecha: Date,
  descripcion: String,
});
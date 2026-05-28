import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PasswordService } from '../auth/password.service';
import { CreateUserDto, SafeUser, UserDocument } from './users.types';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
    private readonly passwordService: PasswordService,
  ) {}

  async findAll() {
    const users = await this.userModel.find().exec();
    return users.map((user) => this.toSafeUser(user));
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email: email.trim().toLowerCase() }).exec();
  }

  async findById(userId: string) {
    return this.userModel.findById(userId).exec();
  }

  async create(data: CreateUserDto) {
    const email = data.email?.trim().toLowerCase();
    const existingUser = await this.findByEmail(email);

    if (existingUser) {
      throw new BadRequestException('Ya existe un usuario con este correo');
    }

    const newUser = new this.userModel({
      ...data,
      email,
      password: this.passwordService.hashPassword(data.password),
    });

    const savedUser = await newUser.save();
    return {
      message: 'Usuario registrado correctamente',
      user: this.toSafeUser(savedUser),
    };
  }

  toSafeUser(user: UserDocument): SafeUser {
    return {
      id: user._id?.toString(),
      nombre: user.nombre,
      email: user.email,
      tipo: user.tipo,
      twoFactorEnabled: Boolean(user.twoFactorEnabled),
    };
  }

  async storeTwoFactorTempSecret(userId: string, secret: string) {
    await this.userModel.findByIdAndUpdate(userId, {
      twoFactorTempSecret: secret,
    });
  }

  async enableTwoFactor(userId: string) {
    const user = await this.userModel.findById(userId).exec();

    if (!user || !user.twoFactorTempSecret) {
      return null;
    }

    user.twoFactorEnabled = true;
    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorTempSecret = null;

    return user.save();
  }

  async disableTwoFactor(userId: string) {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorTempSecret: null,
        },
        { new: true },
      )
      .exec();
  }
}

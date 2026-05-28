import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private userModel: Model<any>) {}

  async findAll() {
    return this.userModel.find();
  }

  async create(data: any) {
    const newUser = new this.userModel(data);
    return newUser.save();
  }
}
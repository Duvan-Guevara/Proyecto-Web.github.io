import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class DonationsService {
  constructor(@InjectModel('Donation') private donationModel: Model<any>) {}

  async findAll() {
    return this.donationModel.find();
  }

  async create(data: any) {
    const newDonation = new this.donationModel(data);
    return newDonation.save();
  }
}
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DonationsController } from './donations.controller';
import { DonationsService } from './donations.service';
import { DonationSchema } from './donations.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Donation', schema: DonationSchema }
    ])
  ],
  controllers: [DonationsController],
  providers: [DonationsService],
})
export class DonationsModule {}
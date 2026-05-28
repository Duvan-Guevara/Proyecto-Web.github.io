import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { DonationsModule } from './donations/donations.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://admin:admin123@cluster0.dkxqee7.mongodb.net/foodsync'
    ),
    UsersModule,
    DonationsModule, 
  ],
})
export class AppModule {}
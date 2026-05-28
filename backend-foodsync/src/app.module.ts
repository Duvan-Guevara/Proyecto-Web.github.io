import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { DonationsModule } from './donations/donations.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI ??
        'mongodb+srv://admin:admin123@cluster0.dkxqee7.mongodb.net/foodsync',
    ),
    UsersModule,
    DonationsModule,
    AuthModule,
  ],
})
export class AppModule {}

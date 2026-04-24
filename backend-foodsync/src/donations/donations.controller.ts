import { Controller, Get, Post, Body } from '@nestjs/common';
import { DonationsService } from './donations.service';

@Controller('donations')
export class DonationsController {
  constructor(private donationsService: DonationsService) {}

  @Get()
  findAll() {
    return this.donationsService.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.donationsService.create(body);
  }
}
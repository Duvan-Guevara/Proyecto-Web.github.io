import { Controller, Get, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import type { CreateUserDto } from './users.types';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }
}

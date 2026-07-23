import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { UsersQueryDto } from './dto/users-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard) // toutes les routes exigent d'être connecté
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Créer un compte. Admin (tout rôle) ou Bibliothécaire (étudiant seulement). */
  @Post()
  @Roles(Role.ADMINISTRATEUR, Role.BIBLIOTHECAIRE)
  create(@Body() dto: CreateUserDto, @CurrentUser() createur: AuthUser) {
    return this.usersService.create(dto, createur);
  }

  /** Lister les comptes (paginé) — Administrateur uniquement. */
  @Get()
  @Roles(Role.ADMINISTRATEUR)
  findAll(@Query() query: UsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.ADMINISTRATEUR)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMINISTRATEUR)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  /** Désactiver un compte — Administrateur uniquement. */
  @Delete(':id')
  @Roles(Role.ADMINISTRATEUR)
  desactiver(@Param('id') id: string) {
    return this.usersService.desactiver(id);
  }
}

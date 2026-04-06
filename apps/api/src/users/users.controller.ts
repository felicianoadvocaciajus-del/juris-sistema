import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Listar todos os usuarios (admin)' })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Buscar usuario por ID (admin)' })
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Criar novo usuario (admin)' })
  async create(
    @Body()
    body: {
      email: string;
      password: string;
      name: string;
      role: 'ADMIN' | 'ADVOGADO' | 'ASSISTENTE';
      oabNumber?: string;
      phone?: string;
    },
  ) {
    return this.usersService.create(body);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualizar usuario (admin)' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      role?: 'ADMIN' | 'ADVOGADO' | 'ASSISTENTE';
      oabNumber?: string;
      phone?: string;
      active?: boolean;
    },
  ) {
    return this.usersService.update(id, body);
  }
}

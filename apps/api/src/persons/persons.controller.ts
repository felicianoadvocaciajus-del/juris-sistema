import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PersonsService } from './persons.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Persons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('persons')
export class PersonsController {
  constructor(private readonly personsService: PersonsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar pessoas com busca e filtros' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.personsService.findAll({ search, status, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar pessoa por ID' })
  async findById(@Param('id') id: string) {
    return this.personsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar nova pessoa' })
  async create(
    @Body() dto: CreatePersonDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.personsService.create(dto, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar pessoa' })
  async update(@Param('id') id: string, @Body() dto: UpdatePersonDto) {
    return this.personsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover pessoa' })
  async remove(@Param('id') id: string) {
    return this.personsService.remove(id);
  }
}

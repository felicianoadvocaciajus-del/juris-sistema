import { PartialType } from '@nestjs/swagger';
import { CreateMatterDto } from './create-matter.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMatterDto extends PartialType(CreateMatterDto) {
  @ApiPropertyOptional({ enum: ['ATIVO', 'SUSPENSO', 'ENCERRADO', 'ARQUIVADO'] })
  @IsOptional()
  @IsEnum(['ATIVO', 'SUSPENSO', 'ENCERRADO', 'ARQUIVADO'])
  status?: string;
}

import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMatterDto {
  @ApiProperty({ example: 'Acao de Indenizacao' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsUUID()
  personId: string;

  @ApiProperty({
    enum: [
      'CIVIL',
      'TRABALHISTA',
      'CRIMINAL',
      'PREVIDENCIARIO',
      'TRIBUTARIO',
      'FAMILIA',
      'CONSUMIDOR',
      'ADMINISTRATIVO',
      'OUTRO',
    ],
  })
  @IsEnum([
    'CIVIL',
    'TRABALHISTA',
    'CRIMINAL',
    'PREVIDENCIARIO',
    'TRIBUTARIO',
    'FAMILIA',
    'CONSUMIDOR',
    'ADMINISTRATIVO',
    'OUTRO',
  ])
  legalArea: string;

  @ApiPropertyOptional({ example: '1234567-89.2024.8.26.0224' })
  @IsOptional()
  @IsString()
  courtNumber?: string;

  @ApiPropertyOptional({ example: 'TJSP - Guarulhos' })
  @IsOptional()
  @IsString()
  court?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jurisdiction?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nextSteps?: string;

  @ApiProperty()
  @IsUUID()
  responsibleId: string;
}

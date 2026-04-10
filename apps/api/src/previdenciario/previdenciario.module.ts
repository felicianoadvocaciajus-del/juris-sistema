import { Module } from '@nestjs/common';
import { PrevidenciarioService } from './previdenciario.service';
import { PrevidenciarioController } from './previdenciario.controller';

@Module({
  providers: [PrevidenciarioService],
  controllers: [PrevidenciarioController],
  exports: [PrevidenciarioService],
})
export class PrevidenciarioModule {}

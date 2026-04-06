import { Module } from '@nestjs/common';
import { MattersService } from './matters.service';
import { MattersController } from './matters.controller';

@Module({
  providers: [MattersService],
  controllers: [MattersController],
  exports: [MattersService],
})
export class MattersModule {}

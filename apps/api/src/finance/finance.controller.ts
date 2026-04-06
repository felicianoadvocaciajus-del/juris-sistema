import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('agreements')
  @ApiOperation({ summary: 'Listar acordos de honorarios' })
  @ApiQuery({ name: 'personId', required: false })
  @ApiQuery({ name: 'matterId', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAllAgreements(
    @Query('personId') personId?: string,
    @Query('matterId') matterId?: string,
    @Query('isActive') isActive?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.financeService.findAllAgreements({
      personId,
      matterId,
      isActive,
      page,
      limit,
    });
  }

  @Get('agreements/:id')
  @ApiOperation({ summary: 'Buscar acordo por ID' })
  async findAgreementById(@Param('id') id: string) {
    return this.financeService.findAgreementById(id);
  }

  @Post('agreements')
  @ApiOperation({ summary: 'Criar acordo de honorarios' })
  async createAgreement(
    @Body()
    body: {
      personId: string;
      matterId?: string;
      type: string;
      totalAmount: number;
      downPayment?: number;
      installmentCount?: number;
      notes?: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financeService.createAgreement(body, user.sub);
  }

  @Get('installments/pending')
  @ApiOperation({ summary: 'Listar parcelas pendentes' })
  @ApiQuery({ name: 'overdue', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findPendingInstallments(
    @Query('overdue') overdue?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.financeService.findPendingInstallments({
      overdue,
      page,
      limit,
    });
  }

  @Post('payments')
  @ApiOperation({ summary: 'Registrar pagamento' })
  async registerPayment(
    @Body()
    body: {
      installmentId: string;
      amount: number;
      method: string;
      reference?: string;
      notes?: string;
      paidAt: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financeService.registerPayment(body, user.sub);
  }
}

import { Controller } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}
  async create(data: CreateTransactionDto) {
    return this.transactionService.create(data);
  }
}

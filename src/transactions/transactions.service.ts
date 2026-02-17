import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTransactionDto) {
    const { senderId, receiverId, amount } = dto;

    // 1. Wrap EVERYTHING in a transaction
    return await this.prisma.$transaction(async (tx) => {
      // Step A: Check Sender Balance (Locking isn't needed yet for simple transfer)
      const sender = await tx.user.findUnique({ where: { id: senderId } });
      if (!sender) throw new NotFoundException('Sender not found');
      if (Number(sender.balance) < amount) {
        throw new BadRequestException('Insufficient funds');
      }
      // Step B: Deduct from Sender
      const updatedSender = await tx.user.update({
        where: { id: senderId },
        data: { balance: { decrement: amount } }, // Atomic Decrement
      });
      // Step C: Add to Receiver
      const updatedReceiver = await tx.user.update({
        where: { id: receiverId },
        data: { balance: { increment: amount } }, // Atomic Increment
      });

      // Step D: Record the Transaction Log
      return await tx.transaction.create({
        data: {
          amount: amount,
          type: 'TRANSFER',
          status: 'COMPLETED',
          senderId: senderId,
          receiverId: receiverId,
        },
      });
    });
  }

  findAll() {
    return `This action returns all transactions`;
  }
  findOne(id: number) {
    return `This action returns a #${id} transaction`;
  }
  update(id: number, updateTransactionDto: any) {
    return `This action updates a #${id} transaction`;
  }
  remove(id: number) {
    return `This action removes a #${id} transaction`;
  }
}

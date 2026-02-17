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
      // 1. Fetch both in parallel (Total wait: ~50ms)
      const [sender, receiver] = await Promise.all([
        tx.user.findUnique({ where: { id: senderId } }),
        tx.user.findUnique({ where: { id: receiverId } }),
      ]);

      // 2. Validate existence
      if (!sender) throw new NotFoundException('Sender not found');
      if (!receiver) throw new NotFoundException('Receiver not found');
      // Step A: Check Sender Balance (Locking isn't needed yet for simple transfer)
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
    return this.prisma.transaction.findMany({
      include: {
        sender: { select: { name: true, email: true } },
        receiver: { select: { name: true, email: true } },
      },
    });
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

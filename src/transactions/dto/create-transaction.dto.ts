import {
  IsString,
  IsPositive,
  IsNumber,
  IsNotEmpty,
  Min,
} from 'class-validator';
export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  senderId: string;
  @IsString()
  @IsNotEmpty()
  receiverId: string;

  @IsNumber()
  @IsPositive()
  @Min(1, { message: 'Amount must be at least 1' })
  amount: number;
}

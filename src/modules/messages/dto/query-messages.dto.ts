import { IsDateString, IsOptional, IsString } from 'class-validator';

export class QueryMessagesDto {
  @IsOptional()
  @IsString()
  sender?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

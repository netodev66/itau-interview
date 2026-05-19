import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';

const FILTER_REQUIRED =
  'GET /api/v1/messages requires "sender" or both "startDate" and "endDate" (ISO 8601)';

export class QueryMessagesDto {
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Filter by sender UUID. Takes priority over date range.',
  })
  @IsOptional()
  @IsUUID()
  sender?: string;

  @ApiPropertyOptional({
    example: '2025-01-31T00:00:00.000Z',
    description: 'Range start (ISO 8601). Required when sender is absent.',
  })
  @ValidateIf((o: QueryMessagesDto) => !o.sender)
  @IsDateString(
    {},
    {
      message:
        '"startDate" must be a valid ISO 8601 date (e.g. 2025-01-31T00:00:00Z)',
    },
  )
  @IsNotEmpty({ message: FILTER_REQUIRED })
  startDate?: string;

  @ApiPropertyOptional({
    example: '2025-01-31T23:59:59.000Z',
    description: 'Range end (ISO 8601). Required when sender is absent.',
  })
  @ValidateIf((o: QueryMessagesDto) => !o.sender)
  @IsDateString(
    {},
    {
      message:
        '"endDate" must be a valid ISO 8601 date (e.g. 2025-01-31T23:59:59Z)',
    },
  )
  @IsNotEmpty({ message: FILTER_REQUIRED })
  endDate?: string;
}

import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { DealKind } from '../../../generated/prisma/client';

export class CreateDealDto {
  @IsEnum(DealKind) kind: DealKind;
  @IsString() title: string;
  @IsString() detail: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(99) percentOff?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) endsInHours?: number;

  /** Path returned by POST /api/uploads/product-image. */
  @IsOptional() @IsString() imageUrl?: string;

  @IsOptional() @IsBoolean() active?: boolean;

  /** Products covered by this promotion. */
  @IsArray() @ArrayNotEmpty() @IsString({ each: true }) productIds: string[];
}

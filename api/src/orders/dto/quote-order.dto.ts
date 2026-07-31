import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { OrderLineDto } from './create-order.dto';

/** A basket to be priced without placing it, so checkout can show real totals. */
export class QuoteOrderDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  items: OrderLineDto[];

  @IsOptional() @IsString() couponCode?: string;
}

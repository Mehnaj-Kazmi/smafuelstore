import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderLineDto {
  @IsString() productId: string;
  @Type(() => Number) @IsInt() @Min(1) quantity: number;
}

export class OrderAddressDto {
  @IsString() recipient: string;
  @IsString() line1: string;
  @IsString() city: string;

  /** Digits only, matching the checkout form. */
  @Matches(/^\d{4,10}$/, { message: 'Postcode must be numbers only' })
  zip: string;

  @IsOptional() @IsString() notes?: string;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  items: OrderLineDto[];

  @ValidateNested()
  @Type(() => OrderAddressDto)
  address: OrderAddressDto;

  @IsOptional() @IsString() couponCode?: string;
  @IsOptional() @IsString() paymentMethod?: string;
}

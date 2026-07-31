import { Type } from 'class-transformer';
import { IsNumber, IsString, Min } from 'class-validator';

export class CheckCouponDto {
  @IsString() code: string;

  /** Only used to test a minimum-spend rule; the order's real total is always
      recalculated server-side when it is placed. */
  @Type(() => Number) @IsNumber() @Min(0) subtotal: number;
}

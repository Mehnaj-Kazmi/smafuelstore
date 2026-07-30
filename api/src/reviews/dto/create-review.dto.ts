import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min, MaxLength, MinLength } from 'class-validator';

export class CreateReviewDto {
  @Type(() => Number) @IsInt() productId: number;

  @Type(() => Number) @IsInt() @Min(1) @Max(5) rating: number;

  @IsOptional() @IsString() @MaxLength(120) title?: string;

  @IsString() @MinLength(3) @MaxLength(2000) body: string;
}

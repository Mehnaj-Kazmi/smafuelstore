import { Type } from 'class-transformer';
import {
  IsArray,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class FuelPriceDto {
  @IsString() grade: string;
  @Type(() => Number) @IsNumber() @Min(0) price: number;
}

export class UpdateStoreDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() hours?: string;

  /* Validated as real coordinates: a typo here silently refuses every customer,
     because the radius check is measured from this point. */
  @IsOptional() @Type(() => Number) @IsLatitude() lat?: number;
  @IsOptional() @Type(() => Number) @IsLongitude() lng?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0.1) radiusMiles?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FuelPriceDto)
  fuelPrices?: FuelPriceDto[];
}

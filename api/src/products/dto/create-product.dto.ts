import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString() sku: string;
  @IsString() barcode: string;
  @IsString() title: string;
  @IsString() brand: string;
  @IsString() departmentSlug: string;
  @IsString() categorySlug: string;
  @IsString() unit: string;

  @Type(() => Number) @IsNumber() @Min(0) price: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) listPrice?: number;

  @Type(() => Number) @IsInt() @Min(0) stock: number;
  @Type(() => Number) @IsInt() @Min(0) lowStockAt: number;

  /** Path returned by POST /api/uploads/product-image, e.g. /uploads/abc.jpg */
  @IsOptional() @IsString() imageUrl?: string;

  @IsString() art: string;
  @Type(() => Number) @IsInt() hue: number;

  @IsOptional() @IsBoolean() ageRestricted?: boolean;

  @IsArray() @IsString({ each: true }) tags: string[];
  @IsArray() @IsString({ each: true }) bullets: string[];
  @IsString() description: string;
}

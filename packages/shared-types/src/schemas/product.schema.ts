import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { StockMovementType } from '../enums';

export const CreateProductSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(2, 'SKU is required'),
  category: z.string().min(2, 'Category is required'),
  unitPrice: z.number().positive('Unit price must be positive'),
  currentStock: z.number().int().min(0, 'Current stock must be non-negative').default(0),
  minStockAlert: z.number().int().min(0, 'Min stock alert must be non-negative').default(10),
  warehouseLocation: z.string().min(1, 'Warehouse location is required'),
  imageUrl: z.string().nullable().optional(),
});

// Note: currentStock is intentionally excluded/ignored from direct product update
export const UpdateProductSchema = CreateProductSchema.omit({ currentStock: true }).partial();

export const StockMovementSchema = z.object({
  quantityChanged: z.number().int().positive('Quantity must be positive'),
  movementType: z.nativeEnum(StockMovementType),
  reason: z.string().min(3, 'Reason is required'),
});

export class CreateProductDto extends createZodDto(CreateProductSchema) {}
export class UpdateProductDto extends createZodDto(UpdateProductSchema) {}
export class StockMovementDto extends createZodDto(StockMovementSchema) {}


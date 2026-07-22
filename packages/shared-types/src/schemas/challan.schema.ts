import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const ChallanItemInputSchema = z.object({
  productId: z.string().uuid('Valid Product ID required'),
  quantity: z.number().int().positive('Quantity must be positive'),
});

export const CreateChallanSchema = z.object({
  customerId: z.string().uuid('Valid Customer ID required'),
  items: z.array(ChallanItemInputSchema).min(1, 'At least one line item is required'),
});

export const UpdateChallanSchema = CreateChallanSchema.partial();

export class ChallanItemInputDto extends createZodDto(ChallanItemInputSchema) {}
export class CreateChallanDto extends createZodDto(CreateChallanSchema) {}
export class UpdateChallanDto extends createZodDto(UpdateChallanSchema) {}


import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { CustomerType, CustomerStatus } from '../enums';

export const CreateCustomerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  mobile: z.string().min(10, 'Mobile must be at least 10 digits'),
  email: z.string().email('Invalid email address'),
  businessName: z.string().min(2, 'Business name is required'),
  gstNumber: z.string().nullable().optional(),
  type: z.nativeEnum(CustomerType),
  address: z.string().min(3, 'Address is required'),
  status: z.nativeEnum(CustomerStatus).default(CustomerStatus.Lead),
  followUpDate: z.string().nullable().optional(),
  notes: z.string().optional(),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial();

export const CreateFollowUpSchema = z.object({
  note: z.string().min(1, 'Follow-up note is required'),
  followUpDate: z.string().nullable().optional(),
});

export class CreateCustomerDto extends createZodDto(CreateCustomerSchema) {}
export class UpdateCustomerDto extends createZodDto(UpdateCustomerSchema) {}
export class CreateFollowUpDto extends createZodDto(CreateFollowUpSchema) {}


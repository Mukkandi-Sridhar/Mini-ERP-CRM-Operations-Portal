import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { UserRole } from '../enums';

export const CreateUserSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(UserRole),
});

export const UpdateUserSchema = CreateUserSchema.partial().omit({ password: true }).extend({
  password: z.string().min(6).optional(),
  isActive: z.boolean().optional(),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}


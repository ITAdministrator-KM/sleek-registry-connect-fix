import { z } from 'zod';

export const newVisitorSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  
  nic: z.string()
    .min(10, 'NIC must be at least 10 characters')
    .max(15, 'NIC cannot exceed 15 characters')
    .regex(/^[0-9]{9}[vVxX]?$|^[0-9]{12}$/, 'Invalid NIC format'),
    
  address: z.string()
    .min(5, 'Address must be at least 5 characters')
    .max(500, 'Address cannot exceed 500 characters'),
    
  mobile: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number cannot exceed 15 digits')
    .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format'),
    
  email: z.string()
    .email('Invalid email address')
    .max(100, 'Email cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),
    
  department_id: z.string().min(1, 'Department is required'),
  division_id: z.string().optional(),
  
  purpose: z.string()
    .min(10, 'Purpose must be at least 10 characters')
    .max(1000, 'Purpose cannot exceed 1000 characters'),
    
  remarks: z.string()
    .max(1000, 'Remarks cannot exceed 1000 characters')
    .optional()
    .or(z.literal('')),
    
  create_account: z.boolean().default(true)
});

export const existingVisitorSchema = z.object({
  search: z.string().min(1, 'Search query is required'),
  public_user_id: z.string().min(1, 'Please select a visitor'),
  
  purpose: z.string()
    .min(10, 'Purpose must be at least 10 characters')
    .max(1000, 'Purpose cannot exceed 1000 characters'),
    
  remarks: z.string()
    .max(1000, 'Remarks cannot exceed 1000 characters')
    .optional()
    .or(z.literal(''))
});

export type NewVisitorFormData = z.infer<typeof newVisitorSchema>;
export type ExistingVisitorFormData = z.infer<typeof existingVisitorSchema>;

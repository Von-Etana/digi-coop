import { z } from 'zod';

// ============= Group Buy Item Schemas =============

export const createGroupBuyItemSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(200),
    description: z.string().max(2000).optional(),
    image_url: z.string().url().optional(),
    unit_price: z.number().positive('Price must be positive'),
    min_quantity: z.number().int().positive('Minimum quantity must be positive'),
    max_quantity: z.number().int().positive().optional(),
    deadline: z.string().datetime(),
    category: z.string().max(100).optional(),
    is_active: z.boolean().default(true),
});

export type CreateGroupBuyItemInput = z.infer<typeof createGroupBuyItemSchema>;

export const updateGroupBuyItemSchema = createGroupBuyItemSchema.partial();

export type UpdateGroupBuyItemInput = z.infer<typeof updateGroupBuyItemSchema>;

// ============= Cart Schemas =============

export const addToCartSchema = z.object({
    item_id: z.string().uuid(),
    quantity: z.number().int().positive('Quantity must be at least 1'),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;

export const updateCartSchema = z.object({
    quantity: z.number().int().min(0, 'Quantity cannot be negative'),
});

export type UpdateCartInput = z.infer<typeof updateCartSchema>;

// ============= Checkout Schema =============

export const checkoutSchema = z.object({
    delivery_address: z.string().max(500).optional(),
    delivery_notes: z.string().max(500).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ============= Query Schema =============

export const groupBuyQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(20),
    category: z.string().optional(),
    status: z.enum(['active', 'closed', 'all']).default('active'),
});

export type GroupBuyQueryInput = z.infer<typeof groupBuyQuerySchema>;

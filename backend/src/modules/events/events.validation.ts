import { z } from 'zod';

// ============= Event Schemas =============

export const createEventSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().max(5000).optional(),
    banner_url: z.string().url().optional(),
    banner_type: z.enum(['image', 'video']).default('image'),
    location: z.string().max(500).optional(),
    location_url: z.string().url().optional(), // Google Maps link
    start_date: z.string().datetime(),
    end_date: z.string().datetime().optional(),
    is_published: z.boolean().default(false),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = createEventSchema.partial();

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const rsvpSchema = z.object({
    status: z.enum(['attending', 'not_attending', 'maybe']),
});

export type RsvpInput = z.infer<typeof rsvpSchema>;

export const eventQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(10),
    status: z.enum(['upcoming', 'past', 'all']).default('upcoming'),
});

export type EventQueryInput = z.infer<typeof eventQuerySchema>;

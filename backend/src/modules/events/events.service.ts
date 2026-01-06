import { query } from '../../config/database';
import { Event, EventRsvp, EventStatus, RsvpStatus } from '../../types';
import { NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { CreateEventInput, UpdateEventInput, RsvpInput, EventQueryInput } from './events.validation';

export class EventsService {
    /**
     * Create a new event (Admin only)
     */
    async createEvent(adminId: string, input: CreateEventInput): Promise<Event> {
        const result = await query(
            `INSERT INTO events 
       (title, description, banner_url, banner_type, location, location_url, start_date, end_date, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
            [
                input.title,
                input.description,
                input.banner_url,
                input.banner_type,
                input.location,
                input.location_url,
                input.start_date,
                input.end_date,
                input.is_published ? EventStatus.PUBLISHED : EventStatus.DRAFT,
                adminId,
            ]
        );

        logger.info(`Event created: ${input.title}`, { eventId: result.rows[0].id, adminId });
        return result.rows[0] as Event;
    }

    /**
     * Update an event (Admin only)
     */
    async updateEvent(eventId: string, input: UpdateEventInput): Promise<Event> {
        const existing = await this.getEventById(eventId);
        if (!existing) {
            throw new NotFoundError('Event not found');
        }

        const updates: string[] = [];
        const values: unknown[] = [];
        let paramIndex = 1;

        if (input.title !== undefined) {
            updates.push(`title = $${paramIndex++}`);
            values.push(input.title);
        }
        if (input.description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            values.push(input.description);
        }
        if (input.banner_url !== undefined) {
            updates.push(`banner_url = $${paramIndex++}`);
            values.push(input.banner_url);
        }
        if (input.banner_type !== undefined) {
            updates.push(`banner_type = $${paramIndex++}`);
            values.push(input.banner_type);
        }
        if (input.location !== undefined) {
            updates.push(`location = $${paramIndex++}`);
            values.push(input.location);
        }
        if (input.location_url !== undefined) {
            updates.push(`location_url = $${paramIndex++}`);
            values.push(input.location_url);
        }
        if (input.start_date !== undefined) {
            updates.push(`start_date = $${paramIndex++}`);
            values.push(input.start_date);
        }
        if (input.end_date !== undefined) {
            updates.push(`end_date = $${paramIndex++}`);
            values.push(input.end_date);
        }
        if (input.is_published !== undefined) {
            updates.push(`status = $${paramIndex++}`);
            values.push(input.is_published ? EventStatus.PUBLISHED : EventStatus.DRAFT);
        }

        if (updates.length === 0) {
            return existing;
        }

        updates.push(`updated_at = NOW()`);
        values.push(eventId);

        const result = await query(
            `UPDATE events SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );

        logger.info(`Event updated: ${eventId}`);
        return result.rows[0] as Event;
    }

    /**
     * Get event by ID
     */
    async getEventById(eventId: string): Promise<Event | null> {
        const result = await query(
            `SELECT e.*, 
              COUNT(CASE WHEN r.status = 'attending' THEN 1 END) as attending_count,
              COUNT(CASE WHEN r.status = 'not_attending' THEN 1 END) as not_attending_count,
              COUNT(CASE WHEN r.status = 'maybe' THEN 1 END) as maybe_count
       FROM events e
       LEFT JOIN event_rsvps r ON e.id = r.event_id
       WHERE e.id = $1
       GROUP BY e.id`,
            [eventId]
        );

        return result.rows[0] as Event || null;
    }

    /**
     * Get event with user's RSVP status
     */
    async getEventWithRsvp(eventId: string, userId: string): Promise<Event & { user_rsvp?: RsvpStatus }> {
        const event = await this.getEventById(eventId);
        if (!event) {
            throw new NotFoundError('Event not found');
        }

        const rsvpResult = await query(
            `SELECT status FROM event_rsvps WHERE event_id = $1 AND user_id = $2`,
            [eventId, userId]
        );

        return {
            ...event,
            user_rsvp: rsvpResult.rows[0]?.status,
        };
    }

    /**
     * List events with pagination
     */
    async getEvents(filters: EventQueryInput): Promise<{ events: Event[]; total: number }> {
        let whereClause = `status = 'published'`;
        const params: unknown[] = [];
        let paramIndex = 1;

        if (filters.status === 'upcoming') {
            whereClause += ` AND start_date >= NOW()`;
        } else if (filters.status === 'past') {
            whereClause += ` AND start_date < NOW()`;
        }

        // Get total count
        const countResult = await query(
            `SELECT COUNT(*) FROM events WHERE ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Get paginated results with RSVP counts
        const offset = (filters.page - 1) * filters.limit;
        const result = await query(
            `SELECT e.*, 
              COUNT(CASE WHEN r.status = 'attending' THEN 1 END) as attending_count,
              COUNT(CASE WHEN r.status = 'not_attending' THEN 1 END) as not_attending_count,
              COUNT(CASE WHEN r.status = 'maybe' THEN 1 END) as maybe_count
       FROM events e
       LEFT JOIN event_rsvps r ON e.id = r.event_id
       WHERE ${whereClause}
       GROUP BY e.id
       ORDER BY e.start_date ${filters.status === 'past' ? 'DESC' : 'ASC'}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, filters.limit, offset]
        );

        return {
            events: result.rows as Event[],
            total,
        };
    }

    /**
     * RSVP to an event
     */
    async rsvpToEvent(eventId: string, userId: string, input: RsvpInput): Promise<EventRsvp> {
        const event = await this.getEventById(eventId);
        if (!event) {
            throw new NotFoundError('Event not found');
        }

        const result = await query(
            `INSERT INTO event_rsvps (event_id, user_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id)
       DO UPDATE SET status = $3, updated_at = NOW()
       RETURNING *`,
            [eventId, userId, input.status]
        );

        logger.info(`RSVP updated for event: ${eventId}`, { userId, status: input.status });
        return result.rows[0] as EventRsvp;
    }

    /**
     * Get attendees for an event
     */
    async getAttendees(
        eventId: string,
        status?: RsvpStatus
    ): Promise<{ user_id: string; first_name: string; last_name: string; status: RsvpStatus }[]> {
        let whereClause = `r.event_id = $1`;
        const params: unknown[] = [eventId];

        if (status) {
            whereClause += ` AND r.status = $2`;
            params.push(status);
        }

        const result = await query(
            `SELECT r.user_id, u.first_name, u.last_name, r.status
       FROM event_rsvps r
       JOIN users u ON r.user_id = u.id
       WHERE ${whereClause}
       ORDER BY r.created_at DESC`,
            params
        );

        return result.rows as { user_id: string; first_name: string; last_name: string; status: RsvpStatus }[];
    }

    /**
     * Cancel an event (Admin only)
     */
    async cancelEvent(eventId: string): Promise<Event> {
        const result = await query(
            `UPDATE events SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [EventStatus.CANCELLED, eventId]
        );

        if (result.rows.length === 0) {
            throw new NotFoundError('Event not found');
        }

        logger.info(`Event cancelled: ${eventId}`);
        return result.rows[0] as Event;
    }
}

export const eventsService = new EventsService();

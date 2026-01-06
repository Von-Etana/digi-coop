import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, RsvpStatus } from '../../types';
import { eventsService } from './events.service';
import { sendSuccess, sendPaginated } from '../../middleware/validator';
import { CreateEventInput, UpdateEventInput, RsvpInput, EventQueryInput } from './events.validation';

export class EventsController {
    /**
     * GET /api/v1/events
     * List all events
     */
    async getEvents(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const filters: EventQueryInput = req.query as unknown as EventQueryInput;
            const { events, total } = await eventsService.getEvents(filters);

            sendPaginated(res, events, {
                page: filters.page || 1,
                limit: filters.limit || 10,
                total,
            }, 'Events retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/events/:id
     * Get single event with user's RSVP
     */
    async getEvent(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.user?.id;
            const event = userId
                ? await eventsService.getEventWithRsvp(req.params.id, userId)
                : await eventsService.getEventById(req.params.id);

            if (!event) {
                sendSuccess(res, null, 'Event not found', 404);
                return;
            }

            sendSuccess(res, event, 'Event retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/events
     * Create new event (Admin only)
     */
    async createEvent(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const input: CreateEventInput = req.body;
            const event = await eventsService.createEvent(req.user.id, input);

            sendSuccess(res, event, 'Event created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/v1/events/:id
     * Update event (Admin only)
     */
    async updateEvent(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const input: UpdateEventInput = req.body;
            const event = await eventsService.updateEvent(req.params.id, input);

            sendSuccess(res, event, 'Event updated successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/events/:id/rsvp
     * RSVP to an event
     */
    async rsvpEvent(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const input: RsvpInput = req.body;
            const rsvp = await eventsService.rsvpToEvent(req.params.id, req.user.id, input);

            sendSuccess(res, rsvp, 'RSVP updated successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/events/:id/attendees
     * Get event attendees (Admin only)
     */
    async getAttendees(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const status = req.query.status as RsvpStatus | undefined;
            const attendees = await eventsService.getAttendees(req.params.id, status);

            sendSuccess(res, attendees, 'Attendees retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/events/:id/cancel
     * Cancel event (Admin only)
     */
    async cancelEvent(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const event = await eventsService.cancelEvent(req.params.id);
            sendSuccess(res, event, 'Event cancelled successfully');
        } catch (error) {
            next(error);
        }
    }
}

export const eventsController = new EventsController();

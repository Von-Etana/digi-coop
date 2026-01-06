import { Router } from 'express';
import { eventsController } from './events.controller';
import { authenticate, optionalAuth, requireRole } from '../../middleware/auth';
import { validateBody, validateQuery } from '../../middleware/validator';
import { auditLog, AuditActions } from '../../middleware/auditLog';
import {
    createEventSchema,
    updateEventSchema,
    rsvpSchema,
    eventQuerySchema
} from './events.validation';

const router = Router();

/**
 * @route   GET /api/v1/events
 * @desc    List all published events
 * @access  Public (optional auth for personalization)
 */
router.get(
    '/',
    optionalAuth,
    validateQuery(eventQuerySchema),
    eventsController.getEvents.bind(eventsController)
);

/**
 * @route   GET /api/v1/events/:id
 * @desc    Get single event details
 * @access  Public (optional auth for RSVP status)
 */
router.get(
    '/:id',
    optionalAuth,
    eventsController.getEvent.bind(eventsController)
);

/**
 * @route   POST /api/v1/events
 * @desc    Create new event
 * @access  Admin only
 */
router.post(
    '/',
    authenticate,
    requireRole('admin'),
    validateBody(createEventSchema),
    auditLog({ action: AuditActions.EVENT_CREATED, entityType: 'event' }),
    eventsController.createEvent.bind(eventsController)
);

/**
 * @route   PUT /api/v1/events/:id
 * @desc    Update event
 * @access  Admin only
 */
router.put(
    '/:id',
    authenticate,
    requireRole('admin'),
    validateBody(updateEventSchema),
    auditLog({
        action: AuditActions.EVENT_UPDATED,
        entityType: 'event',
        getEntityId: (req) => req.params.id
    }),
    eventsController.updateEvent.bind(eventsController)
);

/**
 * @route   POST /api/v1/events/:id/rsvp
 * @desc    RSVP to an event
 * @access  Private
 */
router.post(
    '/:id/rsvp',
    authenticate,
    validateBody(rsvpSchema),
    eventsController.rsvpEvent.bind(eventsController)
);

/**
 * @route   GET /api/v1/events/:id/attendees
 * @desc    Get event attendees
 * @access  Admin only
 */
router.get(
    '/:id/attendees',
    authenticate,
    requireRole('admin'),
    eventsController.getAttendees.bind(eventsController)
);

/**
 * @route   POST /api/v1/events/:id/cancel
 * @desc    Cancel an event
 * @access  Admin only
 */
router.post(
    '/:id/cancel',
    authenticate,
    requireRole('admin'),
    auditLog({
        action: AuditActions.EVENT_CANCELLED,
        entityType: 'event',
        getEntityId: (req) => req.params.id
    }),
    eventsController.cancelEvent.bind(eventsController)
);

export default router;

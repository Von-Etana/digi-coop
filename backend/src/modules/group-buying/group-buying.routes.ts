import { Router } from 'express';
import { groupBuyingController } from './group-buying.controller';
import { authenticate, require2FA, requireRole } from '../../middleware/auth';
import { validateBody, validateQuery } from '../../middleware/validator';
import { idempotency } from '../../middleware/idempotency';
import { transactionRateLimiter } from '../../middleware/rateLimiter';
import { auditLog, AuditActions } from '../../middleware/auditLog';
import {
    createGroupBuyItemSchema,
    updateGroupBuyItemSchema,
    addToCartSchema,
    updateCartSchema,
    checkoutSchema,
    groupBuyQuerySchema
} from './group-buying.validation';

const router = Router();

// ==================== ITEMS ====================

/**
 * @route   GET /api/v1/group-buy/items
 * @desc    List all group buy items
 * @access  Private
 */
router.get(
    '/items',
    authenticate,
    validateQuery(groupBuyQuerySchema),
    groupBuyingController.getItems.bind(groupBuyingController)
);

/**
 * @route   GET /api/v1/group-buy/items/:id
 * @desc    Get single item with progress
 * @access  Private
 */
router.get(
    '/items/:id',
    authenticate,
    groupBuyingController.getItem.bind(groupBuyingController)
);

/**
 * @route   POST /api/v1/group-buy/items
 * @desc    Create new group buy item
 * @access  Admin only
 */
router.post(
    '/items',
    authenticate,
    requireRole('admin'),
    validateBody(createGroupBuyItemSchema),
    auditLog({ action: AuditActions.GROUP_BUY_CREATED, entityType: 'group_buy_item' }),
    groupBuyingController.createItem.bind(groupBuyingController)
);

/**
 * @route   PUT /api/v1/group-buy/items/:id
 * @desc    Update group buy item
 * @access  Admin only
 */
router.put(
    '/items/:id',
    authenticate,
    requireRole('admin'),
    validateBody(updateGroupBuyItemSchema),
    groupBuyingController.updateItem.bind(groupBuyingController)
);

// ==================== CART ====================

/**
 * @route   GET /api/v1/group-buy/cart
 * @desc    Get user's cart
 * @access  Private
 */
router.get(
    '/cart',
    authenticate,
    groupBuyingController.getCart.bind(groupBuyingController)
);

/**
 * @route   POST /api/v1/group-buy/cart
 * @desc    Add item to cart
 * @access  Private
 */
router.post(
    '/cart',
    authenticate,
    validateBody(addToCartSchema),
    groupBuyingController.addToCart.bind(groupBuyingController)
);

/**
 * @route   PUT /api/v1/group-buy/cart/:id
 * @desc    Update cart item quantity
 * @access  Private
 */
router.put(
    '/cart/:id',
    authenticate,
    validateBody(updateCartSchema),
    groupBuyingController.updateCartItem.bind(groupBuyingController)
);

/**
 * @route   DELETE /api/v1/group-buy/cart
 * @desc    Clear cart
 * @access  Private
 */
router.delete(
    '/cart',
    authenticate,
    groupBuyingController.clearCart.bind(groupBuyingController)
);

// ==================== CHECKOUT ====================

/**
 * @route   POST /api/v1/group-buy/checkout
 * @desc    Checkout cart
 * @access  Private (2FA if enabled)
 */
router.post(
    '/checkout',
    authenticate,
    require2FA,
    transactionRateLimiter,
    idempotency(['/checkout']),
    validateBody(checkoutSchema),
    groupBuyingController.checkout.bind(groupBuyingController)
);

// ==================== ORDERS ====================

/**
 * @route   GET /api/v1/group-buy/orders
 * @desc    Get user's orders
 * @access  Private
 */
router.get(
    '/orders',
    authenticate,
    groupBuyingController.getOrders.bind(groupBuyingController)
);

export default router;

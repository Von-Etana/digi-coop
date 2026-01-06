import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { groupBuyingService } from './group-buying.service';
import { sendSuccess, sendPaginated } from '../../middleware/validator';
import {
    CreateGroupBuyItemInput,
    UpdateGroupBuyItemInput,
    AddToCartInput,
    UpdateCartInput,
    CheckoutInput,
    GroupBuyQueryInput
} from './group-buying.validation';

export class GroupBuyingController {
    // ==================== ITEMS ====================

    /**
     * GET /api/v1/group-buy/items
     */
    async getItems(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const filters: GroupBuyQueryInput = req.query as unknown as GroupBuyQueryInput;
            const { items, total } = await groupBuyingService.getItems(filters);

            sendPaginated(res, items, {
                page: filters.page || 1,
                limit: filters.limit || 20,
                total,
            }, 'Items retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/group-buy/items/:id
     */
    async getItem(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const item = await groupBuyingService.getItemById(req.params.id);

            if (!item) {
                sendSuccess(res, null, 'Item not found', 404);
                return;
            }

            // Calculate progress percentage
            const orderedQty = parseInt((item as typeof item & { ordered_quantity: string }).ordered_quantity || '0');
            const progress = Math.min(100, Math.round((orderedQty / item.min_quantity) * 100));

            sendSuccess(res, {
                ...item,
                progress_percentage: progress,
                remaining_quantity: Math.max(0, item.min_quantity - orderedQty),
            }, 'Item retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/group-buy/items (Admin)
     */
    async createItem(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const input: CreateGroupBuyItemInput = req.body;
            const item = await groupBuyingService.createItem(req.user.id, input);

            sendSuccess(res, item, 'Item created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/v1/group-buy/items/:id (Admin)
     */
    async updateItem(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const input: UpdateGroupBuyItemInput = req.body;
            const item = await groupBuyingService.updateItem(req.params.id, input);

            sendSuccess(res, item, 'Item updated successfully');
        } catch (error) {
            next(error);
        }
    }

    // ==================== CART ====================

    /**
     * GET /api/v1/group-buy/cart
     */
    async getCart(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const cart = await groupBuyingService.getCart(req.user.id);
            sendSuccess(res, cart, 'Cart retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/group-buy/cart
     */
    async addToCart(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const input: AddToCartInput = req.body;
            const cartItem = await groupBuyingService.addToCart(req.user.id, input);

            sendSuccess(res, cartItem, 'Item added to cart', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/v1/group-buy/cart/:id
     */
    async updateCartItem(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const input: UpdateCartInput = req.body;
            const cartItem = await groupBuyingService.updateCartItem(req.user.id, req.params.id, input);

            if (!cartItem) {
                sendSuccess(res, null, 'Item removed from cart');
            } else {
                sendSuccess(res, cartItem, 'Cart updated successfully');
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/v1/group-buy/cart
     */
    async clearCart(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            await groupBuyingService.clearCart(req.user.id);
            sendSuccess(res, null, 'Cart cleared successfully');
        } catch (error) {
            next(error);
        }
    }

    // ==================== CHECKOUT ====================

    /**
     * POST /api/v1/group-buy/checkout
     */
    async checkout(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const input: CheckoutInput = req.body;
            const orders = await groupBuyingService.checkout(req.user.id, input);

            sendSuccess(res, {
                orders,
                order_count: orders.length,
            }, 'Checkout successful');
        } catch (error) {
            next(error);
        }
    }

    // ==================== ORDERS ====================

    /**
     * GET /api/v1/group-buy/orders
     */
    async getOrders(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const orders = await groupBuyingService.getUserOrders(req.user.id);
            sendSuccess(res, orders, 'Orders retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

export const groupBuyingController = new GroupBuyingController();

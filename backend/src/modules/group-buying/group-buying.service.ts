import { query, withTransaction } from '../../config/database';
import { walletsService } from '../wallets/wallets.service';
import {
    GroupBuyItem,
    GroupBuyOrder,
    GroupBuyCartItem,
    GroupBuyItemStatus,
    GroupBuyOrderStatus,
    TransactionType
} from '../../types';
import {
    NotFoundError,
    BadRequestError,
    InsufficientFundsError
} from '../../utils/errors';
import { logger } from '../../utils/logger';
import { generateOrderNumber, formatCurrency } from '../../utils/helpers';
import {
    CreateGroupBuyItemInput,
    UpdateGroupBuyItemInput,
    AddToCartInput,
    UpdateCartInput,
    CheckoutInput,
    GroupBuyQueryInput
} from './group-buying.validation';

export class GroupBuyingService {
    // ==================== ITEMS ====================

    /**
     * Create a new group buy item (Admin)
     */
    async createItem(adminId: string, input: CreateGroupBuyItemInput): Promise<GroupBuyItem> {
        const result = await query(
            `INSERT INTO group_buy_items 
       (name, description, image_url, unit_price, min_quantity, max_quantity, deadline, category, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
            [
                input.name,
                input.description,
                input.image_url,
                input.unit_price,
                input.min_quantity,
                input.max_quantity,
                input.deadline,
                input.category,
                input.is_active ? GroupBuyItemStatus.ACTIVE : GroupBuyItemStatus.DRAFT,
                adminId,
            ]
        );

        logger.info(`Group buy item created: ${input.name}`, { itemId: result.rows[0].id });
        return result.rows[0] as GroupBuyItem;
    }

    /**
     * Update group buy item (Admin)
     */
    async updateItem(itemId: string, input: UpdateGroupBuyItemInput): Promise<GroupBuyItem> {
        const existing = await this.getItemById(itemId);
        if (!existing) {
            throw new NotFoundError('Item not found');
        }

        const updates: string[] = [];
        const values: unknown[] = [];
        let paramIndex = 1;

        Object.entries(input).forEach(([key, value]) => {
            if (value !== undefined) {
                if (key === 'is_active') {
                    updates.push(`status = $${paramIndex++}`);
                    values.push(value ? GroupBuyItemStatus.ACTIVE : GroupBuyItemStatus.DRAFT);
                } else {
                    updates.push(`${key} = $${paramIndex++}`);
                    values.push(value);
                }
            }
        });

        if (updates.length === 0) return existing;

        updates.push(`updated_at = NOW()`);
        values.push(itemId);

        const result = await query(
            `UPDATE group_buy_items SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );

        return result.rows[0] as GroupBuyItem;
    }

    /**
     * Get item by ID with order stats
     */
    async getItemById(itemId: string): Promise<GroupBuyItem | null> {
        const result = await query(
            `SELECT i.*, 
              COALESCE(SUM(o.quantity), 0) as ordered_quantity,
              COUNT(DISTINCT o.user_id) as buyer_count
       FROM group_buy_items i
       LEFT JOIN group_buy_orders o ON i.id = o.item_id AND o.status != 'cancelled'
       WHERE i.id = $1
       GROUP BY i.id`,
            [itemId]
        );

        return result.rows[0] as GroupBuyItem || null;
    }

    /**
     * List items with pagination
     */
    async getItems(filters: GroupBuyQueryInput): Promise<{ items: GroupBuyItem[]; total: number }> {
        let whereClause = '1=1';
        const params: unknown[] = [];
        let paramIndex = 1;

        if (filters.status === 'active') {
            whereClause += ` AND status = 'active' AND deadline > NOW()`;
        } else if (filters.status === 'closed') {
            whereClause += ` AND (status = 'closed' OR deadline <= NOW())`;
        }

        if (filters.category) {
            whereClause += ` AND category = $${paramIndex++}`;
            params.push(filters.category);
        }

        // Get total
        const countResult = await query(
            `SELECT COUNT(*) FROM group_buy_items WHERE ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Get items with order stats
        const offset = (filters.page - 1) * filters.limit;
        const result = await query(
            `SELECT i.*, 
              COALESCE(SUM(o.quantity), 0) as ordered_quantity,
              COUNT(DISTINCT o.user_id) as buyer_count
       FROM group_buy_items i
       LEFT JOIN group_buy_orders o ON i.id = o.item_id AND o.status != 'cancelled'
       WHERE ${whereClause}
       GROUP BY i.id
       ORDER BY i.deadline ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, filters.limit, offset]
        );

        return {
            items: result.rows as GroupBuyItem[],
            total,
        };
    }

    // ==================== CART ====================

    /**
     * Add item to cart
     */
    async addToCart(userId: string, input: AddToCartInput): Promise<GroupBuyCartItem> {
        const item = await this.getItemById(input.item_id);
        if (!item) {
            throw new NotFoundError('Item not found');
        }

        if (item.status !== GroupBuyItemStatus.ACTIVE) {
            throw new BadRequestError('This item is not available for purchase');
        }

        if (new Date(item.deadline) < new Date()) {
            throw new BadRequestError('This group buy has ended');
        }

        // Check if already in cart
        const existingResult = await query(
            `SELECT * FROM group_buy_cart_items WHERE user_id = $1 AND item_id = $2`,
            [userId, input.item_id]
        );

        if (existingResult.rows.length > 0) {
            // Update quantity
            const newQuantity = existingResult.rows[0].quantity + input.quantity;
            const result = await query(
                `UPDATE group_buy_cart_items SET quantity = $1, updated_at = NOW() 
         WHERE id = $2 RETURNING *`,
                [newQuantity, existingResult.rows[0].id]
            );
            return result.rows[0] as GroupBuyCartItem;
        }

        // Add new cart item
        const result = await query(
            `INSERT INTO group_buy_cart_items (user_id, item_id, quantity)
       VALUES ($1, $2, $3)
       RETURNING *`,
            [userId, input.item_id, input.quantity]
        );

        return result.rows[0] as GroupBuyCartItem;
    }

    /**
     * Update cart item quantity
     */
    async updateCartItem(userId: string, cartItemId: string, input: UpdateCartInput): Promise<GroupBuyCartItem | null> {
        if (input.quantity === 0) {
            await query(
                `DELETE FROM group_buy_cart_items WHERE id = $1 AND user_id = $2`,
                [cartItemId, userId]
            );
            return null;
        }

        const result = await query(
            `UPDATE group_buy_cart_items SET quantity = $1, updated_at = NOW() 
       WHERE id = $2 AND user_id = $3 RETURNING *`,
            [input.quantity, cartItemId, userId]
        );

        if (result.rows.length === 0) {
            throw new NotFoundError('Cart item not found');
        }

        return result.rows[0] as GroupBuyCartItem;
    }

    /**
     * Get user's cart
     */
    async getCart(userId: string): Promise<{ items: GroupBuyCartItem[]; total: number }> {
        const result = await query(
            `SELECT c.*, i.name, i.image_url, i.unit_price, i.deadline
       FROM group_buy_cart_items c
       JOIN group_buy_items i ON c.item_id = i.id
       WHERE c.user_id = $1 AND i.status = 'active' AND i.deadline > NOW()
       ORDER BY c.created_at DESC`,
            [userId]
        );

        const items = result.rows as GroupBuyCartItem[];
        const total = items.reduce((sum, item) => {
            const price = parseFloat((item as GroupBuyCartItem & { unit_price: number }).unit_price?.toString() || '0');
            return sum + price * item.quantity;
        }, 0);

        return { items, total };
    }

    /**
     * Clear user's cart
     */
    async clearCart(userId: string): Promise<void> {
        await query(`DELETE FROM group_buy_cart_items WHERE user_id = $1`, [userId]);
    }

    // ==================== CHECKOUT ====================

    /**
     * Checkout cart - create orders and debit wallet
     */
    async checkout(userId: string, input: CheckoutInput): Promise<GroupBuyOrder[]> {
        const { items, total } = await this.getCart(userId);

        if (items.length === 0) {
            throw new BadRequestError('Cart is empty');
        }

        // Get user's wallet
        const wallet = await walletsService.getWallet(userId);
        const balance = parseFloat(wallet.available_balance.toString());

        if (balance < total) {
            throw new InsufficientFundsError(
                `Insufficient funds. Required: ${formatCurrency(total)}, Available: ${formatCurrency(balance)}`
            );
        }

        return withTransaction(async (client) => {
            const orders: GroupBuyOrder[] = [];

            for (const cartItem of items) {
                const itemData = cartItem as unknown as { unit_price: number; name: string };
                const unitPrice = parseFloat(itemData.unit_price.toString());
                const orderTotal = unitPrice * cartItem.quantity;
                const orderNumber = generateOrderNumber();

                // Create order
                const orderResult = await client.query(
                    `INSERT INTO group_buy_orders 
           (user_id, item_id, quantity, unit_price, total_amount, status, order_number, delivery_address, delivery_notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
                    [
                        userId,
                        cartItem.item_id,
                        cartItem.quantity,
                        unitPrice,
                        orderTotal,
                        GroupBuyOrderStatus.PENDING,
                        orderNumber,
                        input.delivery_address,
                        input.delivery_notes,
                    ]
                );

                orders.push(orderResult.rows[0] as GroupBuyOrder);
            }

            // Debit wallet for total
            await walletsService.debitWallet(
                wallet.id,
                total,
                TransactionType.GROUP_BUY,
                `Group buy order - ${orders.length} item(s)`,
                undefined,
                { order_ids: orders.map(o => o.id) }
            );

            // Clear cart
            await client.query(`DELETE FROM group_buy_cart_items WHERE user_id = $1`, [userId]);

            logger.info(`Group buy checkout completed: ${formatCurrency(total)}`, {
                userId,
                orderCount: orders.length
            });

            return orders;
        });
    }

    // ==================== ORDERS ====================

    /**
     * Get user's orders
     */
    async getUserOrders(userId: string): Promise<GroupBuyOrder[]> {
        const result = await query(
            `SELECT o.*, i.name as item_name, i.image_url
       FROM group_buy_orders o
       JOIN group_buy_items i ON o.item_id = i.id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
            [userId]
        );

        return result.rows as GroupBuyOrder[];
    }

    /**
     * Check and process items that have reached deadline
     * Called by scheduler - refunds if MOQ not met
     */
    async processDeadlineItems(): Promise<void> {
        // Get items past deadline that are still active
        const expiredItems = await query(
            `SELECT * FROM group_buy_items 
       WHERE status = 'active' AND deadline <= NOW()`
        );

        for (const item of expiredItems.rows) {
            // Get ordered quantity
            const ordersResult = await query(
                `SELECT SUM(quantity) as total_quantity 
         FROM group_buy_orders 
         WHERE item_id = $1 AND status = 'pending'`,
                [item.id]
            );

            const totalOrdered = parseInt(ordersResult.rows[0]?.total_quantity || '0');

            if (totalOrdered < item.min_quantity) {
                // MOQ not met - refund all orders
                await this.refundItemOrders(item.id);

                // Mark item as closed
                await query(
                    `UPDATE group_buy_items SET status = 'closed' WHERE id = $1`,
                    [item.id]
                );

                logger.info(`Group buy item closed (MOQ not met): ${item.name}`, {
                    itemId: item.id,
                    ordered: totalOrdered,
                    required: item.min_quantity
                });
            } else {
                // MOQ met - mark as fulfilled
                await query(
                    `UPDATE group_buy_items SET status = 'fulfilled' WHERE id = $1`,
                    [item.id]
                );

                await query(
                    `UPDATE group_buy_orders SET status = 'confirmed' WHERE item_id = $1 AND status = 'pending'`,
                    [item.id]
                );

                logger.info(`Group buy item fulfilled: ${item.name}`, {
                    itemId: item.id,
                    ordered: totalOrdered
                });
            }
        }
    }

    /**
     * Refund all pending orders for an item
     */
    private async refundItemOrders(itemId: string): Promise<void> {
        const orders = await query(
            `SELECT o.*, w.id as wallet_id 
       FROM group_buy_orders o
       JOIN wallets w ON o.user_id = w.user_id
       WHERE o.item_id = $1 AND o.status = 'pending'`,
            [itemId]
        );

        for (const order of orders.rows) {
            // Credit wallet
            await walletsService.creditWallet(
                order.wallet_id,
                parseFloat(order.total_amount),
                TransactionType.REFUND,
                `Refund for group buy order ${order.order_number}`,
                undefined,
                { order_id: order.id, item_id: itemId }
            );

            // Update order status
            await query(
                `UPDATE group_buy_orders SET status = 'refunded' WHERE id = $1`,
                [order.id]
            );

            logger.info(`Order refunded: ${order.order_number}`, {
                orderId: order.id,
                userId: order.user_id,
                amount: order.total_amount
            });
        }
    }
}

export const groupBuyingService = new GroupBuyingService();

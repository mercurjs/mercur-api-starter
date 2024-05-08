import { type SubscriberConfig, type SubscriberArgs, OrderService, LineItem } from '@medusajs/medusa';
import OrderRepository from '../repositories/order';
import { EntityManager } from 'typeorm';
import LineItemRepository from '@medusajs/medusa/dist/repositories/line-item';
import ShippingMethodRepository from '@medusajs/medusa/dist/repositories/shipping-method';
import { omit } from 'lodash';

/**
 * Subscribers that listen to the `order-placed` event.
 * Subscribers creates "children" orders for each store in the order.
 */
export default async function orderPlacedHandler({ data, container }: SubscriberArgs<Record<string, any>>) {
	const orderService: OrderService = container.resolve('orderService');
	const orderRepository_: typeof OrderRepository = container.resolve('orderRepository');
	const manager: EntityManager = container.resolve('manager');
	const lineItemRepository: typeof LineItemRepository = container.resolve('lineItemRepository');
	const shippingMethodRepository: typeof ShippingMethodRepository = container.resolve('shippingMethodRepository');

	await manager.transaction(async (manager) => {
		const orderRepo = manager.withRepository(orderRepository_);
		const lineItemRepo = manager.withRepository(lineItemRepository);
		const shippingMethodRepo = manager.withRepository(shippingMethodRepository);

		const order = await orderService.withTransaction(manager).retrieveWithTotals(data.id, {
			relations: [
				'items',
				'items.variant',
				'items.variant.product',
				'items.variant.product.store',
				'shipping_methods',
			],
		});

		const storeProductsMap = new Map<string, LineItem[]>();

		// Grouping line items by store id in a map
		for (const lineItem of order.items) {
			const storeProducts = storeProductsMap.get(lineItem.variant.product.store_id);

			storeProductsMap.set(lineItem.variant.product.store_id, [...(storeProducts ?? []), lineItem]);
		}

		for (const [storeId, lineItems] of storeProductsMap) {
			// Calculate total for each store
			const totals = lineItems.reduce(
				(acc, item) => {
					return {
						subtotal: acc.subtotal + item.subtotal,
						tax_total: acc.tax_total + item.tax_total,
						total: acc.total + item.total,
						original_total: acc.original_total + item.original_total,
						original_tax_total: acc.original_tax_total + item.original_tax_total,
						discount_total: acc.discount_total + item.discount_total,
						raw_discount_total: acc.raw_discount_total + item.raw_discount_total,
						gift_card_total: acc.gift_card_total + item.gift_card_total,
					};
				},
				{
					subtotal: 0,
					tax_total: 0,
					total: 0,
					original_total: 0,
					original_tax_total: 0,
					discount_total: 0,
					raw_discount_total: 0,
					gift_card_total: 0,
				}
			);

			const lineItemIds = lineItems.map((li) => li.id);

			const shippingMethods = order.shipping_methods.filter((sm) =>
				lineItemIds.includes((sm.data as Record<string, string>).line_item_id)
			);

			const newLineItems = lineItems.map((li) => {
				return lineItemRepo.create({
					...li,
					id: null,
				});
			});

			// Create a new order for each store
			const storeOrder = orderRepo.create({
				...omit(order, 'id', 'cart_id'),
				parent_id: order.id,
				items: newLineItems,
				store_id: storeId,
				paid_total: totals.total,
				refunded_total: 0,
				shipping_tax_total: shippingMethods.reduce((acc, sm) => acc + sm.tax_total, 0),
				shipping_total: shippingMethods.reduce((acc, sm) => acc + sm.total, 0),
				...totals,
			});

			storeOrder.shipping_methods = shippingMethods.map((sm) => {
				return shippingMethodRepo.create({
					...omit(sm, 'id', 'cart_id'),
					order_id: storeOrder.id,
				});
			});

			await orderRepo.save(storeOrder);
		}
	});
}

export const config: SubscriberConfig = {
	event: [OrderService.Events.PLACED],
	context: {
		subscriberId: 'order-placed-handler',
	},
};

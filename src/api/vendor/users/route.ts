import { AdminCreateUserRequest, MedusaRequest, MedusaResponse, validator } from '@medusajs/medusa';
import UserService from '../../../services/user';
import _ from 'lodash';
import { EntityManager } from 'typeorm';
import StoreService from '../../../services/store';

/**
 * @oas [post] /vendor/users
 * operationId: "PostVendorUsers"
 * summary: "Create a vendor user"
 * description: "Creates a new vendor user."
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/AdminCreateUserRequest"
 * x-codegen:
 *   method: create
 * tags:
 *   - VendorUsers
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
	const validated = await validator(AdminCreateUserRequest, req.body);

	const userService: UserService = req.scope.resolve('userService');
	const storeService: StoreService = req.scope.resolve('storeService');
	const data = _.omit(validated, ['password']);

	const manager: EntityManager = req.scope.resolve('manager');
	const user = await manager.transaction(async (transactionManager) => {
		const newStore = await storeService.withTransaction(transactionManager).createForUser();

		return await userService
			.withTransaction(transactionManager)
			.create({ ...data, store_id: newStore.id }, validated.password);
	});

	res.status(200).json({ user: _.omit(user, ['password_hash', 'is_admin']) });
};

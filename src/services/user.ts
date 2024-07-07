import { FindConfig, UserService as MedusaUserService, buildQuery } from '@medusajs/medusa';
import {
	FilterableUserProps,
	CreateUserInput as MedusaCreateUserInput,
	UpdateUserInput as MedusaUpdateUserInput,
} from '@medusajs/medusa/dist/types/user';
import { Selector } from '@medusajs/types';
import { MedusaError } from '@medusajs/utils';
import { Lifetime } from 'awilix';
import { User, UserPermission, UserStatus } from '../models/user';
import StoreService from './store';

type CreateUserInput = {
	store_id?: string;
	status?: UserStatus;
	is_admin?: boolean;
} & MedusaCreateUserInput;

type UpdateUserInput = {
	status?: UserStatus;
} & MedusaUpdateUserInput;

class UserService extends MedusaUserService {
	static LIFE_TIME = Lifetime.TRANSIENT;

	protected readonly loggedInUser_: User | null;
	protected readonly storeService: StoreService;

	constructor(container) {
		super(container);
		this.storeService = container.storeService;

		try {
			this.loggedInUser_ = container.loggedInUser;
		} catch (e) {
			// avoid errors when backend first runs
		}
	}

	/**
	 * Assigns store_id to selector if not provided
	 * @param selector
	 */
	private prepareListConfig_(selector?: Selector<User>) {
		selector = selector || {};

		if (this.loggedInUser_?.store_id && !selector.store_id) {
			selector.store_id = this.loggedInUser_.store_id;
		}
	}

	/**
	 * Create a new user and assigns it to a store if not provided
	 * @param user
	 * @param password
	 * @returns {Promise<User>}
	 */
	async create(user: CreateUserInput, password: string): Promise<User> {
		return await super.create(user, password);
	}

	async retrieve(userId: string, config?: FindConfig<User>): Promise<User> {
		const user = await super.retrieve(userId, config);

		// If logged in user is not admin, we check if the user is from the same store
		if (user.store_id && this.loggedInUser_?.store_id && user.store_id !== this.loggedInUser_.store_id) {
			throw new MedusaError(MedusaError.Types.NOT_FOUND, 'User does not exist');
		}

		return user;
	}

	/**
	 * This method is used to authenticate user
	 * If the user is not approved, we throw an error
	 * @param email
	 * @param config
	 * @returns
	 */
	async retrieveByEmail(email: string, config: FindConfig<User> = {}): Promise<User> {
		const userRepo = this.activeManager_.withRepository(this.userRepository_);

		const query = buildQuery(
			{
				email: email.toLowerCase(),
				status: UserStatus.ACTIVE,
			},
			config
		);
		const user = await userRepo.findOne(query);

		if (!user) {
			throw new MedusaError(MedusaError.Types.NOT_FOUND, `User with email: ${email} was not found`);
		}

		return user;
	}

	async list(selector?: Selector<User> & { q?: string }, config?: FindConfig<FilterableUserProps>): Promise<User[]> {
		this.prepareListConfig_(selector);

		return await super.list(selector, config);
	}

	async listAndCount(
		selector?: Selector<User> & { q?: string },
		config?: FindConfig<FilterableUserProps>
	): Promise<[User[], number]> {
		this.prepareListConfig_(selector);

		return await super.listAndCount(selector, config);
	}

	async update(userId: string, update: UpdateUserInput): Promise<User> {
		const permission = this.loggedInUser_.is_admin ? UserPermission.ADMIN : UserPermission.VENDOR;

		if (permission !== UserPermission.ADMIN) {
			if (update.role) {
				throw new MedusaError(MedusaError.Types.INVALID_DATA, 'You are not allowed to change user role');
			}

			if (update.status) {
				throw new MedusaError(MedusaError.Types.INVALID_DATA, 'You are not allowed to change user status');
			}
		}

		return await super.update(userId, update);
	}
}

export default UserService;

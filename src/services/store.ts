import { Lifetime } from 'awilix';
import { FindConfig, StoreService as MedusaStoreService, Store, buildQuery } from '@medusajs/medusa';
import { User } from '../models/user';
import StoreRepository from '../repositories/store';
import { MedusaError } from 'medusa-core-utils';
import { EntityManager } from 'typeorm';

class StoreService extends MedusaStoreService {
	static LIFE_TIME = Lifetime.TRANSIENT;
	protected readonly loggedInUser_: User | null;
	protected readonly storeRepository_: typeof StoreRepository;

	constructor(container) {
		super(container);
		this.storeRepository_ = container.storeRepository;

		try {
			this.loggedInUser_ = container.loggedInUser;
		} catch (e) {
			// avoid errors when backend first runs
		}
	}

	async createForUser() {
		return await this.atomicPhase_(async (transactionManager: EntityManager) => {
			const storeRepository = transactionManager.withRepository(this.storeRepository_);
			const currencyRepository = transactionManager.withRepository(this.currencyRepository_);

			const newStore = storeRepository.create();

			const usd = await currencyRepository.findOne({
				where: {
					code: 'usd',
				},
			});

			if (usd) {
				newStore.currencies = [usd];
			}

			return await storeRepository.save(newStore);
		});
	}

	async retrieve(config?: FindConfig<Store>): Promise<Store> {
		if (!this.loggedInUser_?.store_id) {
			return super.retrieve(config);
		}

		return await this.retrieveForLoggedInUser(config);
	}

	/**
	 * Retrieves store by id
	 * @param id
	 * @param config
	 * @returns
	 */
	async retrieve_(id: string, config?: FindConfig<Store>) {
		const storeRepo = this.manager_.withRepository(this.storeRepository_);

		const query = buildQuery({ id }, config);

		const stores = await storeRepo.find(query);

		const store = stores[0];

		if (!store) {
			throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Store not found');
		}

		return store;
	}

	async retrieveForLoggedInUser(config?: FindConfig<Store>) {
		const store = await this.retrieve_(this.loggedInUser_.store_id, {
			relations: [...(config?.relations ?? []), 'members'],
			...config,
		});

		return store;
	}
}

export default StoreService;

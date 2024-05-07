import { Lifetime } from 'awilix';
import { FindConfig, StoreService as MedusaStoreService, Store, buildQuery } from '@medusajs/medusa';
import { User } from '../models/user';
import StoreRepository from '../repositories/store';
import { MedusaError } from 'medusa-core-utils';
import { EntityManager } from 'typeorm';

class StoreService extends MedusaStoreService {
	static LIFE_TIME = Lifetime.SCOPED;
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

	async create(): Promise<Store> {
		return await this.atomicPhase_(async (transactionManager: EntityManager) => {
			const storeRepository = transactionManager.withRepository(this.storeRepository_);
			const currencyRepository = transactionManager.withRepository(this.currencyRepository_);

			const newStore = storeRepository.create();
			// Add default currency (USD) to store currencies
			const usd = await currencyRepository.findOne({
				where: {
					code: 'usd',
				},
			});

			if (usd) {
				newStore.currencies = [usd];
			}

			const store = await storeRepository.save(newStore);
			return store;
		});
	}

	async retrieve(config?: FindConfig<Store>): Promise<Store> {
		const storeRepo = this.activeManager_.withRepository(this.storeRepository_);

		// If no user is logged in, return the first store
		if (!this.loggedInUser_) {
			return await super.retrieve(config);
		}

		const query = buildQuery(
			{
				id: this.loggedInUser_.store_id,
			},
			config
		);

		const store = await storeRepo.findOne(query);

		if (!store) {
			throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Store does not exist');
		}

		return store;
	}
}

export default StoreService;

import { AdminPostProductsReq as MedusaAdminPostProductsReq } from '@medusajs/medusa/dist/api/routes/admin/products/create-product';
import { AdminPostProductsProductReq as MedusaAdminPostProductsProductReq } from '@medusajs/medusa/dist/api/routes/admin/products/update-product';
import { IsString, ArrayMaxSize, IsOptional } from 'class-validator';
import { registerOverriddenValidators } from '@medusajs/medusa';

class AdminPostProductsReq extends MedusaAdminPostProductsReq {
	@IsString({ each: true })
	@ArrayMaxSize(10)
	@IsOptional()
	shipping_options?: string[];
}

class AdminPostProductsProductReq extends MedusaAdminPostProductsProductReq {
	@IsString({ each: true })
	@ArrayMaxSize(10)
	@IsOptional()
	shipping_options?: string[];
}

registerOverriddenValidators(AdminPostProductsReq);
registerOverriddenValidators(AdminPostProductsProductReq);

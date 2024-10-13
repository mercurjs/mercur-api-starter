import { registerOverriddenValidators } from '@medusajs/medusa';
import { AdminPostProductsReq as MedusaAdminPostProductsReq } from '@medusajs/medusa/dist/api/routes/admin/products/create-product';
import { AdminPostProductsProductReq as MedusaAdminPostProductsProductReq } from '@medusajs/medusa/dist/api/routes/admin/products/update-product';
import { AdminUpdateUserRequest as MedusaAdminUpdateUserRequest } from '@medusajs/medusa/dist/api/routes/admin/users/update-user';
import { ArrayMaxSize, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserStatus } from '../models/user';

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

// change this to a local class declaration
class AdminUpdateUserRequest extends MedusaAdminUpdateUserRequest {
	@IsEnum(UserStatus)
	@IsOptional()
	status?: UserStatus;
}

registerOverriddenValidators(AdminPostProductsReq);
registerOverriddenValidators(AdminPostProductsProductReq);
/**
 * We have to register the external validator AdminUpdateUserRequest as an
 * override for the vendor update request so the new field status gets recognized
*/
registerOverriddenValidators(AdminUpdateUserRequest);

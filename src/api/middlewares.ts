import { MiddlewaresConfig, authenticate } from '@medusajs/medusa';
import cors from 'cors';
import { registerLoggedInUser } from '../middlewares/register-logged-in-user';
import { adminCors } from '../util/cors';
import { restrictedAdminMiddlewares } from '../util/restricted-admin-middlewares';

export const config: MiddlewaresConfig = {
	routes: [
		{
			// Authenticate all /admin routes except /auth and /admin/invites/accept and /admin/users/password-token and /admin/users/reset-password
			matcher: /^\/admin\/(?!auth|invites\/accept|users\/password-token|users\/reset-password).*$/,
			middlewares: [cors(adminCors), authenticate(), registerLoggedInUser],
		},
		{
			matcher: /^\/admin\/users\/(password-token|reset-password)$/,
			middlewares: [adminCors],
		},
		{
			matcher: '/vendor/*',
			middlewares: [cors(adminCors)],
		},
		...restrictedAdminMiddlewares,
	],
};

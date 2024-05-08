export default async function () {
	const imports = (await import('@medusajs/medusa/dist/api/routes/admin/users/index')) as any;

	imports.defaultAdminUserFields = [...imports.defaultAdminUserFields, 'status', 'is_admin'];
}

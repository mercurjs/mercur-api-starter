import { FocusModal, Button, Heading, Text, Label, Input, Select, useToggleState } from '@medusajs/ui';
import { useForm, Controller } from 'react-hook-form';
import { Notify } from './types';
import { useAdminCreateInvite } from 'medusa-react';
import { UserRoles } from '@medusajs/medusa';

type InviteUsersModal = {
	email: string;
	role: UserRoles;
};

const InviteUsersModal = ({ notify }: { notify: Notify }) => {
	const form = useForm<InviteUsersModal>({
		defaultValues: getDefaultValues(),
	});

	const { toggle, state, close } = useToggleState();

	const { mutate, isLoading } = useAdminCreateInvite();

	const onReset = () => {
		form.reset(getDefaultValues());
		close();
	};

	const onSubmit = form.handleSubmit(async (data) => {
		mutate(
			{ role: data.role as UserRoles, user: data.email },
			{
				onSuccess: () => {
					notify.success('Success', `User ${data.email} was invited`);
					onReset();
				},
				onError: () => {
					notify.error('Error', 'Error occured while inviting user');
				},
			}
		);
	});

	return (
		<FocusModal open={state} onOpenChange={toggle}>
			<FocusModal.Trigger>
				<Button variant="secondary">Invite administrators</Button>
			</FocusModal.Trigger>
			<FocusModal.Content>
				<form onSubmit={onSubmit}>
					<FocusModal.Header>
						<Button isLoading={isLoading}>Invite</Button>
					</FocusModal.Header>
					<FocusModal.Body className="flex flex-col items-center py-16">
						<div className="flex w-full max-w-lg flex-col gap-y-8">
							<div className="flex flex-col gap-y-1">
								<Heading>Invite administrator</Heading>
								<Text className="text-ui-fg-subtle">Invite administators to your team</Text>
							</div>
							<div className="flex flex-col gap-y-4">
								<div className="flex flex-col gap-y-2">
									<Label htmlFor="email" className="text-ui-fg-subtle">
										Email
									</Label>
									<Input
										id="email"
										placeholder="member@medusa-test.com"
										{...form.register('email', { required: true })}
									/>
								</div>
								<div className="flex flex-col gap-y-2">
									<Label htmlFor="last_name" className="text-ui-fg-subtle">
										Role
									</Label>
									<Controller
										name="role"
										control={form.control}
										rules={{ required: true }}
										render={({ field: { onChange, ...other } }) => (
											<Select {...other} onValueChange={onChange}>
												<Select.Trigger>
													<Select.Value placeholder="Select status" />
												</Select.Trigger>
												<Select.Content>
													{roles.map((item) => (
														<Select.Item key={item.value} value={item.value}>
															{item.label}
														</Select.Item>
													))}
												</Select.Content>
											</Select>
										)}
									/>
								</div>
							</div>
						</div>
					</FocusModal.Body>
				</form>
			</FocusModal.Content>
		</FocusModal>
	);
};

const roles = [
	{
		label: 'Admin',
		value: 'admin',
	},
	{
		label: 'Member',
		value: 'member',
	},
	{
		label: 'Developer',
		value: 'developer',
	},
];

const getDefaultValues = (): InviteUsersModal => {
	return {
		email: '',
		role: 'admin' as UserRoles,
	};
};

export default InviteUsersModal;

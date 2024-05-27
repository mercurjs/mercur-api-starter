import { EllipsisHorizontal, PencilSquare, Trash } from '@medusajs/icons';
import { User } from '@medusajs/medusa';
import { useAdminDeleteUser } from 'medusa-react';
import { DropdownMenu, IconButton, usePrompt } from '@medusajs/ui';
import { Notify } from './types';

export function UserActions({ user, onEdit, notify }: { user: User; onEdit: () => void; notify: Notify }) {
	const promt = usePrompt();
	const { mutate } = useAdminDeleteUser(user.id, {
		onSuccess: () => {
			notify.success('Success', 'User deleted successfully');
		},
		onError: () => {
			notify.error('Error', 'Error occured while deleting user');
		},
	});

	const onDelete = () => {
		const confirmed = promt({
			title: 'Are you sure?',
			description: 'Are you sure you want to delete this user?',
			confirmText: 'Delete',
		});

		if (confirmed) {
			mutate();
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenu.Trigger asChild>
				<IconButton variant="transparent">
					<EllipsisHorizontal />
				</IconButton>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content>
				<DropdownMenu.Item className="gap-x-2" onClick={onEdit}>
					<PencilSquare className="text-ui-fg-subtle" />
					Edit
				</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<DropdownMenu.Item className="gap-x-2" onClick={onDelete}>
					<Trash className="text-ui-fg-subtle" />
					Delete
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu>
	);
}

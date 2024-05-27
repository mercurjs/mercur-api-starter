import type { WidgetConfig, ProductDetailsWidgetProps } from '@medusajs/admin';
import { Container, Heading, Checkbox, Label, Button } from '@medusajs/ui';
import { useAdminShippingOptions, useAdminUpdateProduct } from 'medusa-react';
import React, { useEffect } from 'react';

const ProductWidget = ({ product, notify }: ProductDetailsWidgetProps) => {
	const [selected, setSelected] = React.useState(product.shipping_options.map((it) => it.id));
	const { shipping_options } = useAdminShippingOptions();
	const { mutate, isLoading } = useAdminUpdateProduct(product.id);

	useEffect(() => {
		setSelected(product.shipping_options.map((it) => it.id));
	}, [product]);

	const onSubmit = () => {
		mutate(
			{
				shipping_options: selected,
			},
			{
				onSuccess: () => {
					notify.success('Success', 'Succesfuly updated shipping options');
				},
				onError: () => {
					notify.error('Error', 'Error updating shipping options');
				},
			}
		);
	};

	return (
		<Container>
			<Heading>Shipping options</Heading>
			<div className="flex flex-col gap-2 mt-4">
				{shipping_options?.map((option) => {
					const checked = selected.includes(option.id);

					return (
						<div className="flex items-center space-x-2">
							<Checkbox
								id={option.id}
								checked={checked}
								onClick={() => {
									if (checked) {
										setSelected(selected.filter((it) => it !== option.id));
									} else {
										setSelected([...selected, option.id]);
									}
								}}
							/>
							<Label htmlFor={option.id}>{option.name}</Label>
						</div>
					);
				})}
			</div>
			<div className="mt-4 flex justify-end">
				<Button isLoading={isLoading} onClick={onSubmit}>
					Save
				</Button>
			</div>
		</Container>
	);
};

export const config: WidgetConfig = {
	zone: 'product.details.after',
};

export default ProductWidget;

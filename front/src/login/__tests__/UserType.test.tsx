import UserType from '../UserType';
import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render } from '@testing-library/react';

describe('<UserType />', () => {
	const props = { field: { name: 'my-field', value: [ true ] } };
	it('UserType renders correctly', () => {
		const { container, debug, queryByText } = render(<UserType {...props} />);

		expect(queryByText('Producteur de déchets')).toBeInTheDocument();
		expect(container.firstChild).toMatchSnapshot();
	});
});


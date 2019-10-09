import React from 'react';
import Tooltip from '../Tooltip';
import '@testing-library/jest-dom/extend-expect';
import { render, fireEvent } from '@testing-library/react';

describe('<Tooltip />', () => {
	it('renders nothing when props are empty', () => {
		const { container } = render(<Tooltip />);
		expect(container.querySelector('span')).toBeNull();
	});

	it('shows help message when button is hovered', async () => {
		const helpMsg = 'lorem ipsum';
		const { container, getByAltText, queryByText, getByRole, getByText } = render(<Tooltip msg={helpMsg} />);
		expect(container.querySelector('span')).toHaveClass('tooltip__container');
		expect(getByAltText('Aide')).toBeInTheDocument();
		expect(queryByText(helpMsg)).not.toBeInTheDocument();
		const button = getByRole('button');
		expect(button).toHaveClass('tooltip__trigger');

		// Mouseover button -> display text
		fireEvent.mouseOver(button);
		const displayed = getByText(helpMsg);
		expect(displayed).toBeInTheDocument();
		expect(displayed).toHaveClass('tooltip__content');

		// Mouseleave button -> hide text
		fireEvent.mouseLeave(button);
		expect(queryByText(helpMsg)).not.toBeInTheDocument();
	});
});

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import App from './App';

afterEach(() => {
  cleanup();
});

describe('MsgDock shell', () => {
  it('renders an API-ready empty message state', () => {
    render(<App />);

    expect(screen.getByText('MSGDOCK')).toBeInTheDocument();
    expect(screen.getByText('No messages in this view')).toBeInTheDocument();
    expect(
      screen.getByText(/Captured email and SMS traffic will appear here/),
    ).toBeInTheDocument();
  });

  it('updates the active workspace section without adding message fixtures', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Email' }));

    expect(screen.getByRole('button', { name: 'Email' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByText('capture stream / email')).toBeInTheDocument();
    expect(screen.getByText('No messages in this view')).toBeInTheDocument();
  });
});

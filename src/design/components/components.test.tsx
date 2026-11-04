import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button, Checkbox, Dialog, IconButton, TextField } from './index';

describe('design system components', () => {
  it('Button is disabled and busy while loading', () => {
    render(<Button loading>Save</Button>);
    const btn = screen.getByRole('button', { name: /save/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  it('IconButton exposes its label to assistive tech', () => {
    render(<IconButton label="Reset file" icon={<span />} />);
    expect(screen.getByRole('button', { name: 'Reset file' })).toBeInTheDocument();
  });

  it('TextField links its error message via aria-describedby', () => {
    render(<TextField label="Email" error="Enter a valid email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter a valid email');
  });

  it('Checkbox toggles via its label', async () => {
    render(<Checkbox label="I agree" />);
    const box = screen.getByRole('checkbox', { name: 'I agree' });
    await userEvent.click(screen.getByText('I agree'));
    expect(box).toBeChecked();
  });

  it('Dialog renders title/description and a close button only when dismissible', () => {
    const onClose = vi.fn();
    const { rerender } = render(<Dialog open onClose={onClose} title="Heads up" description="Details" />);
    expect(screen.getByText('Heads up')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    rerender(<Dialog open onClose={onClose} title="Heads up" dismissible={false} />);
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });
});

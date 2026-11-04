import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { appConfig } from '@/config/app.config';
import { LoginPage } from './LoginPage';

describe('candidate sign-in page', () => {
  it('shows everything a candidate needs', () => {
    render(<LoginPage onSubmit={vi.fn()} error="That access code is not valid." mockNotice />);
    expect(screen.getByRole('img', { name: appConfig.brand.logoAlt })).toBeInTheDocument();
    expect(screen.getByText('Talent Assessment')).toBeInTheDocument();
    expect(screen.getByText(appConfig.subtitle)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: appConfig.welcomeLine.replaceAll('-', '‑') }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Sign in with the email address and access code from your invitation.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Mock backend (development)')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('That access code is not valid.');
    expect(screen.getByLabelText(/Email address/)).toHaveAttribute('placeholder', 'name@example.com');
    expect(screen.getByLabelText(/Access code/)).toHaveAttribute('maxLength', '14');
    expect(screen.getByRole('button', { name: /Continue/ })).toBeInTheDocument();
    expect(screen.getByText(/One sitting, timed by the server/)).toBeInTheDocument();
    expect(screen.getByText(/Proctored: webcam, full screen/)).toBeInTheDocument();
    expect(screen.getByText(/Desktop Google Chrome or Microsoft Edge/)).toBeInTheDocument();
    expect(screen.getByText(/Trouble signing in\?/)).toBeInTheDocument();
    expect(screen.getByText(appConfig.footerText(new Date().getFullYear()))).toBeInTheDocument();
  });

  it('checks the fields before submitting', async () => {
    const onSubmit = vi.fn();
    render(<LoginPage onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: /Continue/ }));
    expect(screen.getByText('Enter the email address the invitation was sent to.')).toBeInTheDocument();
    expect(screen.getByText('Access codes have 12 characters, like 7KQ2-M9XD-4RTA.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a normalised email and access code', async () => {
    const onSubmit = vi.fn();
    render(<LoginPage onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText(/Email address/), ' Candidate@Example.com ');
    await userEvent.type(screen.getByLabelText(/Access code/), '7kq2m9xd4rta');
    expect(screen.getByLabelText(/Access code/)).toHaveValue('7KQ2-M9XD-4RTA');
    await userEvent.click(screen.getByRole('button', { name: /Continue/ }));
    expect(onSubmit).toHaveBeenCalledWith({ email: 'candidate@example.com', accessCode: '7KQ2M9XD4RTA' });
  });
});

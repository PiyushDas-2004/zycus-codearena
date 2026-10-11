/**
 * The admin portal against a fake API: who gets in, the candidate list, inviting (the code is shown
 * once, with ways to send it), and reopening a submitted test.
 */
import { configure, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The pages load lazily and userEvent types slowly on a busy machine (the suite runs in parallel).
vi.setConfig({ testTimeout: 20_000 });
configure({ asyncUtilTimeout: 10_000 });
import AdminRoute from './AdminRoute';
import { useAdminSession } from './adminSession';
import { setAdminApiForTesting, type AdminApi } from './api';
import { detail, fakeAdminApi, STAFF, TEMPLATE_ID } from './testing/fakeAdminApi';

function open(api: AdminApi, path = '/admin') {
  setAdminApiForTesting(api);
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/*" element={<AdminRoute />} />
      </Routes>
    </MemoryRouter>,
  );
  return userEvent.setup();
}

beforeEach(() => useAdminSession.setState({ status: 'loading', staff: null, api: null }));
afterEach(() => setAdminApiForTesting(null));

describe('signing in', () => {
  it('asks for a password, says when it is wrong, and opens the portal when it is right', async () => {
    const api = fakeAdminApi({
      restore: async () => ({ ok: true, staff: null }),
    });
    vi.mocked(api.signIn).mockResolvedValueOnce({ ok: false, error: 'INVALID_PAYLOAD', field: 'password' });
    const user = open(api);

    await user.type(await screen.findByLabelText(/Email address/), 'admin@zycus.com');
    await user.type(screen.getByLabelText(/Password/), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Wrong email or password.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('heading', { name: 'Candidates' })).toBeInTheDocument();
    expect(api.signIn).toHaveBeenLastCalledWith('admin@zycus.com', 'wrong');
  });

  it('checks the fields before asking the server', async () => {
    const api = fakeAdminApi({ restore: async () => ({ ok: true, staff: null }) });
    const user = open(api);
    await user.click(await screen.findByRole('button', { name: 'Sign in' }));
    expect(screen.getByText('Enter your Zycus email address.')).toBeInTheDocument();
    expect(api.signIn).not.toHaveBeenCalled();
  });

  it('tells someone without a staff role that access is not granted', async () => {
    open(fakeAdminApi({ restore: async () => ({ ok: false, error: 'NOT_STAFF' }) }));
    expect(await screen.findByText('Access not granted')).toBeInTheDocument();
  });

  it('shows the sign-in page again when the session ends', async () => {
    const api = fakeAdminApi({ listCandidates: async () => ({ ok: false, error: 'SIGNED_OUT' }) });
    open(api);
    expect(await screen.findByRole('heading', { name: 'Admin sign-in' })).toBeInTheDocument();
  });
});

describe('the candidate list', () => {
  it('shows each candidate with their status, how the test ended, proctoring and tests', async () => {
    open(fakeAdminApi());
    const rowEl = (await screen.findByRole('link', { name: 'Asha Verma' })).closest('tr') as HTMLElement;
    const cells = within(rowEl);
    expect(cells.getByText('Submitted')).toBeInTheDocument();
    expect(cells.getByText('Auto-submitted: proctoring limit reached')).toBeInTheDocument();
    expect(cells.getByText('5 violations')).toBeInTheDocument();
    expect(cells.getByText('4 / 16')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText(/US\$0\.0123 of US\$5\.00 spent/)).toBeInTheDocument();
  });

  it('searches and filters on the server', async () => {
    const api = fakeAdminApi();
    const user = open(api);
    await user.type(await screen.findByPlaceholderText(/Search name/), 'asha');
    await waitFor(() => expect(api.listCandidates).toHaveBeenLastCalledWith({ search: 'asha', state: '' }));
    await user.selectOptions(screen.getByLabelText('Status'), 'in_progress');
    await waitFor(() =>
      expect(api.listCandidates).toHaveBeenLastCalledWith({ search: 'asha', state: 'in_progress' }),
    );
  });
});

describe('inviting a candidate', () => {
  it('validates, creates the code and shows it once with ways to send it', async () => {
    const api = fakeAdminApi();
    const user = open(api);
    await screen.findByText('Online'); // the button waits for the overview (the assessments)
    await user.click(screen.getByRole('button', { name: 'New invitation' }));
    const dialog = within(await screen.findByRole('dialog'));

    await user.click(dialog.getByRole('button', { name: 'Create code' }));
    expect(dialog.getByText('Enter the candidate’s name.')).toBeInTheDocument();
    expect(dialog.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(api.createInvitation).not.toHaveBeenCalled();

    await user.type(dialog.getByLabelText(/Full name/), 'Ravi Kumar');
    await user.type(dialog.getByLabelText(/Email address/), 'Ravi.Kumar@Example.com');
    await user.click(dialog.getByRole('button', { name: 'Create code' }));

    expect(await screen.findByTestId('access-code')).toHaveTextContent('ABCD-EFGH-JKMN');
    expect(api.createInvitation).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Ravi Kumar',
        email: 'ravi.kumar@example.com',
        templateId: TEMPLATE_ID,
        allowDuplicate: false,
      }),
    );
    const mail = screen.getByRole('link', { name: /Open in Outlook/ });
    expect(mail.getAttribute('href')).toMatch(/^mailto:ravi\.kumar%40example\.com\?subject=/);
    expect(decodeURIComponent(mail.getAttribute('href') ?? '')).toContain('ABCD-EFGH-JKMN');
    expect(screen.getByText(/can’t be shown again/)).toBeInTheDocument();
  });

  it('warns about a working code the person already has, and creates a second only when asked', async () => {
    const api = fakeAdminApi();
    vi.mocked(api.createInvitation).mockResolvedValueOnce({
      ok: false,
      error: 'DUPLICATE_ACTIVE',
      invitationId: 'inv-old',
    });
    const user = open(api);
    await screen.findByText('Online'); // the button waits for the overview (the assessments)
    await user.click(screen.getByRole('button', { name: 'New invitation' }));
    const dialog = within(await screen.findByRole('dialog'));
    await user.type(dialog.getByLabelText(/Full name/), 'Asha Verma');
    await user.type(dialog.getByLabelText(/Email address/), 'asha@example.com');
    await user.click(dialog.getByRole('button', { name: 'Create code' }));

    expect(await dialog.findByText(/already has a working code/)).toBeInTheDocument();
    expect(dialog.getByRole('link', { name: 'Open the existing invitation' })).toHaveAttribute(
      'href',
      '/admin/candidates/inv-old',
    );
    await user.click(dialog.getByRole('button', { name: 'Create a second code anyway' }));
    await waitFor(() =>
      expect(api.createInvitation).toHaveBeenLastCalledWith(
        expect.objectContaining({ allowDuplicate: true }),
      ),
    );
  });
});

describe('a candidate’s page', () => {
  it('reopens a submitted test with fresh warnings, after a reason is given', async () => {
    const api = fakeAdminApi();
    const user = open(api, '/admin/candidates/inv-1');
    await user.click(await screen.findByRole('button', { name: 'Reopen test' }));
    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByText(/Time left when it ended/)).toHaveTextContent('2 h 29 min');
    expect(
      dialog.getByRole('checkbox', { name: /Start the warnings afresh \(5 counted so far\)/ }),
    ).toBeChecked();

    await user.click(dialog.getByRole('button', { name: 'Reopen' }));
    expect(dialog.getByText(/Say why/)).toBeInTheDocument();
    expect(api.reopen).not.toHaveBeenCalled();

    await user.type(dialog.getByLabelText(/Reason/), 'Notification popups');
    await user.click(dialog.getByRole('button', { name: 'Reopen' }));
    await waitFor(() => expect(api.reopen).toHaveBeenCalledWith('sess-1', 0, true, 'Notification popups'));
    await waitFor(() => expect(api.candidateDetail).toHaveBeenCalledTimes(2)); // refreshed
  });

  it('asks for extra minutes when no time was left (time-up)', async () => {
    const base = detail();
    const session = base.session ?? undefined;
    const api = fakeAdminApi({
      candidateDetail: async () => ({
        ok: true,
        ...detail({
          session: session && { ...session, submitReason: 'time_up', submittedAtMs: session.deadlineMs },
        }),
      }),
    });
    const user = open(api, '/admin/candidates/inv-1');
    await user.click(await screen.findByRole('button', { name: 'Reopen test' }));
    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByLabelText(/Extra minutes/)).toHaveValue('15');
    await user.clear(dialog.getByLabelText(/Extra minutes/));
    await user.type(dialog.getByLabelText(/Extra minutes/), '0');
    expect(dialog.getByText(/add at least 1 minute/)).toBeInTheDocument();
  });

  it('shows the timeline, marking violations that no longer count', async () => {
    const base = detail();
    const api = fakeAdminApi({
      candidateDetail: async () => ({
        ok: true,
        ...detail({
          events: base.events.map((e, i) =>
            i < 2 ? { ...e, counted: false, details: { reset_by_reopen: 1 } } : e,
          ),
        }),
      }),
    });
    open(api, '/admin/candidates/inv-1');
    expect(await screen.findAllByText('Reset')).toHaveLength(2);
    expect(screen.getAllByText('Counted')).toHaveLength(3);
  });

  it('gives reviewers no actions', async () => {
    const api = fakeAdminApi({ restore: async () => ({ ok: true, staff: { ...STAFF, role: 'reviewer' } }) });
    open(api, '/admin/candidates/inv-1');
    expect(await screen.findByRole('heading', { name: 'Asha Verma' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reopen test' })).toBeNull();
  });
});

describe('webcam snapshots', () => {
  it('loads each snapshot and marks the ones with no face or several faces', async () => {
    const api = fakeAdminApi({
      candidateDetail: async () => ({
        ok: true,
        ...detail({
          snapshots: [
            { id: 'sn1', capturedAtMs: 960_000, reason: 'periodic', faceCount: 1, width: 320, height: 240 },
            { id: 'sn2', capturedAtMs: 970_000, reason: 'violation', faceCount: 2, width: 320, height: 240 },
          ],
        }),
      }),
      snapshotImage: async () => ({ ok: true, jpegB64: '/9j/4AAQ' }),
    });
    const user = open(api, '/admin/candidates/inv-1');
    await user.click(await screen.findByRole('tab', { name: /Webcam/ }));
    const images = await screen.findAllByRole('img', { name: /Webcam at/ });
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', 'data:image/jpeg;base64,/9j/4AAQ');
    expect(screen.getByText('violation')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Only issues' }));
    expect(screen.getAllByRole('img', { name: /Webcam at/ })).toHaveLength(1);
  });
});

describe('team and settings', () => {
  it('adds a staff member and saves the settings', async () => {
    const api = fakeAdminApi();
    const user = open(api, '/admin/team');
    await user.click(await screen.findByRole('button', { name: 'Add staff' }));
    const dialog = within(await screen.findByRole('dialog'));
    await user.type(dialog.getByLabelText(/Zycus email/), 'New.Person@zycus.com');
    await user.type(dialog.getByLabelText(/^Name/), 'New Person');
    await user.selectOptions(dialog.getByLabelText('Role'), 'reviewer');
    await user.click(dialog.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(api.saveStaff).toHaveBeenCalledWith('new.person@zycus.com', 'New Person', 'reviewer', true),
    );

    const max = screen.getByLabelText(/Tests that may run at the same time/);
    await user.clear(max);
    await user.type(max, '0');
    expect(screen.getByText('Between 1 and 50.')).toBeInTheDocument();
    await user.clear(max);
    await user.type(max, '12');
    await user.click(screen.getByRole('button', { name: 'Save settings' }));
    await waitFor(() =>
      expect(api.updateSettings).toHaveBeenCalledWith({
        maxConcurrentSessions: 12,
        grievanceContactEmail: '',
      }),
    );
  });

  it('is only for Super Admins', async () => {
    open(
      fakeAdminApi({ restore: async () => ({ ok: true, staff: { ...STAFF, role: 'recruiter' } }) }),
      '/admin/team',
    );
    expect(await screen.findByRole('heading', { name: 'Candidates' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Team & settings/ })).toBeNull();
  });
});

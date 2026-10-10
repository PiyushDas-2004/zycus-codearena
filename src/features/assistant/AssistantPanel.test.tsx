import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setCandidateApiForTesting, type CandidateApi, type SessionState } from '@/lib/api';
import { useCandidateSession } from '../candidate/session/candidateSession';
import type { WorkspaceController } from '../workspace/WorkspaceController';
import { useWorkspaceUi } from '../workspace/workspaceStore';
import { AssistantPanel } from './AssistantPanel';
import { useAssistant } from './assistantStore';

const QID = '9249d0ed-6c2c-4ea4-80f9-48645dbf737a';
const timing = { sentAtPerf: 0, receivedAtPerf: 1 };

function setup({ selected = 'let isRefreshing = false;', aiUsed = 0 } = {}) {
  const askAssistant = vi.fn<CandidateApi['askAssistant']>(async () => ({
    ok: true as const,
    timing,
    reply: 'What happens when **two** requests get a 401 at once?',
    remaining: 9,
    cooldownSeconds: 20,
  }));
  setCandidateApiForTesting({ askAssistant } as unknown as CandidateApi);
  useCandidateSession.setState({ token: 't'.repeat(43), state: { aiUsed } as SessionState });
  useWorkspaceUi.setState({
    currentQuestionId: QID,
    questions: [{ questionId: QID, position: 1, title: 'Approvals Inbox', statementMd: '', files: [] }],
    locked: false,
    paused: false,
  });
  const controller = {
    selectedText: vi.fn(() => ({ text: selected, lines: selected ? 1 : 0 })),
    activeFilePath: vi.fn(() => 'src/api/httpClient.ts'),
  } as unknown as WorkspaceController;
  render(<AssistantPanel controller={controller} maxRequests={10} />);
  const box = () => screen.getByLabelText('Your question for the assistant');
  return { askAssistant, controller, box, user: userEvent.setup() };
}

beforeEach(() => useAssistant.getState().reset());
afterEach(() => setCandidateApiForTesting(null));

describe('AssistantPanel', () => {
  it('asks with the selected code, shows the hint and what is left', async () => {
    const { askAssistant, box, user } = setup();
    expect(screen.getByText('10 of 10 left')).toBeInTheDocument();

    await user.type(box(), 'Why does refresh run twice?{Enter}');

    expect(await screen.findByText('two')).toBeInTheDocument();
    expect(askAssistant).toHaveBeenCalledWith('t'.repeat(43), {
      questionId: QID,
      message: 'Why does refresh run twice?',
      filePath: 'src/api/httpClient.ts',
      code: 'let isRefreshing = false;',
      history: [],
    });
    expect(screen.getByText('9 of 10 left')).toBeInTheDocument();
    expect(box()).toHaveValue('');
    // The cooldown starts: the button shows the seconds left.
    expect(screen.getByRole('button', { name: 'Ask' })).toHaveTextContent(/\d+s/);
  });

  it('leaves the code out when the box is unticked', async () => {
    const { askAssistant, box, user } = setup();
    await user.click(screen.getByLabelText("Include the code I've selected"));
    await user.type(box(), 'What is a stale closure?{Enter}');
    await waitFor(() => expect(askAssistant).toHaveBeenCalled());
    expect(askAssistant.mock.calls[0]?.[1].code).toBeNull();
  });

  it('starts from the server count after a reload', () => {
    setup({ aiUsed: 4 });
    expect(screen.getByText('6 of 10 left')).toBeInTheDocument();
  });

  it('on a cooldown, says how long to wait and gives the question back', async () => {
    const { askAssistant, box, user } = setup();
    askAssistant.mockResolvedValueOnce({
      ok: false,
      error: 'ASSISTANT_COOLDOWN',
      retryAfterSeconds: 12,
      timing,
    });

    await user.type(box(), 'Again?{Enter}');

    expect(await screen.findByText('Please wait 12 s before asking again.')).toBeInTheDocument();
    expect(box()).toHaveValue('Again?');
    expect(screen.queryByText('You')).not.toBeInTheDocument(); // the unanswered question was removed
    expect(screen.getByRole('button', { name: 'Ask' })).toBeDisabled();
  });

  it('at the budget, says so and locks the box', async () => {
    const { askAssistant, box, user } = setup();
    askAssistant.mockResolvedValueOnce({ ok: false, error: 'ASSISTANT_LIMIT', timing });

    await user.type(box(), 'One more{Enter}');

    expect(await screen.findByText(/used all your assistant questions/)).toBeInTheDocument();
    expect(screen.getByText('0 of 10 left')).toBeInTheDocument();
    expect(box()).toBeDisabled();
    expect(box()).toHaveAttribute('placeholder', 'No questions left');
  });

  it('when the model is unavailable or the network is down, explains and keeps the text', async () => {
    const { askAssistant, box, user } = setup();
    askAssistant.mockResolvedValueOnce({ ok: false, error: 'ASSISTANT_UNAVAILABLE', timing });
    await user.type(box(), 'Hint please{Enter}');
    expect(await screen.findByText(/unavailable right now/)).toBeInTheDocument();
    expect(box()).toHaveValue('Hint please');

    askAssistant.mockResolvedValueOnce({ ok: false, error: 'NETWORK', timing });
    await user.type(box(), '{Enter}');
    expect(await screen.findByText(/offline/)).toBeInTheDocument();
  });

  it("doesn't send blank questions, and caps the length at 500 characters", async () => {
    const { askAssistant, box, user } = setup();
    await user.type(box(), '   {Enter}');
    expect(askAssistant).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Ask' })).toBeDisabled();
    expect(box()).toHaveAttribute('maxLength', '500');
  });

  it('is read-only while the workspace is locked', () => {
    const { box } = setup();
    act(() => useWorkspaceUi.setState({ locked: true }));
    expect(box()).toBeDisabled();
  });

  it('closes from its own button', async () => {
    const { user } = setup();
    act(() => useWorkspaceUi.setState({ assistantOpen: true }));
    await user.click(screen.getByRole('button', { name: 'Close coding assistant' }));
    expect(useWorkspaceUi.getState().assistantOpen).toBe(false);
  });
});

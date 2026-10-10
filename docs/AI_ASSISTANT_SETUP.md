# Coding assistant: setup

The coding assistant gives candidates short hints, never solutions. It uses the company LiteLLM
gateway (`litellm-qc.zycus.net`). The gateway is reachable **only inside the Zycus network**: its
address (100.64.x.x) is private, so no cloud service can call it, whether Supabase, Cloudflare,
Vercel or anything else.

So a small **worker** runs on a laptop that is inside the network (yours) and does the talking:

```
candidate's browser ──ask──▶ Supabase ◀──"any questions?" (every second)── worker on your laptop ──▶ LiteLLM
candidate's browser ◀─reply─ Supabase ◀────────────── reply ───────────── worker on your laptop ◀── LiteLLM
```

- The laptop only makes **outgoing** requests (to Supabase and to LiteLLM, like a browser does).
  Nothing on it is exposed to the internet, and there is no tunnel.
- The LiteLLM key stays on the laptop, in `.env.local` (git-ignored). It is never sent to Supabase
  or to candidates.
- Supabase enforces the rules: 10 questions per candidate, 20 s between questions, size limits,
  and a **hard spending cap of US$5.00** for all candidates together (see below). Every question
  and reply is logged for reviewers in `public.ai_interactions`.
- When the worker isn't running, candidates see *"The assistant is unavailable right now"* at once
  and lose no questions. Everything else in the assessment works as normal.

## One-time setup

1. **Database:** run the numbered scripts in `supabase/dist/codearena-database/` in the SQL Editor
   (see the README). `01-schema.sql` adds the assistant tables.
2. **`.env.local`** on the laptop (already done on Piyush's machine) needs these lines:
   ```
   VITE_SUPABASE_URL=…            (already there)
   VITE_SUPABASE_ANON_KEY=…       (already there)
   LITELLM_BASE_URL=https://litellm-qc.zycus.net
   LITELLM_API_KEY=…              (the gateway key)
   LITELLM_MODEL=qwen-cursor
   LITELLM_PRODUCT=codearena      (the gateway rejects requests without a product tag)
   ```
3. Run `npm run assistant:worker` once. The first run creates `ASSISTANT_WORKER_SECRET` in
   `.env.local` and stops with one line like
   `select private.set_assistant_worker_secret('…64 hex characters…');`.
   Paste that line into **SQL Editor → New query → Run**. Supabase stores only a hash of the secret.

## During assessments

Connect the laptop to the Zycus network or VPN, then run:

```
npm run assistant:worker
```

Leave the window open. The worker prints one line per question with the time taken, the tokens
used and the money spent so far, never the question's content. Stop it with **Ctrl+C**.

**The laptop must stay awake** for as long as candidates may be taking the test (overnight too).
The worker doesn't change any power setting, and company policy hibernates the laptop after about
30 minutes without activity. So:

- Keep it **plugged in** and the **lid open**. Closing the lid or pressing the power button puts it
  to sleep. Locking the screen (Windows key + L) is fine.
- Keep something running that holds it awake, for example a video or playlist playing in a browser
  tab with the sound on (low volume is fine; a muted tab may not count).
- Install pending Windows updates first, so it doesn't restart at night, and stay signed in to the
  VPN (Zscaler).
- If the laptop slept anyway, the worker says so when it wakes up (*"This computer was asleep for
  about N min"*), so you can tell whether your method worked.

What candidates see if the worker isn't reachable (laptop asleep, VPN dropped): *"The assistant is
unavailable right now"*, at once, and they keep their questions. The worker also stops taking
questions while the gateway is unreachable and resumes by itself when it is back.

## Switching the assistant off

For a template, so the button disappears:

```sql
update public.test_templates
   set proctoring = jsonb_set(proctoring, '{aiAssistant,enabled}', 'false')
 where slug = 'lead-react-native-hands-on';
```

Set `'true'` to turn it back on. `maxRequests` (default 10) and `cooldownSec` (default 20) live in
the same JSON.

## Checking it

After a candidate asks something:

```sql
select created_at, status, prompt, left(reply, 80) as reply, latency_ms, prompt_tokens, completion_tokens, cost_usd
  from public.ai_interactions order by id desc limit 5;
```

## Cost and the US$5 spending cap

The gateway's prices for `qwen-cursor` (from its `/model/info`): **US$0.53 per million input
tokens** and **US$2.12 per million output tokens**.

| | Tokens | Cost |
|---|---|---|
| A typical question | about 1,100 in + up to 300 out | about US$0.001 |
| One candidate using all 10 questions | about 11,000 in + 3,000 out | about **US$0.012** (₹1) |
| The worst case for one question | 16,000 in + 300 out | about US$0.009 |

So US$5 covers roughly **400 candidates** even if every one of them uses all 10 questions.

**The cap is enforced by the database**, not by the laptop (migration `0011`):

- Before a question can reach the worker, it reserves its worst-case cost. If what was spent plus
  what is reserved would pass US$5.00, the candidate is told the assistant isn't available, and
  nothing is sent to the gateway.
- When the reply is stored, its real cost is added up. A question that fails after the worker took
  it is charged at the worst case, because the gateway may have billed it anyway.
- The worker never sends more than 15,000 bytes per question and asks for at most 300 output
  tokens, so no question can cost more than its reservation.

In the SQL Editor:

```sql
select * from private.assistant_spend();                    -- spent, reserved, left
update private.assistant_budget set cap_usd = 10 where id;  -- change the cap (in US$)
```

For an extra safety net outside this app, ask the LiteLLM admins to set `max_budget: 5` on the
gateway key; the gateway then refuses anything beyond that whatever happens here.

## Moving the worker later

Any always-on machine inside the Zycus network can run it instead of a laptop, for example a team
server or VM. Copy the repository, put the same `.env.local` lines there, and run
`npm run assistant:worker`. Only one worker should run at a time.

/**
 * Zycus CodeArena keep-alive — a free Cloudflare Worker with a Cron Trigger.
 *
 * Supabase pauses free projects after 7 days without activity. This worker calls the public
 * `ping` function of each configured project every 48 hours, so a quiet week between hiring
 * drives never takes the platform offline. It uses only the PUBLIC anon/publishable key, which
 * is already public in the website; no secrets are involved.
 *
 * Setup (Cloudflare dashboard, see SETUP_AND_DEPLOY.md §5):
 *   Variables (plain text): PROD_SUPABASE_URL, PROD_SUPABASE_ANON_KEY,
 *                           STAGING_SUPABASE_URL, STAGING_SUPABASE_ANON_KEY (staging optional)
 *   Cron Trigger: 0 3 *\/2 * *   (03:00 UTC every second day; write it without the backslash)
 */
export default {
  async scheduled(_event, env) {
    const targets = [
      ['prod', env.PROD_SUPABASE_URL, env.PROD_SUPABASE_ANON_KEY],
      ['staging', env.STAGING_SUPABASE_URL, env.STAGING_SUPABASE_ANON_KEY],
    ].filter(([, url, key]) => url && key);

    for (const [name, url, key] of targets) {
      try {
        const res = await fetch(`${url}/rest/v1/rpc/ping`, {
          method: 'POST',
          headers: { apikey: key, 'Content-Type': 'application/json' },
          body: '{}',
        });
        console.log(`${name}: HTTP ${res.status}`);
      } catch (err) {
        console.error(`${name}: ${err}`);
      }
    }
  },

  // Visiting the worker URL runs the same check, to confirm the setup works.
  async fetch(_request, env) {
    await this.scheduled(null, env);
    return new Response('CodeArena keep-alive ran. See the worker logs for results.\n');
  },
};

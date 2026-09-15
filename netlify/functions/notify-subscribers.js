// Sends a "new article" announcement to the Brevo "FutureProof subscribers"
// list. Uses the same BREVO_API_KEY already configured in Netlify's env vars
// for the enquiry-reply automation (submission-created.js) — no new key
// needed.
//
// Deliberately two-phase, called with a different `action` each time:
//   action: "draft" -> creates a Brevo campaign (draft only, nothing sent)
//   action: "send"  -> sends an already-created draft campaign immediately
//
// Why two calls instead of one "publish and email" call: sending a real
// broadcast to real subscribers should never happen without a person
// explicitly saying "yes, send this" in that moment. A Claude session should
// call action=draft right after publishing (safe, reversible, nothing goes
// out), show Rahul the subject/preview, and only call action=send after he
// has said to send it — never automatically, and never reusing an earlier
// approval for a later article. See futureproofblog-standing-instructions.md
// section 1.5 for the full policy this function was built to support.
//
// Auth: a shared secret read from the NOTIFY_SECRET Netlify env var (same
// pattern as BREVO_API_KEY — never hardcoded in source, since this repo is
// public). It just stops random callers from hitting this public endpoint
// and creating junk campaign drafts in Rahul's Brevo account. Worst case if
// it leaked: someone creates draft campaigns nobody sends, since the
// separate action=send call is a second, distinct step. Rahul must paste a
// value for NOTIFY_SECRET into Netlify himself, same as he did for
// BREVO_API_KEY — see futureproofblog-standing-instructions.md section 1.5.

const SENDER = { email: 'contact@futureproofblog.in', name: 'FutureProof Blog' };
const LIST_NAME = 'FutureProof subscribers';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const expectedSecret = process.env.NOTIFY_SECRET;
  if (!expectedSecret || payload.secret !== expectedSecret) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'BREVO_API_KEY not configured in Netlify env vars' }) };
  }
  const brevoHeaders = { 'api-key': apiKey, 'content-type': 'application/json' };

  // --- action: send -------------------------------------------------------
  if (payload.action === 'send') {
    const { campaignId } = payload;
    if (!campaignId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'campaignId required for action=send' }) };
    }
    const res = await fetch(`https://api.brevo.com/v3/emailCampaigns/${campaignId}/sendNow`, {
      method: 'POST',
      headers: brevoHeaders,
    });
    if (res.status === 204) {
      return { statusCode: 200, body: JSON.stringify({ sent: true, campaignId }) };
    }
    const text = await res.text();
    return { statusCode: res.status, body: JSON.stringify({ sent: false, error: text }) };
  }

  // --- action: draft --------------------------------------------------------
  if (payload.action !== 'draft') {
    return { statusCode: 400, body: JSON.stringify({ error: 'action must be "draft" or "send"' }) };
  }

  const { articles } = payload;
  if (!Array.isArray(articles) || articles.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'articles array required: [{title, url, excerpt}]' }) };
  }

  // Resolve the subscriber list ID by name each time, rather than hardcoding
  // it, so nothing breaks if the list is ever recreated.
  const listsRes = await fetch('https://api.brevo.com/v3/contacts/lists?limit=50&sort=desc', { headers: brevoHeaders });
  if (!listsRes.ok) {
    return { statusCode: 502, body: JSON.stringify({ error: 'Could not fetch Brevo lists', detail: await listsRes.text() }) };
  }
  const listsData = await listsRes.json();
  const targetList = (listsData.lists || []).find((l) => l.name === LIST_NAME);
  if (!targetList) {
    return { statusCode: 404, body: JSON.stringify({ error: `List "${LIST_NAME}" not found in Brevo account` }) };
  }

  const isMultiple = articles.length > 1;
  const subject = isMultiple
    ? `${articles.length} new articles on FutureProof Blog`
    : articles[0].title;

  const itemsHtml = articles
    .map(
      (a) => `
    <tr><td style="padding:16px 0;border-top:1px solid #e6e9f2">
      <h2 style="margin:0 0 8px;font-size:1.1rem;color:#1a1a2e">${a.title}</h2>
      <p style="margin:0 0 10px;color:#444;font-size:.95rem;line-height:1.6">${a.excerpt}</p>
      <a href="https://futureproofblog.in${a.url}" style="color:#e94560;font-weight:700;text-decoration:none">Read it &rarr;</a>
    </td></tr>`
    )
    .join('');

  const htmlContent = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,Segoe UI,Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff">
    <tr><td style="background:#1a1a2e;padding:20px 24px"><span style="color:#e94560;font-size:1.2rem;font-weight:800">FutureProof Blog</span></td></tr>
    <tr><td style="padding:20px 24px">
      <p style="color:#1a1a2e;font-size:.95rem;margin:0 0 6px">${isMultiple ? 'New on the blog:' : 'Just published:'}</p>
      <table width="100%" cellpadding="0" cellspacing="0">${itemsHtml}</table>
    </td></tr>
    <tr><td style="padding:18px 24px;color:#888;font-size:.78rem;border-top:1px solid #eee">
      You're receiving this because you subscribed at futureproofblog.in.
    </td></tr>
  </table></body></html>`;

  const createRes = await fetch('https://api.brevo.com/v3/emailCampaigns', {
    method: 'POST',
    headers: brevoHeaders,
    body: JSON.stringify({
      name: `Blog announcement - ${new Date().toISOString().slice(0, 10)} - ${articles.map((a) => a.url).join(', ')}`,
      subject,
      sender: SENDER,
      htmlContent,
      recipients: { listIds: [targetList.id] },
      tag: 'blog-announcement',
    }),
  });

  if (!createRes.ok) {
    return { statusCode: createRes.status, body: JSON.stringify({ error: await createRes.text() }) };
  }
  const created = await createRes.json();
  return {
    statusCode: 200,
    body: JSON.stringify({ draftCreated: true, campaignId: created.id, listId: targetList.id, subject }),
  };
};

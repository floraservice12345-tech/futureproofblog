/* ============================================================
   FutureProof Blog — form submission handler
   ------------------------------------------------------------
   Netlify calls this automatically every time a form on the site
   is submitted successfully. Nothing on the site links to it and
   nothing needs to invoke it by hand.

   WHAT IT DOES, IN ORDER
   1. Scores the submission for spam (link count, known phrases,
      empty or gibberish message, honeypot residue).
   2. Decides how urgent it is. A project brief is money arriving;
      a topic suggestion is not.
   3. Sends the sender an immediate, human-sounding acknowledgement
      that says what happens next and by when.
   4. Sends Rahul one notification with the sender's details, the
      full message, and a subject line that says whether he needs
      to do something. Anything scored as spam is filed quietly
      instead of pinged.
   5. Files the sender in a Brevo list so every enquiry is visible
      in one place on his phone.

   SETUP REQUIRED (one time, in Netlify)
   Site settings -> Environment variables, add:
     BREVO_API_KEY        your Brevo API v3 key
     OWNER_EMAIL          floraservice12345@gmail.com   (optional,
                          this is the default)
     BREVO_ENQUIRY_LIST   numeric id of the Brevo list for
                          enquiries (optional)

   Without BREVO_API_KEY the function does nothing and fails
   quietly — Netlify's own form notifications still work, so no
   submission is ever lost.
   ============================================================ */

const BREVO_API = "https://api.brevo.com/v3/smtp/email";
const BREVO_CONTACTS = "https://api.brevo.com/v3/contacts";

const FROM = { name: "FutureProof Blog", email: "contact@futureproofblog.in" };
const OWNER = process.env.OWNER_EMAIL || "floraservice12345@gmail.com";

/* ---------- spam scoring ---------- */
const SPAM_PHRASES = [
  "seo services", "guest post", "link building", "buy backlinks",
  "increase your ranking", "casino", "crypto investment", "loan offer",
  "make money fast", "виагра", "click here to claim", "dear sir/madam we are a"
];

function spamScore(data) {
  const msg = String(data.message || data.brief || "").toLowerCase();
  const email = String(data.email || "").toLowerCase();
  let score = 0;

  if (data["bot-field"]) score += 100;                    // honeypot filled
  const links = (msg.match(/https?:\/\//g) || []).length;
  if (links >= 3) score += 40;
  if (links >= 6) score += 40;
  SPAM_PHRASES.forEach(p => { if (msg.includes(p)) score += 35; });
  if (msg.length < 15) score += 20;                       // nothing actually said
  if (/(.)\1{9,}/.test(msg)) score += 30;                 // keyboard mashing
  if (!/@/.test(email)) score += 50;
  if (/\b(seo|backlink|guest post)\b/.test(msg) && /\bwe (are|offer|provide)\b/.test(msg)) score += 30;

  return score;
}

/* ---------- how urgent is this ---------- */
function classify(formName, data) {
  const subject = String(data.subject || "").toLowerCase();
  const msg = String(data.message || data.brief || "").toLowerCase();

  if (formName === "project-brief") {
    return { level: "ACTION", label: "New project brief", sla: "one working day",
             why: "Someone is asking you to quote for paid work." };
  }
  if (subject.includes("hire") || subject.includes("project brief") ||
      /\b(quote|budget|hire you|work with you|retainer|invoice)\b/.test(msg)) {
    return { level: "ACTION", label: "Enquiry about paid work", sla: "one working day",
             why: "This reads like a paying enquiry, not a general question." };
  }
  if (subject.includes("correction") || /\b(wrong|incorrect|error|mistake|outdated)\b/.test(msg)) {
    return { level: "ACTION", label: "Possible correction", sla: "two working days",
             why: "Someone thinks something on the site is factually wrong. Worth checking today." };
  }
  if (subject.includes("partnership") || subject.includes("republish")) {
    return { level: "REVIEW", label: "Partnership or republishing request", sla: "two working days",
             why: "Needs a judgement call from you." };
  }
  if (subject.includes("topic")) {
    return { level: "FYI", label: "Topic suggestion", sla: "when convenient",
             why: "A content idea. No reply strictly needed, but they will appreciate one." };
  }
  return { level: "REVIEW", label: "General message", sla: "two working days",
           why: "Read it and decide." };
}

/* ---------- email bodies ---------- */
function ackHtml(name, cls) {
  const first = (name || "").trim().split(/\s+/)[0] || "there";
  const extra = cls.level === "ACTION" && cls.label.includes("brief")
    ? `<p style="margin:0 0 14px">Your quote will include a firm fixed price in rupees, a delivery date, and a one-paragraph outline of the approach — so you can judge the thinking before committing anything.</p>
       <p style="margin:0 0 14px">One thing that speeds this up: if the work involves your own figures or documents, send them in a <strong>digital, exportable format</strong> — XLSX, CSV, DOCX, a text-based PDF or a live link. Scans and photographs have to be re-keyed by hand, which adds days for no benefit to either of us.</p>`
    : `<p style="margin:0 0 14px">If it turns out to be something I can answer in a line, I will. If it needs more than that, it will take a little longer and I will tell you so rather than leaving you waiting.</p>`;

  return `<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;color:#23262f;line-height:1.65">
  <div style="background:#1a1a2e;padding:22px 24px;border-radius:10px 10px 0 0">
    <div style="color:#e94560;font-weight:800;font-size:1.2rem">FutureProof Blog</div>
  </div>
  <div style="border:1px solid #e3e6ee;border-top:0;border-radius:0 0 10px 10px;padding:26px 24px">
    <p style="margin:0 0 14px">Hello ${escapeHtml(first)},</p>
    <p style="margin:0 0 14px">Your message reached me — this is an automatic note so you know it did not vanish into a form.</p>
    <p style="margin:0 0 14px"><strong>You will hear back from me personally within ${cls.sla}</strong>, usually sooner. Not from an assistant and not from an autoresponder; I read and answer everything myself.</p>
    ${extra}
    <p style="margin:0 0 14px">In the meantime, the <a href="https://futureproofblog.in/tools" style="color:#c9304e">free calculators</a> and the <a href="https://futureproofblog.in/" style="color:#c9304e">article archive</a> are there if useful.</p>
    <p style="margin:0">— Geeta<br><span style="color:#6b7288;font-size:.9rem">FutureProof Blog · futureproofblog.in</span></p>
  </div>
  <p style="color:#98a0b2;font-size:.78rem;text-align:center;margin:16px 0 0">You are receiving this because you sent a message through futureproofblog.in. It is a one-off reply, not a subscription.</p>
</div>`;
}

function notifyHtml(formName, data, cls, score) {
  const rows = Object.keys(data)
    .filter(k => !["bot-field", "form-name"].includes(k) && String(data[k]).trim())
    .map(k => `<tr><td style="padding:8px 12px;border-bottom:1px solid #eceff5;color:#6b7288;font-size:.82rem;text-transform:uppercase;letter-spacing:.06em;vertical-align:top;white-space:nowrap">${escapeHtml(k)}</td>
                   <td style="padding:8px 12px;border-bottom:1px solid #eceff5;white-space:pre-wrap">${escapeHtml(String(data[k]))}</td></tr>`)
    .join("");
  const colour = cls.level === "ACTION" ? "#a8342b" : cls.level === "REVIEW" ? "#8a6100" : "#1c6349";
  return `<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:620px;margin:0 auto;color:#23262f;line-height:1.6">
  <div style="background:${colour};color:#fff;padding:16px 20px;border-radius:8px 8px 0 0">
    <div style="font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;opacity:.85">${cls.level === "ACTION" ? "Needs your reply" : cls.level === "REVIEW" ? "Read and decide" : "For information"}</div>
    <div style="font-size:1.15rem;font-weight:700;margin-top:3px">${escapeHtml(cls.label)}</div>
  </div>
  <div style="border:1px solid #e3e6ee;border-top:0;border-radius:0 0 8px 8px;padding:20px">
    <p style="margin:0 0 14px;color:#4a5060"><strong>Why you are seeing this:</strong> ${escapeHtml(cls.why)}<br>
       <strong>Reply by:</strong> ${escapeHtml(cls.sla)} &nbsp;·&nbsp; <strong>Form:</strong> ${escapeHtml(formName)} &nbsp;·&nbsp; <strong>Spam score:</strong> ${score}</p>
    <table style="width:100%;border-collapse:collapse;font-size:.92rem;border:1px solid #eceff5">${rows}</table>
    ${data.email ? `<p style="margin:18px 0 0"><a href="mailto:${escapeHtml(data.email)}" style="background:#c9304e;color:#fff;padding:11px 20px;border-radius:6px;text-decoration:none;font-weight:700;display:inline-block">Reply to ${escapeHtml(data.email)}</a></p>` : ""}
    <p style="margin:16px 0 0;color:#98a0b2;font-size:.8rem">The sender has already had an automatic acknowledgement telling them to expect a reply within ${escapeHtml(cls.sla)}.</p>
  </div>
</div>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---------- Brevo calls ---------- */
async function send(key, payload) {
  const r = await fetch(BREVO_API, {
    method: "POST",
    headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(payload)
  });
  if (!r.ok) console.log("brevo send failed", r.status, (await r.text()).slice(0, 300));
  return r.ok;
}

async function fileContact(key, email, name, formName) {
  const listId = parseInt(process.env.BREVO_ENQUIRY_LIST || "", 10);
  const body = {
    email,
    attributes: { FIRSTNAME: (name || "").split(/\s+/)[0] || "", SOURCE: "website:" + formName },
    updateEnabled: true                       // an existing contact is updated, never duplicated
  };
  if (listId) body.listIds = [listId];
  const r = await fetch(BREVO_CONTACTS, {
    method: "POST",
    headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body)
  });
  if (!r.ok && r.status !== 204) console.log("brevo contact failed", r.status);
}

/* ---------- entry point ---------- */
export default async (req) => {
  let body;
  try { body = await req.json(); } catch { return new Response("bad payload", { status: 400 }); }

  const p = body.payload || {};
  const formName = p.form_name || "unknown";
  const data = p.data || {};

  // Newsletter sign-ups go to Brevo directly and are handled there.
  if (formName.startsWith("newsletter") || formName === "nl-sidebar") {
    return new Response("newsletter handled by brevo", { status: 200 });
  }

  const key = process.env.BREVO_API_KEY;
  if (!key) {
    console.log("BREVO_API_KEY not set — skipping. Netlify's own notification still applies.");
    return new Response("no api key", { status: 200 });
  }

  const score = spamScore(data);
  const cls = classify(formName, data);
  const email = String(data.email || "").trim();
  const name = String(data.name || "").trim();

  if (score >= 60) {
    // Filed, not pinged. No acknowledgement to a spammer, no interruption to Rahul.
    await send(key, {
      sender: FROM, to: [{ email: OWNER }],
      subject: `[filed as spam · ${score}] ${formName}`,
      htmlContent: notifyHtml(formName, data, cls, score)
    });
    return new Response("spam filed", { status: 200 });
  }

  const jobs = [];

  if (email) {
    jobs.push(send(key, {
      sender: FROM, replyTo: { email: FROM.email, name: FROM.name },
      to: [{ email, name: name || undefined }],
      subject: cls.level === "ACTION" && cls.label.includes("brief")
        ? "Your brief has reached me — quote coming within one working day"
        : "Thanks — your message reached FutureProof Blog",
      htmlContent: ackHtml(name, cls)
    }));
    jobs.push(fileContact(key, email, name, formName));
  }

  const flag = cls.level === "ACTION" ? "[ACTION NEEDED]" : cls.level === "REVIEW" ? "[REVIEW]" : "[FYI]";
  jobs.push(send(key, {
    sender: FROM,
    to: [{ email: OWNER }],
    replyTo: email ? { email, name: name || undefined } : undefined,
    subject: `${flag} ${cls.label}${name ? " — " + name : ""}`,
    htmlContent: notifyHtml(formName, data, cls, score)
  }));

  await Promise.allSettled(jobs);
  return new Response("ok", { status: 200 });
};

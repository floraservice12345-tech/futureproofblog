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
   4. Sends the site owner one notification with the sender's details, the
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

/* Forms where the free-text box is optional by design. A resume order can
   legitimately arrive with an empty brief (the CV comes by email), so an
   empty box there says nothing about whether the sender is real. */
const OPTIONAL_MESSAGE_FORMS = ["resume-brief"];

function spamScore(formName, data) {
  const msg = String(data.message || data.brief || data.review || "").toLowerCase();
  const email = String(data.email || "").toLowerCase();
  let score = 0;

  if (data["bot-field"]) score += 100;                    // honeypot filled
  const links = (msg.match(/https?:\/\//g) || []).length;
  if (links >= 3) score += 40;
  if (links >= 6) score += 40;
  SPAM_PHRASES.forEach(p => { if (msg.includes(p)) score += 35; });
  if (msg.length < 15 && !OPTIONAL_MESSAGE_FORMS.includes(formName)) score += 20;
  if (/(.)\1{9,}/.test(msg)) score += 30;                 // keyboard mashing
  if (!/@/.test(email)) score += 50;
  if (/\b(seo|backlink|guest post)\b/.test(msg) && /\bwe (are|offer|provide)\b/.test(msg)) score += 30;

  return score;
}

/* ---------- how urgent is this ---------- */
function classify(formName, data) {
  const subject = String(data.subject || "").toLowerCase();
  const msg = String(data.message || data.brief || "").toLowerCase();

  if (formName === "quick-service-request") {
    return { level: "ACTION", kind: "quick",
             label: "Quick service request — " + String(data.service || "unspecified"),
             sla: "one working day",
             why: "Confirm scope and total, then send payment instructions. The website has collected no payment." };
  }

  /* Selecting a priced service in a form is an enquiry, not proof of payment. */
  if (formName === "resume-brief") {
    const service = String(data.service || "");
    const freeSample = /free sample|₹0/i.test(service);
    return { level: "ACTION", kind: freeSample ? "resumeSample" : "resumeService",
             label: freeSample ? "Free resume sample request" : "Career service enquiry — " + service,
             sla: "one working day",
             why: freeSample
               ? "Confirm the CV and sample timing. The free sample does not create a paid order."
               : "Confirm scope and price, then payment instructions. No payment was collected by the form." };
  }

  if (formName === "site-review") {
    return { level: "FYI", kind: "review", noList: true,
             label: "Reader review — " + String(data.rating || "no rating"),
             sla: "when convenient",
             why: "A reader reviewed the site. Read it, check it against the page or the work, then publish it as written." };
  }

  if (formName === "project-brief") {
    return { level: "ACTION", kind: "brief", label: "New project brief", sla: "one working day",
             why: "Someone is asking you to quote for paid work." };
  }
  if (subject.includes("hire") || subject.includes("project brief") ||
      /\b(quote|quotation|budget|hire you|work with you|retainer|invoice|proposal|pricing|cost)\b/.test(msg) ||
      /\b(build|develop|website|web app|webapp|landing page|calculator|dashboard|automate|automation|script|scrape|clean up|cleanup|migrate|integrat)\w*\b/.test(msg)) {
    return { level: "ACTION", kind: "enquiry", label: "Enquiry about paid work", sla: "one working day",
             why: "This reads like a paying enquiry, not a general question." };
  }
  if (subject.includes("correction") || /\b(wrong|incorrect|error|mistake|outdated)\b/.test(msg)) {
    return { level: "ACTION", kind: "correction", label: "Possible correction", sla: "two working days",
             why: "Someone thinks something on the site is factually wrong. Worth checking today." };
  }
  if (subject.includes("partnership") || subject.includes("republish")) {
    return { level: "REVIEW", kind: "partnership", label: "Partnership or republishing request", sla: "two working days",
             why: "Needs a judgement call from you." };
  }
  if (subject.includes("topic")) {
    return { level: "FYI", kind: "topic", label: "Topic suggestion", sla: "when convenient",
             why: "A content idea. No reply strictly needed, but they will appreciate one." };
  }
  return { level: "REVIEW", kind: "general", label: "General message", sla: "two working days",
           why: "Read it and decide." };
}

/* ---------- email bodies ---------- */
function ackHtml(name, cls) {
  const first = (name || "").trim().split(/\s+/)[0] || "there";
  const BODIES = {
    resumeSample: `<p style="margin:0 0 14px"><strong>If you have not already sent your CV, that is the only thing I need.</strong> Reply to this email with it attached, or send it to <a href="mailto:contact@futureproofblog.in" style="color:#c9304e">contact@futureproofblog.in</a>.</p>
       <p style="margin:0 0 14px">Please send it as a <strong>Word file, a Google Doc link, or a PDF you can select text in</strong> — not a scan and not a photograph of a printed CV. Text read from an image carries errors that are hard to spot and expensive to find later. It does not need to be tidy; rough is fine.</p>
       <p style="margin:0 0 14px">I will confirm when the free opening-section rewrite can be sent. If you want the full resume after seeing it, I will confirm the price and delivery date. Paid work starts after payment is confirmed.</p>`,
    resumeService: `<p style="margin:0 0 14px">Please send your existing CV if this is a rewrite, or the target job posting if this is a cover letter. A text-based Word file or PDF is easiest to work with.</p>
       <p style="margin:0 0 14px">I will confirm the scope, total price and delivery date. The form has not charged you; paid work starts only after payment is confirmed.</p>`,
    brief: `<p style="margin:0 0 14px">Your quote will include a firm fixed price in rupees, a delivery date, and a one-paragraph outline of the approach — so you can judge the thinking before committing anything.</p>
       <p style="margin:0 0 14px">Once you approve the written scope, I will send payment instructions. Work begins after the agreed advance is confirmed; final editable files are handed over after the balance is paid. If your task uses your own files, please send digital, exportable formats rather than scans.</p>`,
    quick: `<p style="margin:0 0 14px">I will check that your request fits the selected quick-service package, then send the confirmed total and payment instructions. If it needs a different scope, you can decline the revised quote without charge.</p>
       <p style="margin:0 0 14px">This website has not taken payment. The delivery clock starts only after the complete brief and payment are confirmed in the receiving account.</p>`,
    review: `<p style="margin:0 0 14px">Nothing publishes automatically. I read every review, check it against the page or the work it refers to, and then publish it as written apart from trimming for length. <strong>Critical reviews get published too</strong> — a two-star review that explains what went wrong is more useful to the next reader than ten five-star ones, and it tells me what to fix.</p>
       <p style="margin:0 0 14px">Your email address is not published, not sold, and <strong>not added to any mailing list</strong>. If you change your mind later, say so and the review comes down, no reason needed.</p>`
  };
  const generic = `<p style="margin:0 0 14px">If it turns out to be something I can answer in a line, I will. If it needs more than that, it will take a little longer and I will tell you so rather than leaving you waiting.</p>`;
  const extra = BODIES[cls.kind] || generic;

  return `<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;color:#23262f;line-height:1.65">
  <div style="background:#1a1a2e;padding:22px 24px;border-radius:10px 10px 0 0">
    <div style="color:#e94560;font-weight:800;font-size:1.2rem">FutureProof Blog</div>
  </div>
  <div style="border:1px solid #e3e6ee;border-top:0;border-radius:0 0 10px 10px;padding:26px 24px">
    <p style="margin:0 0 14px">Hello ${escapeHtml(first)},</p>
    <p style="margin:0 0 14px">${cls.kind === "review"
      ? "Your review reached me — this is an automatic note so you know it did not vanish into a form. Thank you for taking the time; it is genuinely more useful than you think."
      : "Your message reached me — this is an automatic note so you know it did not vanish into a form."}</p>
    ${cls.kind === "review" ? "" : `<p style="margin:0 0 14px"><strong>You will hear back from me personally within ${cls.sla}</strong>, usually sooner. Not from an assistant and not from an autoresponder; I read and answer everything myself.</p>`}
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
    <p style="margin:16px 0 0;color:#98a0b2;font-size:.8rem">${cls.kind === "review" ? "The reviewer has had an automatic acknowledgement explaining how reviews are handled." : `The sender has already had an automatic acknowledgement telling them to expect a reply within ${escapeHtml(cls.sla)}.`}</p>
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

/* ---------- acknowledgement subject lines ---------- */
const ACK_SUBJECTS = {
  resumeSample: "Your free resume sample request has reached us",
  resumeService: "Your career-service request has reached us",
  brief:  "Your brief has reached me — quote coming within one working day",
  quick:  "Your quick-service request has reached us — next steps",
  review: "Thank you for the review — here is what happens to it next"
};

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

  const score = spamScore(formName, data);
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
      subject: ACK_SUBJECTS[cls.kind] || "Thanks — your message reached FutureProof Blog",
      htmlContent: ackHtml(name, cls)
    }));
    /* A reviewer is told in writing on /reviews that they are not added to
       any list. Filing them in Brevo would break that promise, so don't. */
    if (!cls.noList) jobs.push(fileContact(key, email, name, formName));
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

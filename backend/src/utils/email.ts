import nodemailer, { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

// Lazy-initialise — only create if SMTP vars are set
const getTransporter = (): Transporter => {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP environment variables not configured');
  }

  transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

// ─── Shared send wrapper ───────────────────────────────────────────────────
const sendMail = async (options: {
  to:      string;
  subject: string;
  html:    string;
}): Promise<void> => {
  const t = getTransporter();
  await t.sendMail({
    from:    process.env.EMAIL_FROM || 'Applywise <noreply@applywise.app>',
    to:      options.to,
    subject: options.subject,
    html:    options.html,
  });
};

// ─── Email templates ───────────────────────────────────────────────────────

const baseTemplate = (title: string, body: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           background: #f5f5f5; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #fff;
               border-radius: 12px; overflow: hidden; border: 1px solid #e5e5e5; }
    .header  { background: #0a0a0a; padding: 24px 32px; }
    .brand   { color: #fff; font-size: 18px; font-weight: 600; text-decoration: none; }
    .body    { padding: 32px; }
    h1       { font-size: 20px; font-weight: 600; color: #0a0a0a; margin: 0 0 8px; }
    p        { font-size: 14px; color: #525252; line-height: 1.6; margin: 0 0 16px; }
    .cta     { display: inline-block; background: #0a0a0a; color: #fff;
               padding: 10px 20px; border-radius: 8px; text-decoration: none;
               font-size: 14px; font-weight: 500; margin-top: 8px; }
    .job-card { background: #f9f9f9; border: 1px solid #e5e5e5; border-radius: 8px;
                padding: 16px; margin: 16px 0; }
    .job-card .role    { font-size: 15px; font-weight: 600; color: #0a0a0a; }
    .job-card .company { font-size: 13px; color: #737373; margin-top: 2px; }
    .footer  { padding: 20px 32px; border-top: 1px solid #f0f0f0; }
    .footer p { font-size: 12px; color: #a3a3a3; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <span class="brand">Applywise</span>
    </div>
    <div class="body">${body}</div>
    <div class="footer">
      <p>You're receiving this because you have an Applywise account. 
         Manage your notification settings in your account.</p>
    </div>
  </div>
</body>
</html>`;

// ─── Welcome email ─────────────────────────────────────────────────────────
export const sendWelcomeEmail = async (to: string, name: string): Promise<void> => {
  await sendMail({
    to,
    subject: 'Welcome to Applywise 👋',
    html: baseTemplate('Welcome to Applywise', `
      <h1>Welcome, ${name}</h1>
      <p>Your job search command centre is ready. Start adding applications and 
         Applywise will help you track progress, spot stale leads, and never miss 
         a follow-up.</p>
      <a class="cta" href="${process.env.CLIENT_URL}">Open Applywise →</a>
    `),
  });
};

// ─── Stale job digest ──────────────────────────────────────────────────────
export interface StaleJobSummary {
  title:   string;
  company: string;
  days:    number;
}

export const sendStaleDigest = async (
  to:   string,
  name: string,
  jobs: StaleJobSummary[]
): Promise<void> => {
  const jobList = jobs
    .map(
      (j) => `
      <div class="job-card">
        <div class="role">${j.title}</div>
        <div class="company">${j.company} · No activity for ${j.days} day${j.days !== 1 ? 's' : ''}</div>
      </div>`
    )
    .join('');

  await sendMail({
    to,
    subject: `${jobs.length} application${jobs.length !== 1 ? 's' : ''} went stale — Applywise`,
    html: baseTemplate('Stale applications', `
      <h1>Heads up, ${name}</h1>
      <p>${jobs.length} application${jobs.length !== 1 ? 's have' : ' has'} gone stale 
         because there's been no activity for too long.</p>
      ${jobList}
      <p>You can reactivate them by updating the status or adding a note.</p>
      <a class="cta" href="${process.env.CLIENT_URL}/jobs">Review applications →</a>
    `),
  });
};

// ─── Follow-up reminder ────────────────────────────────────────────────────
export const sendFollowUpReminder = async (
  to:      string,
  name:    string,
  title:   string,
  company: string,
  jobId:   string
): Promise<void> => {
  await sendMail({
    to,
    subject: `Time to follow up with ${company} — Applywise`,
    html: baseTemplate('Follow-up reminder', `
      <h1>Don't forget to follow up</h1>
      <p>Hi ${name}, you haven't sent a follow-up yet for:</p>
      <div class="job-card">
        <div class="role">${title}</div>
        <div class="company">${company}</div>
      </div>
      <p>A brief, professional follow-up email can significantly increase your 
         chances of getting a response. Keep it short — one paragraph is enough.</p>
      <a class="cta" href="${process.env.CLIENT_URL}/jobs/${jobId}">Mark follow-up sent →</a>
    `),
  });
};

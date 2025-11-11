const RESEND_API_URL = "https://api.resend.com/emails";

const SUBJECT_MAP = {
  en: "Your CodeILab sign-in link",
  zh: "您的 CodeILab 登录链接",
  fr: "Votre lien de connexion CodeILab",
} as const;

const PREHEADER_MAP = {
  en: "Tap the button inside to finish signing in.",
  zh: "点击邮件中的按钮完成登录。",
  fr: "Cliquez sur le bouton pour terminer la connexion.",
} as const;

const CTA_MAP = {
  en: "Sign in to CodeILab",
  zh: "登录 CodeILab",
  fr: "Se connecter à CodeILab",
} as const;

const EXPIRATION_COPY = {
  en: (minutes: number) => `This secure link expires in ${minutes} minutes.`,
  zh: (minutes: number) => `该安全链接将在 ${minutes} 分钟后失效。`,
  fr: (minutes: number) => `Ce lien sécurisé expire dans ${minutes} minutes.`,
} as const;

type SupportedMagicLinkLocale = keyof typeof SUBJECT_MAP;

interface SendMagicLinkEmailParams {
  to: string;
  magicLink: string;
  expiresInMinutes: number;
  locale?: string;
}

const getLocaleCopy = (locale?: string): SupportedMagicLinkLocale => {
  if (!locale) return "en";
  return (Object.keys(SUBJECT_MAP) as string[]).includes(locale) ? (locale as SupportedMagicLinkLocale) : "en";
};

const buildHtml = (link: string, expiresInMinutes: number, locale: SupportedMagicLinkLocale) => {
  const preheader = PREHEADER_MAP[locale];
  const cta = CTA_MAP[locale];
  const expirationCopy = EXPIRATION_COPY[locale](expiresInMinutes);

  return `<!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <title>${SUBJECT_MAP[locale]}</title>
      <style>
        body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background: #f4f5f7; margin: 0; padding: 32px; }
        .container { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 8px 24px rgba(15,23,42,0.08); }
        .cta { display: inline-block; padding: 12px 24px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 999px; font-weight: 600; }
        .footer { color: #6b7280; font-size: 12px; margin-top: 24px; }
      </style>
    </head>
    <body>
      <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;">${preheader}</span>
      <div class="container">
        <h1 style="font-size:22px;margin-bottom:16px;color:#111827;">${SUBJECT_MAP[locale]}</h1>
        <p style="margin:0 0 16px;color:#374151;">${preheader}</p>
        <p style="margin:0 0 24px;color:#4b5563;">${expirationCopy}</p>
        <a href="${link}" class="cta" target="_blank" rel="noopener noreferrer">${cta}</a>
        <p style="margin:24px 0 0;color:#6b7280;font-size:14px;">If the button does not work, copy and paste this URL into your browser:</p>
        <p style="word-break:break-all;color:#111827;font-size:13px;">${link}</p>
        <p class="footer">If you did not request this email you can safely ignore it.</p>
      </div>
    </body>
  </html>`;
};

const buildText = (link: string, expiresInMinutes: number, locale: SupportedMagicLinkLocale) => {
  switch (locale) {
    case "zh":
      return `使用以下链接在 ${expiresInMinutes} 分钟内登录 CodeILab：\n${link}`;
    case "fr":
      return `Utilisez ce lien pour vous connecter à CodeILab (expire dans ${expiresInMinutes} min) :\n${link}`;
    default:
      return `Use this link to sign in (expires in ${expiresInMinutes} min):\n${link}`;
  }
};

export async function sendMagicLinkEmail({ to, magicLink, expiresInMinutes, locale }: SendMagicLinkEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"; //"CodeILab <no-reply@codeilab.com>";
  const normalizedLocale = getLocaleCopy(locale);

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: SUBJECT_MAP[normalizedLocale],
      html: buildHtml(magicLink, expiresInMinutes, normalizedLocale),
      text: buildText(magicLink, expiresInMinutes, normalizedLocale),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to send magic link email: ${response.status} ${errorBody}`);
  }
}

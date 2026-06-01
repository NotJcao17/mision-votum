import nodemailer, { type Transporter } from 'nodemailer';

let cachedTransport: Transporter | null = null;

// Devuelve un transporter SMTP de Gmail si están las credenciales, o null.
// Requiere SMTP_USER (ej. misionvotum@gmail.com) y SMTP_PASS (la App Password
// de 16 caracteres generada en https://myaccount.google.com/apppasswords).
export function getMailTransport(): Transporter | null {
  if (cachedTransport) return cachedTransport;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  cachedTransport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });
  return cachedTransport;
}

// "Misión Votum <misionvotum@gmail.com>" — Gmail respeta el nombre para
// mostrar al destinatario.
export function getFromEmail(): string {
  const user = process.env.SMTP_USER ?? 'no-reply@example.com';
  return `Misión Votum <${user}>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface CredentialsEmailInput {
  judgeName: string;
  eventName: string;
  username: string;
  password: string;
  loginUrl?: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export function buildCredentialsEmail(
  input: CredentialsEmailInput,
): RenderedEmail {
  const { judgeName, eventName, username, password, loginUrl } = input;

  const subject = `Tus credenciales — ${eventName}`;

  const text = [
    `Hola ${judgeName},`,
    '',
    `Estas son tus credenciales para participar como juez en "${eventName}":`,
    '',
    `Usuario: ${username}`,
    `Contraseña: ${password}`,
    '',
    loginUrl ? `Entrar: ${loginUrl}` : 'Pide al admin del concurso el enlace para entrar.',
    '',
    'Si tienes problemas para entrar, contacta al admin del concurso.',
    '',
    '— Misión Votum',
  ].join('\n');

  const safeName = escapeHtml(judgeName);
  const safeEvent = escapeHtml(eventName);
  const safeUser = escapeHtml(username);
  const safePass = escapeHtml(password);
  const safeUrl = loginUrl ? escapeHtml(loginUrl) : null;

  const html = `<!doctype html>
<html lang="es">
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /><title>${escapeHtml(subject)}</title></head>
  <body style="margin:0; padding:0; background:#FAF5EC; font-family: Georgia, 'Times New Roman', serif; color:#2B1D14;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FAF5EC;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; background:#FFFFFF; border:1px solid rgba(43,29,20,0.08); border-radius:18px;">
            <tr>
              <td style="padding:28px 28px 8px 28px;">
                <div style="font-family: Helvetica, Arial, sans-serif; font-weight:700; letter-spacing:0.18em; color:#C2552F; font-size:12px; text-transform:uppercase;">Misión Votum</div>
                <h1 style="margin:8px 0 0 0; font-size:24px; line-height:1.2; color:#2B1D14;">Tus credenciales para ${safeEvent}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 0 28px; font-family: Helvetica, Arial, sans-serif; font-size:15px; color:#6F5E4C; line-height:1.55;">
                Hola <strong style="color:#2B1D14;">${safeName}</strong>, estas son las credenciales que te asignó el admin para participar como juez. Guárdalas a mano durante el concurso.
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 0 28px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F2E7D4; border-radius:12px;">
                  <tr>
                    <td style="padding:14px 18px; font-family: Helvetica, Arial, sans-serif; font-size:12px; color:#6F5E4C; text-transform:uppercase; letter-spacing:0.08em;">Usuario</td>
                    <td style="padding:14px 18px; font-family: 'Courier New', monospace; font-size:15px; font-weight:700; color:#2B1D14; text-align:right;">${safeUser}</td>
                  </tr>
                  <tr>
                    <td style="padding:14px 18px; font-family: Helvetica, Arial, sans-serif; font-size:12px; color:#6F5E4C; text-transform:uppercase; letter-spacing:0.08em; border-top:1px solid rgba(43,29,20,0.08);">Contraseña</td>
                    <td style="padding:14px 18px; font-family: 'Courier New', monospace; font-size:15px; font-weight:700; color:#2B1D14; text-align:right; border-top:1px solid rgba(43,29,20,0.08);">${safePass}</td>
                  </tr>
                </table>
              </td>
            </tr>
            ${
              safeUrl
                ? `<tr>
              <td style="padding:20px 28px 0 28px; text-align:center;">
                <a href="${safeUrl}" style="display:inline-block; background:#C2552F; color:#FAF5EC; text-decoration:none; font-family: Helvetica, Arial, sans-serif; font-weight:700; font-size:15px; padding:12px 22px; border-radius:12px;">Entrar a Misión Votum</a>
              </td>
            </tr>`
                : `<tr>
              <td style="padding:20px 28px 0 28px; font-family: Helvetica, Arial, sans-serif; font-size:14px; color:#6F5E4C; text-align:center;">
                Pide al admin del concurso el enlace para entrar.
              </td>
            </tr>`
            }
            <tr>
              <td style="padding:20px 28px 28px 28px; font-family: Helvetica, Arial, sans-serif; font-size:13px; color:#A2917C; line-height:1.55;">
                Si tienes problemas para entrar, contacta al admin del concurso.
              </td>
            </tr>
          </table>
          <div style="margin-top:14px; font-family: Helvetica, Arial, sans-serif; font-size:11px; color:#A2917C; letter-spacing:0.06em;">Misión Votum · Colegio Misión Montessori</div>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}

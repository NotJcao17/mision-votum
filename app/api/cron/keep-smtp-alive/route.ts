import { timingSafeEqual } from 'crypto';
import { getMailTransport, getFromEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Ping de mantenimiento SMTP.
//
// La SMTP key de Brevo no expira por fecha fija, pero sí caduca tras 90 días
// consecutivos sin uso. Como el concurso ocurre solo un par de veces al año,
// este cron manda un correo trivial de la cuenta a sí misma para mantener la
// clave activa entre eventos. No involucra a jueces ni al cliente.
//
// Lo dispara el cron de Vercel (ver vercel.json), que envía el header
// "Authorization: Bearer <CRON_SECRET>".

// Comparación en tiempo constante para no filtrar el secreto por timing.
function secretsMatch(received: string, expected: string): boolean {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.error('[cron/keep-smtp-alive] falta CRON_SECRET en el entorno');
    return Response.json(
      { ok: false, error: 'Falta configurar CRON_SECRET en el entorno.' },
      { status: 500 },
    );
  }

  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || !secretsMatch(token, expected)) {
    return Response.json(
      { ok: false, error: 'No autorizado.' },
      { status: 401 },
    );
  }

  const transport = getMailTransport();
  if (!transport) {
    return Response.json(
      {
        ok: false,
        error:
          'Configura SMTP_USER y SMTP_PASS en el entorno para poder enviar emails.',
      },
      { status: 500 },
    );
  }

  // Se manda a la propia dirección de remitente verificada. SMTP_USER en Brevo
  // es un login de relay (no un buzón real), así que MAIL_FROM va primero.
  const recipient = process.env.MAIL_FROM || process.env.SMTP_USER;
  if (!recipient) {
    return Response.json(
      { ok: false, error: 'Falta configurar MAIL_FROM o SMTP_USER.' },
      { status: 500 },
    );
  }

  const sentAt = new Date().toISOString();
  const text = [
    'Ping automático de mantenimiento de Misión Votum.',
    '',
    'Este correo se manda solo para mantener activa la SMTP key de Brevo,',
    'que caduca tras 90 días consecutivos sin uso. No requiere ninguna acción.',
    '',
    `Enviado: ${sentAt}`,
    '',
    '— Misión Votum',
  ].join('\n');

  try {
    await transport.sendMail({
      from: getFromEmail(),
      to: recipient,
      subject: 'Misión Votum — ping de mantenimiento SMTP',
      text,
    });
  } catch (e) {
    console.error('[cron/keep-smtp-alive] envío fallido:', e);
    const msg = e instanceof Error ? e.message : 'desconocido';
    return Response.json(
      { ok: false, error: `No se pudo enviar el correo: ${msg}` },
      { status: 500 },
    );
  }

  console.log(`[cron/keep-smtp-alive] ping enviado a ${recipient}`);
  return Response.json({ ok: true, recipient, sentAt });
}

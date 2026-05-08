import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { role, timestamp } = await request.json();

  const isEnd = role === 'end';
  const subject = isEnd
    ? '🎉 Memory World — Someone reached THE END!'
    : `🔔 Memory World — ${role === 'admin' ? 'Admin' : 'Visitor'} Login`;

  const html = isEnd
    ? `
      <div style="font-family:monospace;background:#fffef5;padding:24px;max-width:480px">
        <h2 style="color:#b8860b;margin:0 0 16px">🌻 Memory World</h2>
        <p style="margin:0 0 8px">Someone walked all the way to the end of the gallery and saw the birthday screen! 🎂</p>
        <table style="border-collapse:collapse;width:100%;margin-top:16px">
          <tr>
            <td style="padding:8px 12px;background:#f5f0e0;border:1px solid #e0d8c0;font-weight:bold">Event</td>
            <td style="padding:8px 12px;border:1px solid #e0d8c0">🎆 Reached the end</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;background:#f5f0e0;border:1px solid #e0d8c0;font-weight:bold">Time</td>
            <td style="padding:8px 12px;border:1px solid #e0d8c0">${timestamp}</td>
          </tr>
        </table>
      </div>
    `
    : `
      <div style="font-family:monospace;background:#fffef5;padding:24px;max-width:480px">
        <h2 style="color:#b8860b;margin:0 0 16px">🌻 Memory World</h2>
        <p style="margin:0 0 8px">Someone just logged in.</p>
        <table style="border-collapse:collapse;width:100%;margin-top:16px">
          <tr>
            <td style="padding:8px 12px;background:#f5f0e0;border:1px solid #e0d8c0;font-weight:bold">Role</td>
            <td style="padding:8px 12px;border:1px solid #e0d8c0">${role === 'admin' ? '🔑 Admin' : '👤 Visitor'}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;background:#f5f0e0;border:1px solid #e0d8c0;font-weight:bold">Time</td>
            <td style="padding:8px 12px;border:1px solid #e0d8c0">${timestamp}</td>
          </tr>
        </table>
      </div>
    `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Memory World <onboarding@resend.dev>',
      to: 'yashbshah13@gmail.com',
      subject,
      html,
    }),
  });

  if (!res.ok) return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

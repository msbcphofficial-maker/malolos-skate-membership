export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, email, memberId, barangay, skateName, gcashReceiptUrl } = req.body;

  if (!firstName || !lastName || !memberId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const memberName = `${firstName} ${lastName}`;

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        sender: { name: 'Malolos Skateboarding', email: 'hello@msbcskate.org' },
        to: [{ email: 'msbcph.official@gmail.com', name: 'MSBC Admin' }],
        subject: `New Physical ID Request — ${memberName} (${memberId})`,
        htmlContent: `
          <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@700&family=Roboto+Mono&display=swap" rel="stylesheet">
          <div style="font-family:'Roboto Mono',monospace; background:#0f1720; color:#f0ede8; padding:32px; max-width:560px; margin:0 auto;">
            <div style="font-family:'Barlow',sans-serif; font-size:24px; font-weight:700; color:#A7D3BF; letter-spacing:3px; text-transform:uppercase; margin-bottom:8px;">PHYSICAL ID REQUEST</div>
            <div style="font-size:12px; color:rgba(167,211,191,0.7); margin-bottom:28px; letter-spacing:1px;">Malolos Skateboarding Membership</div>

            <table style="width:100%; border-collapse:collapse; font-size:13px; font-family:'Roboto Mono',monospace;">
              <tr><td style="padding:8px 0; color:rgba(167,211,191,0.7); width:140px;">Member ID</td><td style="padding:8px 0; color:#f0ede8;">${memberId}</td></tr>
              <tr style="border-top:1px solid rgba(167,211,191,0.15);"><td style="padding:8px 0; color:rgba(167,211,191,0.7);">Name</td><td style="padding:8px 0;">${memberName}</td></tr>
              <tr style="border-top:1px solid rgba(167,211,191,0.15);"><td style="padding:8px 0; color:rgba(167,211,191,0.7);">Email</td><td style="padding:8px 0;">${email ? `<a href="mailto:${email}" style="color:#f0ede8; text-decoration:underline;">${email}</a>` : '—'}</td></tr>
              <tr style="border-top:1px solid rgba(167,211,191,0.15);"><td style="padding:8px 0; color:rgba(167,211,191,0.7);">Barangay</td><td style="padding:8px 0;">${barangay || '—'}</td></tr>
              <tr style="border-top:1px solid rgba(167,211,191,0.15);"><td style="padding:8px 0; color:rgba(167,211,191,0.7);">Skate Name</td><td style="padding:8px 0;">${skateName || '—'}</td></tr>
              <tr style="border-top:1px solid rgba(167,211,191,0.15);"><td style="padding:8px 0; color:rgba(167,211,191,0.7);">ID Type</td><td style="padding:8px 0; color:#A7D3BF;">Physical ID · ₱250 GCash</td></tr>
              ${gcashReceiptUrl ? `<tr style="border-top:1px solid rgba(167,211,191,0.15);"><td style="padding:8px 0; color:rgba(167,211,191,0.7);">GCash Receipt</td><td style="padding:8px 0;"><a href="${gcashReceiptUrl}" download style="display:inline-flex; align-items:center; gap:6px; color:#A7D3BF; text-decoration:none; font-family:'Roboto Mono',monospace; font-size:13px; border:1px solid rgba(167,211,191,0.4); padding:6px 12px;">&#x2B07; Download Receipt</a></td></tr>` : ''}
            </table>
          </div>
        `
      })
    });

    if (response.ok) {
      return res.status(200).json({ success: true });
    }

    const data = await response.json();
    console.error('Brevo send error:', data);
    return res.status(response.status).json({ error: 'Failed to send notification' });

  } catch (err) {
    console.error('Notify physical ID error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

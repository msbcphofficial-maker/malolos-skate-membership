export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, email, memberId, barangay, skateName } = req.body;

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
          <div style="font-family:monospace; background:#0f1720; color:#f0ede8; padding:32px; max-width:560px; margin:0 auto;">
            <div style="font-size:22px; font-weight:700; color:#A7D3BF; letter-spacing:2px; margin-bottom:8px;">PHYSICAL ID REQUEST</div>
            <div style="font-size:12px; color:rgba(167,211,191,0.7); margin-bottom:28px; letter-spacing:1px;">Malolos Skateboarding Membership</div>

            <table style="width:100%; border-collapse:collapse; font-size:13px;">
              <tr><td style="padding:8px 0; color:rgba(167,211,191,0.7); width:140px;">Member ID</td><td style="padding:8px 0; font-weight:700; color:#f0ede8;">${memberId}</td></tr>
              <tr style="border-top:1px solid rgba(167,211,191,0.15);"><td style="padding:8px 0; color:rgba(167,211,191,0.7);">Name</td><td style="padding:8px 0;">${memberName}</td></tr>
              <tr style="border-top:1px solid rgba(167,211,191,0.15);"><td style="padding:8px 0; color:rgba(167,211,191,0.7);">Email</td><td style="padding:8px 0;">${email || '—'}</td></tr>
              <tr style="border-top:1px solid rgba(167,211,191,0.15);"><td style="padding:8px 0; color:rgba(167,211,191,0.7);">Barangay</td><td style="padding:8px 0;">${barangay || '—'}</td></tr>
              <tr style="border-top:1px solid rgba(167,211,191,0.15);"><td style="padding:8px 0; color:rgba(167,211,191,0.7);">Skate Name</td><td style="padding:8px 0;">${skateName || '—'}</td></tr>
              <tr style="border-top:1px solid rgba(167,211,191,0.15);"><td style="padding:8px 0; color:rgba(167,211,191,0.7);">ID Type</td><td style="padding:8px 0; color:#A7D3BF; font-weight:700;">Physical ID · ₱250 GCash</td></tr>
            </table>

            <div style="margin-top:28px; padding:16px; background:rgba(167,211,191,0.08); border-left:3px solid #A7D3BF; font-size:12px; color:rgba(167,211,191,0.8); line-height:1.7;">
              Reach out to this member to collect GCash payment and arrange pickup at Explore Co. 100 A. Mabini, Malolos, Bulacan.
            </div>
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

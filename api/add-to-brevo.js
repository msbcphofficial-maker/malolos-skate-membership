export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, firstName, lastName, memberId, discipline } = req.body;

  if (!email || !firstName || !lastName || !memberId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const isMSBC = discipline === 'BMX' || discipline === 'Scooter' || discipline === 'inline_roller';
  const templateId = isMSBC ? 4 : 1;

  try {
    // 1. Add / update contact in Brevo list
    const contactRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        email,
        attributes: {
          FIRSTNAME: firstName,
          LASTNAME: lastName,
          MEMBER_ID: memberId
        },
        listIds: [5],
        updateEnabled: true
      })
    });

    if (!contactRes.ok && contactRes.status !== 204) {
      const data = await contactRes.json();
      console.error('Brevo contact error:', data);
      return res.status(contactRes.status).json({ error: 'Failed to add contact' });
    }

    // 2. Send welcome email using the correct template
    const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        templateId,
        to: [{ email, name: `${firstName} ${lastName}` }],
        params: {
          FIRSTNAME: firstName,
          LASTNAME: lastName,
          MEMBER_ID: memberId
        }
      })
    });

    if (!emailRes.ok) {
      const data = await emailRes.json();
      console.error('Brevo email error:', data);
      // Non-fatal — contact was added, just log the email failure
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Brevo fetch error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

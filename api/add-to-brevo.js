export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, firstName, lastName, memberId } = req.body;

  // Basic validation
  if (!email || !firstName || !lastName || !memberId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/contacts', {
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

    // Brevo returns 201 on success, 204 on update (contact already exists)
    if (response.ok || response.status === 204) {
      return res.status(200).json({ success: true });
    }

    const data = await response.json();
    // Log server-side only — never exposed to browser
    console.error('Brevo API error:', data);
    return res.status(response.status).json({ error: 'Failed to add contact' });

  } catch (err) {
    console.error('Brevo fetch error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

const fetch = globalThis.fetch || require('node-fetch');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'proposals';

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Airtable environment variables not configured' });
  }

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');

    const fields = {
      id: body.id || '',
      clientName: body.clientName || '',
      projectName: body.projectName || '',
      finalValue: body.finalValue != null ? String(body.finalValue) : '',
      deviceId: body.deviceId || '',
      createdAt: body.createdAt || new Date().toISOString(),
      payload: JSON.stringify(body)
    };

    const resp = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields })
    });

    const json = await resp.json();
    if (!resp.ok) return res.status(500).json({ error: 'Airtable error', details: json });

    return res.status(200).json({ id: json.id, record: json });
  } catch (e) {
    console.error('airtable-save error', e);
    return res.status(500).json({ error: 'internal' });
  }
};

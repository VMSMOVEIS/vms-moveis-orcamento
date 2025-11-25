const fetch = globalThis.fetch || require('node-fetch');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'proposals';

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Airtable environment variables not configured' });
  }

  try {
    const records = [];
    let offset = undefined;
    do {
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}${offset ? ('?offset=' + offset) : ''}`;
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
      });
      const json = await resp.json();
      if (!resp.ok) return res.status(500).json({ error: 'Airtable error', details: json });

      for (const r of json.records || []) {
        let payload = null;
        try {
          payload = r.fields && r.fields.payload ? JSON.parse(r.fields.payload) : null;
        } catch (e) {
          payload = null;
        }
        records.push({ id: r.fields?.id || null, recordId: r.id, fields: r.fields, payload });
      }

      offset = json.offset;
    } while (offset);

    return res.status(200).json({ records });
  } catch (e) {
    console.error('airtable-load error', e);
    return res.status(500).json({ error: 'internal' });
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Tato adresa přijímá pouze POST požadavky.' });
  }

  const airtableToken = process.env.AIRTABLE_SECRET_TOKEN;
  const baseId = process.env.EXPO_PUBLIC_AIRTABLE_BASE_ID; 

  if (!airtableToken) {
    return res.status(500).json({ error: 'Chybí tajný Airtable token na serveru.' });
  }

  try {
    // 1. KROK: Uložení jména a e-mailu do tabulky Rezervace
    const airtableResponse = await fetch(`https://api.airtable.com/v0/${baseId}/Rezervace`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${airtableToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body.rezervaceData)
    });

    const data = await airtableResponse.json();

    if (!airtableResponse.ok) {
      return res.status(airtableResponse.status).json({ error: data.error?.message || 'Chyba při ukládání do Airtable' });
    }

    // 2. KROK: Úprava čísla obsazených míst v tabulce Program
    if (req.body.programId && req.body.novyPocetRezervaci !== undefined) {
       await fetch(`https://api.airtable.com/v0/${baseId}/Program`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${airtableToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          records: [{
            id: req.body.programId,
            fields: {
              "Počet rezervací": req.body.novyPocetRezervaci
            }
          }]
        })
      });
    }

    return res.status(200).json({ success: true, data: data });

  } catch (error) {
    return res.status(500).json({ error: 'Nepodařilo se spojit s Airtable.' });
  }
}

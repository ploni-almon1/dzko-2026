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

  // Získáme ID akce a ZMĚNU (1 pro přidání, -1 pro odebrání)
  const { id, zmena } = req.body;

  if (!id || zmena === undefined) {
    return res.status(400).json({ error: 'Chybí ID akce nebo hodnota změny.' });
  }

  try {
    // 1. Zjistíme aktuální počet srdíček přímo z databáze
    const programZaznam = await fetch(`https://api.airtable.com/v0/${baseId}/Program/${id}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${airtableToken}` }
    });
    
    const programData = await programZaznam.json();
    
    if (!programZaznam.ok) {
      return res.status(programZaznam.status).json({ error: 'Nepodařilo se načíst akci z databáze.' });
    }

    const aktualniPocet = programData.fields["Počet oblíbených"] || 0;
    // Pojistka, aby počet srdíček nikdy neklesl pod nulu
    const bezpecnyNovyPocet = Math.max(0, aktualniPocet + zmena);

    // 2. Upravíme číslo v tabulce Program bezpečně vypočítanou hodnotou
    const airtableResponse = await fetch(`https://api.airtable.com/v0/${baseId}/Program`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${airtableToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        records: [{
          id: id,
          fields: {
            "Počet oblíbených": bezpecnyNovyPocet
          }
        }]
      })
    });

    const data = await airtableResponse.json();

    if (!airtableResponse.ok) {
      return res.status(airtableResponse.status).json({ error: data.error?.message || 'Chyba při ukládání srdíček.' });
    }

    return res.status(200).json({ success: true, data: data });

  } catch (error) {
    return res.status(500).json({ error: 'Nepodařilo se spojit s Airtable.' });
  }
}
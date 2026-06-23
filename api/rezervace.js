export default async function handler(req, res) {
  // Povolíme přístup z naší aplikace
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Rychlá odpověď pro prohlížeč (tzv. preflight request)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Chceme přijímat jen data (POST), nic jiného
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Tato adresa přijímá pouze POST požadavky.' });
  }

  // 👇 TADY JE TEN TRIK 👇
  // Načítáme klíč z Vercelu. Všimni si, že už tu NENÍ to slovo "EXPO_PUBLIC_"!
  // Tím pádem se klíč nikdy nedostane k uživateli do telefonu/prohlížeče.
  const airtableToken = process.env.AIRTABLE_SECRET_TOKEN;
  
  // Base ID tajné být nemusí, to aplikaci klidně necháme, ať ví, do jaké databáze se hlásí
  const baseId = process.env.EXPO_PUBLIC_AIRTABLE_BASE_ID; 

  if (!airtableToken) {
    return res.status(500).json({ error: 'Chybí tajný Airtable token na serveru.' });
  }

  try {
    // Náš Hlídač teď vezme data od uživatele (jméno, email) a přepošle je s tajným klíčem do Airtable
    const airtableResponse = await fetch(`https://api.airtable.com/v0/${baseId}/Rezervace`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${airtableToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await airtableResponse.json();

    if (!airtableResponse.ok) {
      return res.status(airtableResponse.status).json({ error: data.error?.message || 'Chyba při ukládání do Airtable' });
    }

    // Vše proběhlo v pořádku, pošleme do aplikace zprávu o úspěchu
    return res.status(200).json({ success: true, data: data });

  } catch (error) {
    return res.status(500).json({ error: 'Nepodařilo se spojit s Airtable.' });
  }
}

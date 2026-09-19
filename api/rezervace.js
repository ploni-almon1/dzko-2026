// Globální paměť pro ochranu proti spamu (pamatuje si IP adresy)
const ipCache = new Map();

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

  // 👇 BOD 6: OCHRANA PROTI SPAMU (Rate Limiting) 👇
  // Zjistíme IP adresu uživatele
  const ip = req.headers['x-forwarded-for'] || 'neznama-ip';
  const nyni = Date.now();
  const casoveOkno = 60 * 1000; // 1 minuta v milisekundách
  const maximalniPocet = 5; // Povolíme max 5 rezervací za minutu z jedné IP

  if (!ipCache.has(ip)) {
    ipCache.set(ip, []);
  }

  // Z paměti vezmeme jen ty pokusy, které se staly za poslední minutu
  const pozadavky = ipCache.get(ip).filter(cas => nyni - cas < casoveOkno);

  if (pozadavky.length >= maximalniPocet) {
    return res.status(429).json({ error: 'Příliš mnoho pokusů o rezervaci. Zkuste to prosím za chvíli.' });
  }

  // Zapíšeme aktuální pokus do paměti a uložíme zpět
  pozadavky.push(nyni);
  ipCache.set(ip, pozadavky);
  // 👆 KONEC OCHRANY PROTI SPAMU 👆


  const airtableToken = process.env.AIRTABLE_SECRET_TOKEN;
  const baseId = process.env.EXPO_PUBLIC_AIRTABLE_BASE_ID; 

  if (!airtableToken) {
    return res.status(500).json({ error: 'Chybí tajný Airtable token na serveru.' });
  }

  // 👇 BOD 5: SERVEROVÁ VALIDACE DAT 👇
  const dodanaData = req.body.rezervaceData?.records?.[0]?.fields;
  const jmeno = dodanaData?.["Jméno"];
  const email = dodanaData?.["Email"];

  if (!jmeno || typeof jmeno !== 'string' || jmeno.trim().length < 3) {
    return res.status(400).json({ error: 'Neplatné jméno. Zadejte prosím celé jméno.' });
  }
  
  if (!email || !email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Neplatný formát e-mailu.' });
  }
  
  if (!req.body.programId) {
    return res.status(400).json({ error: 'Chybí ID programu.' });
  }
  // 👆 KONEC VALIDACE 👆


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

    // 2. KROK: Bezpečné navýšení kapacity (Server si to počítá sám)
    if (req.body.programId) {
       const programZaznam = await fetch(`https://api.airtable.com/v0/${baseId}/Program/${req.body.programId}`, {
         method: 'GET',
         headers: {
           'Authorization': `Bearer ${airtableToken}`
         }
       });
       
       const programData = await programZaznam.json();
       
       if (programZaznam.ok) {
         const aktualniPocet = programData.fields["Počet rezervací"] || 0;
         const bezpecnyNovyPocet = aktualniPocet + 1;

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
                "Počet rezervací": bezpecnyNovyPocet
              }
            }]
          })
         });
       }
    }

    return res.status(200).json({ success: true, data: data });

  } catch (error) {
    return res.status(500).json({ error: 'Nepodařilo se spojit s Airtable.' });
  }
}
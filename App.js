const handleOdeslatRezervaci = async () => {
    if (!rezervaceJmeno.trim() || !rezervaceEmail.trim()) {
      alert('Prosím, vyplňte jméno i e-mail pro rezervaci.');
      return;
    }
    
    setOdesilaRezervaci(true);
    const baseId = process.env.EXPO_PUBLIC_AIRTABLE_BASE_ID;
    const token = process.env.EXPO_PUBLIC_AIRTABLE_TOKEN;

    try {
      const response = await fetch(`https://api.airtable.com/v0/${baseId}/Rezervace`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          records: [{
            fields: {
              "Akce": detailAkce.nazev,
              "Jméno": rezervaceJmeno,
              "Email": rezervaceEmail
            }
          }]
        })
      });

      // ZDE JE ZMĚNA: Vytáhneme si přesný detail chyby přímo z Airtable
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Detail chyby z Airtable:", errorData);
        throw new Error(`Airtable chyba: ${errorData?.error?.message || 'Neznámý problém'}`);
      }
      
      setRezervaceOdeslana(true);
    } catch (err) {
      // Nyní se v alertu ukáže přesný důvod, proč to spadlo
      alert(`Nepodařilo se odeslat rezervaci.\n\nDetail: ${err.message}`);
    } finally {
      setOdesilaRezervaci(false);
    }
  };

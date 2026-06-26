import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Pomocné funkce pro bezpečné parsování Airtable dat
const safeString = (val) => (val ? String(val).trim() : '');
const safeImage = (val) => (val && val[0] ? val[0].url : null);

export default function useAirtableData(
  DEFAULT_THEME_COLOR,
  setAktivniTab,
  setDetailAkce,
  setSdilenyVyberIds,
  setVybranyDen,
  setVybranyTag,
  setActiveFilters,
  aktivniTab,
  detailAkce,
  hlavniScrollY,
  hlavniScrollViewRef,
  setHomeMapaZvetsena,
  setMapaModalVisible,
  otevriDetail
) {
  const [prednaskyVsechny, setPrednaskyVsechny] = useState([]);
  const [hosteVsechny, setHosteVsechny] = useState([]);
  const [partneri, setPartneri] = useState([]);
  const [heroImage, setHeroImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [oblibeneIds, setOblibeneIds] = useState([]);
  const [mojeRezervace, setMojeRezervace] = useState([]);
  const [themeColor, setThemeColor] = useState(DEFAULT_THEME_COLOR);
  const [zobrazitObrazky, setZobrazitObrazky] = useState(true);

  // Hlídače pro History API nahoře v adresním řádku
  const isBackNavigation = useRef(false);
  const isInitialMount = useRef(true);

  // 1. EFEKT: Obnova pozice scrollu
  useEffect(() => {
    if (!detailAkce && hlavniScrollY.current > 0) {
      setTimeout(() => {
        if (hlavniScrollViewRef.current) {
          if (typeof hlavniScrollViewRef.current.scrollTo === 'function') {
            hlavniScrollViewRef.current.scrollTo({ y: hlavniScrollY.current, animated: false });
          } else if (typeof hlavniScrollViewRef.current.scrollToOffset === 'function') {
            hlavniScrollViewRef.current.scrollToOffset({ offset: hlavniScrollY.current, animated: false });
          }
        }
      }, 50);
    }
  }, [detailAkce]);

  // 2. EFEKT: Service Worker pro web
  useEffect(() => {
    if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(() => console.log('Offline režim webu (Service Worker) úspěšně aktivován.'))
        .catch((err) => console.log('Service Worker se nepodařilo zaregistrovat:', err));
    }
  }, []);

  // 3. EFEKT: History API - Tlačítko zpět v prohlížeči
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handlePopState = (event) => {
        isBackNavigation.current = true;
        if (event.state) {
          setAktivniTab(event.state.tab || (window.innerWidth >= 1024 ? 'Home' : 'Program'));
          if (event.state.akceId && prednaskyVsechny.length > 0) {
            const nalezenaAkce = prednaskyVsechny.find(a => a.id === event.state.akceId);
            setDetailAkce(nalezenaAkce || null);
          } else {
            setDetailAkce(null);
          }
        } else {
          setDetailAkce(null);
          setAktivniTab(window.innerWidth >= 1024 ? 'Home' : 'Program');
        }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [prednaskyVsechny]);

  // 4. EFEKT: History API - Zápis kliknutí do URL adresy
  useEffect(() => {
    if (Platform.OS === 'web' && !loading) {
      if (isBackNavigation.current) {
        isBackNavigation.current = false;
        return;
      }
      const currentState = { tab: aktivniTab, akceId: detailAkce ? detailAkce.id : null };
      let novaUrl = window.location.pathname;
      if (detailAkce) {
        novaUrl += `?akce=${detailAkce.id}`;
      } else if (aktivniTab !== 'Home' && aktivniTab !== 'Program') {
        novaUrl += `?tab=${aktivniTab.toLowerCase()}`;
      }
      if (isInitialMount.current) {
        window.history.replaceState(currentState, '', novaUrl);
        isInitialMount.current = false;
      } else {
        window.history.pushState(currentState, '', novaUrl);
      }
    }
  }, [aktivniTab, detailAkce, loading]);

  // 5. EFEKT: Meta tagy, barva pozadí a zachycení kliknutí z iframe Mapy
  useEffect(() => {
    if (Platform.OS === 'web') {
      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
      }
      meta.content = '#F3F4F6';
      document.body.style.backgroundColor = '#F3F4F6';
      document.documentElement.style.backgroundColor = '#F3F4F6';

      const handleMapMessage = (event) => {
        if (event.data === 'EXPAND_MAP') setHomeMapaZvetsena(true);
        if (event.data === 'CONTRACT_MAP') setHomeMapaZvetsena(false);
        if (event.data && event.data.type === 'OPEN_EVENT') {
          const eventId = event.data.id;
          const nalezenaAkce = prednaskyVsechny.find(a => a.id === eventId);
          if (nalezenaAkce) {
            otevriDetail(nalezenaAkce);
            setAktivniTab('Program');
            setMapaModalVisible(false);
            setHomeMapaZvetsena(false);
          }
        }
      };
      window.addEventListener('message', handleMapMessage);
      return () => window.removeEventListener('message', handleMapMessage);
    }
  }, [prednaskyVsechny]);

  // 6. EFEKT: SAMOTNÉ STAŽENÍ DAT (AIRTABLE + ASYNCSTORAGE)
  useEffect(() => {
    const nactiVse = async () => {
      const startTime = Date.now();
      const skryjKolecko = () => {
        const uplynulo = Date.now() - startTime;
        const zbyva = Math.max(0, 800 - uplynulo);
        setTimeout(() => setLoading(false), zbyva);
      };

      let nactenyProgram = [];

      try {
        const ulozenaData = await AsyncStorage.getItem('@moje_srdicka');
        if (ulozenaData !== null) setOblibeneIds(JSON.parse(ulozenaData));
        const ulozeneRezervace = await AsyncStorage.getItem('@moje_rezervace');
        if (ulozeneRezervace !== null) setMojeRezervace(JSON.parse(ulozeneRezervace));
        const ulozenaBarva = await AsyncStorage.getItem('@theme_color_v2');
        if (ulozenaBarva !== null) setThemeColor(ulozenaBarva);
        const ulozeneZobrazeni = await AsyncStorage.getItem('@zobrazit_obrazky');
        if (ulozeneZobrazeni !== null) setZobrazitObrazky(JSON.parse(ulozeneZobrazeni));

        const cachedProgram = await AsyncStorage.getItem('@cached_program');
        const cachedHoste = await AsyncStorage.getItem('@cached_hoste');
        const cachedPartneri = await AsyncStorage.getItem('@cached_partneri');
        const cachedImage = await AsyncStorage.getItem('@cached_hero');

        if (cachedProgram && cachedHoste && cachedPartneri) {
          nactenyProgram = JSON.parse(cachedProgram);
          setPrednaskyVsechny(nactenyProgram);
          setHosteVsechny(JSON.parse(cachedHoste));
          setPartneri(JSON.parse(cachedPartneri));
          if (cachedImage) setHeroImage(cachedImage);
          skryjKolecko();
        }
      } catch (error) { console.error('Chyba při načítání lokálních dat:', error); }

      const baseId = process.env.EXPO_PUBLIC_AIRTABLE_BASE_ID;
      const token = process.env.EXPO_PUBLIC_AIRTABLE_TOKEN;

      if (!baseId || !token) {
        if (nactenyProgram.length === 0) setError('Chybí konfigurace API klíčů.');
        skryjKolecko();
        return;
      }

      try {
        fetch(`https://api.airtable.com/v0/${baseId}/Nastaveni`, { headers: { Authorization: `Bearer ${token}` } })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && data.records && data.records.length > 0) {
              const record = data.records.find(r => r.fields['Home']);
              if (record && record.fields['Home'][0]) {
                const imgUrl = record.fields['Home'][0].url;
                setHeroImage(imgUrl);
                AsyncStorage.setItem('@cached_hero', imgUrl);
              }
            }
          }).catch(() => {});

        fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent('Partneři')}?view=Grid%20view`, { headers: { Authorization: `Bearer ${token}` } })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && data.records) {
              const upraveniPartneri = data.records.map(record => {
                const f = record.fields;
                return { id: record.id, nazev: safeString(f['Název']), odkaz: safeString(f['Odkaz']), kategorie: safeString(f['Kategorie']), logo: safeImage(f['Logo']) };
              });
              setPartneri(upraveniPartneri);
              AsyncStorage.setItem('@cached_partneri', JSON.stringify(upraveniPartneri));
            }
          }).catch(() => {});

        const resProgram = await fetch(`https://api.airtable.com/v0/${baseId}/Program`, { headers: { Authorization: `Bearer ${token}` } });
        if (!resProgram.ok) throw new Error('Chyba Airtable');
        const dataProgram = await resProgram.json();
        
        const upravenaData = dataProgram.records
          .filter(record => record.fields['Název akce'])
          .map(record => {
            const f = record.fields;
            const denText = f['Den'] || 'PO 12';
            const casText = f['Čas'] || '--:--';
            const mistoText = f['Místo'] || '';
            const slozenyCas = [denText, casText, mistoText].filter(Boolean).join(' | ');

            const hosteList = [];
            const pridajHosta = (jmenoKey, roleKey, fotkaKey, popisKey, profeseKey) => {
              const jmeno = safeString(f[jmenoKey]);
              if (jmeno !== '') {
                hosteList.push({
                  jmeno, role: safeString(f[roleKey]) || 'Přednášející',
                  fotka: safeImage(f[fotkaKey]), popis: safeString(f[popisKey]), profese: safeString(f[profeseKey])
                });
              }
            };
            pridajHosta('Host', 'Role hosta', 'Fotka hosta', 'Popis hosta', 'Profese hosta');
            pridajHosta('Host 2', 'Role hosta 2', 'Fotka hosta 2', 'Popis hosta 2', 'Profese hosta 2');
            pridajHosta('Host 3', 'Role hosta 3', 'Fotka hosta 3', 'Popis hosta 3', 'Profese hosta 3');

            return {
              id: record.id, den: denText, cas: slozenyCas, nazev: f['Název akce'],
              hoste: hosteList, host: hosteList.map(h => h.jmeno).join(', '),
              roleHosta: hosteList.length > 1 ? 'Hosté' : (hosteList.length === 1 ? hosteList[0].role : 'Přednášející'),
              tag: f['Tagy'] || [], popis: f['Anotace'] || '', image: safeImage(f['Obrázek']),
              odkaz: f['Vstupenky'] || null, rezervace: !!f['Rezervace'], pocetOblibenych: f['Počet oblíbených'] || 0,
              pocetRezervaci: f['Počet rezervací'] || 0, kapacita: f['Kapacita'] || null, highlight: !!f['Highlight'] 
            };
          });

        const spravnePoradiDnu = ['PO 12', 'ÚT 13', 'ST 14', 'ČT 15', 'PÁ 16', 'SO 17', 'NE 18'];
        upravenaData.sort((a, b) => {
          const indexA = spravnePoradiDnu.indexOf(a.den);
          const indexB = spravnePoradiDnu.indexOf(b.den);
          if (indexA !== indexB) return indexA - indexB;
          return a.cas.localeCompare(b.cas);
        });

        setPrednaskyVsechny(upravenaData);
        AsyncStorage.setItem('@cached_program', JSON.stringify(upravenaData));
        nactenyProgram = upravenaData;

        const unikatniHosteMap = new Map();
        for (const item of upravenaData) {
          for (const h of item.hoste) {
            if (h.jmeno && h.jmeno.trim() !== '') {
              if (!unikatniHosteMap.has(h.jmeno)) unikatniHosteMap.set(h.jmeno, h);
            }
          }
        }
        const unikatniHosteList = Array.from(unikatniHosteMap.values());
        unikatniHosteList.sort((a, b) => a.jmeno.localeCompare(b.jmeno));
        setHosteVsechny(unikatniHosteList);
        AsyncStorage.setItem('@cached_hoste', JSON.stringify(unikatniHosteList));

        if (Platform.OS === 'web') {
          const urlParams = new URLSearchParams(window.location.search);
          const sdileneId = urlParams.get('akce');
          if (sdileneId) {
            const nalezenaAkce = upravenaData.find(a => a.id === sdileneId);
            if (nalezenaAkce) { setDetailAkce(nalezenaAkce); setAktivniTab('Program'); }
          }
          const sdileneOblibene = urlParams.get('oblibene');
          if (sdileneOblibene) {
            const sdileneIds = sdileneOblibene.split(',');
            const platneSdileneIds = sdileneIds.filter(id => upravenaData.some(a => a.id === id));
            if (platneSdileneIds.length > 0) {
              setSdilenyVyberIds(platneSdileneIds); setAktivniTab('Oblíbené');
              setVybranyDen('VŠE'); setVybranyTag(null); setActiveFilters({ den: [], typ: [], misto: [], hoste: [] });
            }
          }
        }

        setOblibeneIds(staraSrdicka => {
          const platnaSrdicka = staraSrdicka.filter(id => upravenaData.some(akce => akce.id === id));
          if (platnaSrdicka.length !== staraSrdicka.length) AsyncStorage.setItem('@moje_srdicka', JSON.stringify(platnaSrdicka));
          return platnaSrdicka;
        });

        skryjKolecko();
      } catch (err) {
        console.log('Jsme offline, stahování dat se nepodařilo. Použije se cache.', err);
        if (nactenyProgram.length === 0) {
          setError('Jste offline a v mobilu zatím nemáte uložená žádná data z festivalu. Připojte se prosím na chvíli k internetu.');
        }
        skryjKolecko();
      }
    };

    nactiVse();
  }, []);

  // Vrátíme všechny stavy, aby je App.js mohl používat
  return {
    prednaskyVsechny, setPrednaskyVsechny,
    hosteVsechny, setHosteVsechny,
    partneri, setPartneri,
    heroImage, setHeroImage,
    loading, setLoading,
    error, setError,
    oblibeneIds, setOblibeneIds,
    mojeRezervace, setMojeRezervace,
    themeColor, setThemeColor,
    zobrazitObrazky, setZobrazitObrazky
  };
}
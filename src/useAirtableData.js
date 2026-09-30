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

  const isBackNavigation = useRef(false);
  const isInitialMount = useRef(true);

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

  useEffect(() => {
    if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then((reg) => {
          console.log('Offline režim webu úspěšně aktivován.');
          reg.update(); 
        })
        .catch((err) => console.log('Service Worker se nepodařilo zaregistrovat:', err));
    }
  }, []);

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

  useEffect(() => {
    if (Platform.OS === 'web') {
      let metaTheme = document.querySelector('meta[name="theme-color"]');
      if (!metaTheme) {
        metaTheme = document.createElement('meta');
        metaTheme.name = 'theme-color';
        document.head.appendChild(metaTheme);
      }
      metaTheme.content = '#FFFFFF';

      let metaColor = document.querySelector('meta[name="color-scheme"]');
      if (!metaColor) {
        metaColor = document.createElement('meta');
        metaColor.name = 'color-scheme';
        document.head.appendChild(metaColor);
      }
      metaColor.content = 'light';

      document.body.style.backgroundColor = '#FFFFFF';
      document.documentElement.style.backgroundColor = '#FFFFFF';
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const script = document.createElement('script');
      script.src = 'https://www.googletagmanager.com/gtag/js?id=G-GX6BYGPYWN';
      script.async = true;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(){window.dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-GX6BYGPYWN');

      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      if (isStandalone) {
        gtag('event', 'pwa_opened', { event_category: 'PWA', event_label: 'Aplikace spuštěna z plochy' });
      }
      window.addEventListener('appinstalled', () => {
        gtag('event', 'pwa_installed', { event_category: 'PWA', event_label: 'Aplikace nainstalována na plochu' });
      });
    }
  }, []);

  // HLAVNÍ ZÁCHRANNÝ BLOK
  useEffect(() => {
    const nactiVse = async () => {
      const startTime = Date.now();
      const skryjKolecko = () => {
        const uplynulo = Date.now() - startTime;
        const zbyva = Math.max(0, 800 - uplynulo);
        setTimeout(() => setLoading(false), zbyva);
      };

      let nactenyProgram = [];
      let pouzitCache = false;

      try {
        // Načtení uživatelského nastavení
        const ulozenaData = await AsyncStorage.getItem('@moje_srdicka');
        if (ulozenaData !== null) setOblibeneIds(JSON.parse(ulozenaData));
        const ulozeneRezervace = await AsyncStorage.getItem('@moje_rezervace');
        if (ulozeneRezervace !== null) setMojeRezervace(JSON.parse(ulozeneRezervace));
        const ulozenaBarva = await AsyncStorage.getItem('@theme_color_v2');
        if (ulozenaBarva !== null) setThemeColor(ulozenaBarva);
        
        // ZJIŠTĚNÍ ČASU POSLEDNÍ AKTUALIZACE DAT
        const casPoslednihoStazeni = await AsyncStorage.getItem('@posledni_stazeni');
        const nyni = Date.now();
        // 15 minut v milisekundách = 900 000
        const LIMIT_CACHE = 900000; 

        const cachedProgram = await AsyncStorage.getItem('@cached_program');
        const cachedHoste = await AsyncStorage.getItem('@cached_hoste');
        const cachedPartneri = await AsyncStorage.getItem('@cached_partneri');
        const cachedImage = await AsyncStorage.getItem('@cached_hero');

        // Pokud máme data A ZÁROVEŇ jsou mladší než 15 minut, použijeme je a STOP!
        if (cachedProgram && cachedHoste && cachedPartneri) {
          nactenyProgram = JSON.parse(cachedProgram);
          setPrednaskyVsechny(nactenyProgram);
          setHosteVsechny(JSON.parse(cachedHoste));
          setPartneri(JSON.parse(cachedPartneri));
          if (cachedImage) setHeroImage(cachedImage);
          
          if (casPoslednihoStazeni && (nyni - parseInt(casPoslednihoStazeni, 10) < LIMIT_CACHE)) {
            console.log("Používám čerstvou paměť, nezatěžuji Airtable.");
            pouzitCache = true;
            skryjKolecko();
            return; // Zastaví spouštění, Airtable zůstává v klidu
          }
        }
      } catch (error) { console.error('Chyba paměti:', error); }

      const baseId = process.env.EXPO_PUBLIC_AIRTABLE_BASE_ID;
      const token = process.env.EXPO_PUBLIC_AIRTABLE_TOKEN;

      if (!baseId || !token) {
        if (nactenyProgram.length === 0) setError('Chybí konfigurace API klíčů.');
        skryjKolecko();
        return;
      }

      // Funkce, která náhodně počká, pokud je Airtable přetížený (Retry mechanismus)
      const fetchSFrontou = async (url, options, maxPokusu = 4) => {
        for (let i = 0; i < maxPokusu; i++) {
          const res = await fetch(url, options);
          if (res.ok) return res;
          if (res.status === 429) {
            const pauza = 1000 * Math.pow(1.5, i) + Math.random() * 1000;
            console.warn(`Airtable plný, čekám ${Math.round(pauza)}ms...`);
            await new Promise(resolve => setTimeout(resolve, pauza));
          } else {
            throw new Error(`Chyba: ${res.status}`);
          }
        }
        throw new Error('Přetíženo.');
      };

      try {
        console.log("Stahuji nová data z Airtable...");
        
        fetchSFrontou(`https://api.airtable.com/v0/${baseId}/Nastaveni`, { headers: { Authorization: `Bearer ${token}` } })
          .then(res => res.json())
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

        fetchSFrontou(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent('Partneři')}?view=Grid%20view`, { headers: { Authorization: `Bearer ${token}` } })
          .then(res => res.json())
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

        const resProgram = await fetchSFrontou(`https://api.airtable.com/v0/${baseId}/Program`, { headers: { Authorization: `Bearer ${token}` } });
        const dataProgram = await resProgram.json();
        
        const upravenaData = dataProgram.records
          .filter(record => record.fields['Název akce'])
          .map(record => {
            const f = record.fields;
            const hosteList = [];
            const pridajHosta = (jmenoKey, roleKey, fotkaKey, popisKey, profeseKey) => {
              const jmeno = safeString(f[jmenoKey]);
              if (jmeno !== '') hosteList.push({ jmeno, role: safeString(f[roleKey]) || 'Přednášející', fotka: safeImage(f[fotkaKey]), popis: safeString(f[popisKey]), profese: safeString(f[profeseKey]) });
            };
            pridajHosta('Host', 'Role hosta', 'Fotka hosta', 'Popis hosta', 'Profese hosta');
            pridajHosta('Host 2', 'Role hosta 2', 'Fotka hosta 2', 'Popis hosta 2', 'Profese hosta 2');
            pridajHosta('Host 3', 'Role hosta 3', 'Fotka hosta 3', 'Popis hosta 3', 'Profese hosta 3');

            return {
              id: record.id, den: f['Den'] || 'PO 12', cas: [f['Den'], f['Čas'], f['Místo']].filter(Boolean).join(' | '), nazev: f['Název akce'],
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
        AsyncStorage.setItem('@posledni_stazeni', Date.now().toString()); // Uložení času úspěšného stáhnutí

        const unikatniHosteMap = new Map();
        for (const item of upravenaData) {
          for (const h of item.hoste) if (h.jmeno && h.jmeno.trim() !== '' && !unikatniHosteMap.has(h.jmeno)) unikatniHosteMap.set(h.jmeno, h);
        }
        const unikatniHosteList = Array.from(unikatniHosteMap.values()).sort((a, b) => a.jmeno.localeCompare(b.jmeno));
        setHosteVsechny(unikatniHosteList);
        AsyncStorage.setItem('@cached_hoste', JSON.stringify(unikatniHosteList));

        skryjKolecko();
      } catch (err) {
        console.log('Jsme offline nebo je přetíženo, stahování dat se nepodařilo.', err);
        if (nactenyProgram.length === 0) setError('Nepodařilo se načíst data z festivalu. Zkuste to prosím za chvíli.');
        skryjKolecko();
      }
    };

    nactiVse();
  }, []);

  return { prednaskyVsechny, setPrednaskyVsechny, hosteVsechny, setHosteVsechny, partneri, setPartneri, heroImage, setHeroImage, loading, setLoading, error, setError, oblibeneIds, setOblibeneIds, mojeRezervace, setMojeRezervace, themeColor, setThemeColor, zobrazitObrazky, setZobrazitObrazky };
}
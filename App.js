import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Platform, Linking, Image, TextInput, Alert, Modal, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Inter_400Regular } from '@expo-google-fonts/inter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

// 👇👇👇 ZDE JE TVOJE CENTRÁLNÍ BARVA PRO CELOU APLIKACI 👇👇👇
const DEFAULT_THEME_COLOR = '#1E3A8A'; // Updated to match the blue from the image

// --- GENERÁTOR MAPY ---
const generateMapHtml = (focusLat, focusLng, focusTitle, themeColor) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { padding: 0; margin: 0; }
        html, body, #map { height: 100%; width: 100%; }
        
        .dzko-pin-wrapper { background: transparent; border: none; }
        
        .dzko-pin {
            width: 32px; height: 32px;
            background-color: ${themeColor || DEFAULT_THEME_COLOR}; border: 2px solid white;
            border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
            box-shadow: -2px 2px 5px rgba(0,0,0,0.3); 
            display: flex; align-items: center; justify-content: center;
        }
        
        .dzko-pin i {
            transform: rotate(45deg);
            font-size: 14px;
            color: white;
            margin-bottom: 2px; margin-left: 2px;
        }
        
        .leaflet-popup-content-wrapper { border-radius: 8px; }
        .leaflet-popup-content {
            font-family: sans-serif; font-weight: bold;
            color: #374151; text-align: center; margin: 10px 15px;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var centerLat = ${focusLat || 49.595};
        var centerLng = ${focusLng || 17.255};
        var zoomLevel = ${focusLat ? 17 : 14};
        
        var map = L.map('map').setView([centerLat, centerLng], zoomLevel);

        var apiKey = 'gRioCnF44GOOJJaSU3aLnzGM48hcumaNIilX_748pbM';
        L.tileLayer('https://api.mapy.cz/v1/maptiles/basic/256/{z}/{x}/{y}?apikey=' + apiKey, {
            minZoom: 10, maxZoom: 19,
            attribution: '&copy; <a href="https://www.seznam.cz" target="_blank">Seznam.cz, a.s.</a>'
        }).addTo(map);

        function pridejMisto(lat, lng, nazev, iconName) {
            var currentIcon = iconName || 'fa-building';
            var dzkoIcon = L.divIcon({
                className: 'dzko-pin-wrapper',
                html: '<div class="dzko-pin"><i class="fa-solid ' + currentIcon + '"></i></div>',
                iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -36]
            });

            var marker = L.marker([lat, lng], {icon: dzkoIcon}).addTo(map).bindPopup(nazev);
            var targetTitle = ${focusTitle ? `'${focusTitle}'` : 'null'};
            if (targetTitle === nazev) {
                setTimeout(() => marker.openPopup(), 300);
            }
        }

        pridejMisto(49.5980481, 17.2610522, 'Mozarteum', 'fa-landmark');
        pridejMisto(49.5904358, 17.2513681, 'Centrum judaistických studií', 'fa-graduation-cap');
        pridejMisto(49.5970906, 17.2627506, 'Židovská obec Olomouc', 'fa-star-of-david');
        pridejMisto(49.5695, 17.2912, 'Sladovna Holice', 'fa-industry');
        pridejMisto(49.5963561, 17.2563322, 'MUO CENTRAL', 'fa-film');

        // LOKALIZACE UŽIVATELE
        map.locate({setView: false, maxZoom: 16, watch: true, enableHighAccuracy: true});

        var userMarker = null;

        function onLocationFound(e) {
            if (!userMarker) {
                var userIcon = L.divIcon({
                    className: 'dzko-user-pin',
                    html: '<div style="background-color: #3B82F6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>',
                    iconSize: [22, 22],
                    iconAnchor: [11, 11]
                });
                userMarker = L.marker(e.latlng, {icon: userIcon, zIndexOffset: 1000}).addTo(map).bindPopup("Vaše aktuální poloha");
            } else {
                userMarker.setLatLng(e.latlng);
            }
        }

        map.on('locationfound', onLocationFound);

        // TLAČÍTKO PRO VYCENTROVÁNÍ NA POLOHU UŽIVATELE
        var locateControl = L.control({position: 'topright'});
        locateControl.onAdd = function (map) {
            var div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
            div.style.backgroundColor = 'white';
            div.style.width = '30px';
            div.style.height = '30px';
            div.style.cursor = 'pointer';
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.justifyContent = 'center';
            div.title = 'Ukaž moji polohu';
            div.innerHTML = '<i class="fa-solid fa-location-crosshairs" style="color: black; font-size: 16px;"></i>';
            div.onclick = function(){
                map.locate({setView: true, maxZoom: 16, enableHighAccuracy: true});
            }
            return div;
        };
        locateControl.addTo(map);

    </script>
</body>
</html>
`;

const ziskejVychoziDen = () => {
  const dnes = new Date();
  const rok = dnes.getFullYear();
  const mesic = dnes.getMonth(); 
  const den = dnes.getDate();

  if (rok === 2026 && mesic === 9) {
    switch (den) {
      case 12: return 'PO 12';
      case 13: return 'ÚT 13';
      case 14: return 'ST 14';
      case 15: return 'ČT 15';
      case 16: return 'PÁ 16';
      case 17: return 'SO 17';
      case 18: return 'NE 18';
      default: return 'VŠE'; 
    }
  }
  return 'VŠE'; 
};

export default function App() {
  let [fontsLoaded] = useFonts({
    Inter_400Regular,
  });

  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024; 

  const dny = ['PO 12', 'ÚT 13', 'ST 14', 'ČT 15', 'PÁ 16', 'SO 17', 'NE 18'];
  
  const [aktivniTab, setAktivniTab] = useState(Platform.OS === 'web' && window.innerWidth >= 1024 ? 'Home' : 'Program');
  
  const [vybranyDen, setVybranyDen] = useState(ziskejVychoziDen());
  
  const [oblibeneIds, setOblibeneIds] = useState([]);
  const [mojeRezervace, setMojeRezervace] = useState([]);
  const [vybranyTag, setVybranyTag] = useState(null);
  const [mapFocus, setMapFocus] = useState(null);
  const [rozbaleno, setRozbaleno] = useState(null);
  const [detailAkce, setDetailAkce] = useState(null);

  const [zobrazitObrazky, setZobrazitObrazky] = useState(true);

  const [themeColor, setThemeColor] = useState(DEFAULT_THEME_COLOR);
  const [zobrazitNastaveniBarvy, setZobrazitNastaveniBarvy] = useState(false);
  const [novaBarvaInput, setNovaBarvaInput] = useState('');

  const [prednaskyVsechny, setPrednaskyVsechny] = useState([]);
  const [heroImage, setHeroImage] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [rezervaceJmeno, setRezervaceJmeno] = useState('');
  const [rezervaceEmail, setRezervaceEmail] = useState('');
  const [odesilaRezervaci, setOdesilaRezervaci] = useState(false);
  const [rezervaceOdeslana, setRezervaceOdeslana] = useState(false);
  const [rezervaceChyba, setRezervaceChyba] = useState(null); 
  const [infoRezervaceVisible, setInfoRezervaceVisible] = useState(false);

  const detailScrollViewRef = useRef(null);

  useEffect(() => {
    if (!isDesktop && aktivniTab === 'Home') {
      setAktivniTab('Program');
    }
  }, [isDesktop, aktivniTab]);

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
    }
  }, []);

  useEffect(() => {
    const nactiData = async () => {
      try {
        const ulozenaData = await AsyncStorage.getItem('@moje_srdicka');
        if (ulozenaData !== null) setOblibeneIds(JSON.parse(ulozenaData));
        
        const ulozeneRezervace = await AsyncStorage.getItem('@moje_rezervace');
        if (ulozeneRezervace !== null) setMojeRezervace(JSON.parse(ulozeneRezervace));

        const ulozenaBarva = await AsyncStorage.getItem('@theme_color_v2');
        if (ulozenaBarva !== null) setThemeColor(ulozenaBarva);

        const ulozeneZobrazeni = await AsyncStorage.getItem('@zobrazit_obrazky');
        if (ulozeneZobrazeni !== null) setZobrazitObrazky(JSON.parse(ulozeneZobrazeni));
      } catch (error) { console.error('Chyba při načítání lokálních dat:', error); }
    };
    nactiData();

    const baseId = process.env.EXPO_PUBLIC_AIRTABLE_BASE_ID;
    const token = process.env.EXPO_PUBLIC_AIRTABLE_TOKEN;

    if (!baseId || !token) {
      setError('Chybí konfigurace API klíčů.');
      setLoading(false);
      return;
    }

    // NAČTENÍ ÚVODNÍHO OBRÁZKU Z TABULKY "Nastaveni"
    fetch(`https://api.airtable.com/v0/${baseId}/Nastaveni`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) return null; 
        return res.json();
      })
      .then((data) => {
        if (data && data.records && data.records.length > 0) {
          const record = data.records.find(r => r.fields['Home']);
          if (record && record.fields['Home'][0]) {
            setHeroImage(record.fields['Home'][0].url);
          }
        }
      })
      .catch((err) => console.log('Obrázek pro Home se nenačetl nebo tabulka neexistuje:', err));

    // NAČTENÍ PROGRAMU
    fetch(`https://api.airtable.com/v0/${baseId}/Program`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok) throw new Error('Nepodařilo se připojit k Airtable.');
        return response.json();
      })
      .then((data) => {
        const upravenaData = data.records
          .filter(record => record.fields['Název akce'])
          .map(record => {
            const f = record.fields;
            const denText = f['Den'] || 'PO 12';
            const casText = f['Čas'] || '--:--';
            const mistoText = f['Místo'] || '';
            const slozenyCas = [denText, casText, mistoText].filter(Boolean).join(' | ');

            return {
              id: record.id,
              den: denText,
              cas: slozenyCas,
              nazev: f['Název akce'],
              host: f['Host'] || '',
              roleHosta: f['Role hosta'] || 'host',
              tag: f['Tagy'] || [],
              popis: f['Anotace'] || '',
              image: f['Obrázek'] && f['Obrázek'][0] ? f['Obrázek'][0].url : null,
              odkaz: f['Vstupenky'] || null, 
              rezervace: !!f['Rezervace'],
              pocetOblibenych: f['Počet oblíbených'] || 0,
              pocetRezervaci: f['Počet rezervací'] || 0,
              kapacita: f['Kapacita'] || null,
              highlight: !!f['Highlight'] // 👇 NAČTENÍ CHECKBOXU Z AIRTABLU
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

        setOblibeneIds(staraSrdicka => {
          const platnaSrdicka = staraSrdicka.filter(id => upravenaData.some(akce => akce.id === id));
          if (platnaSrdicka.length !== staraSrdicka.length) {
            AsyncStorage.setItem('@moje_srdicka', JSON.stringify(platnaSrdicka));
          }
          return platnaSrdicka;
        });

        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []); 

  const prepniObrazky = async () => {
    const novyStav = !zobrazitObrazky;
    setZobrazitObrazky(novyStav);
    try { await AsyncStorage.setItem('@zobrazit_obrazky', JSON.stringify(novyStav)); }
    catch (error) { console.error('Chyba při ukládání nastavení zobrazení:', error); }
  };

  const prepniOblibene = async (id) => {
    const jeOblibene = oblibeneIds.includes(id);
    const novySeznam = jeOblibene ? oblibeneIds.filter(item => item !== id) : [...oblibeneIds, id]; 
    
    setOblibeneIds(novySeznam);
    try { await AsyncStorage.setItem('@moje_srdicka', JSON.stringify(novySeznam)); } 
    catch (error) { console.error('Chyba při ukládání srdíčka:', error); }

    const zmena = jeOblibene ? -1 : 1;
    
    setPrednaskyVsechny(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, pocetOblibenych: Math.max(0, item.pocetOblibenych + zmena) };
      }
      return item;
    }));

    if (detailAkce && detailAkce.id === id) {
      setDetailAkce(prev => ({ ...prev, pocetOblibenych: Math.max(0, prev.pocetOblibenych + zmena) }));
    }

    const baseId = process.env.EXPO_PUBLIC_AIRTABLE_BASE_ID;
    const token = process.env.EXPO_PUBLIC_AIRTABLE_TOKEN;
    
    const aktualniAkce = prednaskyVsechny.find(i => i.id === id);
    const novyPocetVAirtable = Math.max(0, (aktualniAkce?.pocetOblibenych || 0) + zmena);

    if (baseId && token) {
      try {
        await fetch(`https://api.airtable.com/v0/${baseId}/Program`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            records: [{
              id: id,
              fields: {
                "Počet oblíbených": novyPocetVAirtable
              }
            }]
          })
        });
      } catch (err) {
        console.error('Nepodařilo se aktualizovat počet srdíček v Airtable:', err);
      }
    }
  };

  const mapaLokace = {
    'CJS': { lat: 49.5904358, lng: 17.2513681, title: 'Centrum judaistických studií' },
    'Central': { lat: 49.5963561, lng: 17.2563322, title: 'MUO CENTRAL' },
    'Mozarteum': { lat: 49.5980481, lng: 17.2610522, title: 'Mozarteum' },
    'Mozarteum/Central?': { lat: 49.5963561, lng: 17.2563322, title: 'MUO CENTRAL' }, 
    'ŽOO, Komenského 9': { lat: 49.5970906, lng: 17.2627506, title: 'Židovská obec Olomouc' },
    'Sladovna Holice': { lat: 49.5695, lng: 17.2912, title: 'Sladovna Holice' }
  };

  const zobrazenePrednasky = vybranyTag
    ? prednaskyVsechny.filter(item => item.tag && item.tag.includes(vybranyTag))
    : (vybranyDen === 'VŠE' ? prednaskyVsechny : prednaskyVsechny.filter(item => item.den === vybranyDen));

  const oblibeneZobrazeni = prednaskyVsechny.filter(item => oblibeneIds.includes(item.id));
  
  // 👇 VÝBĚR HIGHLIGHTŮ PRO ÚVODNÍ STRÁNKU 👇
  const highlightAkce = prednaskyVsechny.filter(item => item.highlight).slice(0, 4);

  const handleLocationClick = (mistoText) => {
    const coords = mapaLokace[mistoText];
    if (coords) setMapFocus(coords); 
    else setMapFocus(null);
    setDetailAkce(null);
    setAktivniTab('Mapa');
  };

  const handleMenuPress = (nazev, type, content) => {
    if (type === 'link') Linking.openURL(content);
    else setRozbaleno(rozbaleno === nazev ? null : nazev);
  };

  const otevriDetail = (item, scrollNaRezervaci = false) => {
    setDetailAkce(item);
    setRezervaceJmeno('');
    setRezervaceEmail('');
    setOdesilaRezervaci(false);
    setRezervaceOdeslana(false);
    setRezervaceChyba(null);

    if (scrollNaRezervaci && !isDesktop) {
      setTimeout(() => {
        detailScrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  };

  const clickTagNaProgram = (tag) => {
    setVybranyTag(tag);
    setVybranyDen('VŠE');
    setAktivniTab('Program');
    setDetailAkce(null);
  };

  const ulozNovyMotiv = async () => {
    const hexPattern = /^#([0-9A-F]{3}){1,2}$/i;
    if (hexPattern.test(novaBarvaInput.trim())) {
      const novaBarva = novaBarvaInput.trim();
      setThemeColor(novaBarva);
      try { await AsyncStorage.setItem('@theme_color_v2', novaBarva); } 
      catch (error) { console.error('Chyba při ukládání barvy:', error); }
      setZobrazitNastaveniBarvy(false);
    } else {
      Alert.alert("Neplatný kód", "Zadejte správný HEX formát barvy (např. #666666 nebo #000)");
    }
  };

  const handleOdeslatRezervaci = async () => {
    setRezervaceChyba(null); 
    
    if (!rezervaceJmeno.trim() || !rezervaceEmail.trim()) {
      setRezervaceChyba('Prosím, vyplňte jméno i e-mail.');
      return;
    }

    if (!rezervaceJmeno.trim().includes(' ') || rezervaceJmeno.trim().length < 5) {
      setRezervaceChyba('Zadejte prosím celé jméno a příjmení (s mezerou).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rezervaceEmail.trim())) {
      setRezervaceChyba('Zadejte prosím platnou e-mailovou adresu (např. jan.novak@email.cz).');
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
              "Akce ID": detailAkce.nazev,
              "Jméno": rezervaceJmeno,
              "Email": rezervaceEmail
            }
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setRezervaceChyba(`Airtable zamítl uložení: ${errorData?.error?.message || 'Neznámý problém'}`);
        setOdesilaRezervaci(false);
        return;
      }
      
      setRezervaceOdeslana(true);
      
      const noveRezervace = [...new Set([...mojeRezervace, detailAkce.id])];
      setMojeRezervace(noveRezervace);
      await AsyncStorage.setItem('@moje_rezervace', JSON.stringify(noveRezervace));

      if (!oblibeneIds.includes(detailAkce.id)) {
        prepniOblibene(detailAkce.id);
      }

      const novyPocetRezervaci = (detailAkce.pocetRezervaci || 0) + 1;
      
      setDetailAkce(prev => ({ ...prev, pocetRezervaci: novyPocetRezervaci }));
      setPrednaskyVsechny(prev => prev.map(item => 
        item.id === detailAkce.id ? { ...item, pocetRezervaci: novyPocetRezervaci } : item
      ));

      await fetch(`https://api.airtable.com/v0/${baseId}/Program`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          records: [{
            id: detailAkce.id,
            fields: {
              "Počet rezervací": novyPocetRezervaci
            }
          }]
        })
      });

    } catch (err) {
      setRezervaceChyba(`Chyba připojení: ${err.message}`);
    } finally {
      setOdesilaRezervaci(false);
    }
  };

  const vykresliPolozkuMenu = (title, type, content) => (
    <View key={title} style={styles.menuItemWrapper}>
      <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress(title, type, content)} activeOpacity={0.6}>
        <Text style={styles.menuItemText}>{title}</Text>
        {type === 'expand' && (
          <Ionicons name={rozbaleno === title ? 'chevron-up' : 'chevron-down'} size={20} color="black" />
        )}
      </TouchableOpacity>
      
      {type === 'expand' && rozbaleno === title && (
        <View style={[styles.menuExpandedContent, { borderLeftColor: themeColor }]}>
          {typeof content === 'string' ? (
            <Text style={styles.menuExpandedText}>{content}</Text>
          ) : (
            content.map((linkObj, index) => (
              <TouchableOpacity key={index} onPress={() => Linking.openURL(linkObj.url)} style={styles.contentLinkRow} activeOpacity={0.6}>
                <Text style={styles.contentInlineLink}>{linkObj.label}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  );

  const vykresliKartu = (item) => {
    const casParts = item.cas.split(' | ');
    const timeText = casParts.length > 2 ? `${casParts[0]} | ${casParts[1]}` : item.cas;
    const mistoText = casParts.length > 2 ? casParts[2] : null;
    const maRezervaci = mojeRezervace.includes(item.id);
    
    const jePlno = item.kapacita && item.pocetRezervaci >= item.kapacita;

    return (
      <View key={item.id} style={isDesktop ? styles.desktopCardWrapper : styles.mobileCardWrapper}>
        <View style={styles.card}>
          {item.image && zobrazitObrazky && (
            <TouchableOpacity onPress={() => otevriDetail(item)} activeOpacity={0.8}>
              <Image source={{ uri: item.image }} style={isDesktop ? styles.desktopCardImage : styles.cardImage} resizeMode="cover" />
            </TouchableOpacity>
          )}

          <View style={styles.cardContent}>
            <View style={styles.timeLocationRow}>
              <Text style={styles.cardTime}>{timeText}</Text>
              {mistoText && (
                <>
                  <Text style={styles.cardTime}> | </Text>
                  <TouchableOpacity onPress={() => handleLocationClick(mistoText)} activeOpacity={0.6}>
                    <Text style={styles.locationLink}>{mistoText}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            
            <TouchableOpacity onPress={() => otevriDetail(item)} activeOpacity={0.6}>
              <Text style={styles.cardTitle}>{item.nazev}</Text>
            </TouchableOpacity>
            
            {item.host !== '' && <Text style={styles.cardHost}>{item.roleHosta}: {item.host}</Text>}
            
            <View style={styles.cardBottomRow}>
              <View style={styles.tagsContainer}>
                {item.tag && item.tag.map((t, index) => (
                  <TouchableOpacity key={index} style={[styles.tagPill, { backgroundColor: themeColor, borderColor: themeColor }]} onPress={() => clickTagNaProgram(t)} activeOpacity={0.7}>
                    <Text style={styles.tagText}>{t}</Text>
                  </TouchableOpacity>
                ))}
                
                {item.odkaz && (
                  <TouchableOpacity style={[styles.tagPillOutline, { borderColor: themeColor }]} onPress={() => Linking.openURL(item.odkaz)} activeOpacity={0.7}>
                    <Text style={[styles.tagTextOutline, { color: themeColor }]}>VSTUPENKY</Text>
                  </TouchableOpacity>
                )}

                {item.rezervace && (
                  <TouchableOpacity 
                    style={[
                      styles.tagPillOutline, 
                      { borderColor: themeColor }, 
                      maRezervaci && !jePlno && styles.tagPillRezervovano,
                      jePlno && styles.tagPillPlno 
                    ]} 
                    onPress={() => otevriDetail(item, true)} 
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.tagTextOutline, 
                      { color: themeColor }, 
                      maRezervaci && !jePlno && styles.tagTextRezervovano,
                      jePlno && styles.tagTextPlno
                    ]}>
                      {jePlno ? 'OBSAZENO' : (maRezervaci ? 'REZERVOVÁNO' : 'NUTNÁ REZERVACE')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity onPress={() => prepniOblibene(item.id)} style={styles.heartIconBtn}>
                <Ionicons name={oblibeneIds.includes(item.id) ? "heart" : "heart-outline"} size={26} color="black" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const vykresliDetail = () => {
    const item = detailAkce;
    const casParts = item.cas.split(' | ');
    const timeText = casParts.length > 2 ? `${casParts[0]} | ${casParts[1]}` : item.cas;
    const mistoText = casParts.length > 2 ? casParts[2] : null;
    const maRezervaci = mojeRezervace.includes(item.id);
    
    const jePlno = item.kapacita && item.pocetRezervaci >= item.kapacita;

    return (
      <>
        <ScrollView style={isDesktop ? styles.desktopDetailScrollView : styles.content} keyboardShouldPersistTaps="handled" ref={detailScrollViewRef}>
          
          {isDesktop ? (
            <View style={styles.desktopBreadcrumbsContainer}>
              <TouchableOpacity onPress={() => setDetailAkce(null)} activeOpacity={0.6}>
                <Text style={styles.desktopBreadcrumbLink}>PROGRAM</Text>
              </TouchableOpacity>
              <Text style={styles.desktopBreadcrumbText}> &gt; {item.nazev.toUpperCase()}</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.backBtn} onPress={() => setDetailAkce(null)}>
              <Ionicons name="arrow-back" size={20} color={themeColor} />
              <Text style={[styles.backBtnText, { color: themeColor }]}>Zpět</Text>
            </TouchableOpacity>
          )}

          {isDesktop ? (
            <View style={styles.desktopDetailLayout}>
              {/* LEVÝ SLOUPEC (BÍLÁ KARTA) - DESKTOP */}
              <View style={styles.desktopDetailLeftCard}>
                <View style={styles.desktopTimeLocationRow}>
                  <Text style={styles.desktopCardTime}>{timeText}</Text>
                  {mistoText && (
                    <>
                      <Text style={styles.desktopCardTime}> | </Text>
                      <TouchableOpacity onPress={() => handleLocationClick(mistoText)} activeOpacity={0.6}>
                        <Text style={[styles.desktopCardTime, {textDecorationLine: 'underline'}]}>{mistoText}</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
                
                <Text style={styles.desktopDetailMainTitle}>{item.nazev}</Text>
                {item.host !== '' && <Text style={styles.desktopDetailHost}>{item.roleHosta}: {item.host}</Text>}

                <Text style={styles.desktopDetailDescription}>
                  {item.popis ? item.popis : 'Další informace o této akci připravujeme...'}
                </Text>

                <View style={styles.detailTagsWrapper}>
                  <View style={styles.tagsContainer}>
                    {item.tag && item.tag.map((t, index) => (
                      <TouchableOpacity key={index} style={[styles.detailTagPill, { backgroundColor: themeColor, borderColor: themeColor }]} onPress={() => clickTagNaProgram(t)} activeOpacity={0.7}>
                        <Text style={styles.detailTagText}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                    
                    {item.odkaz && (
                      <TouchableOpacity style={[styles.detailTagPillOutline, { borderColor: themeColor }]} onPress={() => Linking.openURL(item.odkaz)} activeOpacity={0.7}>
                        <Text style={[styles.detailTagTextOutline, { color: themeColor }]}>VSTUPENKY</Text>
                      </TouchableOpacity>
                    )}
                    {item.rezervace && (
                      <View style={[
                        styles.detailTagPillOutline, 
                        { borderColor: themeColor }, 
                        maRezervaci && !jePlno && styles.tagPillRezervovano,
                        jePlno && styles.tagPillPlno
                      ]}>
                        <Text style={[
                          styles.detailTagTextOutline, 
                          { color: themeColor }, 
                          maRezervaci && !jePlno && styles.tagTextRezervovano,
                          jePlno && styles.tagTextPlno
                        ]}>
                          {jePlno ? 'OBSAZENO' : (maRezervaci ? 'REZERVOVÁNO' : 'NUTNÁ REZERVACE')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {item.rezervace && (
                  <View style={[styles.formContainer, {marginTop: 20, marginBottom: 0, padding: 0, borderWidth: 0, shadowOpacity: 0, elevation: 0}]}>
                    <Text style={styles.formTitle}>Rezervace</Text>
                    
                    {jePlno ? (
                      <View style={{ backgroundColor: '#F3F4F6', padding: 15, borderRadius: 8 }}>
                         <Text style={{ fontFamily: 'Inter_400Regular', color: '#4B5563', textAlign: 'center' }}>
                           Kapacita této akce již byla naplněna.
                         </Text>
                      </View>
                    ) : rezervaceOdeslana ? (
                      <Text style={styles.successText}>Rezervace byla úspěšně odeslána!</Text>
                    ) : (
                      <>
                        {rezervaceChyba && <Text style={styles.errorText}>{rezervaceChyba}</Text>}
                        <TextInput style={styles.input} placeholder="Celé jméno a příjmení" value={rezervaceJmeno} onChangeText={setRezervaceJmeno} placeholderTextColor="#9CA3AF" />
                        <TextInput style={styles.input} placeholder="E-mail (např. jan.novak@email.cz)" keyboardType="email-address" autoCapitalize="none" value={rezervaceEmail} onChangeText={setRezervaceEmail} placeholderTextColor="#9CA3AF" />
                        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: themeColor }]} onPress={handleOdeslatRezervaci} disabled={odesilaRezervaci}>
                          {odesilaRezervaci ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>Odeslat rezervaci</Text>}
                        </TouchableOpacity>
                      </    >
                    )}
                  </View>
                )}
              </View>

              {/* PRAVÝ SLOUPEC (OBRÁZEK A IKONY) - DESKTOP */}
              <View style={styles.desktopDetailRightColumn}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.desktopDetailImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.desktopDetailImage, {backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center'}]}>
                    <Text style={{color: '#9CA3AF'}}>Obrázek zatím není</Text>
                  </View>
                )}
                
                <View style={styles.desktopDetailBottomActions}>
                  {item.rezervace && (
                    <View style={styles.detailStatItemHorizontal}>
                      <TouchableOpacity style={styles.detailIconBtn} onPress={() => setInfoRezervaceVisible(true)}>
                        <View style={[styles.tagPillRezervovano, styles.detailRezervaceKolecko]}>
                          <Ionicons name="checkmark-sharp" size={15} color={styles.tagTextRezervovano.color} />
                        </View>
                      </TouchableOpacity>
                      {item.pocetRezervaci > 0 && (
                        <Text style={styles.detailStatCountHorizontal}>
                          {item.pocetRezervaci}{item.kapacita ? ` / ${item.kapacita}` : ''}
                        </Text>
                      )}
                    </View>
                  )}

                  <View style={styles.detailStatItemHorizontal}>
                    <TouchableOpacity onPress={() => prepniOblibene(item.id)} style={styles.detailIconBtn}>
                      <Ionicons name={oblibeneIds.includes(item.id) ? "heart" : "heart-outline"} size={26} color="black" />
                    </TouchableOpacity>
                    {item.pocetOblibenych > 0 && (
                      <Text style={styles.detailStatCountHorizontal}>{item.pocetOblibenych}</Text>
                    )}
                  </View>
                </View>
              </View>

            </View>
          ) : (
            /* MOBILNÍ LAYOUT */
            <>
              <View style={styles.detailTitleRow}>
                <Text style={styles.detailMainTitle}>{item.nazev}</Text>
              </View>

              {item.host !== '' && <Text style={styles.detailHost}>{item.roleHosta}: {item.host}</Text>}

              <View style={styles.detailTimeLocationRow}>
                <Text style={styles.cardTime}>{timeText}</Text>
                {mistoText && (
                  <>
                    <Text style={styles.cardTime}> | </Text>
                    <TouchableOpacity onPress={() => handleLocationClick(mistoText)} activeOpacity={0.6}>
                      <Text style={styles.locationLink}>{mistoText}</Text>
                    </TouchableOpacity>
                  </  >
                )}
              </View>

              {item.image && (
                <Image source={{ uri: item.image }} style={styles.wireframeImage} resizeMode="cover" />
              )}

              <Text style={styles.detailDescription}>
                {item.popis ? item.popis : 'Další informace o této akci připravujeme...'}
              </Text>

              <View style={styles.detailTagsWrapper}>
                <View style={styles.tagsContainer}>
                  {item.tag && item.tag.map((t, index) => (
                    <TouchableOpacity key={index} style={[styles.tagPill, { backgroundColor: themeColor, borderColor: themeColor }]} onPress={() => clickTagNaProgram(t)} activeOpacity={0.7}>
                      <Text style={styles.tagText}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                  
                  {item.odkaz && (
                    <TouchableOpacity style={[styles.tagPillOutline, { borderColor: themeColor }]} onPress={() => Linking.openURL(item.odkaz)} activeOpacity={0.7}>
                      <Text style={[styles.tagTextOutline, { color: themeColor }]}>VSTUPENKY</Text>
                    </TouchableOpacity>
                  )}
                  {item.rezervace && (
                    <View style={[
                      styles.tagPillOutline, 
                      { borderColor: themeColor }, 
                      maRezervaci && !jePlno && styles.tagPillRezervovano,
                      jePlno && styles.tagPillPlno
                    ]}>
                      <Text style={[
                        styles.tagTextOutline, 
                        { color: themeColor }, 
                        maRezervaci && !jePlno && styles.tagTextRezervovano,
                        jePlno && styles.tagTextPlno
                      ]}>
                        {jePlno ? 'OBSAZENO' : (maRezervaci ? 'REZERVOVÁNO' : 'NUTNÁ REZERVACE')}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.detailStatsBottomContainer}>
                {item.rezervace && (
                  <View style={[styles.statItem, { marginRight: 15 }]}>
                    <TouchableOpacity 
                      style={styles.detailIconBtn}
                      onPress={() => setInfoRezervaceVisible(true)}
                    >
                      <View style={[styles.tagPillRezervovano, styles.detailRezervaceKolecko]}>
                        <Ionicons name="checkmark-sharp" size={15} color={styles.tagTextRezervovano.color} />
                      </View>
                    </TouchableOpacity>
                    {item.pocetRezervaci > 0 && (
                      <Text style={styles.detailStatCount}>
                        {item.pocetRezervaci}{item.kapacita ? ` / ${item.kapacita}` : ''}
                      </Text>
                    )}
                  </View>
                )}

                <View style={styles.statItem}>
                  <TouchableOpacity onPress={() => prepniOblibene(item.id)} style={styles.detailIconBtn}>
                    <Ionicons name={oblibeneIds.includes(item.id) ? "heart" : "heart-outline"} size={26} color="black" />
                  </TouchableOpacity>
                  {item.pocetOblibenych > 0 && (
                    <Text style={styles.detailStatCount}>{item.pocetOblibenych}</Text>
                  )}
                </View>
              </View>

              {item.rezervace && (
                <View style={styles.formContainer}>
                  <Text style={styles.formTitle}>Rezervace</Text>
                  
                  {jePlno ? (
                    <View style={{ backgroundColor: '#F3F4F6', padding: 15, borderRadius: 8 }}>
                       <Text style={{ fontFamily: 'Inter_400Regular', color: '#4B5563', textAlign: 'center' }}>
                         Kapacita této akce již byla naplněna.
                       </Text>
                    </View>
                  ) : rezervaceOdeslana ? (
                    <Text style={styles.successText}>Rezervace byla úspěšně odeslána!</Text>
                  ) : (
                    <>
                      {rezervaceChyba && (
                        <Text style={styles.errorText}>{rezervaceChyba}</Text>
                      )}
                      
                      <TextInput
                        style={styles.input}
                        placeholder="Celé jméno a příjmení"
                        value={rezervaceJmeno}
                        onChangeText={setRezervaceJmeno}
                        placeholderTextColor="#9CA3AF"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="E-mail (např. jan.novak@email.cz)"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={rezervaceEmail}
                        onChangeText={setRezervaceEmail}
                        placeholderTextColor="#9CA3AF"
                      />
                      <TouchableOpacity style={[styles.submitBtn, { backgroundColor: themeColor }]} onPress={handleOdeslatRezervaci} disabled={odesilaRezervaci}>
                        {odesilaRezervaci ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <Text style={styles.submitBtnText}>Odeslat rezervaci</Text>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        <Modal
          visible={infoRezervaceVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setInfoRezervaceVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setInfoRezervaceVisible(false)} />
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setInfoRezervaceVisible(false)}>
                <Ionicons name="close" size={24} color="#4B5563" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Rezervace</Text>
              <Text style={styles.modalText}>
                {item.kapacita 
                  ? `Zobrazený počet ukazuje aktuální stav ze stávající kapacity ${item.kapacita} míst.` 
                  : `Toto číslo ukazuje počet aktuálních rezervací na tuto akci.`}
              </Text>
            </View>
          </View>
        </Modal>
      </>
    );
  };

  if (!fontsLoaded || loading) return <ActivityIndicator size="large" color={themeColor} style={{flex: 1, justifyContent: 'center', backgroundColor: '#F3F4F6'}} />;
  if (error) return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text style={{color: 'red'}}>{error}</Text></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      <StatusBar style="dark" backgroundColor="#F3F4F6" translucent={false} />
      <SafeAreaView style={[styles.mainContainer, { backgroundColor: '#F3F4F6' }]}>
        
        <View style={isDesktop ? styles.desktopHeader : styles.header}>
          <TouchableOpacity 
            style={isDesktop ? styles.headerLeft : {flexDirection: 'row', alignItems: 'center'}}
            activeOpacity={0.7}
            onPress={() => {
              if (isDesktop) {
                setAktivniTab('Home'); 
                setDetailAkce(null);
              } else {
                setDetailAkce(null);
                setAktivniTab('Další');
                setRozbaleno('O festivalu');
              }
            }}
          >
            <Image 
              source={require('./assets/star.png')} 
              style={[styles.headerLogo, { tintColor: themeColor }]} 
            />
            <Text style={styles.headerText}>{isDesktop ? "DNY ŽIDOVSKÉ KULTURY OLOMOUC" : "DŽKO"}</Text>
          </TouchableOpacity>

          {isDesktop && (
            <View style={styles.desktopHeaderMenu}>
              <TouchableOpacity onPress={() => { setAktivniTab('Program'); setVybranyDen(ziskejVychoziDen()); setVybranyTag(null); setDetailAkce(null); }}>
                <Text style={[styles.desktopMenuText, aktivniTab === 'Program' && !detailAkce && { color: themeColor, fontWeight: 'bold' }]}>PROGRAM</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setDetailAkce(null); setAktivniTab('Home'); }}>
                <Text style={[styles.desktopMenuText, aktivniTab === 'Home' && !detailAkce && { color: themeColor, fontWeight: 'bold' }]}>O FESTIVALU</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://muo.cz/central/dzko-2025/dzko-archiv-2025/')}>
                <Text style={styles.desktopMenuText}>ARCHIV</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setDetailAkce(null); setAktivniTab('Další'); setRozbaleno('Pořadatelé'); }}>
                <Text style={[styles.desktopMenuText, aktivniTab === 'Další' && rozbaleno === 'Pořadatelé' && { color: themeColor, fontWeight: 'bold' }]}>POŘADATELÉ</Text>
              </TouchableOpacity>

              {/* HLAVIČKA - SRDÍČKO */}
              <TouchableOpacity 
                style={styles.desktopHeaderFavBtn} 
                onPress={() => { setDetailAkce(null); setAktivniTab('Oblíbené'); }}
              >
                <Ionicons 
                  name={oblibeneIds.length > 0 || (aktivniTab === 'Oblíbené' && !detailAkce) ? "heart" : "heart-outline"} 
                  size={24} 
                  color={aktivniTab === 'Oblíbené' && !detailAkce ? themeColor : "black"} 
                />
                {oblibeneIds.length > 0 && (
                  <Text style={[styles.desktopHeaderFavCount, aktivniTab === 'Oblíbené' && !detailAkce && { color: themeColor }]}>
                    {oblibeneIds.length}
                  </Text>
                )}
              </TouchableOpacity>

            </View>
          )}
        </View>

        <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
          
          {/* 👇 ÚVODNÍ STRÁNKA POUZE PRO POČÍTAČ 👇 */}
          {aktivniTab === 'Home' && isDesktop && !detailAkce && (
             <ScrollView style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
               
               <View style={styles.homeHeroContainer}>
                 {/* Stylized background to match the blurring and text texture */}
                 <View style={styles.heroBackgroundBlur} />
                 
                 <View style={styles.homeHeroOverlay}>
                   {/* Top Left Text */}
                   <View style={styles.heroTopLeftTextGroup}>
                     <Text style={styles.heroTerminText}>TERIMÍN FESTIVALU: 12.–18. ŘÍJNA 2026</Text>
                     <Text style={styles.heroProgramText}>PROGRAM</Text>
                   </View>

                   {/* Geometric stylized elements */}
                   <View style={styles.heroShapesRow}>
                     <View style={styles.heroShapePlus} />
                     <View style={styles.heroShapePlus} />
                     <View style={styles.heroShapeBlueSquare} />
                     <View style={styles.heroShapePlus} />
                   </View>
                   
                   {/* Centered box O FESTIVALU */}
                   <View style={styles.centeredFestivalBox}>
                     <Text style={styles.centeredFestivalText}>O FESTIVALU</Text>
                   </View>

                   {/* Bottom Grid for shapes */}
                   <View style={styles.heroBottomShapesGrid}>
                     {[1, 2, 3, 4].map((item) => (
                       <View key={item} style={styles.heroBottomShapeCard}>
                         <View style={styles.heroShapePlusSmall} />
                       </View>
                     ))}
                     <View style={[styles.heroBottomShapeCard, { backgroundColor: themeColor }]} />
                   </View>

                   {/* 👇 OUTLINE TLAČÍTKO PROGRAM 👇 */}
                   <TouchableOpacity 
                     style={[styles.homeHeroBtn, { borderColor: themeColor }]} 
                     onPress={() => setAktivniTab('Program')}
                   >
                     <Text style={[styles.homeHeroBtnText, { color: themeColor }]}>PROGRAM</Text>
                   </TouchableOpacity>
                 </View>
               </View>

               <View style={styles.homeContentSection}>
                 <Text style={styles.homeSectionTitle}>O FESTIVALU</Text>
                 <Text style={styles.homeText}>
                   Dny židovské kultury Olomouc se i letos vrací, aby... Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.{'\n\n'}
                   19. ročník festivalu (12.–18. 10. 2026) s podtitulem "Morava – na periferii, nebo v centru?" se zaměří na historickou a kulturní roli Moravy v rámci židovských dějin. Program nabídne přednášky, koncerty, divadlo, film i komentované prohlídky a otevře diskusi o tom, zda byla Morava spíše periferií, nebo svébytným a vlivným centrem.
                 </Text>
               </View>

               {/* 👇 TIPY Z PROGRAMU - NOW A GRID OF FOUR 👇 */}
               {highlightAkce.length > 0 && (
                 <View style={[styles.homeContentSection, { paddingTop: 40, paddingBottom: 20 }]}>
                   <Text style={styles.homeSectionTitle}>TIPY Z PROGRAMU</Text>
                   <View style={styles.desktopGrid}>
                     {highlightAkce.map((item, index) => {
                       // Use specific placeholder data as shown in the design
                       const placeholders = [
                         { time: 'PO 12 | 19:30 | MUO CENTRAL', title: 'S kytarou a vtipem', description: 'Láskyplný i ironický pohled...' },
                         { time: 'ÚT 13 | 18:00 | MOZARTEUM', title: 'Morava v tanci', description: 'Tradiční židovský folklor...' },
                         { time: 'ST 14 | 20:00 | MUO CENTRAL', title: 'Film a periferie', description: 'Projekce a diskuse o...' },
                         { time: 'ČT 15 | 17:00 | MOZARTEUM', title: 'Architektura periferie', description: 'Kompletní přehled...' }
                       ];
                       const placeholder = placeholders[index];
                       const tags = item.tag && item.tag.map(tag => tag.toUpperCase());

                       return (
                         <View key={item.id} style={styles.desktopCardWrapper}>
                           <View style={[styles.card, styles.tipCard]}>
                             <View style={styles.placeholderTipImage} />
                             <View style={styles.cardContent}>
                               <View style={styles.timeLocationRow}>
                                 <Text style={styles.cardTime}>{placeholder.time}</Text>
                               </View>
                               
                               <TouchableOpacity onPress={() => otevriDetail(item)} activeOpacity={0.6}>
                                 <Text style={styles.tipCardTitle}>{placeholder.title}</Text>
                               </TouchableOpacity>
                               
                               <Text style={styles.tipCardDescription}>{placeholder.description}</Text>
                               
                               <View style={styles.cardBottomRow}>
                                 <View style={styles.tagsContainer}>
                                   {tags && tags.map((t, idx) => (
                                     <View key={idx} style={[styles.tipTagPill, { backgroundColor: '#E5E7EB', borderColor: '#E5E7EB' }]}>
                                       <Text style={styles.tipTagText}>{t}</Text>
                                     </View>
                                   ))}
                                   {item.rezervace && (
                                     <View style={[styles.tipTagPill, { backgroundColor: themeColor, borderColor: themeColor }]}>
                                       <Text style={[styles.tipTagText, { color: 'white' }]}>NUTNÁ REZERVACE</Text>
                                     </View>
                                   )}
                                 </View>
                                 <TouchableOpacity onPress={() => prepniOblibene(item.id)} style={styles.heartIconBtn}>
                                   <Ionicons name={oblibeneIds.includes(item.id) ? "heart" : "heart-outline"} size={26} color="black" />
                                 </TouchableOpacity>
                               </View>
                             </View>
                           </View>
                         </View>
                       );
                     })}
                   </View>
                 </View>
               )}
               
               <View style={{ height: 100 }} />
             </ScrollView>
          )}

          {aktivniTab === 'Mapa' && (
            <View style={styles.mapTabContainer}>
              <View style={styles.pageTitleContainer}>
                <Text style={styles.pageTitle}>MAPA FESTIVALU</Text>
              </View>
              {Platform.OS === 'web' ? (
                <iframe srcDoc={generateMapHtml(mapFocus?.lat, mapFocus?.lng, mapFocus?.title, themeColor)} style={styles.webMap} frameBorder={0} allow="geolocation" />
              ) : (
                <Text style={styles.emptyText}>Mapa se načítá v prohlížeči.</Text>
              )}
            </View>
          )}

          {aktivniTab !== 'Mapa' && aktivniTab !== 'Home' && !detailAkce && (
            <ScrollView style={styles.content}>
              {aktivniTab === 'Program' && (
                <>
                  <View style={styles.pageTitleContainer}>
                    <TouchableOpacity onPress={() => { setVybranyDen(ziskejVychoziDen()); setVybranyTag(null); }} activeOpacity={0.7} style={{ flex: 1 }}>
                      <Text style={styles.pageTitle}>{vybranyTag ? `PROGRAM: ${vybranyTag}` : 'PROGRAM'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={prepniObrazky} style={styles.toggleViewBtn}>
                      <Ionicons name={zobrazitObrazky ? "reorder-three-outline" : "grid-outline"} size={24} color="black" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysContainer}>
                    <TouchableOpacity style={[styles.dayPill, vybranyDen === 'VŠE' && !vybranyTag && { backgroundColor: themeColor, borderColor: themeColor }]}
                      onPress={() => { setVybranyDen('VŠE'); setVybranyTag(null); }}>
                      <Text style={[styles.dayText, vybranyDen === 'VŠE' && !vybranyTag && styles.dayTextActive]}>VŠE</Text>
                    </TouchableOpacity>
                    {dny.map((den, index) => {
                      const isActive = (vybranyDen === den && !vybranyTag);
                      return (
                        <TouchableOpacity key={index} style={[styles.dayPill, isActive && { backgroundColor: themeColor, borderColor: themeColor }]}
                          onPress={() => { setVybranyDen(den); setVybranyTag(null); }}>
                          <Text style={[styles.dayText, isActive && styles.dayTextActive]}>{den}</Text>
                        </TouchableOpacity>
                      )
                    })}
                  </ScrollView>
                  
                  <View style={{ paddingBottom: 20 }}>
                    {zobrazenePrednasky.length > 0 ? (
                      dny.map((den, index) => {
                        if (vybranyDen !== 'VŠE' && vybranyDen !== den) return null;

                        const akceDne = zobrazenePrednasky.filter(item => item.den === den);
                        if (akceDne.length === 0) return null;
                        
                        return (
                          <View key={index} style={{ marginBottom: 15 }}>
                            <Text style={styles.favoriteDayHeader}>{den}</Text>
                            <View style={isDesktop ? styles.desktopGrid : undefined}>
                              {akceDne.map(vykresliKartu)}
                            </View>
                          </View>
                        );
                      })
                    ) : (
                      <Text style={styles.emptyText}>Pro tento výběr zatím není program.</Text>
                    )}
                  </View>
                </>
              )}
              
              {aktivniTab === 'Oblíbené' && (
                <View style={{ paddingBottom: 20 }}>
                  <View style={styles.pageTitleContainer}>
                    <Text style={styles.pageTitle}>OBLÍBENÉ</Text>
                  </View>
                  
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysContainer}>
                    <TouchableOpacity style={[styles.dayPill, vybranyDen === 'VŠE' && !vybranyTag && { backgroundColor: themeColor, borderColor: themeColor }]}
                      onPress={() => { setVybranyDen('VŠE'); setVybranyTag(null); }}>
                      <Text style={[styles.dayText, vybranyDen === 'VŠE' && !vybranyTag && styles.dayTextActive]}>VŠE</Text>
                    </TouchableOpacity>
                    {dny.map((den, index) => {
                      const isActive = (vybranyDen === den && !vybranyTag);
                      return (
                        <TouchableOpacity key={index} style={[styles.dayPill, isActive && { backgroundColor: themeColor, borderColor: themeColor }]}
                          onPress={() => { setVybranyDen(den); setVybranyTag(null); }}>
                          <Text style={[styles.dayText, isActive && styles.dayTextActive]}>{den}</Text>
                        </TouchableOpacity>
                      )
                    })}
                  </ScrollView>

                  {oblibeneZobrazeni.length > 0 ? (
                    dny.map((den, index) => {
                      if (vybranyDen !== 'VŠE' && vybranyDen !== den) return null;

                      const akceDne = oblibeneZobrazeni.filter(item => item.den === den);
                      if (akceDne.length === 0) return null;
                      
                      return (
                        <View key={index} style={{ marginBottom: 15 }}>
                          <Text style={styles.favoriteDayHeader}>{den}</Text>
                          <View style={isDesktop ? styles.desktopGrid : undefined}>
                            {akceDne.map(vykresliKartu)}
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <Text style={styles.emptyText}>Sem si můžete uložit oblíbené akce z programu kliknutím na srdíčko.</Text>
                  )}
                  {oblibeneZobrazeni.length > 0 && vybranyDen !== 'VŠE' && oblibeneZobrazeni.filter(item => item.den === vybranyDen).length === 0 && (
                    <Text style={styles.emptyText}>Pro vybraný den nemáte uložené žádné oblíbené akce.</Text>
                  )}
                </View>
              )}
              
              {aktivniTab === 'Další' && (
                <View style={styles.dalsiContainer}>
                  <Text style={styles.dalsiHlavniNadpis}>DNY ŽIDOVSKÉ{'\n'}KULTURY OLOMOUC</Text>
                  
                  <View style={styles.menuList}>
                    {vykresliPolozkuMenu('O festivalu', 'expand', 'Termín festivalu: 12.–18. října 2026\n\n19. ročník festivalu Dny židovské kultury Olomouc (12.–18. 10. 2026) se pod názvem „Morava – na periferii, nebo v centru?“ zaměří na historickou a kulturní roli Moravy v rámci židovských dějin. Program nabídne přednášky, koncerty, divadlo, film i komentované prohlídky a otevře diskusi o tom, zda byla Morava spíše periferií židovského světa, nebo svébytným a vlivným centrem. Pozornost bude věnována zásadním osobnostem pocházejícím z moravských židovských obcí, kulturním transferům, migracím a vztahům mezi centrem a periferií.')}
                    {vykresliPolozkuMenu('Archiv', 'link', 'https://muo.cz/central/dzko-2025/dzko-archiv-2025/')}
                    {vykresliPolozkuMenu('Židovská obec Olomouc', 'link', 'https://kehila-olomouc.cz/rs/')}
                    {vykresliPolozkuMenu('Stolpersteine Olomouc', 'link', 'https://kehila-olomouc.cz/stolpersteine/')}
                    {vykresliPolozkuMenu('Pořadatelé', 'expand', [
                      { label: 'Muzeum umění Olomouc', url: 'https://muo.cz/' },
                      { label: 'Židovská obec Olomouc', url: 'https://kehila-olomouc.cz/rs/' },
                      { label: 'Centrum judaistických studií', url: 'https://judaistika.upol.cz/' }
                    ])}
                    {vykresliPolozkuMenu('Kontakt', 'expand', 'Produkce festivalu\nAlexandr Jeništa\njenista@muo.cz\n+420 770 147 527\n\nPokladna MUO | CENTRAL\n+420 585 514 241\npokladna@muo.cz\nút–ne 10-18 hodin\n\nMuzeum umění Olomouc\nDenisova 47, 771 11 Olomouc\n+420 585 514 111\ninfo@muo.cz')}
                  </View>

                  <View style={styles.socialContainer}>
                    <TouchableOpacity style={styles.socialCircleBtn} onPress={() => Linking.openURL('https://muo.cz/central/dzko-2025/')}>
                      <Image source={require('./assets/muo-icon.png')} style={styles.customSocialIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialCircleBtn} onPress={() => Linking.openURL('https://www.facebook.com/profile.php?id=61567469939592')}>
                      <Image source={require('./assets/facebook-icon.png')} style={styles.customSocialIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialCircleBtn} onPress={() => Linking.openURL('https://www.instagram.com/judaistika_upol/')}>
                      <Ionicons name="logo-instagram" size={20} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialCircleBtn} onPress={() => {
                        if (!zobrazitNastaveniBarvy) setNovaBarvaInput(themeColor);
                        setZobrazitNastaveniBarvy(!zobrazitNastaveniBarvy);
                    }}>
                    </TouchableOpacity>
                  </View>

                  {zobrazitNastaveniBarvy && (
                    <View style={styles.colorPickerContainer}>
                      <Text style={styles.colorPickerTitle}>Nastavení motivu</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Zadejte HEX kód (např. #666666)"
                        value={novaBarvaInput}
                        onChangeText={setNovaBarvaInput}
                        placeholderTextColor="#9CA3AF"
                      />
                      <TouchableOpacity style={[styles.submitBtn, { backgroundColor: themeColor }]} onPress={ulozNovyMotiv}>
                        <Text style={styles.submitBtnText}>Uložit barvu</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                </View>
              )}
            </ScrollView>
          )}

          {detailAkce && vykresliDetail()}

          {!isDesktop && (
            <View style={styles.bottomNav}>
              <TouchableOpacity style={styles.navItem} onPress={() => { setAktivniTab('Program'); setVybranyDen(ziskejVychoziDen()); setVybranyTag(null); setDetailAkce(null); }}>
                <Ionicons name={aktivniTab === 'Program' && !detailAkce ? "calendar" : "calendar-outline"} size={24} color={aktivniTab === 'Program' && !detailAkce ? themeColor : 'black'} />
                <Text style={[styles.navText, { color: aktivniTab === 'Program' && !detailAkce ? themeColor : 'black' }]}>Program</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.navItem} onPress={() => { setAktivniTab('Oblíbené'); setDetailAkce(null); }}>
                <Ionicons name={aktivniTab === 'Oblíbené' && !detailAkce ? "heart" : "heart-outline"} size={24} color={aktivniTab === 'Oblíbené' && !detailAkce ? themeColor : 'black'} />
                <Text style={[styles.navText, { color: aktivniTab === 'Oblíbené' && !detailAkce ? themeColor : 'black' }]}>Oblíbené</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.navItem} onPress={() => { setAktivniTab('Mapa'); setMapFocus(null); setDetailAkce(null); }}>
                <Ionicons name={aktivniTab === 'Mapa' ? "map" : "map-outline"} size={24} color={aktivniTab === 'Mapa' ? themeColor : 'black'} />
                <Text style={[styles.navText, { color: aktivniTab === 'Mapa' ? themeColor : 'black' }]}>Mapa</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.navItem} onPress={() => { setAktivniTab('Další'); setDetailAkce(null); }}>
                <Ionicons name={aktivniTab === 'Další' ? "grid" : "grid-outline"} size={24} color={aktivniTab === 'Další' ? themeColor : 'black'} />
                <Text style={[styles.navText, { color: aktivniTab === 'Další' ? themeColor : 'black' }]}>Další</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
 homeHeroContainer: {
    width: '100%',
    aspectRatio: 2/1, // Large hero ratio
    position: 'relative',
    backgroundColor: 'black', // fallback
  },
  heroBackgroundBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000CC', // Dark mask
  },
  homeHeroImage: {
    width: '100%',
    height: '100%',
  },
  homeHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTopLeftTextGroup: {
    position: 'absolute',
    top: 30,
    left: 40,
  },
  heroTerminText: {
    fontFamily: 'Inter_400Regular',
    color: 'white',
    fontSize: 14,
    marginBottom: 5,
  },
  heroProgramText: {
    fontFamily: 'Inter_400Regular',
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  heroShapesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 150,
    marginTop: -80,
  },
  heroShapePlus: {
    width: 60,
    height: 60,
    borderWidth: 8,
    borderColor: 'white',
    transform: [{ rotate: '45deg' }],
  },
  heroShapeBlueSquare: {
    width: 80,
    height: 80,
    backgroundColor: DEFAULT_THEME_COLOR,
    transform: [{ rotate: '15deg' }],
  },
  centeredFestivalBox: {
    backgroundColor: 'white',
    paddingVertical: 30,
    paddingHorizontal: 80,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 40,
  },
  centeredFestivalText: {
    fontFamily: 'Inter_400Regular',
    color: 'black',
    fontSize: 36,
    fontWeight: 'bold',
  },
  heroBottomShapesGrid: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 200,
    justifyContent: 'space-around',
    marginBottom: 50,
  },
  heroBottomShapeCard: {
    width: 80,
    height: 80,
    backgroundColor: 'white',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroShapePlusSmall: {
    width: 30,
    height: 30,
    borderWidth: 4,
    borderColor: 'black',
    transform: [{ rotate: '45deg' }],
  },
  homeHeroBtn: {
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 30,
    borderWidth: 2, 
    backgroundColor: 'transparent', 
  },
  homeHeroBtnText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  homeContentSection: {
    maxWidth: 900,
    alignSelf: 'center',
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  homeSectionTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },
  homeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    color: '#4B5563',
    lineHeight: 28,
  },
  tipCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowOpacity: 0.05,
    borderRadius: 8,
  },
  tipCardTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#111827',
  },
  tipCardDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 15,
  },
  tipTagPill: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 18,
    marginRight: 6,
    marginTop: 6,
    borderWidth: 0,
  },
  tipTagText: {
    fontFamily: 'Inter_400Regular',
    color: '#374151',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  placeholderTipImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#374151',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },

  desktopCardImage: {
    width: '100%',
    aspectRatio: 1.5, 
    borderTopLeftRadius: 10, 
    borderTopRightRadius: 10, 
    backgroundColor: '#E5E7EB'
  },

  detailTagPill: {
    alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 18, marginRight: 8, marginTop: 8, borderWidth: 1
  },
  detailTagText: {
    fontFamily: 'Inter_400Regular', color: 'white', fontSize: 13, fontWeight: '600'
  },
  detailTagPillOutline: {
    backgroundColor: 'transparent', alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 18, marginRight: 8, marginTop: 8, borderWidth: 1
  },
  detailTagTextOutline: {
    fontFamily: 'Inter_400Regular', fontSize: 13, fontWeight: '600'
  },

  desktopDetailScrollView: {
    flex: 1, 
    paddingHorizontal: 30,
  },
  desktopBreadcrumbsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  desktopBreadcrumbLink: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6B7280', 
  },
  desktopBreadcrumbText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#000000',
  },
  desktopDetailLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  },
  desktopDetailLeftCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    marginRight: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 6, 
    elevation: 2
  },
  desktopTimeLocationRow: {
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10,
  },
  desktopCardTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#4B5563',
  },
  desktopDetailMainTitle: {
    fontFamily: 'Inter_400Regular', 
    fontSize: 32, 
    color: '#000000', 
    fontWeight: 'bold',
    marginBottom: 10,
    lineHeight: 38,
  },
  desktopDetailHost: {
    fontFamily: 'Inter_400Regular', 
    fontSize: 16, 
    color: '#000000', 
    marginBottom: 25,
  },
  desktopDetailDescription: {
    fontFamily: 'Inter_400Regular', 
    fontSize: 18, 
    color: '#000000', 
    lineHeight: 28, 
    marginBottom: 30,
  },
  desktopDetailRightColumn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-end', 
  },
  desktopDetailImage: {
    width: '100%',
    aspectRatio: 1.5, 
    borderRadius: 16,
    marginBottom: 15,
  },
  desktopDetailBottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  detailStatItemHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
  },
  detailStatCountHorizontal: {
    fontFamily: 'Inter_400Regular', 
    fontSize: 16,
    color: '#4B5563', 
    marginLeft: 8,
  },

  desktopHeaderFavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
  },
  desktopHeaderFavCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    color: '#000000',
    marginLeft: 6, 
  },

  desktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8, 
  },
  desktopCardWrapper: {
    width: '25%', 
    paddingHorizontal: 8,
  },
  mobileCardWrapper: {
    width: '100%',
  },

  desktopHeader: { 
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 30, 
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  desktopHeaderMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 25,
  },
  desktopMenuText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#000000',
    letterSpacing: 0.5,
  },

  mainContainer: { flex: 1 }, 
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  
  header: { 
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 20, 
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLogo: { width: 36, height: 36, marginRight: 10, resizeMode: 'contain' },
  headerText: { fontFamily: 'Inter_400Regular', color: '#000000', fontSize: 22, includeFontPadding: false },
  
  content: { flex: 1, paddingHorizontal: 15 },
  mapTabContainer: { flex: 1, paddingHorizontal: 15 },

  pageTitleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 15 },
  pageTitle: { fontFamily: 'Inter_400Regular', fontSize: 28 },

  toggleViewBtn: {
    width: 44,
    height: 44,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  favoriteDayHeader: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#4B5563', marginBottom: 10, borderBottomWidth: 1, borderColor: '#D1D5DB', paddingBottom: 5 }, 
  
  webMap: { flex: 1, width: '100%', borderRadius: 15, marginBottom: 15, borderWidth: 0, minHeight: 350 },
  daysContainer: { flexDirection: 'row', marginBottom: 20 },
  dayPill: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: '#D1D5DB', marginRight: 6, backgroundColor: 'transparent' },
  dayText: { fontFamily: 'Inter_400Regular', color: '#374151', fontSize: 13 },
  dayTextActive: { fontFamily: 'Inter_400Regular', color: 'white' },
  
  card: { backgroundColor: '#F3F4F6', borderRadius: 10, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  cardContent: { padding: 15 },
  cardImage: { width: '100%', height: 160, borderTopLeftRadius: 10, borderTopRightRadius: 10, backgroundColor: '#E5E7EB' },
  
  timeLocationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, flexWrap: 'wrap' },
  cardTime: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#4B5563' },
  locationLink: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#4B5563' },
  cardTitle: { fontFamily: 'Inter_400Regular', fontSize: 16, marginBottom: 10, color: '#111827' },
  cardHost: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#374151', marginBottom: 10 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', flex: 1, paddingRight: 10 },
  
  tagPill: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 9, borderRadius: 15, marginRight: 6, marginTop: 6, borderWidth: 1 },
  tagText: { fontFamily: 'Inter_400Regular', color: 'white', fontSize: 11, fontWeight: '600' },
  
  tagPillOutline: { backgroundColor: 'transparent', alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 9, borderRadius: 15, marginRight: 6, marginTop: 6, borderWidth: 1 },
  tagTextOutline: { fontFamily: 'Inter_400Regular', fontSize: 11, fontWeight: '600' },
  
  tagPillRezervovano: { backgroundColor: '#1ad67c', borderColor: '#1ad67c' },
  tagTextRezervovano: { color: '#000' },
  tagPillPlno: { backgroundColor: '#D1D5DB', borderColor: '#D1D5DB' },
  tagTextPlno: { color: '#4B5563' },

  heartIconBtn: { paddingBottom: 0, paddingLeft: 10, marginBottom: -4 },
  emptyText: { fontFamily: 'Inter_400Regular', color: '#6B7280', textAlign: 'center', marginTop: 30, lineHeight: 22 },
  
  backBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 15, alignSelf: 'flex-start' },
  backBtnText: { fontFamily: 'Inter_400Regular', fontSize: 16, marginLeft: 5 },
  
  detailTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  detailMainTitle: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 26, color: '#111827', lineHeight: 32 },
  
  detailHost: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#374151', marginBottom: 15, marginTop: -5 },
  
  detailTimeLocationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' },
  wireframeImage: { width: '100%', height: 200, backgroundColor: '#E5E7EB', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  wireframeText: { fontFamily: 'Inter_400Regular', color: '#9CA3AF', marginTop: 10 },
  detailDescription: { fontFamily: 'Inter_400Regular', fontSize: 16, color: '#374151', lineHeight: 24, marginBottom: 15 },
  
  detailTagsWrapper: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 25 },
  
  detailStatsBottomContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  
  statItem: { 
    alignItems: 'center',
    minWidth: 44,
  },
  detailIconBtn: { 
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailStatCount: { 
    fontFamily: 'Inter_400Regular', 
    fontSize: 15,
    color: '#4B5563', 
  },
  
  detailRezervaceKolecko: { 
    width: 22,
    height: 22, 
    borderRadius: 11, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0
  },
  
  formContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 10, marginBottom: 30, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  formTitle: { fontFamily: 'Inter_400Regular', fontSize: 18, marginBottom: 15, color: '#111827', fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 12, fontFamily: 'Inter_400Regular', fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB' },
  submitBtn: { padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  submitBtnText: { color: 'white', fontFamily: 'Inter_400Regular', fontSize: 14, fontWeight: 'bold' },
  successText: { color: '#10B981', fontFamily: 'Inter_400Regular', fontSize: 15, textAlign: 'center', marginVertical: 10, fontWeight: 'bold' },
  errorText: { color: '#EF4444', fontFamily: 'Inter_400Regular', fontSize: 13, marginBottom: 12, lineHeight: 18 }, 

  dalsiContainer: { paddingTop: 20, paddingBottom: 40 },
  dalsiHlavniNadpis: { fontFamily: 'Inter_400Regular', fontSize: 26, color: '#000', marginBottom: 30, lineHeight: 34 },
  menuList: { marginBottom: 30 },
  menuItemWrapper: { marginBottom: 15 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  menuItemText: { fontFamily: 'Inter_400Regular', fontSize: 20, color: '#000' },
  menuExpandedContent: { marginTop: 10, paddingLeft: 10, borderLeftWidth: 2 },
  menuExpandedText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#4B5563', lineHeight: 22 },
  contentLinkRow: { paddingVertical: 6, paddingLeft: 5 },
  contentInlineLink: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#4B5563' },
  
  socialContainer: { flexDirection: 'row', gap: 15, marginTop: 10 },
  socialCircleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  customSocialIcon: { width: 36, height: 36, borderRadius: 18, resizeMode: 'cover' },
  
  colorPickerContainer: { marginTop: 25, padding: 15, backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#D1D5DB' },
  colorPickerTitle: { fontFamily: 'Inter_400Regular', fontSize: 16, marginBottom: 10, color: '#111827', fontWeight: 'bold' },

  bottomNav: { flexDirection: 'row', justifyContent: 'space-evenly', backgroundColor: 'white', borderTopWidth: 1, borderColor: '#E5E7EB', height: Platform.OS === 'web' ? 60 : 'auto', alignItems: Platform.OS === 'web' ? 'center' : 'stretch', paddingTop: Platform.OS === 'web' ? 0 : 10, paddingBottom: Platform.OS === 'web' ? 0 : (Platform.OS === 'android' ? 50 : 40) },
  navItem: { flex: 1, alignItems: 'center', justifyContent: Platform.OS === 'web' ? 'center' : 'flex-start' },
  navText: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: Platform.OS === 'web' ? 2 : 4 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 25,
    width: '85%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
    zIndex: 10
  },
  modalTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#111827',
    textAlign: 'center'
  },
  modalText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22
  }
});

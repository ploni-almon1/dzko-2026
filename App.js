import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Platform, Linking, Image, TextInput, Alert, Modal, useWindowDimensions, Share, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Inter_400Regular } from '@expo-google-fonts/inter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

// 👇 ZDE JE TVOJE CENTRÁLNÍ BARVA PRO CELOU APLIKACI 👇
const DEFAULT_THEME_COLOR = '#3A24DC'; 

// --- GENERÁTOR MAPY ---
const generateMapHtml = (focusLat, focusLng, focusTitle, themeColor, showExpandButton = false, isExpanded = false) => `
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
        html, body, #map { height: 100%; width: 100%; background-color: #F3F4F6; }
        
        .leaflet-tile-pane {
            -webkit-filter: grayscale(95%) brightness(1.1) contrast(0.9);
            filter: grayscale(95%) brightness(1.1) contrast(0.9);
        }
        
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
        var map = L.map('map');

        var apiKey = 'gRioCnF44GOOJJaSU3aLnzGM48hcumaNIilX_748pbM';
        L.tileLayer('https://api.mapy.cz/v1/maptiles/basic/256/{z}/{x}/{y}?apikey=' + apiKey, {
            minZoom: 10, maxZoom: 19,
            attribution: '&copy; <a href="https://www.seznam.cz" target="_blank">Seznam.cz, a.s.</a>'
        }).addTo(map);

        var vsechnyPiny = [];

        function pridejMisto(lat, lng, nazev, iconName) {
            var currentIcon = iconName || 'fa-building';
            var dzkoIcon = L.divIcon({
                className: 'dzko-pin-wrapper',
                html: '<div class="dzko-pin"><i class="fa-solid ' + currentIcon + '"></i></div>',
                iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -36]
            });

            var marker = L.marker([lat, lng], {icon: dzkoIcon}).addTo(map).bindPopup(nazev);
            vsechnyPiny.push(marker);

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

        var focusLat = ${focusLat || 'null'};
        var focusLng = ${focusLng || 'null'};

        if (focusLat && focusLng) {
            map.setView([focusLat, focusLng], 17);
        } else {
            var skupinaPinu = new L.featureGroup(vsechnyPiny);
            map.fitBounds(skupinaPinu.getBounds(), { padding: [40, 40] }); 
        }

        map.locate({setView: false, maxZoom: 16, watch: true, enableHighAccuracy: true});

        var userMarker = null;

        function onLocationFound(e) {
            if (!userMarker) {
                var userIcon = L.divIcon({
                    className: 'dzko-user-pin',
                    html: '<div style="background-color: ${themeColor || DEFAULT_THEME_COLOR}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>',
                    iconSize: [22, 22],
                    iconAnchor: [11, 11]
                });
                userMarker = L.marker(e.latlng, {icon: userIcon, zIndexOffset: 1000}).addTo(map).bindPopup("Vaše aktuální poloha");
            } else {
                userMarker.setLatLng(e.latlng);
            }
        }

        map.on('locationfound', onLocationFound);

        var userClickedLocate = false; 

        map.on('locationerror', function(e) {
            if (userClickedLocate) {
                alert("Nepodařilo se zjistit polohu.\\n\\nDůvod: " + e.message + "\\n\\n1) Zkontrolujte povolení polohy v prohlížeči.\\n2) Pokud testujete na mobilu přes vývojářskou URL, prohlížeč to blokuje kvůli absenci HTTPS šifrování.");
                userClickedLocate = false;
            }
        });

        var customControls = L.control({position: 'topleft'});
        customControls.onAdd = function () {
            var div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');

            if (${showExpandButton}) {
                var expandBtn = L.DomUtil.create('a', '', div);
                expandBtn.href = '#';
                expandBtn.title = ${isExpanded ? "'Zmenšit mapu'" : "'Zvětšit mapu'"};
                expandBtn.style.display = 'flex';
                expandBtn.style.alignItems = 'center';
                expandBtn.style.justifyContent = 'center';
                expandBtn.style.color = 'black';
                expandBtn.innerHTML = '<i class="fa-solid ${isExpanded ? "fa-compress" : "fa-expand"}" style="font-size: 16px;"></i>';
                expandBtn.onclick = function(e){
                    e.preventDefault(); 
                    window.parent.postMessage(${isExpanded ? "'CONTRACT_MAP'" : "'EXPAND_MAP'"}, '*'); 
                };
            }

            var locateBtn = L.DomUtil.create('a', '', div);
            locateBtn.href = '#';
            locateBtn.title = 'Ukaž moji polohu';
            locateBtn.style.display = 'flex';
            locateBtn.style.alignItems = 'center';
            locateBtn.style.justifyContent = 'center';
            locateBtn.style.color = 'black';
            locateBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs" style="font-size: 16px;"></i>';
            locateBtn.onclick = function(e){
                e.preventDefault();
                userClickedLocate = true; 
                map.locate({setView: true, maxZoom: 16, enableHighAccuracy: true});
            };

            return div;
        };
        customControls.addTo(map);

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

// 👇 BEZPEČNÉ FUNKCE PRO NAČÍTÁNÍ Z DATABÁZE 👇
const safeString = (val) => {
  if (val == null) return '';
  if (Array.isArray(val)) return String(val[0] || '').trim();
  return String(val).trim();
};

const safeImage = (val) => {
  if (Array.isArray(val) && val.length > 0 && val[0].url) {
    return val[0].url;
  }
  return null;
};

export default function App() {
  const CustomLoader = ({ themeColor }) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000, // Za jak dlouho se otočí o 360 stupňů (2 sekundy)
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web', 
      })
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }}>
      <Animated.Image
        source={require('./assets/star.png')}
        style={{
          width: 50,
          height: 50,
          tintColor: themeColor,
          transform: [{ rotate: spin }]
        }}
        resizeMode="contain"
      />
    </View>
  );
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
  const [vybranyTag, setVybranyTag] = useState(null);

  // 👇 NOVÉ STAVY PRO POKROČILÝ FILTR 👇
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterSubModalVisible, setFilterSubModalVisible] = useState(null);
  const vychoziFiltry = { den: [], typ: [], misto: [], hoste: [] };
  const [activeFilters, setActiveFilters] = useState(vychoziFiltry);
  const [tempFilters, setTempFilters] = useState(vychoziFiltry);
  
  const [oblibeneIds, setOblibeneIds] = useState([]);
  const [sdilenyVyberIds, setSdilenyVyberIds] = useState(null); 
  
  const [mojeRezervace, setMojeRezervace] = useState([]);
  const [mapFocus, setMapFocus] = useState(null);
  const [rozbaleno, setRozbaleno] = useState(null);
  
  const [detailAkce, setDetailAkce] = useState(null);
  const [historieAkce, setHistorieAkce] = useState(null); 
  const [mapaModalVisible, setMapaModalVisible] = useState(false); 
  
  const [homeMapaZvetsena, setHomeMapaZvetsena] = useState(false);
  const [zobrazitObrazky, setZobrazitObrazky] = useState(true);

  const [themeColor, setThemeColor] = useState(DEFAULT_THEME_COLOR);
  const [zobrazitNastaveniBarvy, setZobrazitNastaveniBarvy] = useState(false);
  const [novaBarvaInput, setNovaBarvaInput] = useState('');

  const [prednaskyVsechny, setPrednaskyVsechny] = useState([]);
  const [hosteVsechny, setHosteVsechny] = useState([]); 
  const [partneri, setPartneri] = useState([]);
  const [hoveredPartnerId, setHoveredPartnerId] = useState(null);

  const [heroImage, setHeroImage] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [rezervaceJmeno, setRezervaceJmeno] = useState('');
  const [rezervaceEmail, setRezervaceEmail] = useState('');
  const [odesilaRezervaci, setOdesilaRezervaci] = useState(false);
  const [rezervaceOdeslana, setRezervaceOdeslana] = useState(false);
  const [rezervaceChyba, setRezervaceChyba] = useState(null); 
  
  const [chciDalsiRezervaci, setChciDalsiRezervaci] = useState(false);
  const [speakerModalVisible, setSpeakerModalVisible] = useState(false);

  const [aktivniSelectedSpeaker, setAktivniSelectedSpeaker] = useState(null);

  const [programDropdownVisible, setProgramDropdownVisible] = useState(false);
  const [hoveredMenuItem, setHoveredMenuItem] = useState(null);

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

      const handleMapMessage = (event) => {
        if (event.data === 'EXPAND_MAP') setHomeMapaZvetsena(true);
        if (event.data === 'CONTRACT_MAP') setHomeMapaZvetsena(false);
      };
      window.addEventListener('message', handleMapMessage);
      return () => window.removeEventListener('message', handleMapMessage);
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

    fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent('Partneři')}?view=Grid%20view`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data && data.records) {
          const upraveniPartneri = data.records.map(record => {
            const f = record.fields;
            return {
              id: record.id,
              nazev: safeString(f['Název']),
              odkaz: safeString(f['Odkaz']),
              kategorie: safeString(f['Kategorie']),
              logo: safeImage(f['Logo'])
            };
          });
          setPartneri(upraveniPartneri);
        }
      })
      .catch((err) => console.log('Chyba při načítání partnerů:', err));

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

            const hosteList = [];
            
            const host1 = safeString(f['Host']);
            if (host1 !== '') {
              hosteList.push({
                jmeno: host1,
                role: safeString(f['Role hosta']) || 'Přednášející',
                fotka: safeImage(f['Fotka hosta']),
                popis: safeString(f['Popis hosta']),
                profese: safeString(f['Profese hosta'])
              });
            }
            
            const host2 = safeString(f['Host 2']);
            if (host2 !== '') {
              hosteList.push({
                jmeno: host2,
                role: safeString(f['Role hosta 2']) || 'Přednášející',
                fotka: safeImage(f['Fotka hosta 2']),
                popis: safeString(f['Popis hosta 2']),
                profese: safeString(f['Profese hosta 2'])
              });
            }

            const host3 = safeString(f['Host 3']);
            if (host3 !== '') {
              hosteList.push({
                jmeno: host3,
                role: safeString(f['Role hosta 3']) || 'Přednášející',
                fotka: safeImage(f['Fotka hosta 3']),
                popis: safeString(f['Popis hosta 3']),
                profese: safeString(f['Profese hosta 3'])
              });
            }

            return {
              id: record.id,
              den: denText,
              cas: slozenyCas,
              nazev: f['Název akce'],
              hoste: hosteList,
              host: hosteList.map(h => h.jmeno).join(', '),
              roleHosta: hosteList.length > 1 ? 'Hosté' : (hosteList.length === 1 ? hosteList[0].role : 'Přednášející'),
              tag: f['Tagy'] || [],
              popis: f['Anotace'] || '',
              image: safeImage(f['Obrázek']),
              odkaz: f['Vstupenky'] || null, 
              rezervace: !!f['Rezervace'],
              pocetOblibenych: f['Počet oblíbených'] || 0,
              pocetRezervaci: f['Počet rezervací'] || 0,
              kapacita: f['Kapacita'] || null,
              highlight: !!f['Highlight'] 
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

        const unikatniHosteMap = new Map();
        for (const item of upravenaData) {
          for (const h of item.hoste) {
            if (h.jmeno && h.jmeno.trim() !== '') {
              if (!unikatniHosteMap.has(h.jmeno)) {
                unikatniHosteMap.set(h.jmeno, h);
              }
            }
          }
        }
        const unikatniHosteList = Array.from(unikatniHosteMap.values());
        unikatniHosteList.sort((a, b) => a.jmeno.localeCompare(b.jmeno));
        setHosteVsechny(unikatniHosteList);

        if (Platform.OS === 'web') {
          const urlParams = new URLSearchParams(window.location.search);
          
          const sdileneId = urlParams.get('akce');
          if (sdileneId) {
            const nalezenaAkce = upravenaData.find(a => a.id === sdileneId);
            if (nalezenaAkce) {
              setDetailAkce(nalezenaAkce);
              setAktivniTab('Program');
            }
          }
          
          const sdileneOblibene = urlParams.get('oblibene');
          if (sdileneOblibene) {
            const sdileneIds = sdileneOblibene.split(',');
            const platneSdileneIds = sdileneIds.filter(id => upravenaData.some(a => a.id === id));
            
            if (platneSdileneIds.length > 0) {
              setSdilenyVyberIds(platneSdileneIds); 
              setAktivniTab('Oblíbené');
              setVybranyDen('VŠE');
              setVybranyTag(null);
              setActiveFilters(vychoziFiltry);
            }
          }
        }

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

  // 👇 LOGIKA PRO EXTRAKCI DAT DO FILTRŮ 👇
  const dostupneTypy = [...new Set(prednaskyVsechny.flatMap(p => p.tag || []))].sort();
  const dostupnaMista = [...new Set(prednaskyVsechny.map(p => {
    const parts = p.cas.split(' | ');
    return parts.length > 2 ? parts[2] : null;
  }).filter(Boolean))].sort();
  const dostupniHoste = hosteVsechny.map(h => h.jmeno).sort();

  const filterOptions = {
    den: dny,
    typ: dostupneTypy,
    misto: dostupnaMista,
    hoste: dostupniHoste
  };

  const filterLabels = {
    den: 'Den',
    typ: 'Typ',
    misto: 'Místo',
    hoste: 'Hosté'
  };

  const hasActiveFilters = activeFilters.den.length > 0 || activeFilters.typ.length > 0 || activeFilters.misto.length > 0 || activeFilters.hoste.length > 0;

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

  // 👇 AKTUALIZOVANÁ LOGIKA PRO FILTROVÁNÍ 👇
  const zobrazenePrednasky = prednaskyVsechny.filter(item => {
    if (hasActiveFilters) {
      const mistoMatch = item.cas.split(' | ')[2];
      const hosteMatch = item.hoste.map(h => h.jmeno);

      const passDen = activeFilters.den.length === 0 || activeFilters.den.includes(item.den);
      const passTyp = activeFilters.typ.length === 0 || activeFilters.typ.some(t => item.tag?.includes(t));
      const passMisto = activeFilters.misto.length === 0 || activeFilters.misto.includes(mistoMatch);
      const passHoste = activeFilters.hoste.length === 0 || activeFilters.hoste.some(h => hosteMatch.includes(h));

      return passDen && passTyp && passMisto && passHoste;
    } else {
      if (vybranyTag) return item.tag && item.tag.includes(vybranyTag);
      return vybranyDen === 'VŠE' ? true : item.den === vybranyDen;
    }
  });

  const aktivniOblibeneIds = sdilenyVyberIds ? sdilenyVyberIds : oblibeneIds;
  const oblibeneZobrazeni = prednaskyVsechny.filter(item => aktivniOblibeneIds.includes(item.id));
  
  const highlightAkce = prednaskyVsechny.filter(item => item.highlight).slice(0, 4);

  const handleLocationClick = (mistoText) => {
    const coords = mapaLokace[mistoText];
    if (coords) {
      setMapFocus(coords); 
      if (isDesktop) {
        setMapaModalVisible(true); 
      } else {
        if (detailAkce) setHistorieAkce(detailAkce); 
        setDetailAkce(null);
        setAktivniTab('Mapa');
      }
    }
  };

  const handleMenuPress = (nazev, type, content) => {
    if (type === 'action') {
      content(); 
    } else if (type === 'link') {
      Linking.openURL(content);
    } else {
      setRozbaleno(rozbaleno === nazev ? null : nazev);
    }
  };

  const otevriDetail = (item, scrollNaRezervaci = false) => {
    setDetailAkce(item);
    setRezervaceJmeno('');
    setRezervaceEmail('');
    setOdesilaRezervaci(false);
    setRezervaceOdeslana(false);
    setRezervaceChyba(null);
    setChciDalsiRezervaci(false); 
    setSpeakerModalVisible(false);

    if (scrollNaRezervaci && !isDesktop) {
      setTimeout(() => {
        detailScrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  };

  const clickTagNaProgram = (tag) => {
    setVybranyTag(tag);
    setVybranyDen('VŠE');
    setActiveFilters(vychoziFiltry);
    setAktivniTab('Program');
    setDetailAkce(null);
  };

  const sdiletAkci = async (item) => {
    try {
      if (Platform.OS === 'web') {
        const shareUrl = window.location.origin + window.location.pathname + '?akce=' + item.id;
        if (navigator.share) {
          await navigator.share({
            title: 'Dny židovské kultury Olomouc',
            text: `Podívej se na tuto akci: ${item.nazev}`,
            url: shareUrl,
          });
        } else {
          await navigator.clipboard.writeText(shareUrl);
          window.alert('Zkopírováno!\n\nOdkaz na tuto akci byl zkopírován do schránky. Můžeš ho poslat kamarádovi (vložit zkratkou Ctrl+V nebo Cmd+V).');
        }
      } else {
        const shareUrl = 'https://muo.cz/central/dzko-2025/?akce=' + item.id;
        await Share.share({
          message: `Dny židovské kultury Olomouc - Podívej se na akci: ${item.nazev}\n${shareUrl}`,
        });
      }
    } catch (error) {
      console.log('Sdílení zrušeno.');
    }
  };

  const sdiletOblibene = async () => {
    if (oblibeneIds.length === 0) {
      window.alert('Nemáš v oblíbených žádné akce, které bys mohl sdílet.');
      return;
    }
    try {
      const idsString = oblibeneIds.join(',');
      if (Platform.OS === 'web') {
        const shareUrl = window.location.origin + window.location.pathname + '?oblibene=' + idsString;
        if (navigator.share) {
          await navigator.share({
            title: 'Můj festivalový výběr - DŽKO',
            text: 'Podívej se na akce, které jsem si vybral z festivalu Dny židovské kultury Olomouc a pojď se mnou!',
            url: shareUrl,
          });
        } else {
          await navigator.clipboard.writeText(shareUrl);
          window.alert('Zkopírováno!\n\nOdkaz na tvůj kompletní výběr oblíbených akcí byl zkopírován. Můžeš ho poslat kamarádovi (Ctrl+V / Cmd+V).');
        }
      } else {
        const shareUrl = 'https://muo.cz/central/dzko-2025/?oblibene=' + idsString;
        await Share.share({
          message: `Podívej se na akce, které jsem si vybral z festivalu Dny židovské kultury Olomouc a pojď se mnou!\n${shareUrl}`,
        });
      }
    } catch (error) {
      console.log('Sdílení výběru zrušeno.');
    }
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
      setChciDalsiRezervaci(false); 
      
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

  const prejitNaAkciHost = (akce) => {
    setSpeakerModalVisible(false);
    setAktivniTab('Program');
    otevriDetail(akce);
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

  const vykresliKartu = (item, forceGrid) => {
    const casParts = item.cas.split(' | ');
    const timeText = casParts.length > 2 ? `${casParts[0]} | ${casParts[1]}` : item.cas;
    const mistoText = casParts.length > 2 ? casParts[2] : null;
    const maRezervaci = mojeRezervace.includes(item.id);
    
    const jePlno = item.kapacita && item.pocetRezervaci >= item.kapacita;
    const isGrid = (forceGrid === true) ? true : zobrazitObrazky; 

    const wrapperStyle = isGrid
      ? (isDesktop ? styles.desktopCardWrapper : styles.mobileCardWrapper)
      : { width: '100%', paddingHorizontal: isDesktop ? 8 : 0, marginBottom: 15 };

    return (
      <View key={item.id} style={wrapperStyle}>
        <TouchableOpacity 
          style={[
            styles.card, 
            !isGrid && isDesktop && { flexDirection: 'row', height: 270 }
          ]} 
          onPress={() => otevriDetail(item)} 
          activeOpacity={0.7}
        >
          {item.image ? (
            <Image 
              source={{ uri: item.image }} 
              style={
                isGrid 
                  ? (isDesktop ? styles.desktopCardImage : styles.cardImage) 
                  : (isDesktop ? styles.listCardImageDesktop : styles.cardImage)
              } 
              resizeMode="cover" 
            />
          ) : (
            <View style={[
              isGrid 
                ? (isDesktop ? styles.desktopCardImage : styles.cardImage) 
                : (isDesktop ? styles.listCardImageDesktop : styles.cardImage),
              { backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' }
            ]}>
              <Text style={{color: '#9CA3AF'}}>Bez obrázku</Text>
            </View>
          )}

          <View style={[styles.cardContent, !isGrid && isDesktop && { flex: 1, paddingHorizontal: 25, paddingVertical: 20 }]}>
            <View style={styles.timeLocationRow}>
              <Text style={styles.cardTime}>{timeText}</Text>
              {mistoText && (
                <>
                  <Text style={styles.desktopCardTime}> | </Text>
                  <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); handleLocationClick(mistoText); }} activeOpacity={0.6} style={{ zIndex: 10 }}>
                    <Text style={styles.desktopCardTime}>{mistoText}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            
            <Text style={[styles.cardTitle, !isGrid && isDesktop && { fontSize: 22, marginTop: 5 }]} numberOfLines={isGrid ? undefined : 2}>{item.nazev}</Text>
            
            {item.host !== '' && <Text style={styles.cardHost} numberOfLines={isGrid ? undefined : 1}>{item.roleHosta}: {item.host}</Text>}
            
            {!isGrid && item.popis && (
              <Text style={styles.listAnnotation} numberOfLines={3}>
                {item.popis}
              </Text>
            )}
            
            <View style={[styles.cardBottomRow, !isGrid && isDesktop && { marginTop: 'auto', paddingTop: 10 }]}>
              <View style={styles.tagsContainer}>
                {item.tag && item.tag.map((t, index) => (
                  <TouchableOpacity key={index} style={[styles.tagPill, { backgroundColor: themeColor, borderColor: themeColor }]} onPress={(e) => { e.stopPropagation?.(); clickTagNaProgram(t); }} activeOpacity={0.7}>
                    <Text style={styles.tagText}>{t}</Text>
                  </TouchableOpacity>
                ))}
                
                {item.odkaz && (
                  <TouchableOpacity style={[styles.tagPillOutline, { borderColor: themeColor }]} onPress={(e) => { e.stopPropagation?.(); Linking.openURL(item.odkaz); }} activeOpacity={0.7}>
                    <Text style={[styles.tagTextOutline, { color: themeColor }]}>VSTUPENKY</Text>
                  </TouchableOpacity>
                )}

                {item.rezervace && (
                  <TouchableOpacity 
                    style={[
                      styles.tagPillOutline, 
                      { borderColor: themeColor }, 
                      maRezervaci ? styles.tagPillRezervovano : (jePlno ? styles.tagPillPlno : null)
                    ]} 
                    onPress={(e) => { e.stopPropagation?.(); otevriDetail(item, true); }} 
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.tagTextOutline, 
                      { color: themeColor }, 
                      maRezervaci ? styles.tagTextRezervovano : (jePlno ? styles.tagTextPlno : null)
                    ]}>
                      {maRezervaci ? 'REZERVOVÁNO' : (jePlno ? 'OBSAZENO' : 'NUTNÁ REZERVACE')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); prepniOblibene(item.id); }} style={styles.heartIconBtn}>
                <Ionicons name={oblibeneIds.includes(item.id) ? "heart" : "heart-outline"} size={26} color="black" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const vykresliPaticku = () => (
    <View style={styles.footerContainer}>
      <View style={[styles.footerInner, !isDesktop && { flexDirection: 'column', alignItems: 'flex-start' }]}>
        
        <View style={[styles.footerLogoCol, !isDesktop && { marginBottom: 35 }]}>
          <Image source={require('./assets/star.png')} style={[styles.footerLogo, { tintColor: '#FFFFFF' }]} />
          <Text style={styles.footerTitleText}>DNY{'\n'}ŽIDOVSKÉ{'\n'}KULTURY{'\n'}OLOMOUC</Text>
        </View>

        <View style={[styles.footerTextCol, !isDesktop && { marginBottom: 30 }]}>
          <Text style={styles.footerLabel}>PRODUKCE FESTIVALU</Text>
          <Text style={styles.footerText}>Alexandr Jeništa{'\n'}jenista@muo.cz{'\n'}+420 770 147 527</Text>
        </View>

        <View style={[styles.footerTextCol, !isDesktop && { marginBottom: 30 }]}>
          <Text style={styles.footerLabel}>POKLADNA MUO | CENTRAL</Text>
          <Text style={styles.footerText}>+420 585 514 241{'\n'}pokladna@muo.cz{'\n'}út–ne 10-18 hodin</Text>
        </View>

        <View style={[styles.footerSocialCol, !isDesktop && { justifyContent: 'flex-start' }]}>
          {Platform.OS === 'web' ? (
            <>
              <a href="https://muo.cz/central/dzko-2025/" target="_blank" style={{...styles.footerSocialBtn, textDecoration: 'none'}}>
                <Image source={require('./assets/muo2-icon.png')} style={styles.footerSocialIconImg} />
              </a>
              <a href="https://www.facebook.com/profile.php?id=61567469939592" target="_blank" style={{...styles.footerSocialBtn, textDecoration: 'none'}}>
                <Image source={require('./assets/facebook2-icon.png')} style={styles.footerSocialIconImg} />
              </a>
              <a href="https://www.instagram.com/judaistika_upol/" target="_blank" style={{...styles.footerSocialBtn, textDecoration: 'none'}}>
                <Ionicons name="logo-instagram" size={24} color="black" />
              </a>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.footerSocialBtn} onPress={() => Linking.openURL('https://muo.cz/central/dzko-2025/')}>
                <Image source={require('./assets/muo2-icon.png')} style={styles.footerSocialIconImg} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerSocialBtn} onPress={() => Linking.openURL('https://www.facebook.com/profile.php?id=61567469939592')}>
                <Image source={require('./assets/facebook2-icon.png')} style={styles.footerSocialIconImg} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerSocialBtn} onPress={() => Linking.openURL('https://www.instagram.com/judaistika_upol/')}>
                <Ionicons name="logo-instagram" size={24} color="black" />
              </TouchableOpacity>
            </>
          )}
        </View>

      </View>
    </View>
  );

  const vykresliDetail = () => {
    const item = detailAkce;
    const casParts = item.cas.split(' | ');
    const timeText = casParts.length > 2 ? `${casParts[0]} | ${casParts[1]}` : item.cas;
    const mistoText = casParts.length > 2 ? casParts[2] : null;
    const maRezervaci = mojeRezervace.includes(item.id);
    
    const jePlno = item.kapacita && item.pocetRezervaci >= item.kapacita;

    const getKapacitaText = () => {
      if (!item.rezervace) return null;
      if (item.kapacita) {
        const volnaMista = Math.max(0, item.kapacita - (item.pocetRezervaci || 0));
        let mistoSlovo = 'volných míst';
        if (volnaMista === 1) mistoSlovo = 'volné místo';
        else if (volnaMista >= 2 && volnaMista <= 4) mistoSlovo = 'volná místa';

        return (
          <Text style={styles.capacityText}>
            <Text style={styles.capacityBold}>{volnaMista} {mistoSlovo}</Text>
            <Text style={styles.capacityLight}> / kapacita {item.kapacita}</Text>
          </Text>
        );
      } else {
        return (
          <Text style={styles.capacityText}>
            <Text style={styles.capacityLight}>Počet rezervací: </Text>
            <Text style={styles.capacityBold}>{item.pocetRezervaci || 0}</Text>
          </Text>
        );
      }
    };

    return (
      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" ref={detailScrollViewRef} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1 }}>
          <View style={isDesktop ? styles.desktopDetailScrollView : styles.content}>
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
                {/* LEVÝ SLOUPEC - DESKTOP */}
                <View style={{ flex: 1, marginRight: 20 }}>
                  {/* 1. BÍLÁ KARTA: ANOTACE A KAPACITA */}
                  <View style={styles.desktopDetailCard}>
                    <View style={[styles.desktopTimeLocationRow, { justifyContent: 'space-between', alignItems: 'center' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.desktopCardTime}>{timeText}</Text>
                        {mistoText && (
                          <>
                            <Text style={styles.desktopCardTime}> | </Text>
                            <TouchableOpacity onPress={() => handleLocationClick(mistoText)} activeOpacity={0.6}>
                              <Text style={styles.desktopCardTime}>{mistoText}</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                      <TouchableOpacity onPress={() => sdiletAkci(item)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 15 }} activeOpacity={0.6}>
                        <Ionicons name="share-social-outline" size={16} color="black" />
                        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, marginLeft: 5, color: '#374151', fontWeight: 'bold' }}>Sdílet</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <Text style={styles.desktopDetailMainTitle}>{item.nazev}</Text>
                    
                    {item.hoste.length > 0 && (
                      <Text style={styles.desktopDetailHost}>
                        {item.hoste.length > 1 ? 'Hosté' : item.hoste[0].role}: {item.hoste.map(h => h.jmeno).join(', ')}
                      </Text>
                    )}

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
                            maRezervaci ? styles.tagPillRezervovano : (jePlno ? styles.tagPillPlno : null)
                          ]}>
                            <Text style={[
                              styles.detailTagTextOutline, 
                              { color: themeColor }, 
                              maRezervaci ? styles.tagTextRezervovano : (jePlno ? styles.tagTextPlno : null)
                            ]}>
                              {maRezervaci ? 'REZERVOVÁNO' : (jePlno ? 'OBSAZENO' : 'NUTNÁ REZERVACE')}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {item.rezervace && (
                      <View style={{ marginTop: 5 }}>
                        {getKapacitaText()}
                      </View>
                    )}
                  </View>

                  {/* 2. BÍLÁ KARTA: REZERVACE */}
                  {item.rezervace && (
                    <View style={[styles.desktopDetailCard, { backgroundColor: '#F9FAFB', padding: 20 }]}>
                      <Text style={styles.formTitle}>Rezervace</Text>
                      
                      {(maRezervaci || rezervaceOdeslana) && !chciDalsiRezervaci ? (
                        <View style={{ backgroundColor: '#ECFDF5', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#10B981' }}>
                           <Text style={{ fontFamily: 'Inter_400Regular', color: '#065F46', textAlign: 'center', fontWeight: 'bold' }}>
                             Na tuto akci máte úspěšně zajištěnou rezervaci.
                           </Text>
                           {!jePlno && (
                             <TouchableOpacity 
                               style={{ marginTop: 12, alignSelf: 'center', backgroundColor: '#10B981', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 }}
                               onPress={() => {
                                 setChciDalsiRezervaci(true);
                                 setRezervaceJmeno(''); 
                               }}
                             >
                               <Text style={{ color: 'white', fontFamily: 'Inter_400Regular', fontSize: 13, fontWeight: 'bold' }}>Vytvořit další rezervaci</Text>
                             </TouchableOpacity>
                           )}
                        </View>
                      ) : jePlno ? (
                        <View style={{ backgroundColor: '#F3F4F6', padding: 15, borderRadius: 8 }}>
                           <Text style={{ fontFamily: 'Inter_400Regular', color: '#4B5563', textAlign: 'center' }}>
                             Kapacita této akce již byla naplněna.
                           </Text>
                        </View>
                      ) : (
                        <>
                          {rezervaceChyba && <Text style={styles.errorText}>{rezervaceChyba}</Text>}
                          <TextInput style={styles.input} placeholder="Celé jméno a příjmení" value={rezervaceJmeno} onChangeText={setRezervaceJmeno} placeholderTextColor="#9CA3AF" />
                          <TextInput style={styles.input} placeholder="E-mail (např. jan.novak@email.cz)" keyboardType="email-address" autoCapitalize="none" value={rezervaceEmail} onChangeText={setRezervaceEmail} placeholderTextColor="#9CA3AF" />
                          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: themeColor }]} onPress={handleOdeslatRezervaci} disabled={odesilaRezervaci}>
                            {odesilaRezervaci ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>Odeslat rezervaci</Text>}
                          </TouchableOpacity>

                          {chciDalsiRezervaci && (
                            <TouchableOpacity onPress={() => setChciDalsiRezervaci(false)} style={{marginTop: 15, alignSelf: 'center'}}>
                              <Text style={{color: '#6B7280', fontFamily: 'Inter_400Regular', fontSize: 14}}>Zrušit zadávání další rezervace</Text>
                            </TouchableOpacity>
                          )}
                        </>
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
                  
                  {item.hoste.map((h, idx) => {
                    if (!h.fotka && h.popis === '' && h.profese === '') return null;
                    return (
                      <View key={idx} style={{ width: '100%', marginTop: 15 }}>
                        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: '#000000', marginBottom: 10, fontWeight: 'bold' }}>
                          {h.role}
                        </Text>
                        <View style={styles.speakerCard}>
                          <View style={[styles.speakerImageContainer, !h.fotka && { backgroundColor: themeColor }]}>
                            {h.fotka && <Image source={{ uri: h.fotka }} style={styles.speakerImage} resizeMode="cover" />}
                          </View>
                          <View style={styles.speakerInfo}>
                            <Text style={styles.speakerName}>{h.jmeno}</Text>
                            {h.profese !== '' && <Text style={styles.speakerJob}>{h.profese}</Text>}
                            {h.popis !== '' && <Text style={styles.speakerDesc}>{h.popis}</Text>}
                          </View>
                        </View>
                      </View>
                    );
                  })}

                  <View style={[styles.desktopDetailBottomActions, { justifyContent: 'flex-end', width: '100%', alignItems: 'flex-start', marginTop: 25 }]}>
                    <View style={styles.detailHeartWrapper}>
                      <TouchableOpacity onPress={() => prepniOblibene(item.id)} style={styles.detailHeartIconBtn}>
                        <Ionicons name={oblibeneIds.includes(item.id) ? "heart" : "heart-outline"} size={28} color="black" />
                      </TouchableOpacity>
                      {item.pocetOblibenych > 0 && (
                        <Text style={styles.detailHeartCount}>{item.pocetOblibenych}</Text>
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

                {item.hoste.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15, marginTop: -5 }}>
                    <Text style={styles.detailHost}>
                      {item.hoste.length > 1 ? 'Hosté' : item.hoste[0].role}:{' '}
                    </Text>
                    {item.hoste.map((h, hIdx) => (
                      <TouchableOpacity 
                        key={hIdx} 
                        activeOpacity={0.7} 
                        onPress={() => {
                          setAktivniSelectedSpeaker(h);
                          setSpeakerModalVisible(true);
                        }}
                      >
                        <Text style={styles.detailHost}>
                          {h.jmeno}{hIdx < item.hoste.length - 1 ? ', ' : ''}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <View style={[styles.detailTimeLocationRow, { justifyContent: 'space-between', alignItems: 'center' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
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
                  <TouchableOpacity onPress={() => sdiletAkci(item)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2, marginLeft: 10 }} activeOpacity={0.6}>
                    <Ionicons name="share-social-outline" size={16} color="black" />
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, marginLeft: 5, color: '#374151', fontWeight: 'bold' }}>Sdílet</Text>
                  </TouchableOpacity>
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
                        maRezervaci ? styles.tagPillRezervovano : (jePlno ? styles.tagPillPlno : null)
                      ]}>
                        <Text style={[
                          styles.tagTextOutline, 
                          { color: themeColor }, 
                          maRezervaci ? styles.tagTextRezervovano : (jePlno ? styles.tagTextPlno : null)
                        ]}>
                          {maRezervaci ? 'REZERVOVÁNO' : (jePlno ? 'OBSAZENO' : 'NUTNÁ REZERVACE')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={[styles.detailBottomRowInfo, { alignItems: 'flex-start', marginTop: 10, marginBottom: 25 }]}>
                  <View style={styles.detailCapacityWrapper}>
                    {getKapacitaText()}
                  </View>
                  <View style={styles.detailHeartWrapper}>
                    <TouchableOpacity onPress={() => prepniOblibene(item.id)} style={styles.detailHeartIconBtn}>
                      <Ionicons name={oblibeneIds.includes(item.id) ? "heart" : "heart-outline"} size={28} color="black" />
                    </TouchableOpacity>
                    {item.pocetOblibenych > 0 && (
                      <Text style={styles.detailHeartCount}>{item.pocetOblibenych}</Text>
                    )}
                  </View>
                </View>

                {item.hoste.map((h, idx) => {
                  if (!h.fotka && h.popis === '' && h.profese === '') return null;
                  return (
                    <View key={idx} style={{ width: '100%', marginBottom: 25 }}>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: '#000000', marginBottom: 10, fontWeight: 'bold' }}>
                        {h.role}
                      </Text>
                      <TouchableOpacity style={styles.mobileSpeakerTrigger} onPress={() => { setAktivniSelectedSpeaker(h); setSpeakerModalVisible(true); }} activeOpacity={0.7}>
                        <View style={[styles.mobileSpeakerTriggerAvatar, !h.fotka && { backgroundColor: themeColor }]}>
                          {h.fotka && <Image source={{ uri: h.fotka }} style={styles.speakerImage} resizeMode="cover" />}
                        </View>
                        <View style={{ flex: 1, paddingLeft: 15, justifyContent: 'center' }}>
                          <Text style={styles.speakerName}>{h.jmeno}</Text>
                          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: themeColor, fontWeight: 'bold', marginTop: 4 }}>
                            Zobrazit více
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })}

                {item.rezervace && (
                  <View style={styles.formContainer}>
                    <Text style={styles.formTitle}>Rezervace</Text>
                    
                    {(maRezervaci || rezervaceOdeslana) && !chciDalsiRezervaci ? (
                      <View style={{ backgroundColor: '#ECFDF5', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#10B981' }}>
                         <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: '#065F46', textAlign: 'center', fontWeight: 'bold' }}>
                           Na tuto akci máte úspěšně zajištěnou rezervaci.
                         </Text>
                         {!jePlno && (
                           <TouchableOpacity 
                             style={{ marginTop: 12, alignSelf: 'center', backgroundColor: '#10B981', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 }}
                             onPress={() => {
                               setChciDalsiRezervaci(true);
                               setRezervaceJmeno(''); 
                             }}
                           >
                             <Text style={{ color: 'white', fontFamily: 'Inter_400Regular', fontSize: 13, fontWeight: 'bold' }}>Vytvořit další rezervaci</Text>
                           </TouchableOpacity>
                         )}
                      </View>
                    ) : jePlno ? (
                      <View style={{ backgroundColor: '#F3F4F6', padding: 15, borderRadius: 8 }}>
                         <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: '#4B5563', textAlign: 'center' }}>
                           Kapacita této akce již byla naplněna.
                         </Text>
                      </View>
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

                        {chciDalsiRezervaci && (
                          <TouchableOpacity onPress={() => setChciDalsiRezervaci(false)} style={{marginTop: 15, alignSelf: 'center'}}>
                            <Text style={{color: '#6B7280', fontFamily: 'Inter_400Regular', fontSize: 14}}>Zrušit zadávání další rezervace</Text>
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </View>
                )}
              </>
            )}

            <View style={{ height: 40 }} />
          </View> 
        </View>
        {isDesktop && vykresliPaticku()}
      </ScrollView>
    );
  };

  const speakerEvents = aktivniSelectedSpeaker 
    ? prednaskyVsechny.filter(item => item.hoste.some(h => h.jmeno === aktivniSelectedSpeaker.jmeno))
    : [];

  if (!fontsLoaded || loading) return <CustomLoader themeColor={themeColor} />;
  if (error) return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text style={{color: 'red'}}>{error}</Text></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      <StatusBar style="dark" backgroundColor="#F3F4F6" translucent={false} />
      <SafeAreaView style={[styles.mainContainer, { backgroundColor: '#F3F4F6' }]}>
        
        <View style={isDesktop ? styles.desktopHeader : styles.header}>
          {isDesktop ? (
            <View style={styles.desktopHeaderInner}>
              <TouchableOpacity 
                style={styles.headerLeft}
                activeOpacity={0.7}
                onPress={() => { setAktivniTab('Home'); setDetailAkce(null); }}
              >
                <Image 
                  source={require('./assets/star.png')} 
                  style={[styles.headerLogo, { tintColor: themeColor }]} 
                />
                <Text style={styles.headerText}>DNY ŽIDOVSKÉ KULTURY OLOMOUC</Text>
              </TouchableOpacity>

              <View style={styles.desktopHeaderMenu}>
                <TouchableOpacity onPress={() => { setDetailAkce(null); setAktivniTab('Home'); }}>
                  <Text style={[styles.desktopMenuText, aktivniTab === 'Home' && !detailAkce && { color: themeColor, fontWeight: 'bold' }]}>O FESTIVALU</Text>
                </TouchableOpacity>
                
                <View 
                  onMouseEnter={() => setProgramDropdownVisible(true)}
                  onMouseLeave={() => setProgramDropdownVisible(false)}
                  style={{ position: 'relative', height: '100%', justifyContent: 'center' }}
                >
                  <TouchableOpacity onPress={() => { setAktivniTab('Program'); setVybranyDen('VŠE'); setVybranyTag(null); setActiveFilters(vychoziFiltry); setDetailAkce(null); }}>
                    <Text style={[styles.desktopMenuText, (aktivniTab === 'Program' || aktivniTab === 'Hoste') && !detailAkce && { color: themeColor, fontWeight: 'bold' }]}>PROGRAM</Text>
                  </TouchableOpacity>

                  {Platform.OS === 'web' && programDropdownVisible && (
                    <View style={styles.dropdownContainer}>
                      <TouchableOpacity 
                        style={styles.dropdownItem}
                        onMouseEnter={() => setHoveredMenuItem('Program')}
                        onMouseLeave={() => setHoveredMenuItem(null)}
                        onPress={() => { setAktivniTab('Program'); setVybranyDen('VŠE'); setVybranyTag(null); setActiveFilters(vychoziFiltry); setDetailAkce(null); setProgramDropdownVisible(false); }}
                      >
                        <Text style={[styles.dropdownItemText, hoveredMenuItem === 'Program' && { color: 'black', fontWeight: 'bold' }]}>PROGRAM</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.dropdownItem}
                        onMouseEnter={() => setHoveredMenuItem('Hoste')}
                        onMouseLeave={() => setHoveredMenuItem(null)}
                        onPress={() => { setAktivniTab('Hoste'); setDetailAkce(null); setProgramDropdownVisible(false); }}
                      >
                        <Text style={[styles.dropdownItemText, hoveredMenuItem === 'Hoste' && { color: 'black', fontWeight: 'bold' }]}>HOSTÉ</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <TouchableOpacity onPress={() => Linking.openURL('https://muo.cz/central/dzko-2025/dzko-archiv-2025/')}>
                  <Text style={styles.desktopMenuText}>ARCHIV</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setDetailAkce(null); setAktivniTab('Partneri'); }}>
                  <Text style={[styles.desktopMenuText, aktivniTab === 'Partneri' && { color: themeColor, fontWeight: 'bold' }]}>POŘADATELÉ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.desktopHeaderFavBtn} onPress={() => { setDetailAkce(null); setAktivniTab('Oblíbené'); }}>
                  <Ionicons name={oblibeneIds.length > 0 || (aktivniTab === 'Oblíbené' && !detailAkce) ? "heart" : "heart-outline"} size={24} color={aktivniTab === 'Oblíbené' && !detailAkce ? themeColor : "black"} />
                  {oblibeneIds.length > 0 && <Text style={[styles.desktopHeaderFavCount, aktivniTab === 'Oblíbené' && !detailAkce && { color: themeColor }]}>{oblibeneIds.length}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.headerLeft}
              activeOpacity={0.7}
              onPress={() => { setDetailAkce(null); setAktivniTab('Další'); setRozbaleno('O festivalu'); }}
            >
              <Image source={require('./assets/star.png')} style={[styles.headerLogo, { tintColor: themeColor }]} />
              <Text style={styles.headerText}>DŽKO</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
          
          {aktivniTab === 'Home' && isDesktop && !detailAkce && (
             <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
               <View style={{ flex: 1 }}>
                 <View style={styles.homeHeroContainer}>
                   {heroImage ? (
                     <Image source={{ uri: heroImage }} style={styles.homeHeroImage} resizeMode="cover" />
                   ) : (
                     <View style={[styles.homeHeroImage, { backgroundColor: '#333' }]} />
                   )}
                   <View style={styles.homeHeroOverlay}>
                     <TouchableOpacity style={[styles.homeHeroBtn, { borderColor: themeColor }]} onPress={() => setAktivniTab('Program')}>
                       <Text style={[styles.homeHeroBtnText, { color: themeColor }]}>PROGRAM</Text>
                     </TouchableOpacity>
                   </View>
                 </View>

                 <View style={styles.homeContentSection}>
                   <Text style={styles.homeSectionTitle}>O FESTIVALU</Text>
                   <Text style={styles.homeText}>
                     Termín festivalu: 12.–18. října 2026{'\n\n'}
                     19. ročník festivalu Dny židovské kultury Olomouc (12.–18. 10. 2026) se pod názvem „Morava – na periferii, nebo v centru?“ zaměří na historickou a kulturní roli Moravy v rámci židovských dějin. Program nabídne přednášky, koncerty, divadlo, film i komentované prohlídky a otevře diskusi o tom, zda byla Morava spíše periferií židovského světa, nebo svébytným a vlivným centrem. Pozornost bude věnována zásadním osobnostem pocházejícím z moravských židovských obcí, kulturním transferům, migracím a vztahům mezi centrem a periferií.
                   </Text>
                 </View>

                 {highlightAkce.length > 0 && (
                   <View style={[styles.homeContentSection, { paddingTop: 80, paddingBottom: 20 }]}>
                     <Text style={styles.homeSectionTitle}>TIPY Z PROGRAMU</Text>
                     <View style={styles.desktopGrid}>
                       {highlightAkce.map(item => vykresliKartu(item, true))}
                     </View>
                     <TouchableOpacity onPress={() => setAktivniTab('Program')} style={{ marginTop: 20 }}>
                       <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 18, color: '#333' }}>
                         Další akce v sekci program...
                       </Text>
                     </TouchableOpacity>
                   </View>
                 )}

                 <View style={[styles.homeContentSection, { paddingTop: 80, paddingBottom: 60 }]}>
                   <Text style={styles.homeSectionTitle}>MAPA</Text>
                   <View style={{ width: '100%', height: 600, borderRadius: 0, overflow: 'hidden', backgroundColor: '#E5E7EB' }}>
                      {Platform.OS === 'web' ? (
                        <iframe 
                          key="home-map" 
                          srcDoc={generateMapHtml(null, null, null, themeColor, true, false)} 
                          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} 
                          allow="geolocation" 
                          title="Mapa DŽKO"
                        />
                      ) : (
                        <Text style={styles.emptyText}>Mapa se načítá v prohlížeči.</Text>
                      )}
                   </View>
                 </View>
               </View>
               {isDesktop && vykresliPaticku()}
             </ScrollView>
          )}

          {aktivniTab === 'Mapa' && (
            <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
              {!isDesktop && historieAkce && (
                <View style={{ paddingHorizontal: 15 }}>
                  <TouchableOpacity 
                    style={[styles.backBtn, { marginTop: 15, marginBottom: 15 }]} 
                    onPress={() => {
                      setDetailAkce(historieAkce);
                      setAktivniTab('Program');
                      setHistorieAkce(null);
                    }}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="arrow-back" size={20} color={themeColor} />
                    <Text style={[styles.backBtnText, { color: themeColor }]}>Zpět na detail akce</Text>
                  </TouchableOpacity>
                </View>
              )}

              {Platform.OS === 'web' ? (
                <iframe 
                  srcDoc={generateMapHtml(mapFocus?.lat, mapFocus?.lng, mapFocus?.title, themeColor, false, false)} 
                  style={{ width: '100%', flex: 1, border: 'none' }} 
                  allow="geolocation" 
                />
              ) : (
                <Text style={styles.emptyText}>Mapa se načítá v prohlížeči.</Text>
              )}
            </View>
          )}

          {aktivniTab === 'Hoste' && !detailAkce && (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
              <View style={{ flex: 1, width: '100%', maxWidth: 1270, alignSelf: 'center', paddingHorizontal: 15, paddingTop: 10 }}>
                <View style={styles.pageTitleContainer}>
                  <Text style={styles.pageTitle}>HOSTÉ</Text>
                </View>
                
                <View style={{ paddingBottom: 20 }}>
                  {hosteVsechny.length > 0 ? (
                    <View style={isDesktop ? styles.desktopGrid : undefined}>
                      {hosteVsechny.map((h, index) => (
                        <View key={index} style={isDesktop ? styles.desktopCardWrapper : styles.mobileCardWrapper}>
                          <TouchableOpacity 
                            style={[styles.card, { height: '100%' }]}
                            activeOpacity={0.7}
                            onPress={() => {
                              setAktivniSelectedSpeaker(h);
                              setSpeakerModalVisible(true);
                            }}
                          >
                            <View style={{ width: '100%', aspectRatio: 4/3, backgroundColor: h.fotka ? 'transparent' : themeColor, borderTopLeftRadius: 10, borderTopRightRadius: 10, overflow: 'hidden' }}>
                              {h.fotka ? (
                                <Image source={{ uri: h.fotka }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                              ) : null}
                            </View>
                            <View style={{ padding: 15 }}>
                              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>{h.jmeno}</Text>
                              {h.profese !== '' && (
                                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#6B7280' }}>{h.profese}</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>Zatím nebyli přidáni žádní hosté.</Text>
                  )}
                </View>
              </View>
              {isDesktop && vykresliPaticku()}
            </ScrollView>
          )}

          {aktivniTab === 'Partneri' && !detailAkce && (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
              <View style={{ flex: 1, width: '100%', maxWidth: 1270, alignSelf: 'center', paddingHorizontal: 15, paddingTop: 40 }}>
                {['Pořadatelé', 'Podpora', 'Mediální partneři'].map((kat) => {
                  const partneriProKategorii = partneri.filter(p => p.kategorie && p.kategorie.toLowerCase() === kat.toLowerCase());
                  
                  if (partneriProKategorii.length === 0) return null;

                  return (
                    <View key={kat} style={{ marginBottom: 60 }}>
                      <Text style={{ 
                        fontFamily: 'Inter_400Regular', 
                        fontSize: 32, 
                        textTransform: 'uppercase', 
                        marginBottom: 40, 
                        color: '#000', 
                        letterSpacing: 1 
                      }}>
                        {kat}
                      </Text>

                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 40 }}>
                        {partneriProKategorii.map(p => {
                          const isHovered = hoveredPartnerId === p.id;
                          
                          // Společný obsah (logo nebo text)
                          const partnerContent = p.logo ? (
                            <Image 
                              source={{ uri: p.logo }} 
                              style={[
                                { width: '80%', height: '80%' },
                                isHovered && { tintColor: themeColor }
                              ]} 
                              resizeMode="contain" 
                            />
                          ) : (
                            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, textAlign: 'center', color: isHovered ? themeColor : '#000', fontWeight: 'bold' }}>{p.nazev}</Text>
                          );

                          // Společné styly pro obal loga
                          const partnerStyle = { 
                            width: isDesktop ? '25%' : '50%', 
                            paddingHorizontal: 15, 
                            paddingVertical: 15, 
                            height: 120,        
                            marginBottom: isDesktop ? 40 : 25,   
                            justifyContent: 'center', 
                            alignItems: 'center',
                            textDecoration: 'none', // Důležité pro <a> tag, aby text nebyl podtržený
                            display: 'flex' 
                          };

                          // Pokud jsme na webu a partner má odkaz, použijeme klasický <a> tag (ukáže URL vlevo dole)
                          if (Platform.OS === 'web' && p.odkaz) {
                            return (
                              <a 
                                key={p.id}
                                href={p.odkaz}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={partnerStyle}
                                onMouseEnter={() => setHoveredPartnerId(p.id)}
                                onMouseLeave={() => setHoveredPartnerId(null)}
                              >
                                {partnerContent}
                              </a>
                            );
                          }

                          // Pro mobily (nebo partnery bez vyplněného odkazu) použijeme původní TouchableOpacity
                          return (
                            <TouchableOpacity 
                              key={p.id} 
                              style={partnerStyle}
                              onPress={() => p.odkaz ? Linking.openURL(p.odkaz) : null}
                              activeOpacity={p.odkaz ? 0.7 : 1}
                              onMouseEnter={() => setHoveredPartnerId(p.id)}
                              onMouseLeave={() => setHoveredPartnerId(null)}
                            >
                              {partnerContent}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
              {isDesktop && vykresliPaticku()}
            </ScrollView>
          )}

          {aktivniTab === 'Program' && !detailAkce && (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
              <View style={{ flex: 1, width: '100%', maxWidth: 1270, alignSelf: 'center', paddingHorizontal: 15 }}>
                  <View style={isDesktop ? styles.desktopContainer : null}>
                    <View style={styles.pageTitleContainer}>
                      <TouchableOpacity onPress={() => { setVybranyDen('VŠE'); setVybranyTag(null); setActiveFilters(vychoziFiltry); }} activeOpacity={0.7} style={{ flex: 1 }}>
                        <Text style={styles.pageTitle}>{vybranyTag ? `PROGRAM: ${vybranyTag}` : 'PROGRAM'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={prepniObrazky} style={styles.toggleViewBtn}>
                        <Ionicons name={zobrazitObrazky ? "reorder-three-outline" : "grid-outline"} size={24} color="black" />
                      </TouchableOpacity>
                    </View>
                    
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.daysContainer, isDesktop && styles.desktopDaysContainer, !isDesktop && { marginBottom: 8 }]}>
                      {dny.map((den, index) => {
                        const isActive = (vybranyDen === den && !vybranyTag && !hasActiveFilters);
                        return (
                          <TouchableOpacity key={index} style={[styles.dayPill, isDesktop && styles.desktopDayPill, { borderColor: themeColor }, isActive && { backgroundColor: themeColor }]}
                            onPress={() => { setVybranyDen(isActive ? 'VŠE' : den); setVybranyTag(null); setActiveFilters(vychoziFiltry); }}>
                            <Text style={[styles.dayText, isDesktop && styles.desktopDayText, { color: themeColor }, isActive && styles.dayTextActive]}>{den}</Text>
                          </TouchableOpacity>
                        )
                      })}
                    </ScrollView>

                    {/* 👇 TLAČÍTKO PRO OTEVŘENÍ FILTRU 👇 */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: isDesktop ? 20 : -20, justifyContent: isDesktop ? 'flex-start' : 'flex-end' }}>
                      
                      {/* Šedý křížek pro zrušení filtru na mobilu (nalevo od tlačítka) */}
                      {!isDesktop && hasActiveFilters && (
                        <TouchableOpacity onPress={() => setActiveFilters(vychoziFiltry)} style={{ marginRight: 12 }}>
                          <Ionicons name="close-circle" size={24} color="#6B7280" />
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity 
                        onPress={() => { setTempFilters(activeFilters); setFilterModalVisible(true); }} 
                        style={styles.filterTriggerBtn}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="filter" size={16} color={themeColor} />
                        <Text style={[styles.filterTriggerText, { color: themeColor }]}>Filtrovat</Text>
                      </TouchableOpacity>
                      
                      {/* Textové zrušení filtru pro PC (napravo od tlačítka) */}
                      {isDesktop && hasActiveFilters && (
                        <TouchableOpacity onPress={() => setActiveFilters(vychoziFiltry)} style={{ marginLeft: 15 }}>
                          <Text style={{ fontFamily: 'Inter_400Regular', color: '#6B7280', fontSize: 13 }}>Zrušit filtry</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    <View style={{ paddingBottom: 20 }}>
                      {zobrazenePrednasky.length > 0 ? (
                        dny.map((den, index) => {
                          // Pokud se nefiltruje složitě přes nový filtr a je vybrán konkrétní den, ukaž jen ten
                          if (!hasActiveFilters && vybranyDen !== 'VŠE' && vybranyDen !== den) return null;

                          const akceDne = zobrazenePrednasky.filter(item => item.den === den);
                          if (akceDne.length === 0) return null;
                          
                          return (
                            <View key={index} style={{ marginBottom: 20 }}>
                              <Text style={styles.favoriteDayHeader}>{den}</Text>
                              <View style={isDesktop ? styles.desktopGrid : undefined}>
                                {akceDne.map(item => vykresliKartu(item))}
                              </View>
                            </View>
                          );
                        })
                      ) : (
                        <Text style={styles.emptyText}>Zvoleným filtrům neodpovídá žádný program.</Text>
                      )}
                    </View>
                  </View>
              </View>
              {isDesktop && vykresliPaticku()}
            </ScrollView>
          )}
                
          {aktivniTab === 'Oblíbené' && !detailAkce && (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
              <View style={{ flex: 1, width: '100%', maxWidth: 1270, alignSelf: 'center', paddingHorizontal: 15 }}>
                  <View style={[isDesktop ? styles.desktopContainer : null, { paddingBottom: 20 }]}>
                    
                    <View style={styles.pageTitleContainer}>
                      <TouchableOpacity onPress={() => { setVybranyDen('VŠE'); setVybranyTag(null); }} activeOpacity={0.7} style={{ flex: 1 }}>
                        <Text style={styles.pageTitle}>{sdilenyVyberIds ? 'SDÍLENÝ VÝBĚR' : 'OBLÍBENÉ'}</Text>
                      </TouchableOpacity>
                      
                      {!sdilenyVyberIds && oblibeneIds.length > 0 && (
                        <TouchableOpacity onPress={sdiletOblibene} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: themeColor, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20 }} activeOpacity={0.7}>
                          <Ionicons name="share-social-outline" size={16} color="white" />
                          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, marginLeft: 6, color: 'white', fontWeight: 'bold' }}>Sdílet výběr</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {sdilenyVyberIds && (
                      <View style={{ backgroundColor: '#E0E7FF', padding: 15, borderRadius: 10, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'Inter_400Regular', color: themeColor, flex: 1, paddingRight: 10, lineHeight: 20 }}>
                          Prohlížíš si sdílený výběr akcí. Tvoje vlastní oblíbené akce zůstaly nedotčeny.
                        </Text>
                        <TouchableOpacity onPress={() => setSdilenyVyberIds(null)} style={{ backgroundColor: themeColor, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}>
                          <Text style={{ color: 'white', fontFamily: 'Inter_400Regular', fontWeight: 'bold' }}>Zavřít</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.daysContainer, isDesktop && styles.desktopDaysContainer]}>
                      {dny.map((den, index) => {
                        const isActive = (vybranyDen === den && !vybranyTag);
                        return (
                          <TouchableOpacity key={index} style={[styles.dayPill, isDesktop && styles.desktopDayPill, { borderColor: themeColor }, isActive && { backgroundColor: themeColor }]}
                            onPress={() => { setVybranyDen(isActive ? 'VŠE' : den); setVybranyTag(null); }}>
                            <Text style={[styles.dayText, isDesktop && styles.desktopDayText, { color: themeColor }, isActive && styles.dayTextActive]}>{den}</Text>
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
                          <View key={index} style={{ marginBottom: 20 }}>
                            <Text style={styles.favoriteDayHeader}>{den}</Text>
                            <View style={isDesktop ? styles.desktopGrid : undefined}>
                              {akceDne.map(item => vykresliKartu(item))}
                            </View>
                          </View>
                        );
                      })
                   ) : (
                      <Text style={[styles.emptyText, { fontSize: 21, lineHeight: 24, marginTop: 120 }]}>Sem si můžete uložit oblíbené akce z programu kliknutím na srdíčko.</Text>
                    )}
                    {oblibeneZobrazeni.length > 0 && vybranyDen !== 'VŠE' && oblibeneZobrazeni.filter(item => item.den === vybranyDen).length === 0 && (
                      <Text style={styles.emptyText}>Pro vybraný den nemáte uložené žádné oblíbené akce.</Text>
                    )}
                  </View>
              </View>
              {isDesktop && vykresliPaticku()}
            </ScrollView>
          )}
                
          {aktivniTab === 'Další' && !detailAkce && (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
              <View style={{ flex: 1, width: '100%', maxWidth: 1270, alignSelf: 'center', paddingHorizontal: 15 }}>
                  <View style={styles.dalsiContainer}>
                    <Text style={styles.dalsiHlavniNadpis}>DNY ŽIDOVSKÉ{'\n'}KULTURY OLOMOUC</Text>
                    
                    <View style={styles.menuList}>
                      {vykresliPolozkuMenu('O festivalu', 'expand', 'Termín festivalu: 12.–18. října 2026\n\n19. ročník festivalu Dny židovské kultury Olomouc (12.–18. 10. 2026) se pod názvem „Morava – na periferii, nebo v centru?“ zaměří na historickou a kulturní roli Moravy v rámci židovských dějin. Program nabídne přednášky, koncerty, divadlo, film i komentované prohlídky a otevře diskusi o tom, zda byla Morava spíše periferií židovského světa, nebo svébytným a vlivným centrem. Pozornost bude věnována zásadním osobnostem pocházejícím z moravských židovských obcí, kulturním transferům, migracím a vztahům mezi centrem a periferií.')}
                      {!isDesktop && vykresliPolozkuMenu('Hosté', 'action', () => setAktivniTab('Hoste'))}
                      {vykresliPolozkuMenu('Archiv', 'link', 'https://muo.cz/central/dzko-2025/dzko-archiv-2025/')}
                      {vykresliPolozkuMenu('Židovská obec Olomouc', 'link', 'https://kehila-olomouc.cz/rs/')}
                      {vykresliPolozkuMenu('Stolpersteine Olomouc', 'link', 'https://kehila-olomouc.cz/stolpersteine/')}
                      {vykresliPolozkuMenu('Pořadatelé / Partneři', 'action', () => setAktivniTab('Partneri'))}
                      {vykresliPolozkuMenu('Kontakt', 'expand', 'Produkce festivalu\nAlexandr Jeništa\njenista@muo.cz\n+420 770 147 527\n\nPokladna MUO | CENTRAL\n+420 585 514 241\npokladna@muo.cz\nút–ne 10-18 hodin\n\nMuzeum umění Olomouc\nDenisova 47, 771 11 Olomouc\n+420 585 514 111\ninfo@muo.cz')}
                    </View>

                    <View style={styles.socialContainer}>
                      <TouchableOpacity onPress={() => Linking.openURL('https://muo.cz/central/dzko-2025/')} activeOpacity={0.7}>
                        <Image source={require('./assets/muo-icon.png')} style={styles.customSocialIcon} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => Linking.openURL('https://www.facebook.com/profile.php?id=61567469939592')} activeOpacity={0.7}>
                        <Image source={require('./assets/facebook-icon.png')} style={styles.customFacebookIconImg} />
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
              </View>
              {isDesktop && vykresliPaticku()}
            </ScrollView>
          )}

          {detailAkce && vykresliDetail()}

          {/* 👇 VYSKAKOVACÍ OKNO PROFILE HOSTŮ 👇 */}
          {speakerModalVisible && aktivniSelectedSpeaker && (
            <View style={styles.mobileSpeakerOverlay}>
              <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setSpeakerModalVisible(false)} />
              
              <View style={isDesktop ? styles.desktopSpeakerModalContent : styles.mobileSpeakerModalContent}>
                
                {isDesktop ? (
                  /* DESKTOP LAYOUT (50:50) */
                  <>
                    <View style={[styles.desktopSpeakerModalImageContainer, !aktivniSelectedSpeaker.fotka && { backgroundColor: themeColor }]}>
                      {aktivniSelectedSpeaker.fotka && <Image source={{ uri: aktivniSelectedSpeaker.fotka }} style={{width: '100%', height: '100%'}} resizeMode="cover" />}
                    </View>
                    <View style={styles.desktopSpeakerModalTextContainer}>
                      <TouchableOpacity style={styles.desktopSpeakerCloseBtn} onPress={() => setSpeakerModalVisible(false)}>
                        <Ionicons name="close" size={24} color="#000" />
                      </TouchableOpacity>
                      <ScrollView style={{flex: 1}} contentContainerStyle={styles.desktopSpeakerModalInfo}>
                        <Text style={styles.mobileSpeakerModalName}>{aktivniSelectedSpeaker.jmeno}</Text>
                        {aktivniSelectedSpeaker.profese !== '' && <Text style={styles.mobileSpeakerModalJob}>{aktivniSelectedSpeaker.profese}</Text>}
                        {aktivniSelectedSpeaker.popis !== '' && <Text style={styles.mobileSpeakerModalDesc}>{aktivniSelectedSpeaker.popis}</Text>}

                        {/* 👇 KARTA PRO PŘECHOD NA AKCI (PC) 👇 */}
                        {speakerEvents.length > 0 && !detailAkce && (
                          <View style={styles.speakerEventsSection}>
                            <Text style={styles.mobileSpeakerModalJob}>Program</Text>
                            {speakerEvents.map(ev => (
                              <TouchableOpacity key={ev.id} style={styles.speakerEventCard} activeOpacity={0.7} onPress={() => prejitNaAkciHost(ev)}>
                                <Text style={styles.speakerEventTime}>{ev.cas}</Text>
                                <Text style={styles.speakerEventTitle}>{ev.nazev}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </ScrollView>
                    </View>
                  </>
                ) : (
                  /* MOBILE LAYOUT (Čtverec nahoře, Text dole) */
                  <>
                    <View style={[styles.mobileSpeakerModalImageContainer, !aktivniSelectedSpeaker.fotka && { backgroundColor: themeColor }]}>
                      {aktivniSelectedSpeaker.fotka && <Image source={{ uri: aktivniSelectedSpeaker.fotka }} style={styles.speakerImage} resizeMode="cover" />}
                      <TouchableOpacity style={styles.mobileSpeakerCloseBtn} onPress={() => setSpeakerModalVisible(false)}>
                        <Ionicons name="close" size={20} color="#000" />
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={{flexShrink: 1}} contentContainerStyle={styles.mobileSpeakerModalInfo}>
                      <Text style={styles.mobileSpeakerModalName}>{aktivniSelectedSpeaker.jmeno}</Text>
                      {aktivniSelectedSpeaker.profese !== '' && <Text style={styles.mobileSpeakerModalJob}>{aktivniSelectedSpeaker.profese}</Text>}
                      {aktivniSelectedSpeaker.popis !== '' && <Text style={styles.mobileSpeakerModalDesc}>{aktivniSelectedSpeaker.popis}</Text>}

                      {/* 👇 KARTA PRO PŘECHOD NA AKCI (MOBIL) 👇 */}
                      {speakerEvents.length > 0 && !detailAkce && (
                        <View style={styles.speakerEventsSection}>
                          <Text style={styles.mobileSpeakerModalJob}>Program</Text>
                          {speakerEvents.map(ev => (
                            <TouchableOpacity key={ev.id} style={styles.speakerEventCard} activeOpacity={0.7} onPress={() => prejitNaAkciHost(ev)}>
                              <Text style={styles.speakerEventTime}>{ev.cas}</Text>
                              <Text style={styles.speakerEventTitle}>{ev.nazev}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </ScrollView>
                  </>
                )}
              </View>

            </View>
          )}

          {/* 👇 HLAVNÍ VYSKAKOVACÍ OKNO FILTRU 👇 */}
          <Modal visible={filterModalVisible} transparent={true} animationType="fade" onRequestClose={() => setFilterModalVisible(false)}>
            <View style={styles.filterModalOverlay}>
              <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setFilterModalVisible(false)} />
              
              <View style={styles.filterModalContent}>
                <View style={styles.filterHeaderRow}>
                  <Text style={styles.filterMainTitle}>Filtrovat</Text>
                  <TouchableOpacity onPress={() => setTempFilters(vychoziFiltry)} style={styles.filterResetBtn}>
                    <Text style={styles.filterResetText}>reset</Text>
                  </TouchableOpacity>
                </View>

                {['den', 'typ', 'misto', 'hoste'].map(filterKey => {
                  if (filterOptions[filterKey].length === 0) return null;
                  
                  const vybranePocet = tempFilters[filterKey].length;
                  const labelText = vybranePocet > 0 ? `Vybráno (${vybranePocet})` : '';

                  return (
                    <View key={filterKey} style={styles.filterFieldWrapper}>
                      <Text style={styles.filterFieldLabel}>{filterLabels[filterKey]}</Text>
                      <TouchableOpacity 
                        style={styles.filterFieldBox} 
                        activeOpacity={0.7}
                        onPress={() => setFilterSubModalVisible(filterKey)}
                      >
                        <Text style={[styles.filterFieldText, vybranePocet > 0 && { color: themeColor, fontWeight: 'bold' }]}>
                          {labelText}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#111827" />
                      </TouchableOpacity>
                    </View>
                  );
                })}

                <TouchableOpacity 
                  style={[styles.filterConfirmBtn, { backgroundColor: themeColor }]}
                  onPress={() => {
                    setActiveFilters(tempFilters);
                    setVybranyDen('VŠE');
                    setVybranyTag(null);
                    setFilterModalVisible(false);
                  }}
                >
                  <Text style={styles.filterConfirmBtnText}>Potvrdit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* 👇 SUB-MODAL PRO VÝBĚR KONKRÉTNÍCH POLOŽEK VE FILTRU 👇 */}
          <Modal visible={!!filterSubModalVisible} transparent={true} animationType="fade" onRequestClose={() => setFilterSubModalVisible(null)}>
            <View style={styles.filterModalOverlay}>
              <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setFilterSubModalVisible(null)} />
              
              <View style={[styles.filterModalContent, { paddingHorizontal: 0, paddingBottom: 25 }]}>
                <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ paddingHorizontal: 25, paddingTop: 20 }}>
                  
                  {filterSubModalVisible && (() => {
                    const currentOptions = filterOptions[filterSubModalVisible];
                    const selectedOptions = tempFilters[filterSubModalVisible];
                    const isAllSelected = selectedOptions.length === currentOptions.length;

                    return (
                      <>
                        <TouchableOpacity 
                          style={styles.filterCheckboxRow}
                          onPress={() => {
                            if (isAllSelected) {
                              setTempFilters({ ...tempFilters, [filterSubModalVisible]: [] });
                            } else {
                              setTempFilters({ ...tempFilters, [filterSubModalVisible]: [...currentOptions] });
                            }
                          }}
                        >
                          <Ionicons name={isAllSelected ? "checkmark-circle" : "ellipse-outline"} size={22} color={isAllSelected ? themeColor : "#D1D5DB"} />
                          <Text style={styles.filterCheckboxText}>OZNAČIT VŠE</Text>
                        </TouchableOpacity>
                        
                        <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 10 }} />

                        {currentOptions.map((option, idx) => {
                          const isSelected = selectedOptions.includes(option);
                          return (
                            <TouchableOpacity 
                              key={idx} 
                              style={styles.filterCheckboxRow}
                              onPress={() => {
                                if (isSelected) {
                                  setTempFilters({ ...tempFilters, [filterSubModalVisible]: selectedOptions.filter(o => o !== option) });
                                } else {
                                  setTempFilters({ ...tempFilters, [filterSubModalVisible]: [...selectedOptions, option] });
                                }
                              }}
                            >
                              <Ionicons name={isSelected ? "checkmark-circle" : "ellipse-outline"} size={22} color={isSelected ? themeColor : "#D1D5DB"} />
                              <Text style={[styles.filterCheckboxText, isSelected && { fontWeight: 'bold', color: '#000' }]}>{option}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </>
                    );
                  })()}

                </ScrollView>

                <View style={styles.filterSubModalActions}>
                  <TouchableOpacity 
                    style={[styles.filterSubConfirmBtn, { backgroundColor: themeColor }]}
                    onPress={() => setFilterSubModalVisible(null)}
                  >
                    <Text style={styles.filterConfirmBtnText}>Potvrdit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.filterSubCancelBtn}
                    onPress={() => setFilterSubModalVisible(null)}
                  >
                    <Text style={styles.filterSubCancelText}>Zrušit</Text>
                  </TouchableOpacity>
                </View>

              </View>
            </View>
          </Modal>

          {!isDesktop && (
            <View style={styles.bottomNav}>
              <TouchableOpacity style={styles.navItem} onPress={() => { setAktivniTab('Program'); setVybranyDen('VŠE'); setVybranyTag(null); setActiveFilters(vychoziFiltry); setDetailAkce(null); }}>
                <Ionicons name={aktivniTab === 'Program' && !detailAkce ? "calendar" : "calendar-outline"} size={24} color={aktivniTab === 'Program' && !detailAkce ? themeColor : 'black'} />
                <Text style={[styles.navText, { color: aktivniTab === 'Program' && !detailAkce ? themeColor : 'black' }]}>Program</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.navItem} onPress={() => { setAktivniTab('Oblíbené'); setDetailAkce(null); }}>
                <Ionicons name={aktivniTab === 'Oblíbené' && !detailAkce ? "heart" : "heart-outline"} size={24} color={aktivniTab === 'Oblíbené' && !detailAkce ? themeColor : 'black'} />
                <Text style={[styles.navText, { color: aktivniTab === 'Oblíbené' && !detailAkce ? themeColor : 'black' }]}>Oblíbené</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.navItem} onPress={() => { setAktivniTab('Mapa'); setMapFocus(null); setDetailAkce(null); setHistorieAkce(null); }}>
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

        {homeMapaZvetsena && (
           <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, backgroundColor: '#F3F4F6' }}>
              {Platform.OS === 'web' ? (
                <iframe 
                  key="fullscreen-home-map-2" 
                  srcDoc={generateMapHtml(null, null, null, themeColor, true, true)} 
                  style={{ width: '100%', height: '100%', border: 'none' }} 
                  allow="geolocation" 
                  title="Mapa DŽKO Fullscreen"
                />
              ) : (
                <Text style={styles.emptyText}>Mapa se načítá v prohlížeči.</Text>
              )}
           </View>
        )}

        <Modal
          visible={mapaModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setMapaModalVisible(false)}
        >
          <View style={styles.mapModalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setMapaModalVisible(false)} />
            
            <View style={styles.mapModalContent}>
              <TouchableOpacity style={styles.mapModalCloseBtn} onPress={() => setMapaModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
              
              {Platform.OS === 'web' ? (
                <iframe 
                  srcDoc={generateMapHtml(mapFocus?.lat, mapFocus?.lng, mapFocus?.title, themeColor, false, false)} 
                  style={{ width: '100%', height: '100%', border: 'none', borderRadius: 16 }} 
                  allow="geolocation" 
                  title="Mapa detailu"
                />
              ) : (
                <Text style={styles.emptyText}>Mapa se načítá v prohlížeči.</Text>
              )}
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
 homeHeroContainer: {
    width: '100%',
    aspectRatio: 2/1, 
    position: 'relative',
  },
  homeHeroImage: {
    width: '100%',
    height: '100%',
  },
  homeHeroOverlay: {
    position: 'absolute',
    bottom: 170,
    width: '100%',
    alignItems: 'center',
  },
  homeHeroBtn: {
    paddingVertical: 14,
    paddingHorizontal: 40,
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
    width: '100%',
    maxWidth: 1270, 
    alignSelf: 'center',
    paddingHorizontal: 15, 
    paddingTop: 60,
  },
  homeSectionTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 32,
    letterSpacing: 1,
    marginBottom: 20,
    color: '#000',
  },
  homeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    color: '#333',
    lineHeight: 28,
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
    width: '100%',
    maxWidth: 1270, 
    alignSelf: 'center',
    paddingHorizontal: 15,
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
  
  desktopDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    marginBottom: 20, 
    ...Platform.select({
      web: { boxShadow: '0px 2px 6px rgba(0,0,0,0.05)' },
      default: { elevation: 2 }
    })
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

  detailBottomRowInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', 
    marginBottom: 30,
  },
  detailCapacityWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 4, 
  },
  capacityText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#4B5563',
  },
  capacityBold: {
    fontWeight: 'bold',
    color: '#000000',
  },
  capacityLight: {
    color: '#6B7280',
  },
  detailHeartWrapper: {
    alignItems: 'center',
    minWidth: 40,
  },
  detailHeartIconBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailHeartCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#4B5563',
    marginTop: 4,
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
    marginBottom: 20, 
  },
  mobileCardWrapper: {
    width: '100%',
    marginBottom: 15,
  },

  desktopHeader: { 
    height: 55,
    width: '100%',
    backgroundColor: '#FFFFFF', 
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    zIndex: 50,
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.08)' },
      default: { elevation: 4 }
    })
  },
  desktopHeaderInner: {
    width: '100%',
    maxWidth: 1240, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -5, 
  },
  desktopHeaderMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 25,
  },
  desktopMenuText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#000000',
    letterSpacing: 0.5,
  },
  
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: -15,
    backgroundColor: '#FFFFFF',
    minWidth: 150,
    borderRadius: 8,
    paddingVertical: 8,
    zIndex: 100,
    ...Platform.select({
      web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.15)' },
      default: { elevation: 5 }
    })
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  dropdownItemText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
  },

  desktopContainer: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    paddingTop: 10,
  },

  mainContainer: { flex: 1 }, 
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  
  header: { 
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 15, 
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLogo: { width: 36, height: 36, marginRight: 10, resizeMode: 'contain' },
  headerText: { fontFamily: 'Inter_400Regular', color: '#000000', fontSize: 22, includeFontPadding: false },
  
  content: { flex: 1, paddingHorizontal: 15 },
  mapTabContainer: { flex: 1, paddingHorizontal: 15 },

  pageTitleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 15 },
  pageTitle: { fontFamily: 'Inter_400Regular', fontSize: 32, letterSpacing: 1 },

  toggleViewBtn: {
    width: 44,
    height: 44,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  favoriteDayHeader: { fontFamily: 'Inter_400Regular', fontSize: 20, color: '#000', marginBottom: 15, marginTop: 15 }, 
  
  webMap: { flex: 1, width: '100%', borderRadius: 15, marginBottom: 15, borderWidth: 0, minHeight: 350 },
  daysContainer: { flexDirection: 'row', marginBottom: 20 },
  dayPill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, marginRight: 8, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  dayText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  dayTextActive: { fontFamily: 'Inter_400Regular', color: 'white' },
  
  desktopDaysContainer: { marginBottom: 30 },
  desktopDayPill: { width: 86, height: 36, borderRadius: 18, marginRight: 16, paddingVertical: 0, paddingHorizontal: 0 },
  desktopDayText: { fontSize: 14 },
  
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 10, 
    marginBottom: 0, 
    ...Platform.select({
      web: { boxShadow: '0px 4px 8px rgba(0,0,0,0.12)' },
      default: { elevation: 5 }
    })
  },
  cardContent: { padding: 15 },
  cardImage: { width: '100%', height: 160, borderTopLeftRadius: 10, borderTopRightRadius: 10, backgroundColor: '#E5E7EB' },
  
  timeLocationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, flexWrap: 'wrap' },
  cardTime: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#4B5563' },
  locationLink: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#4B5563' },
  cardTitle: { fontFamily: 'Inter_400Regular', fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#111827' },
  cardHost: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#374151', marginBottom: 10 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', flex: 1, paddingRight: 10 },
  
  tagPill: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 9, borderRadius: 15, marginRight: 6, marginTop: 6, borderWidth: 1 },
  tagText: { fontFamily: 'Inter_400Regular', color: 'white', fontSize: 11, fontWeight: '600' },
  
  tagPillOutline: { backgroundColor: 'transparent', alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 9, borderRadius: 15, marginRight: 6, marginTop: 6, borderWidth: 1 },
  tagTextOutline: { fontFamily: 'Inter_400Regular', fontSize: 11, fontWeight: '600' },
  
  tagPillRezervovano: { backgroundColor: 'transparent', borderColor: '#10B981' },
  tagTextRezervovano: { color: '#10B981' },
  tagPillPlno: { backgroundColor: '#D1D5DB', borderColor: '#D1D5DB' },
  tagTextPlno: { color: '#4B5563' },

  heartIconBtn: { paddingBottom: 0, paddingLeft: 10, marginBottom: -4 },
  emptyText: { fontFamily: 'Inter_400Regular', color: '#6B7280', textAlign: 'center', marginTop: 30, lineHeight: 22 },
  
  backBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 15, alignSelf: 'flex-start' },
  backBtnText: { fontFamily: 'Inter_400Regular', fontSize: 16, marginLeft: 5 },
  
  detailTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  detailMainTitle: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 26, fontWeight: 'bold', color: '#111827', lineHeight: 32 },
  
  detailHost: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#374151', marginBottom: 15, marginTop: -5 },
  
  detailTimeLocationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' },
  wireframeImage: { width: '100%', height: 200, backgroundColor: '#E5E7EB', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  wireframeText: { fontFamily: 'Inter_400Regular', color: '#9CA3AF', marginTop: 10 },
  detailDescription: { fontFamily: 'Inter_400Regular', fontSize: 16, color: '#374151', lineHeight: 24, marginBottom: 15 },
  
  detailTagsWrapper: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 25 },
  
  formContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 10, marginBottom: 30, borderWidth: 1, borderColor: '#E5E7EB', ...Platform.select({ web: { boxShadow: '0px 1px 2px rgba(0,0,0,0.05)' }, default: { elevation: 1 }}) },
  formTitle: { fontFamily: 'Inter_400Regular', fontSize: 18, marginBottom: 15, color: '#111827', fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 12, fontFamily: 'Inter_400Regular', fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB' },
  submitBtn: { padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  submitBtnText: { color: 'white', fontFamily: 'Inter_400Regular', fontSize: 14, fontWeight: 'bold' },
  successText: { color: '#10B981', fontFamily: 'Inter_400Regular', fontSize: 15, textAlign: 'center', marginVertical: 10, fontWeight: 'bold' },
  errorText: { color: '#EF4444', fontFamily: 'Inter_400Regular', fontSize: 13, marginBottom: 12, lineHeight: 18 }, 

  dalsiContainer: { paddingTop: 20, paddingBottom: 40 },
  dalsiHlavniNadpis: { fontFamily: 'Inter_400Regular', fontSize: 32, letterSpacing: 1, color: '#000', marginBottom: 30, lineHeight: 38 },
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
  customFacebookIconImg: { width: 36, height: 36, borderRadius: 18, resizeMode: 'cover' },
  
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
    ...Platform.select({ web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.15)' }, default: { elevation: 8 } })
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
  },
  
  mapModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)', 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(12px)' } : {}), 
  },
  mapModalContent: {
    width: '100%',
    maxWidth: 900,
    height: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({ web: { boxShadow: '0px 10px 40px rgba(0,0,0,0.15)' }, default: { elevation: 10 } })
  },
  mapModalCloseBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'white',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999, 
    ...Platform.select({ web: { boxShadow: '0px 2px 5px rgba(0,0,0,0.15)' }, default: { elevation: 5 } })
  },

  listCardImageDesktop: {
    width: 360,
    height: 270,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    backgroundColor: '#E5E7EB'
  },
  listAnnotation: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 15,
  },

  footerContainer: {
    backgroundColor: '#000000',
    width: '100%',
    paddingVertical: 25, 
    alignItems: 'center',
    marginTop: 60,
  },
  footerInner: {
    width: '100%',
    maxWidth: 1270,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', 
  },
  footerLogoCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLogo: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
    marginRight: 15,
  },
  footerTitleText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  footerTextCol: {
    justifyContent: 'flex-start',
  },
  footerLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 5,
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  footerSocialCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  footerSocialBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex', 
  },
  footerSocialIconImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'cover',
  },

  speakerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 220, 
  },
  speakerImageContainer: {
    width: 200, 
  },
  speakerImage: {
    width: '100%',
    height: '100%',
  },
  speakerInfo: {
    flex: 1,
    padding: 25,
    justifyContent: 'flex-start',
  },
  speakerName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  speakerJob: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  speakerDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },

  mobileSpeakerTrigger: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  mobileSpeakerTriggerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  
  mobileSpeakerOverlay: {
    position: 'absolute',
    top: 0, 
    bottom: 0, 
    left: 0, 
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.4)', 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25, 
    zIndex: 1000,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(12px)' } : {}), 
  },
  desktopSpeakerModalContent: {
    width: '100%',
    maxWidth: 1000, 
    height: 500,    
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row', 
    ...Platform.select({ web: { boxShadow: '0px 10px 40px rgba(0,0,0,0.15)' }, default: { elevation: 10 } })
  },
  desktopSpeakerModalImageContainer: {
    flex: 1, 
    height: '100%',
  },
  desktopSpeakerModalTextContainer: {
    flex: 1, 
    position: 'relative',
    backgroundColor: '#fff',
  },
  desktopSpeakerCloseBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'white',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...Platform.select({ web: { boxShadow: '0px 2px 5px rgba(0,0,0,0.2)' }, default: { elevation: 5 } })
  },
  desktopSpeakerModalInfo: {
    padding: 40,
    paddingTop: 60, 
    paddingBottom: 40,
  },

  // Mobilní vyskakovací okno
  mobileSpeakerModalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '100%', 
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({ web: { boxShadow: '0px 10px 40px rgba(0,0,0,0.15)' }, default: { elevation: 10 } })
  },
  mobileSpeakerModalImageContainer: {
    width: '100%',
    aspectRatio: 1, 
    position: 'relative',
  },
  mobileSpeakerCloseBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'white',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...Platform.select({ web: { boxShadow: '0px 2px 5px rgba(0,0,0,0.2)' }, default: { elevation: 5 } })
  },
  mobileSpeakerModalInfo: {
    padding: 25,
  },
  mobileSpeakerModalName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  mobileSpeakerModalJob: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 15,
  },
  mobileSpeakerModalDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },

  speakerEventsSection: {
    marginTop: 30,
  },
  speakerEventCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  speakerEventTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  speakerEventTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },

  // 👇 STYLY PRO FILTR MODAL 👇
  filterTriggerBtn: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#E0E7FF', 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 20,
    alignSelf: 'flex-start'
  },
  filterTriggerText: {
    fontFamily: 'Inter_400Regular', 
    marginLeft: 6, 
    fontWeight: 'bold', 
    fontSize: 13
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(5px)' } : {}), 
  },
  filterModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    ...Platform.select({ web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.1)' }, default: { elevation: 8 } })
  },
  filterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  filterMainTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 22,
    color: '#000',
    fontWeight: 'bold'
  },
  filterResetBtn: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12
  },
  filterResetText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#4B5563'
  },
  filterFieldWrapper: {
    marginBottom: 20
  },
  filterFieldLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#000',
    marginBottom: 8
  },
  filterFieldBox: {
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  filterFieldText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280'
  },
  filterConfirmBtn: {
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 30
  },
  filterConfirmBtnText: {
    fontFamily: 'Inter_400Regular',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15
  },
  filterCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12
  },
  filterCheckboxText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#374151',
    marginLeft: 10
  },
  filterSubModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 20,
    borderTopWidth: 1,
    borderColor: '#E5E7EB'
  },
  filterSubConfirmBtn: {
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    paddingHorizontal: 25,
    marginRight: 15
  },
  filterSubCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 15
  },
  filterSubCancelText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#000'
  }
});

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Platform, Linking, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Inter_400Regular } from '@expo-google-fonts/inter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

// --- GENERÁTOR MAPY ---
const generateMapHtml = (focusLat, focusLng, focusTitle) => `
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
            background-color: #8B5CF6; border: 2px solid white;
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
    </script>
</body>
</html>
`;

export default function App() {
  let [fontsLoaded] = useFonts({
    Inter_400Regular,
  });

  const dny = ['PO 12', 'ÚT 13', 'ST 14', 'ČT 15', 'PÁ 16', 'SO 17', 'NE 18'];
  const [vybranyDen, setVybranyDen] = useState('VŠE');
  const [aktivniTab, setAktivniTab] = useState('Program');
  const [oblibeneIds, setOblibeneIds] = useState([]);
  const [vybranyTag, setVybranyTag] = useState(null);
  const [mapFocus, setMapFocus] = useState(null);
  const [rozbaleno, setRozbaleno] = useState(null);
  const [detailAkce, setDetailAkce] = useState(null);

  const [prednaskyVsechny, setPrednaskyVsechny] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stavy pro rezervační formulář
  const [rezervaceJmeno, setRezervaceJmeno] = useState('');
  const [rezervaceEmail, setRezervaceEmail] = useState('');
  const [odesilaRezervaci, setOdesilaRezervaci] = useState(false);
  const [rezervaceOdeslana, setRezervaceOdeslana] = useState(false);
  const [rezervaceChyba, setRezervaceChyba] = useState(null); // NOVÝ STAV PRO CHYBU

  useEffect(() => {
    if (Platform.OS === 'web') {
      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
      }
      meta.content = '#8B5CF6';
    }

    const nactiOblibene = async () => {
      try {
        const ulozenaData = await AsyncStorage.getItem('@moje_srdicka');
        if (ulozenaData !== null) setOblibeneIds(JSON.parse(ulozenaData));
      } catch (error) { console.error('Chyba při načítání srdíček:', error); }
    };
    nactiOblibene();

    const baseId = process.env.EXPO_PUBLIC_AIRTABLE_BASE_ID;
    const token = process.env.EXPO_PUBLIC_AIRTABLE_TOKEN;

    if (!baseId || !token) {
      setError('Chybí konfigurace API klíčů ve Vercelen.');
      setLoading(false);
      return;
    }

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
              tag: f['Tagy'] || [],
              popis: f['Anotace'] || '',
              image: f['Obrázek'] && f['Obrázek'][0] ? f['Obrázek'][0].url : null,
              odkaz: f['Vstupenky'] || null, 
              rezervace: !!f['Rezervace']
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
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []); 

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

  const prepniOblibene = async (id) => {
    let novySeznam = oblibeneIds.includes(id) ? oblibeneIds.filter(item => item !== id) : [...oblibeneIds, id]; 
    setOblibeneIds(novySeznam);
    try { await AsyncStorage.setItem('@moje_srdicka', JSON.stringify(novySeznam)); } 
    catch (error) { console.error('Chyba při ukládání srdíčka:', error); }
  };

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

  const otevriDetail = (item) => {
    setDetailAkce(item);
    setRezervaceJmeno('');
    setRezervaceEmail('');
    setOdesilaRezervaci(false);
    setRezervaceOdeslana(false);
    setRezervaceChyba(null); // Vymaže předchozí chyby
  };

  const handleOdeslatRezervaci = async () => {
    setRezervaceChyba(null); // Reset chyby při novém pokusu
    
    if (!rezervaceJmeno.trim() || !rezervaceEmail.trim()) {
      setRezervaceChyba('Prosím, vyplňte jméno i e-mail.');
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
        // Pokud Airtable odpoví chybou (např. 403 Forbidden, 422 Unprocessable Entity)
        const errorData = await response.json();
        console.log("Airtable chyba:", errorData);
        setRezervaceChyba(`Airtable zamítl uložení: ${errorData?.error?.message || 'Neznámý problém'}`);
        setOdesilaRezervaci(false);
        return;
      }
      
      // Vše proběhlo v pořádku
      setRezervaceOdeslana(true);
    } catch (err) {
      // Pokud selže samotné připojení na internet (např. blokování prohlížečem)
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
        <View style={styles.menuExpandedContent}>
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

    return (
      <View key={item.id} style={styles.card}>
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
        
        {item.host !== '' && <Text style={styles.cardHost}>host: {item.host}</Text>}
        
        <View style={styles.cardBottomRow}>
          <View style={styles.tagsContainer}>
            {item.tag && item.tag.map((t, index) => (
              <TouchableOpacity key={index} style={styles.tagPill} onPress={() => setVybranyTag(t)} activeOpacity={0.7}>
                <Text style={styles.tagText}>{t}</Text>
              </TouchableOpacity>
            ))}
            
            {item.odkaz && (
              <TouchableOpacity style={styles.tagPillOutline} onPress={() => Linking.openURL(item.odkaz)} activeOpacity={0.7}>
                <Text style={styles.tagTextOutline}>VSTUPENKY</Text>
              </TouchableOpacity>
            )}

            {item.rezervace && (
              <TouchableOpacity style={styles.tagPillOutline} onPress={() => otevriDetail(item)} activeOpacity={0.7}>
                <Text style={styles.tagTextOutline}>NUTNÁ REZERVACE</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={() => prepniOblibene(item.id)} style={styles.heartIconBtn}>
            <Ionicons name={oblibeneIds.includes(item.id) ? "heart" : "heart-outline"} size={26} color="black" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const vykresliDetail = () => {
    const item = detailAkce;
    const casParts = item.cas.split(' | ');
    const timeText = casParts.length > 2 ? `${casParts[0]} | ${casParts[1]}` : item.cas;
    const mistoText = casParts.length > 2 ? casParts[2] : null;

    const zobrazenyTitulek = (item.host !== '' && !item.nazev.startsWith(item.host)) 
      ? `${item.host}: ${item.nazev}` 
      : item.nazev;

    return (
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => setDetailAkce(null)}>
          <Ionicons name="arrow-back" size={20} color="#8B5CF6" />
          <Text style={styles.backBtnText}>Zpět</Text>
        </TouchableOpacity>

        <Text style={styles.detailMainTitle}>{zobrazenyTitulek}</Text>

        <View style={styles.detailTimeLocationRow}>
          <Ionicons name="time-outline" size={16} color="#4B5563" style={{ marginRight: 5 }} />
          <Text style={styles.cardTime}>{timeText}</Text>
          {mistoText && (
            <>
              <Text style={styles.cardTime}>  |  </Text>
              <Ionicons name="location-outline" size={16} color="#4B5563" style={{ marginRight: 5 }} />
              <TouchableOpacity onPress={() => handleLocationClick(mistoText)} activeOpacity={0.6}>
                <Text style={styles.locationLink}>{mistoText}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.wireframeImage} resizeMode="cover" />
        ) : (
          <View style={styles.wireframeImage}>
            <Ionicons name="image-outline" size={40} color="#9CA3AF" />
            <Text style={styles.wireframeText}>Místo pro fotografii</Text>
          </View>
        )}

        <Text style={styles.detailDescription}>
          {item.popis ? item.popis : 'Další informace o této akci připravujeme...'}
        </Text>

        {/* REZERVAČNÍ FORMULÁŘ */}
        {item.rezervace && (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Rezervace místa</Text>
            
            {/* Zobrazení úspěchu */}
            {rezervaceOdeslana ? (
              <Text style={styles.successText}>Rezervace byla úspěšně odeslána!</Text>
            ) : (
              <>
                {/* Zobrazení chybové hlášky červeně */}
                {rezervaceChyba && (
                  <Text style={styles.errorText}>{rezervaceChyba}</Text>
                )}
                
                <TextInput
                  style={styles.input}
                  placeholder="Jméno a příjmení"
                  value={rezervaceJmeno}
                  onChangeText={setRezervaceJmeno}
                  placeholderTextColor="#9CA3AF"
                />
                <TextInput
                  style={styles.input}
                  placeholder="E-mail"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={rezervaceEmail}
                  onChangeText={setRezervaceEmail}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity style={styles.submitBtn} onPress={handleOdeslatRezervaci} disabled={odesilaRezervaci}>
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

        <View style={styles.detailBottomRow}>
          <View style={styles.tagsContainer}>
            {item.tag && item.tag.map((t, index) => (
              <View key={index} style={styles.tagPill}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
            
            {item.odkaz && (
              <TouchableOpacity style={styles.tagPillOutline} onPress={() => Linking.openURL(item.odkaz)} activeOpacity={0.7}>
                <Text style={styles.tagTextOutline}>VSTUPENKY ↗</Text>
              </TouchableOpacity>
            )}
            {item.rezervace && (
              <View style={styles.tagPillOutline}>
                <Text style={styles.tagTextOutline}>NUTNÁ REZERVACE</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    );
  };

  if (!fontsLoaded || loading) return <ActivityIndicator size="large" color="#8B5CF6" style={{flex: 1, justifyContent: 'center', backgroundColor: '#F3F4F6'}} />;
  if (error) return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text style={{color: 'red'}}>{error}</Text></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#8B5CF6' }}>
      <StatusBar style="light" backgroundColor="#8B5CF6" translucent={false} />
      <SafeAreaView style={styles.mainContainer}>
        
        <View style={styles.header}>
          <Text style={styles.headerText}>DŽKO</Text>
        </View>

        <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
          
          {aktivniTab === 'Mapa' && (
            <View style={styles.mapTabContainer}>
              <Text style={styles.pageTitleInternal}>MAPA FESTIVALU</Text>
              {Platform.OS === 'web' ? (
                <iframe srcDoc={generateMapHtml(mapFocus?.lat, mapFocus?.lng, mapFocus?.title)} style={styles.webMap} frameBorder="0" />
              ) : (
                <Text style={styles.emptyText}>Mapa se načítá v prohlížeči.</Text>
              )}
            </View>
          )}

          {aktivniTab !== 'Mapa' && !detailAkce && (
            <ScrollView style={styles.content}>
              {aktivniTab === 'Program' && (
                <>
                  <TouchableOpacity onPress={() => { setVybranyDen('VŠE'); setVybranyTag(null); }} activeOpacity={0.7}>
                    <Text style={styles.pageTitle}>{vybranyTag ? `PROGRAM: ${vybranyTag}` : 'PROGRAM'}</Text>
                  </TouchableOpacity>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysContainer}>
                    {dny.map((den, index) => (
                      <TouchableOpacity key={index} style={[styles.dayPill, (vybranyDen === den && !vybranyTag) && styles.dayPillActive]}
                        onPress={() => { setVybranyDen(den); setVybranyTag(null); }}>
                        <Text style={[styles.dayText, (vybranyDen === den && !vybranyTag) && styles.dayTextActive]}>{den}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {zobrazenePrednasky.length > 0 ? zobrazenePrednasky.map(vykresliKartu) : <Text style={styles.emptyText}>Pro tento výběr zatím není program.</Text>}
                </>
              )}
              
              {aktivniTab === 'Oblíbené' && (
                <>
                  <Text style={styles.pageTitle}>OBLÍBENÉ</Text>
                  {oblibeneZobrazeni.length > 0 ? oblibeneZobrazeni.map(vykresliKartu) : <Text style={styles.emptyText}>Zatím si sem můžete přidat akce kliknutím na srdíčko.</Text>}
                </>
              )}
              
              {aktivniTab === 'Další' && (
                <View style={styles.dalsiContainer}>
                  <Text style={styles.dalsiHlavniNadpis}>DNY ŽIDOVSKÉ{'\n'}KULTURY OLOMOUC</Text>
                  
                  <View style={styles.menuList}>
                    {vykresliPolozkuMenu('O festivalu', 'expand', 'Termín festivalu: 12.–18. října 2026\n\n19. ročník festivalu Dny židovské kultury Olomouc (12.–18. 10. 2026) se pod názvem „Morava – na periferii, nebo v centru?“ zaměří na historickou a kulturní roli Moravy v rámci židovských dějin.')}
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
                  </View>
                </View>
              )}
            </ScrollView>
          )}

          {detailAkce && vykresliDetail()}

          <View style={styles.bottomNav}>
            <TouchableOpacity style={styles.navItem} onPress={() => { setAktivniTab('Program'); setVybranyDen('VŠE'); setVybranyTag(null); setDetailAkce(null); }}>
              <Ionicons name={aktivniTab === 'Program' && !detailAkce ? "calendar" : "calendar-outline"} size={24} color={aktivniTab === 'Program' && !detailAkce ? '#8B5CF6' : 'black'} />
              <Text style={[styles.navText, { color: aktivniTab === 'Program' && !detailAkce ? '#8B5CF6' : 'black' }]}>Program</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.navItem} onPress={() => { setAktivniTab('Oblíbené'); setDetailAkce(null); }}>
              <Ionicons name={aktivniTab === 'Oblíbené' && !detailAkce ? "heart" : "heart-outline"} size={24} color={aktivniTab === 'Oblíbené' && !detailAkce ? '#8B5CF6' : 'black'} />
              <Text style={[styles.navText, { color: aktivniTab === 'Oblíbené' && !detailAkce ? '#8B5CF6' : 'black' }]}>Oblíbené</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem} onPress={() => { setAktivniTab('Mapa'); setMapFocus(null); setDetailAkce(null); }}>
              <Ionicons name={aktivniTab === 'Mapa' ? "map" : "map-outline"} size={24} color={aktivniTab === 'Mapa' ? '#8B5CF6' : 'black'} />
              <Text style={[styles.navText, { color: aktivniTab === 'Mapa' ? '#8B5CF6' : 'black' }]}>Mapa</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem} onPress={() => { setAktivniTab('Další'); setDetailAkce(null); }}>
              <Ionicons name={aktivniTab === 'Další' ? "grid" : "grid-outline"} size={24} color={aktivniTab === 'Další' ? '#8B5CF6' : 'black'} />
              <Text style={[styles.navText, { color: aktivniTab === 'Další' ? '#8B5CF6' : 'black' }]}>Další</Text>
            </TouchableOpacity>
          </View>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#8B5CF6' },
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { 
    backgroundColor: '#8B5CF6', paddingHorizontal: 20, paddingBottom: 15,
    paddingTop: Platform.OS === 'ios' ? 10 : 20, borderTopWidth: 0, marginTop: -1 
  },
  headerText: { fontFamily: 'Inter_400Regular', color: 'white', fontSize: 20 },
  content: { flex: 1, paddingHorizontal: 15 },
  mapTabContainer: { flex: 1, paddingHorizontal: 15 },
  pageTitle: { fontFamily: 'Inter_400Regular', fontSize: 28, marginTop: 20, marginBottom: 15 },
  pageTitleInternal: { fontFamily: 'Inter_400Regular', fontSize: 28, marginTop: 20, marginBottom: 10 },
  webMap: { flex: 1, width: '100%', borderRadius: 15, marginBottom: 15, borderWidth: 0, minHeight: 350 },
  daysContainer: { flexDirection: 'row', marginBottom: 20 },
  dayPill: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: '#D1D5DB', marginRight: 6, backgroundColor: 'transparent' },
  dayPillActive: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
  dayText: { fontFamily: 'Inter_400Regular', color: '#374151', fontSize: 13 },
  dayTextActive: { fontFamily: 'Inter_400Regular', color: 'white' },
  card: { backgroundColor: '#F3F4F6', padding: 15, borderRadius: 10, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  timeLocationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, flexWrap: 'wrap' },
  cardTime: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#4B5563' },
  locationLink: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#4B5563' },
  cardTitle: { fontFamily: 'Inter_400Regular', fontSize: 16, marginBottom: 10, color: '#111827' },
  cardHost: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#374151', marginBottom: 10 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', flex: 1, paddingRight: 10 },
  tagPill: { backgroundColor: '#8B5CF6', alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 15, marginRight: 8, marginTop: 5 },
  tagText: { fontFamily: 'Inter_400Regular', color: 'white', fontSize: 12, lineHeight: 16 },
  tagPillOutline: { backgroundColor: 'transparent', alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 9, borderRadius: 15, marginRight: 8, marginTop: 5, borderWidth: 1, borderColor: '#8B5CF6' },
  tagTextOutline: { fontFamily: 'Inter_400Regular', color: '#8B5CF6', fontSize: 11, fontWeight: '600' },
  heartIconBtn: { paddingBottom: 2, paddingLeft: 10 },
  emptyText: { fontFamily: 'Inter_400Regular', color: '#6B7280', textAlign: 'center', marginTop: 30, lineHeight: 22 },
  
  /* Styly pro detail akce */
  backBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 15, alignSelf: 'flex-start' },
  backBtnText: { fontFamily: 'Inter_400Regular', color: '#8B5CF6', fontSize: 16, marginLeft: 5 },
  detailMainTitle: { fontFamily: 'Inter_400Regular', fontSize: 26, color: '#111827', marginBottom: 15, lineHeight: 32 },
  detailTimeLocationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' },
  wireframeImage: { width: '100%', height: 200, backgroundColor: '#E5E7EB', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  wireframeText: { fontFamily: 'Inter_400Regular', color: '#9CA3AF', marginTop: 10 },
  detailDescription: { fontFamily: 'Inter_400Regular', fontSize: 16, color: '#374151', lineHeight: 24, marginBottom: 30 },
  detailBottomRow: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', borderTopWidth: 1, borderColor: '#E5E7EB', paddingTop: 20, paddingBottom: 40 },
  
  /* Formular a zprava s chybou */
  formContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 10, marginBottom: 30, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  formTitle: { fontFamily: 'Inter_400Regular', fontSize: 18, marginBottom: 15, color: '#111827', fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 12, fontFamily: 'Inter_400Regular', fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB' },
  submitBtn: { backgroundColor: '#8B5CF6', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  submitBtnText: { color: 'white', fontFamily: 'Inter_400Regular', fontSize: 14, fontWeight: 'bold' },
  successText: { color: '#10B981', fontFamily: 'Inter_400Regular', fontSize: 15, textAlign: 'center', marginVertical: 10, fontWeight: 'bold' },
  errorText: { color: '#EF4444', fontFamily: 'Inter_400Regular', fontSize: 13, marginBottom: 12, lineHeight: 18 }, // NOVÉ STYLY PRO CHYBU

  dalsiContainer: { paddingTop: 20, paddingBottom: 40 },
  dalsiHlavniNadpis: { fontFamily: 'Inter_400Regular', fontSize: 26, color: '#000', marginBottom: 30, lineHeight: 34 },
  menuList: { marginBottom: 30 },
  menuItemWrapper: { marginBottom: 15 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  menuItemText: { fontFamily: 'Inter_400Regular', fontSize: 20, color: '#000' },
  menuExpandedContent: { marginTop: 10, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: '#8B5CF6' },
  menuExpandedText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#4B5563', lineHeight: 22 },
  contentLinkRow: { paddingVertical: 6, paddingLeft: 5 },
  contentInlineLink: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#4B5563' },
  socialContainer: { flexDirection: 'row', gap: 15, marginTop: 10 },
  socialCircleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  customSocialIcon: { width: 36, height: 36, borderRadius: 18, resizeMode: 'cover' },
  
  bottomNav: { flexDirection: 'row', justifyContent: 'space-evenly', backgroundColor: 'white', borderTopWidth: 1, borderColor: '#E5E7EB', height: Platform.OS === 'web' ? 60 : 'auto', alignItems: Platform.OS === 'web' ? 'center' : 'stretch', paddingTop: Platform.OS === 'web' ? 0 : 10, paddingBottom: Platform.OS === 'web' ? 0 : (Platform.OS === 'android' ? 50 : 40) },
  navItem: { flex: 1, alignItems: 'center', justifyContent: Platform.OS === 'web' ? 'center' : 'flex-start' },
  navText: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: Platform.OS === 'web' ? 2 : 4 }
});

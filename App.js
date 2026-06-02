import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Inter_400Regular } from '@expo-google-fonts/inter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar'; // PŘIDÁNO: Pro obarvení oblasti s hodinami a baterií

// --- GENERÁTOR MAPY ---
const generateMapHtml = (focusLat, focusLng, focusTitle) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { padding: 0; margin: 0; }
        html, body, #map { height: 100%; width: 100%; }
        
        .dzko-pin-wrapper { background: transparent; border: none; }
        .dzko-pin {
            width: 22px; height: 22px;
            background-color: #8B5CF6; border: 3px solid white;
            border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
            box-shadow: -2px 2px 5px rgba(0,0,0,0.4); margin: 2px auto 0 auto;
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

        var dzkoIcon = L.divIcon({
            className: 'dzko-pin-wrapper',
            html: '<div class="dzko-pin"></div>',
            iconSize: [28, 30], iconAnchor: [14, 30], popupAnchor: [0, -30]
        });

        var targetTitle = ${focusTitle ? `'${focusTitle}'` : 'null'};

        function pridejMisto(lat, lng, nazev) {
            var marker = L.marker([lat, lng], {icon: dzkoIcon}).addTo(map).bindPopup(nazev);
            if (targetTitle === nazev) {
                setTimeout(() => marker.openPopup(), 300);
            }
        }

        pridejMisto(49.5980481, 17.2610522, 'Mozarteum');
        pridejMisto(49.5904358, 17.2513681, 'Centrum judaistických studií');
        pridejMisto(49.5970906, 17.2627506, 'Židovská obec Olomouc');
        pridejMisto(49.5963561, 17.2563322, 'MUO CENTRAL');
        pridejMisto(49.5695, 17.2912, 'Sladovna Holice');
    </script>
</body>
</html>
`;

export default function App() {
  let [fontsLoaded] = useFonts({
    Inter_400Regular,
  });

  const dny = ['PO 12', 'ÚT 13', 'ST 14', 'ČT 15', 'PÁ 16', 'SO 17', 'NE 18'];
  const [vybranyDen, setVybranyDen] = useState('PO 12');
  const [aktivniTab, setAktivniTab] = useState('Program');
  const [oblibeneIds, setOblibeneIds] = useState([]);
  const [vybranyTag, setVybranyTag] = useState(null);
  const [mapFocus, setMapFocus] = useState(null);
  const [rozbaleno, setRozbaleno] = useState(null);

  useEffect(() => {
    const nactiOblibene = async () => {
      try {
        const ulozenaData = await AsyncStorage.getItem('@moje_srdicka');
        if (ulozenaData !== null) setOblibeneIds(JSON.parse(ulozenaData));
      } catch (error) { console.error('Chyba při načítání srdíček:', error); }
    };
    nactiOblibene();
  }, []); 

  const prednaskyVsechny = [
    { id: 1, den: 'PO 12', cas: 'PO 12 | 16:45 | CJS', nazev: 'Mährisch Deutsch a geniza', host: 'Lenka Uličná', tag: ['PŘEDNÁŠKA'] },
    { id: 2, den: 'PO 12', cas: 'PO 12 | 18:30 | Beseda', nazev: 'HLASY', host: '', tag: ['VERNISÁŽ', 'ZAHÁJENÍ'] },
    { id: 3, den: 'PO 12', cas: 'PO 12 | 20:00', nazev: 'Kafka Band', host: '', tag: ['KONCERT'] },
    { id: 4, den: 'ÚT 13', cas: 'ÚT 13 | 17:00 | Sladovna Holice', nazev: 'Olomoucké sladovny', host: 'Michael Viktořík', tag: ['PŘEDNÁŠKA'] },
    { id: 5, den: 'ÚT 13', cas: 'ÚT 13 | 19:00 | Central', nazev: 'Happy Days in Brno...; Dopisy z Brna', host: '', tag: ['FILM'] },
    { id: 6, den: 'ST 14', cas: 'ST 14 | 17:00 | Mozarteum', nazev: 'Brněnští německy píšící židovští autoři', host: 'Ingeborg Fialová', tag: ['PŘEDNÁŠKA'] },
    { id: 7, den: 'ST 14', cas: 'ST 14 | 18:00 | Central', nazev: 'Mladé víno z moravských (a českých) obcí', host: 'Anna Štičková, Klára Goldstein, Tim Postovit', tag: ['AUTORSKÉ ČTENÍ'] },
    { id: 8, den: 'ST 14', cas: 'ST 14 | 20:00 | Central', nazev: 'JAZZ', host: '', tag: ['KONCERT'] },
    { id: 9, den: 'ČT 15', cas: 'ČT 15 | 17:00', nazev: 'Brněnští židovští podnikatelé v kontextu textilního průmyslu', host: 'Michal Doležel', tag: ['PŘEDNÁŠKA'] },
    { id: 10, den: 'ČT 15', cas: 'ČT 15 | 19:00 | Central', nazev: 'Návrat do hořícího domu', host: '', tag: ['FILM'] },
    { id: 11, den: 'SO 17', cas: 'SO 17 | 10:00 | Prostějov', nazev: 'Hanácký Jeruzalém: Komentovaná prohlídka', host: '', tag: ['PROHLÍDKA'] },
    { id: 12, den: 'SO 17', cas: 'SO 17 | 15:30 | Mozarteum/Central?', nazev: 'Workshop pro rodiny s dětmi', host: '', tag: ['WORKSHOP'] },
    { id: 13, den: 'SO 17', cas: 'SO 17 | 17:00', nazev: 'Komentovaná prohlídka Centralu - rodina Donathových', host: 'Jan Jeništa/Saša Jeništa', tag: ['PROHLÍDKA'] },
    { id: 14, den: 'NE 18', cas: 'NE 18 | 10:00 | ŽOO, Komenského 9', nazev: 'Den otevřených dveří', host: '', tag: ['Den otevřených dveří'] },
    { id: 15, den: 'NE 18', cas: 'NE 18 | 11:00', nazev: 'Komentovaná prohlídka nového a starého židovského hřbitova v Olomouci', host: 'Daniel Soukup', tag: ['PROHLÍDKA'] },
    { id: 16, den: 'NE 18', cas: 'NE 18 | 20:00 | Kostel Panny Marie Sněžné?', nazev: 'Oratorium Josef', host: '', tag: ['KONCERT'] },
  ];

  const mapaLokace = {
    'CJS': { lat: 49.5904358, lng: 17.2513681, title: 'Centrum judaistických studií' },
    'Central': { lat: 49.5963561, lng: 17.2563322, title: 'MUO CENTRAL' },
    'Mozarteum': { lat: 49.5980481, lng: 17.2610522, title: 'Mozarteum' },
    'Mozarteum/Central?': { lat: 49.5963561, lng: 17.2563322, title: 'MUO CENTRAL' }, 
    'ŽOO, Komenského 9': { lat: 49.5970906, lng: 17.2627506, title: 'Židovská obec Olomouc' },
    'Sladovna Holice': { lat: 49.5695, lng: 17.2912, title: 'Sladovna Holice' }
  };

  const zobrazenePrednasky = vybranyTag
    ? prednaskyVsechny.filter(item => item.tag.includes(vybranyTag))
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
    setAktivniTab('Mapa');
  };

  const handleMenuPress = (nazev, type, content) => {
    if (type === 'link') {
      Linking.openURL(content);
    } else {
      setRozbaleno(rozbaleno === nazev ? null : nazev);
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
            // Změněno: Odkazy již nejsou podtržené ani fialové
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
        <Text style={styles.cardTitle}>{item.nazev}</Text>
        {item.host !== '' && <Text style={styles.cardHost}>host: {item.host}</Text>}
        <View style={styles.cardBottomRow}>
          <View style={styles.tagsContainer}>
            {item.tag.map((t, index) => (
              <TouchableOpacity key={index} style={styles.tagPill} onPress={() => setVybranyTag(t)} activeOpacity={0.7}>
                <Text style={styles.tagText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={() => prepniOblibene(item.id)} style={styles.heartIconBtn}>
            <Ionicons name={oblibeneIds.includes(item.id) ? "heart" : "heart-outline"} size={26} color="black" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!fontsLoaded) return <ActivityIndicator size="large" color="#8B5CF6" style={{flex: 1, justifyContent: 'center'}} />;

  return (
    <View style={{ flex: 1 }}>
      {/* Fialový status bar pro ikony baterie a signálu (bílé ikonky na fialové) */}
      <StatusBar style="light" backgroundColor="#8B5CF6" />
      
      {/* Horní bezpečnostní zóna - Fialová! */}
      <SafeAreaView style={{ flex: 0, backgroundColor: '#8B5CF6' }} />

      {/* Spodní hlavní tělo aplikace - Světle šedé */}
      <SafeAreaView style={styles.container}>
        
        <View style={styles.header}>
          <Text style={styles.headerText}>DŽKO</Text>
        </View>

        {aktivniTab === 'Mapa' ? (
          <View style={styles.mapTabContainer}>
            <Text style={styles.pageTitleInternal}>MAPA FESTIVALU</Text>
            {Platform.OS === 'web' ? (
              <iframe srcDoc={generateMapHtml(mapFocus?.lat, mapFocus?.lng, mapFocus?.title)} style={styles.webMap} frameBorder="0" />
            ) : (
              <Text style={styles.emptyText}>Mapa se načítá v prohlížeči.</Text>
            )}
          </View>
        ) : (
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
                  <TouchableOpacity style={styles.socialCircleBtn} onPress={() => Linking.openURL('https://muo.cz')}>
                    <Text style={styles.socialCircleText}>M</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.socialCircleBtn} onPress={() => Linking.openURL('https://facebook.com')}>
                    <Ionicons name="logo-facebook" size={22} color="white" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.socialCircleBtn} onPress={() => Linking.openURL('https://instagram.com')}>
                    <Ionicons name="logo-instagram" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {/* SPODNÍ NAVIGACE */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => setAktivniTab('Program')}>
            <Ionicons name={aktivniTab === 'Program' ? "calendar" : "calendar-outline"} size={24} color={aktivniTab === 'Program' ? '#8B5CF6' : 'black'} />
            <Text style={[styles.navText, { color: aktivniTab === 'Program' ? '#8B5CF6' : 'black' }]}>Program</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem} onPress={() => setAktivniTab('Oblíbené')}>
            <Ionicons name={aktivniTab === 'Oblíbené' ? "heart" : "heart-outline"} size={24} color={aktivniTab === 'Oblíbené' ? '#8B5CF6' : 'black'} />
            <Text style={[styles.navText, { color: aktivniTab === 'Oblíbené' ? '#8B5CF6' : 'black' }]}>Oblíbené</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => { setAktivniTab('Mapa'); setMapFocus(null); }}>
            <Ionicons name={aktivniTab === 'Mapa' ? "map" : "map-outline"} size={24} color={aktivniTab === 'Mapa' ? '#8B5CF6' : 'black'} />
            <Text style={[styles.navText, { color: aktivniTab === 'Mapa' ? '#8B5CF6' : 'black' }]}>Mapa</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => setAktivniTab('Další')}>
            <Ionicons name={aktivniTab === 'Další' ? "grid" : "grid-outline"} size={24} color={aktivniTab === 'Další' ? '#8B5CF6' : 'black'} />
            <Text style={[styles.navText, { color: aktivniTab === 'Další' ? '#8B5CF6' : 'black' }]}>Další</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#8B5CF6', padding: 20, paddingTop: Platform.OS === 'android' ? 30 : 15 },
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
  cardTitle: { fontFamily: 'Inter_400Regular', fontSize: 16, marginBottom: 10 },
  cardHost: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#374151', marginBottom: 10 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', flex: 1, paddingRight: 10 },
  tagPill: { backgroundColor: '#8B5CF6', alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 15, marginRight: 8, marginTop: 5 },
  tagText: { fontFamily: 'Inter_400Regular', color: 'white', fontSize: 12, lineHeight: 16 },
  heartIconBtn: { paddingBottom: 2, paddingLeft: 10 },
  emptyText: { fontFamily: 'Inter_400Regular', color: '#6B7280', textAlign: 'center', marginTop: 30, lineHeight: 22 },
  
  /* Sekce Další */
  dalsiContainer: { paddingTop: 20, paddingBottom: 40 },
  dalsiHlavniNadpis: { fontFamily: 'Inter_400Regular', fontSize: 26, color: '#000', marginBottom: 30, lineHeight: 34 },
  
  // Změněno: Přidáno paddingLeft pro posunutí celého menu a ikon doprava
  menuList: { marginBottom: 30, paddingLeft: 20 },
  menuItemWrapper: { marginBottom: 15 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  menuItemText: { fontFamily: 'Inter_400Regular', fontSize: 18, color: '#000' },
  menuExpandedContent: { marginTop: 10, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: '#8B5CF6' },
  menuExpandedText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#4B5563', lineHeight: 22 },
  contentLinkRow: { paddingVertical: 6, paddingLeft: 5 },
  
  // Změněno: Odkazy v sekci Pořadatelé vypadají jako normální text (bez podtržení, tmavě šedé)
  contentInlineLink: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#4B5563' },
  
  // Změněno: Posunutí sociálních ikon doprava
  socialContainer: { flexDirection: 'row', gap: 15, marginTop: 10, paddingLeft: 20 },
  socialCircleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  socialCircleText: { fontFamily: 'Inter_400Regular', color: 'white', fontSize: 20, fontWeight: 'bold', transform: [{ translateY: -1 }] },
  
  bottomNav: { flexDirection: 'row', justifyContent: 'space-evenly', backgroundColor: 'white', borderTopWidth: 1, borderColor: '#E5E7EB', height: Platform.OS === 'web' ? 60 : 'auto', alignItems: Platform.OS === 'web' ? 'center' : 'stretch', paddingTop: Platform.OS === 'web' ? 0 : 10, paddingBottom: Platform.OS === 'web' ? 0 : (Platform.OS === 'android' ? 50 : 40) },
  navItem: { flex: 1, alignItems: 'center', justifyContent: Platform.OS === 'web' ? 'center' : 'flex-start' },
  navText: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: Platform.OS === 'web' ? 2 : 4 }
});

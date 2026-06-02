import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Inter_400Regular } from '@expo-google-fonts/inter';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  let [fontsLoaded] = useFonts({
    Inter_400Regular,
  });

  // --- STAVY ---
  const dny = ['PO 12', 'ÚT 13', 'ST 14', 'ČT 15', 'PÁ 16', 'SO 17', 'NE 18'];
  const [vybranyDen, setVybranyDen] = useState('PO 12');
  const [aktivniTab, setAktivniTab] = useState('Program');
  const [oblibeneIds, setOblibeneIds] = useState([]);
  const [vybranyTag, setVybranyTag] = useState(null);

  // --- NAČTENÍ PAMĚTI PO ZAPNUTÍ APLIKACE ---
  useEffect(() => {
    const nactiOblibene = async () => {
      try {
        const ulozenaData = await AsyncStorage.getItem('@moje_srdicka');
        if (ulozenaData !== null) {
          setOblibeneIds(JSON.parse(ulozenaData));
        }
      } catch (error) {
        console.error('Chyba při načítání srdíček:', error);
      }
    };
    nactiOblibene();
  }, []); 

  // --- DATABÁZE AKCÍ ---
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
    { id: 14, den: 'NE 18', cas: 'NE 18 | 10:00 | ŽOO, Komenského 9', nazev: 'Den otevřených dveří', host: '', tag: ['ŽOO - Den otevřených dveří'] },
    { id: 15, den: 'NE 18', cas: 'NE 18 | 11:00', nazev: 'Komentovaná prohlídka nového a starého židovského hřbitova v Olomouci', host: 'Daniel Soukup', tag: ['PROHLÍDKA'] },
    { id: 16, den: 'NE 18', cas: 'NE 18 | 20:00 | Kostel Panny Marie Sněžné?', nazev: 'Oratorium Josef', host: '', tag: ['KONCERT'] },
  ];

  // --- LOGIKA FILTROVÁNÍ ---
  const zobrazenePrednasky = vybranyTag
    ? prednaskyVsechny.filter(item => item.tag.includes(vybranyTag))
    : (vybranyDen === 'VŠE' ? prednaskyVsechny : prednaskyVsechny.filter(item => item.den === vybranyDen));

  const oblibeneZobrazeni = prednaskyVsechny.filter(item => oblibeneIds.includes(item.id));

  // --- UKLÁDÁNÍ DO PAMĚTI ---
  const prepniOblibene = async (id) => {
    let novySeznam;
    if (oblibeneIds.includes(id)) {
      novySeznam = oblibeneIds.filter(item => item !== id);
    } else {
      novySeznam = [...oblibeneIds, id]; 
    }
    
    setOblibeneIds(novySeznam);
    
    try {
      await AsyncStorage.setItem('@moje_srdicka', JSON.stringify(novySeznam));
    } catch (error) {
      console.error('Chyba při ukládání srdíčka:', error);
    }
  };

  // --- VYKRESLENÍ KARTY ---
  const vykresliKartu = (item) => (
    <View key={item.id} style={styles.card}>
      <Text style={styles.cardTime}>{item.cas}</Text>
      <Text style={styles.cardTitle}>{item.nazev}</Text>
      {item.host !== '' && (
        <Text style={styles.cardHost}>host: {item.host}</Text>
      )}
      
      <View style={styles.cardBottomRow}>
        <View style={styles.tagsContainer}>
          {item.tag.map((t, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.tagPill} 
              onPress={() => setVybranyTag(t)}
              activeOpacity={0.7}
            >
              <Text style={styles.tagText}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity onPress={() => prepniOblibene(item.id)} style={styles.heartIconBtn}>
          <Ionicons 
            name={oblibeneIds.includes(item.id) ? "heart" : "heart-outline"} 
            size={26} 
            color="black" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#8B5CF6" style={{flex: 1, justifyContent: 'center'}} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.header}>
        <Text style={styles.headerText}>DŽKO</Text>
      </View>

      {/* POKUD JE AKTIVNÍ MAPA, NEBALÍME JI DO SCROLLVIEW (ABY ŠLO MAPOU POSOUVAT) */}
      {aktivniTab === 'Mapa' ? (
        <View style={styles.mapTabContainer}>
          <Text style={styles.pageTitleInternal}>MAPA FESTIVALU</Text>
          {Platform.OS === 'web' ? (
            <iframe 
              src="/mapa.html" 
              style={styles.webMap}
              frameBorder="0"
            />
          ) : (
            <Text style={styles.emptyText}>Mapa se načítá v prohlížeči.</Text>
          )}
        </View>
      ) : (
        <ScrollView style={styles.content}>
          
          {/* ZÁLOŽKA: PROGRAM */}
          {aktivniTab === 'Program' && (
            <>
              <TouchableOpacity 
                onPress={() => { setVybranyDen('VŠE'); setVybranyTag(null); }} 
                activeOpacity={0.7}
              >
                <Text style={styles.pageTitle}>
                  {vybranyTag ? `PROGRAM: ${vybranyTag}` : 'PROGRAM'}
                </Text>
              </TouchableOpacity>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysContainer}>
                {dny.map((den, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.dayPill, (vybranyDen === den && !vybranyTag) && styles.dayPillActive]}
                    onPress={() => { setVybranyDen(den); setVybranyTag(null); }} 
                  >
                    <Text style={[styles.dayText, (vybranyDen === den && !vybranyTag) && styles.dayTextActive]}>{den}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {zobrazenePrednasky.length > 0 ? (
                zobrazenePrednasky.map(vykresliKartu)
              ) : (
                <Text style={styles.emptyText}>Pro tento výběr zatím není naplánován žádný program.</Text>
              )}
            </>
          )}

          {/* ZÁLOŽKA: OBLÍBENÉ */}
          {aktivniTab === 'Oblíbené' && (
            <>
              <Text style={styles.pageTitle}>OBLÍBENÉ</Text>
              
              {oblibeneZobrazeni.length > 0 ? (
                oblibeneZobrazeni.map(vykresliKartu)
              ) : (
                <Text style={styles.emptyText}>Zatím si sem můžete přidat oblíbené akce z programu kliknutím na srdíčko vpravo dole na kartě.</Text>
              )}
            </>
          )}

          {/* ZÁLOŽKA: REZERVACE */}
          {aktivniTab === 'Rezervace' && (
            <>
              <Text style={styles.pageTitle}>REZERVACE</Text>
              <Text style={styles.emptyText}>Tato sekce se zatím připravuje.</Text>
            </>
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

        <TouchableOpacity style={styles.navItem} onPress={() => setAktivniTab('Mapa')}>
          <Ionicons name={aktivniTab === 'Mapa' ? "map" : "map-outline"} size={24} color={aktivniTab === 'Mapa' ? '#8B5CF6' : 'black'} />
          <Text style={[styles.navText, { color: aktivniTab === 'Mapa' ? '#8B5CF6' : 'black' }]}>Mapa</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setAktivniTab('Rezervace')}>
          <Ionicons name={aktivniTab === 'Rezervace' ? "ticket" : "ticket-outline"} size={24} color={aktivniTab === 'Rezervace' ? '#8B5CF6' : 'black'} />
          <Text style={[styles.navText, { color: aktivniTab === 'Rezervace' ? '#8B5CF6' : 'black' }]}>Rezervace</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#8B5CF6',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  headerText: {
    fontFamily: 'Inter_400Regular',
    color: 'white',
    fontSize: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
  },
  mapTabContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  pageTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 28,
    marginTop: 20,
    marginBottom: 15,
  },
  pageTitleInternal: {
    fontFamily: 'Inter_400Regular',
    fontSize: 28,
    marginTop: 20,
    marginBottom: 10,
  },
  webMap: {
    flex: 1,
    width: '100%',
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 0,
    minHeight: 350,
  },
  daysContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dayPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 6,
    backgroundColor: 'transparent',
  },
  dayPillActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  dayText: {
    fontFamily: 'Inter_400Regular',
    color: '#374151',
    fontSize: 13,
  },
  dayTextActive: {
    fontFamily: 'Inter_400Regular',
    color: 'white',
  },
  card: {
    backgroundColor: '#F3F4F6',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3, 
  },
  cardTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 5,
  },
  cardTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    marginBottom: 10,
  },
  cardHost: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#374151',
    marginBottom: 10,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end', 
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    paddingRight: 10,
  },
  tagPill: {
    backgroundColor: '#8B5CF6',
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginRight: 8,
    marginTop: 5, 
  },
  tagText: {
    fontFamily: 'Inter_400Regular',
    color: 'white',
    fontSize: 12,
    lineHeight: 16, 
  },
  heartIconBtn: {
    paddingBottom: 2, 
    paddingLeft: 10,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 30,
    lineHeight: 22,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    height: Platform.OS === 'web' ? 60 : 'auto',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
    paddingTop: Platform.OS === 'web' ? 0 : 10,
    paddingBottom: Platform.OS === 'web' ? 0 : (Platform.OS === 'android' ? 50 : 40), 
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-start',
  },
  navText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    marginTop: Platform.OS === 'web' ? 2 : 4,
  }
});

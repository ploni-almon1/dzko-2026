import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  SafeAreaView, 
  ActivityIndicator 
} from 'react-native';

export default function App() {
  const [activeDay, setActiveDay] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState('program');
  const [programData, setProgramData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Načtení dat z Airtable po spuštění aplikace
  useEffect(() => {
    // Vercel nám bezpečně podstrčí tyto klíče z trezoru
    const baseId = process.env.EXPO_PUBLIC_AIRTABLE_BASE_ID;
    const token = process.env.EXPO_PUBLIC_AIRTABLE_TOKEN;

    if (!baseId || !token) {
      setError('Chybí propojení s Airtable (nenalezeny tajné klíče).');
      setLoading(false);
      return;
    }

    fetch(`https://api.airtable.com/v0/${baseId}/Program`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Nepodařilo se načíst data z Airtable. Zkontroluj klíče.');
        }
        return response.json();
      })
      .then((data) => {
        // Převod formátu Airtable na čistá data pro aplikaci
        const upravenaData = data.records.map(record => {
          const f = record.fields;
          return {
            id: record.id,
            title: f['Název akce'] || 'Bez názvu',
            day: f['Den'] || 'PO 12',
            time: f['Čas'] || '--:--',
            location: f['Místo'] || 'Místo neurčeno',
            host: f['Host'] || '',
            tags: f['Tagy'] || [],
            description: f['Anotace'] || '',
            // Získání URL adresy nahraného obrázku
            image: f['Obrázek'] && f['Obrázek'][0] ? f['Obrázek'][0].url : ''
          };
        });

        // Seřazení programu podle času (od nejčasnějšího)
        upravenaData.sort((a, b) => a.time.localeCompare(b.time));

        setProgramData(upravenaData);
        
        // Nastavíme první dostupný den z programu jako aktivní
        if (upravenaData.length > 0) {
          setActiveDay(upravenaData[0].day);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Získání unikátních dnů pro navigační menu (vyfilruje duplicity a seřadí)
  const dnyMenu = [...new Set(programData.map(item => item.day))].sort();

  const toggleFavorite = (id) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(favId => favId !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const zobrazovanyProgram = activeTab === 'program' 
    ? programData.filter(item => item.day === activeDay)
    : programData.filter(item => favorites.includes(item.id));

  // Pokud stahujeme data z netu, ukaž fialové kolečko
  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={{ color: '#a1a1aa', marginTop: 15 }}>Načítám aktuální program...</Text>
      </View>
    );
  }

  // Pokud nastala chyba při stahování dat
  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: '#ef4444', textAlign: 'center', padding: 20 }}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HLAVIČKA */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DŽKO</Text>
      </View>

      {/* ZÁLOŽKA: PROGRAM / OBLÍBENÉ */}
      {(activeTab === 'program' || activeTab === 'favorites') && (
        <View style={{ flex: 1 }}>
          
          {/* HORZNÍ MENU DNŮ (pouze pro Program) */}
          {activeTab === 'program' && (
            <View style={{ height: 60 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysList}>
                {dnyMenu.map((den) => (
                  <TouchableOpacity 
                    key={den} 
                    style={[styles.dayButton, activeDay === den && styles.activeDayButton]}
                    onPress={() => setActiveDay(den)}
                  >
                    <Text style={[styles.dayButtonText, activeDay === den && styles.activeDayButtonText]}>
                      {den}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* VÝPIS PROGRAMU */}
          <ScrollView contentContainerStyle={styles.programList}>
            {zobrazovanyProgram.length === 0 ? (
              <Text style={styles.emptyText}>
                {activeTab === 'favorites' ? 'Zatím tu nemáš uložené žádné akce.' : 'Pro tento den zatím není žádný program.'}
              </Text>
            ) : (
              zobrazovanyProgram.map((akce) => (
                <View key={akce.id} style={styles.card}>
                  
                  {/* OBRÁZEK Z AIRTABLE */}
                  {akce.image ? (
                    <Image source={{ uri: akce.image }} style={styles.cardImage} />
                  ) : null}
                  
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTime}>{akce.time}  |  {akce.location}</Text>
                      <TouchableOpacity onPress={() => toggleFavorite(akce.id)} style={styles.favButton}>
                        <Text style={{ fontSize: 20 }}>
                          {favorites.includes(akce.id) ? '⭐' : '☆'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.cardTitle}>{akce.title}</Text>
                    {akce.host ? <Text style={styles.cardHost}>Host: {akce.host}</Text> : null}
                    
                    {/* ANOTACE */}
                    {akce.description ? (
                      <Text style={styles.cardDescription} numberOfLines={3}>
                        {akce.description}
                      </Text>
                    ) : null}

                    {/* TAGY */}
                    <View style={styles.tagsContainer}>
                      {akce.tags.map((tag, index) => (
                        <View key={index} style={styles.tagBadge}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* ZÁLOŽKA: MAPA */}
      {activeTab === 'map' && (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Zde bude interaktivní mapa festivalu.</Text>
        </View>
      )}

      {/* ZÁLOŽKA: DALŠÍ */}
      {activeTab === 'more' && (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Praktické informace, kontakty a partneři.</Text>
        </View>
      )}

      {/* SPODNÍ NAVIGACE */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('program')}>
          <Text style={{ fontSize: 20 }}>📅</Text>
          <Text style={[styles.navLabel, activeTab === 'program' && styles.activeNavLabel]}>Program</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('favorites')}>
          <Text style={{ fontSize: 20 }}>⭐</Text>
          <Text style={[styles.navLabel, activeTab === 'favorites' && styles.activeNavLabel]}>Moje</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('map')}>
          <Text style={{ fontSize: 20 }}>📍</Text>
          <Text style={[styles.navLabel, activeTab === 'map' && styles.activeNavLabel]}>Mapa</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('more')}>
          <Text style={{ fontSize: 20 }}>⚙️</Text>
          <Text style={[styles.navLabel, activeTab === 'more' && styles.activeNavLabel]}>Další</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    height: 60, 
    backgroundColor: '#8B5CF6', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a'
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },
  daysList: { paddingHorizontal: 10, alignItems: 'center', gap: 10 },
  dayButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#18181b' },
  activeDayButton: { backgroundColor: '#8B5CF6' },
  dayButtonText: { color: '#a1a1aa', fontWeight: '600' },
  activeDayButtonText: { color: '#fff' },
  programList: { padding: 15, gap: 15, paddingBottom: 100 },
  card: { backgroundColor: '#18181b', borderRadius: 12, overflow: 'hidden', borderHighlight: 1, borderColor: '#27272a' },
  cardImage: { width: '100%', height: 180, resizeMode: 'cover' },
  cardContent: { padding: 15 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  cardTime: { color: '#a1a1aa', fontSize: 13, fontWeight: '500' },
  favButton: { padding: 5 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  cardHost: { color: '#8B5CF6', fontSize: 14, fontWeight: '500', marginBottom: 5 },
  cardDescription: { color: '#d4d4d8', fontSize: 14, lineHeight: 20, marginBottom: 10 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagBadge: { backgroundColor: '#27272a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  emptyText: { color: '#71717a', textAlign: 'center', marginTop: 40, fontSize: 15 },
  bottomNavigation: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 70, backgroundColor: '#18181b', flexDirection: 'row',
    borderTopWidth: 1, borderTopColor: '#27272a', paddingBottom: 10
  },
  navItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navLabel: { color: '#71717a', fontSize: 11, marginTop: 4 },
  activeNavLabel: { color: '#8B5CF6', fontWeight: 'bold' }
});

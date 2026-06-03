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
// Přidáváme zpět profi ikony!
import { Ionicons } from '@expo/vector-icons';

export default function App() {
  const [activeDay, setActiveDay] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState('program');
  const [programData, setProgramData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Načtení dat z Airtable
  useEffect(() => {
    const baseId = process.env.EXPO_PUBLIC_AIRTABLE_BASE_ID;
    const token = process.env.EXPO_PUBLIC_AIRTABLE_TOKEN;

    if (!baseId || !token) {
      setError('Chybí propojení s Airtable klíči.');
      setLoading(false);
      return;
    }

    fetch(`https://api.airtable.com/v0/${baseId}/Program`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok) throw new Error('Nepodařilo se načíst data.');
        return response.json();
      })
      .then((data) => {
        // Zpracování dat a VYFILTROVÁNÍ prázdných řádků (aby nezavazely)
        const upravenaData = data.records
          .filter(record => record.fields['Název akce']) // Ignoruje prázdné řádky v Airtable
          .map(record => {
            const f = record.fields;
            return {
              id: record.id,
              title: f['Název akce'],
              day: f['Den'] || 'Neurčeno',
              time: f['Čas'] || '--:--',
              location: f['Místo'] || 'Neurčeno',
              host: f['Host'] || '',
              tags: f['Tagy'] || [],
              description: f['Anotace'] || '',
              image: f['Obrázek'] && f['Obrázek'][0] ? f['Obrázek'][0].url : ''
            };
          });

        upravenaData.sort((a, b) => a.time.localeCompare(b.time));
        setProgramData(upravenaData);
        
        if (upravenaData.length > 0) {
          setActiveDay(upravenaData[0].day);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

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

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: '#ef4444' }}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HLAVIČKA */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DŽKO</Text>
      </View>

      {/* OBSAH PROGRAMU */}
      {(activeTab === 'program' || activeTab === 'favorites') && (
        <View style={{ flex: 1 }}>
          
          {/* MENU DNŮ */}
          {activeTab === 'program' && dnyMenu.length > 0 && (
            <View style={{ height: 60, justifyContent: 'center' }}>
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

          {/* VÝPIS KARET */}
          <ScrollView contentContainerStyle={styles.programList}>
            {zobrazovanyProgram.length === 0 ? (
              <Text style={styles.emptyText}>
                {activeTab === 'favorites' ? 'Nemáš uložené žádné akce.' : 'Pro tento den není žádný program.'}
              </Text>
            ) : (
              zobrazovanyProgram.map((akce) => (
                <View key={akce.id} style={styles.card}>
                  
                  {akce.image ? (
                    <Image source={{ uri: akce.image }} style={styles.cardImage} />
                  ) : null}
                  
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTime}>{akce.time}  |  {akce.location}</Text>
                      {/* Profi ikona pro oblíbené */}
                      <TouchableOpacity onPress={() => toggleFavorite(akce.id)} style={styles.favButton}>
                        <Ionicons 
                          name={favorites.includes(akce.id) ? "star" : "star-outline"} 
                          size={24} 
                          color="#8B5CF6" 
                        />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.cardTitle}>{akce.title}</Text>
                    {akce.host ? <Text style={styles.cardHost}>Host: {akce.host}</Text> : null}
                    
                    {akce.description ? (
                      <Text style={styles.cardDescription} numberOfLines={4}>
                        {akce.description}
                      </Text>
                    ) : null}

                    {akce.tags && akce.tags.length > 0 ? (
                      <View style={styles.tagsContainer}>
                        {akce.tags.map((tag, index) => (
                          <View key={index} style={styles.tagBadge}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* OSTATNÍ ZÁLOŽKY */}
      {activeTab === 'map' && <View style={styles.center}><Text style={styles.emptyText}>Interaktivní mapa</Text></View>}
      {activeTab === 'more' && <View style={styles.center}><Text style={styles.emptyText}>Praktické informace</Text></View>}

      {/* SPODNÍ NAVIGACE S PROFI IKONAMI */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('program')}>
          <Ionicons name={activeTab === 'program' ? "calendar" : "calendar-outline"} size={24} color={activeTab === 'program' ? '#8B5CF6' : '#71717a'} />
          <Text style={[styles.navLabel, activeTab === 'program' && styles.activeNavLabel]}>Program</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('favorites')}>
          <Ionicons name={activeTab === 'favorites' ? "star" : "star-outline"} size={24} color={activeTab === 'favorites' ? '#8B5CF6' : '#71717a'} />
          <Text style={[styles.navLabel, activeTab === 'favorites' && styles.activeNavLabel]}>Moje</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('map')}>
          <Ionicons name={activeTab === 'map' ? "map" : "map-outline"} size={24} color={activeTab === 'map' ? '#8B5CF6' : '#71717a'} />
          <Text style={[styles.navLabel, activeTab === 'map' && styles.activeNavLabel]}>Mapa</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('more')}>
          <Ionicons name={activeTab === 'more' ? "menu" : "menu-outline"} size={24} color={activeTab === 'more' ? '#8B5CF6' : '#71717a'} />
          <Text style={[styles.navLabel, activeTab === 'more' && styles.activeNavLabel]}>Další</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' }, // Ještě temnější elegantní pozadí
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
  daysList: { paddingHorizontal: 15, alignItems: 'center', gap: 10 },
  dayButton: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a' },
  activeDayButton: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
  dayButtonText: { color: '#a1a1aa', fontWeight: '600', fontSize: 14 },
  activeDayButtonText: { color: '#fff' },
  programList: { padding: 15, gap: 20, paddingBottom: 100 }, // Větší mezery mezi kartami
  card: { backgroundColor: '#18181b', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#27272a' },
  cardImage: { width: '100%', height: 200, resizeMode: 'cover' },
  cardContent: { padding: 18 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTime: { color: '#a1a1aa', fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  favButton: { padding: 4 },
  cardTitle: { color: '#f4f4f5', fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  cardHost: { color: '#a78bfa', fontSize: 15, fontWeight: '600', marginBottom: 10 },
  cardDescription: { color: '#d4d4d8', fontSize: 15, lineHeight: 22, marginBottom: 16 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagBadge: { backgroundColor: '#27272a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  tagText: { color: '#e4e4e7', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
  emptyText: { color: '#71717a', textAlign: 'center', marginTop: 40, fontSize: 16 },
  bottomNavigation: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 80, backgroundColor: '#18181b', flexDirection: 'row',
    borderTopWidth: 1, borderTopColor: '#27272a', paddingBottom: 20
  },
  navItem: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 10 },
  navLabel: { color: '#71717a', fontSize: 10, marginTop: 4, fontWeight: '500' },
  activeNavLabel: { color: '#8B5CF6', fontWeight: 'bold' }
});


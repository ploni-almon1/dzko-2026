import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  SafeAreaView, 
  ActivityIndicator 
} from 'react-native';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [diagnostika, setDiagnostika] = useState({
    tokenNalezen: false,
    tokenDelka: 0,
    baseIdNalezen: false,
    baseIdDelka: 0,
    httpStatus: null,
    airtableChyba: null,
    surovaData: null
  });

  useEffect(() => {
    const baseId = process.env.EXPO_PUBLIC_AIRTABLE_BASE_ID;
    const token = process.env.EXPO_PUBLIC_AIRTABLE_TOKEN;

    // Krok 1: Kontrola přítomnosti klíčů
    setDiagnostika(prev => ({
      ...prev,
      tokenNalezen: !!token,
      tokenDelka: token ? token.length : 0,
      baseIdNalezen: !!baseId,
      baseIdDelka: baseId ? baseId.length : 0,
    }));

    if (!baseId || !token) {
      setLoading(false);
      return;
    }

    // Krok 2: Pokus o načtení s detailním odchytáváním chyb
    fetch(`https://api.airtable.com/v0/${baseId}/Program`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        setDiagnostika(prev => ({ ...prev, httpStatus: response.status }));
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `HTTP Chyba ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setDiagnostika(prev => ({ 
          ...prev, 
          airtableChyba: 'ŽÁDNÁ (Spojení je 100% úspěšné!)',
          surovaData: `Načteno v pořádku. Počet řádků: ${data.records?.length || 0}`
        }));
        setLoading(false);
      })
      .catch((err) => {
        setDiagnostika(prev => ({ ...prev, airtableChyba: err.message }));
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={{ color: '#fff', marginTop: 15 }}>Detektiv vyšetřuje spojení...</Text>
      </View>
    );
  }

  // VYHODNOCENÍ DETEKTIVA NA OBRAZOVCE
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🕵️‍♂️ AIRTABLE DETEKTIV</Text>
      </View>
      
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        
        {/* BLOK 1: KONTROLA VERCELU */}
        <View style={styles.box}>
          <Text style={styles.boxTitle}>1. Kontrola proměnných ve Vercelu</Text>
          
          <Text style={styles.label}>EXPO_PUBLIC_AIRTABLE_BASE_ID:</Text>
          <Text style={diagnostika.baseIdNalezen ? styles.ok : styles.error}>
            {diagnostika.baseIdNalezen ? `✅ NALEZENO (Délka: ${diagnostika.baseIdDelka} znaků)` : '❌ CHYBÍ! Vercel ho nevidí.'}
          </Text>

          <Text style={styles.label}>EXPO_PUBLIC_AIRTABLE_TOKEN:</Text>
          <Text style={diagnostika.tokenNalezen ? styles.ok : styles.error}>
            {diagnostika.tokenNalezen ? `✅ NALEZENO (Délka: ${diagnostika.tokenDelka} znaků)` : '❌ CHYBÍ! Vercel ho nevidí.'}
          </Text>
        </View>

        {/* BLOK 2: ODPOVĚĎ OD AIRTABLE */}
        <View style={styles.box}>
          <Text style={styles.boxTitle}>2. Výsledek síťového požadavku</Text>
          
          <Text style={styles.label}>HTTP Status kód serveru:</Text>
          <Text style={[styles.value, diagnostika.httpStatus === 200 ? styles.ok : styles.error]}>
            {diagnostika.httpStatus ? diagnostika.httpStatus : 'Požadavek vůbec neodešel'}
          </Text>

          <Text style={styles.label}>Důvod chyby z Airtablu:</Text>
          <Text style={[styles.value, diagnostika.httpStatus === 200 ? styles.ok : styles.error]}>
            {diagnostika.airtableChyba ? diagnostika.airtableChyba : 'Zatím žádný'}
          </Text>
        </View>

        {/* BLOK 3: RADY CO DĚLAT */}
        <View style={styles.box}>
          <Text style={styles.boxTitle}>💡 Co z toho vyplývá?</Text>
          
          {!diagnostika.baseIdNalezen || !diagnostika.tokenNalezen ? (
            <Text style={styles.instruction}>
              Vercel proměnné vůbec nenačetl. Buď jsi zapomněl po uložení proměnných na Vercelu udělat nový "Commit" na GitHubu (aby se web přebudoval), nebo je v názvech proměnných překlep.
            </Text>
          ) : diagnostika.httpStatus === 401 ? (
            <Text style={styles.instruction}>
              Chyba 401 znamená "Unauthorized". Tvůj token (`pat...`) sice dorazil do Airtablu, ale Airtable ho neuznal jako správné heslo. Zkontroluj, zda jsi ho nezkopíroval neúplný, nebo zda jsi mu při vytváření v Developer Hubu nezapomněl přiřadit přístup k této databázi!
            </Text>
          ) : diagnostika.httpStatus === 404 ? (
            <Text style={styles.instruction}>
              Chyba 404 znamená "Not Found". Spojení a heslo je správné, ale Airtable nenašel to, co hledá. Buď máš v proměnné `AIRTABLE_BASE_ID` překlep (ID databáze `app...`), nebo se tvoje záložka v Airtable nejmenuje přesně "Program" (pozor na velká písmena a mezery!).
            </Text>
          ) : diagnostika.httpStatus === 200 ? (
            <Text style={styles.ok}>
              Vše funguje! Data tečou. Můžeme detektiva smazat a vrátit tam design programu. Vyzkoušeno: {diagnostika.surovaData}
            </Text>
          ) : (
            <Text style={styles.instruction}>
              Neznámá chyba. Ujisti se, že jsi v Airtable správně vytvořil sloupec "Obrázek" typu Attachment a "Anotace" typu Long Text.
            </Text>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0a09' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { height: 60, backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  box: { backgroundColor: '#1c1917', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#2e2a24' },
  boxTitle: { color: '#a78bfa', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  label: { color: '#78716c', fontSize: 12, marginTop: 8 },
  value: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 2 },
  ok: { color: '#22c55e', fontWeight: 'bold', fontSize: 14, marginTop: 2 },
  error: { color: '#ef4444', fontWeight: 'bold', fontSize: 14, marginTop: 2 },
  instruction: { color: '#d6d3d1', fontSize: 13, lineHeight: 18, marginTop: 5 }
});


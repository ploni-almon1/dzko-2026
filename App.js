import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Platform, Linking, Image, TextInput, Alert, Modal, useWindowDimensions, Share, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Inter_400Regular } from '@expo-google-fonts/inter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

import Footer from './src/components/Footer';
import EventCard from './src/components/EventCard';
import EventDetail from './src/components/EventDetail';
import Header from './src/components/Header';
import SpeakerModal from './src/components/SpeakerModal';
import FilterModal from './src/components/FilterModal';
import MobileNav from './src/components/MobileNav';

import { styles } from './src/styles';
import useAirtableData from './src/useAirtableData';

import HomeScreen from './src/components/HomeScreen';
import ProgramScreen from './src/components/ProgramScreen';
import OblibeneScreen from './src/components/OblibeneScreen';
import DalsiScreen from './src/components/DalsiScreen';

import HosteScreen from './src/components/HosteScreen';
import PartneriScreen from './src/components/PartneriScreen';

import { generateMapHtml, ziskejVychoziDen, stahniKalendar } from './src/utils';
import CustomLoader from './src/components/CustomLoader';

// ZDE JE TVOJE CENTRÁLNÍ BARVA PRO CELOU APLIKACI
const DEFAULT_THEME_COLOR = '#3A24DC';

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

// 👇 FUNKCE PRO PŘIDÁNÍ DO KALENDÁŘE 👇
const stahniKalendar = (akce) => {
  const denCislo = akce.den.replace(/[^0-9]/g, ''); 
  
  let casZacatek = '00:00';
  const casParts = akce.cas.split(' | ');
  if (casParts.length > 1) {
      casZacatek = casParts[1].trim(); 
  }

  const zDate = `202610${denCislo}T${casZacatek.replace(':', '')}00`;
  
  let hodinaZacatek = parseInt(casZacatek.split(':')[0], 10);
  let konecDate = `202610${denCislo}T${String(hodinaZacatek + 1).padStart(2, '0')}${casZacatek.split(':')[1] || '00'}00`;

  const mistoText = casParts.length > 2 ? casParts[2] : 'Olomouc';

  const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//DZKO//Festival//CS\nBEGIN:VEVENT\nUID:${akce.id}@dzko.cz\nDTSTAMP:${zDate}\nDTSTART:${zDate}\nDTEND:${konecDate}\nSUMMARY:${akce.nazev}\nLOCATION:${mistoText}\nDESCRIPTION:Festival Dny židovské kultury Olomouc. ${akce.popis ? akce.popis.replace(/\n/g, '\\n') : ''}\nEND:VEVENT\nEND:VCALENDAR`;

  if (Platform.OS === 'web') {
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `${akce.nazev.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  } else {
      const startDate = `202610${denCislo}T${casZacatek.replace(':', '')}00Z`; 
      const endDate = `202610${denCislo}T${String(hodinaZacatek + 1).padStart(2, '0')}${casZacatek.split(':')[1] || '00'}00Z`;
      const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(akce.nazev)}&dates=${startDate}/${endDate}&details=${encodeURIComponent('Festival Dny židovské kultury Olomouc.')}&location=${encodeURIComponent(mistoText)}`;
      Linking.openURL(googleCalUrl);
  }
};
export default function App() {
  let [fontsLoaded] = useFonts({
    Inter_400Regular,
  });

  const { width } = useWindowDimensions();
  
  const jeProhlizecPocitac = Platform.OS === 'web' && typeof navigator !== 'undefined' 
    ? !/Mobi|Android|iPhone/i.test(navigator.userAgent) 
    : false;

  const isDesktop = width >= 1024 || jeProhlizecPocitac;
  const dny = ['PO 12', 'ÚT 13', 'ST 14', 'ČT 15', 'PÁ 16', 'SO 17', 'NE 18'];
  
  const [aktivniTab, setAktivniTab] = useState(Platform.OS === 'web' && window.innerWidth >= 1024 ? 'Home' : 'Program');
  const [vybranyDen, setVybranyDen] = useState(ziskejVychoziDen());
  const [vybranyTag, setVybranyTag] = useState(null);

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterSubModalVisible, setFilterSubModalVisible] = useState(null);
  const vychoziFiltry = { den: [], typ: [], misto: [], hoste: [] };
  const [activeFilters, setActiveFilters] = useState(vychoziFiltry);
  const [tempFilters, setTempFilters] = useState(vychoziFiltry);
  
  const [sdilenyVyberIds, setSdilenyVyberIds] = useState(null); 
  const [mapFocus, setMapFocus] = useState(null);
  const [rozbaleno, setRozbaleno] = useState(null);
  
  const [detailAkce, setDetailAkce] = useState(null);
  const [historieAkce, setHistorieAkce] = useState(null); 
  const [mapaModalVisible, setMapaModalVisible] = useState(false); 
  const [homeMapaZvetsena, setHomeMapaZvetsena] = useState(false);

  const [zobrazitNastaveniBarvy, setZobrazitNastaveniBarvy] = useState(false);
  const [novaBarvaInput, setNovaBarvaInput] = useState('');
  const [hoveredPartnerId, setHoveredPartnerId] = useState(null);

  const detailScrollViewRef = useRef(null);
  const hlavniScrollY = useRef(0);
  const hlavniScrollViewRef = useRef(null);

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

  const {
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
  } = useAirtableData(
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
  );
  
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
    const aktualniAkce = prednaskyVsechny.find(i => i.id === id);
    const novyPocetVAirtable = Math.max(0, (aktualniAkce?.pocetOblibenych || 0) + zmena);

    setPrednaskyVsechny(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, pocetOblibenych: novyPocetVAirtable };
      }
      return item;
    }));

    if (detailAkce && detailAkce.id === id) {
      setDetailAkce(prev => ({ ...prev, pocetOblibenych: novyPocetVAirtable }));
    }

    try {
      await fetch(`/api/oblibene`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, novyPocet: novyPocetVAirtable })
      });
    } catch (err) {
      console.error('Nepodařilo se odeslat srdíčko na server:', err);
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
    const novyPocetRezervaci = (detailAkce.pocetRezervaci || 0) + 1;

    try {
      const response = await fetch(`/api/rezervace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rezervaceData: {
            records: [{
              fields: {
                "Akce ID": detailAkce.nazev,
                "Jméno": rezervaceJmeno,
                "Email": rezervaceEmail
              }
            }]
          },
          programId: detailAkce.id,
          novyPocetRezervaci: novyPocetRezervaci
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setRezervaceChyba(`Zamítnuto: ${errorData?.error || 'Neznámý problém'}`);
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
      
      // Upravíme číslo na obrazovce
      setDetailAkce(prev => ({ ...prev, pocetRezervaci: novyPocetRezervaci }));
      setPrednaskyVsechny(prev => prev.map(item => 
        item.id === detailAkce.id ? { ...item, pocetRezervaci: novyPocetRezervaci } : item
      ));

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

  

  const speakerEvents = aktivniSelectedSpeaker 
    ? prednaskyVsechny.filter(item => item.hoste.some(h => h.jmeno === aktivniSelectedSpeaker.jmeno))
    : [];

  if (!fontsLoaded || loading) return <CustomLoader themeColor={themeColor} />;
  if (error) return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text style={{color: 'red'}}>{error}</Text></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      <StatusBar style="dark" backgroundColor="#F3F4F6" translucent={false} />
      <SafeAreaView style={[styles.mainContainer, { backgroundColor: '#F3F4F6' }]}>
        
        <Header 
          isDesktop={isDesktop}
          themeColor={themeColor}
          aktivniTab={aktivniTab}
          setAktivniTab={setAktivniTab}
          detailAkce={detailAkce}
          setDetailAkce={setDetailAkce}
          oblibeneIds={oblibeneIds}
          setVybranyDen={setVybranyDen}
          setVybranyTag={setVybranyTag}
          setActiveFilters={setActiveFilters}
          vychoziFiltry={vychoziFiltry}
          programDropdownVisible={programDropdownVisible}
          setProgramDropdownVisible={setProgramDropdownVisible}
          hoveredMenuItem={hoveredMenuItem}
          setHoveredMenuItem={setHoveredMenuItem}
          setRozbaleno={setRozbaleno}
        />

        <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
          
          {aktivniTab === 'Home' && isDesktop && !detailAkce && (
  <HomeScreen 
    isDesktop={isDesktop}
    heroImage={heroImage}
    themeColor={themeColor}
    setAktivniTab={setAktivniTab}
    highlightAkce={highlightAkce}
    zobrazitObrazky={zobrazitObrazky}
    mojeRezervace={mojeRezervace}
    oblibeneIds={oblibeneIds}
    otevriDetail={otevriDetail}
    handleLocationClick={handleLocationClick}
    clickTagNaProgram={clickTagNaProgram}
    prepniOblibene={prepniOblibene}
    generateMapHtml={generateMapHtml}
    prednaskyVsechny={prednaskyVsechny}
  />
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
                  srcDoc={generateMapHtml(mapFocus?.lat, mapFocus?.lng, mapFocus?.title, themeColor, false, false, prednaskyVsechny)} 
                  style={{ width: '100%', flex: 1, border: 'none' }} 
                  allow="geolocation" 
                />
              ) : (
                <Text style={styles.emptyText}>Mapa se načítá v prohlížeči.</Text>
              )}
            </View>
          )}

          {aktivniTab === 'Hoste' && !detailAkce && (
  <HosteScreen 
    isDesktop={isDesktop}
    themeColor={themeColor}
    hosteVsechny={hosteVsechny}
    setAktivniSelectedSpeaker={setAktivniSelectedSpeaker}
    setSpeakerModalVisible={setSpeakerModalVisible}
  />
)}

          {aktivniTab === 'Partneri' && !detailAkce && (
  <PartneriScreen 
    isDesktop={isDesktop}
    themeColor={themeColor}
    partneri={partneri}
    hoveredPartnerId={hoveredPartnerId}
    setHoveredPartnerId={setHoveredPartnerId}
  />
)}

          {aktivniTab === 'Program' && !detailAkce && (
  <ProgramScreen 
    isDesktop={isDesktop}
    themeColor={themeColor}
    dny={dny}
    vybranyDen={vybranyDen}
    setVybranyDen={setVybranyDen}
    vybranyTag={vybranyTag}
    setVybranyTag={setVybranyTag}
    activeFilters={activeFilters}
    setActiveFilters={setActiveFilters}
    vychoziFiltry={vychoziFiltry}
    hasActiveFilters={hasActiveFilters}
    zobrazitObrazky={zobrazitObrazky}
    prepniObrazky={prepniObrazky}
    setTempFilters={setTempFilters}
    setFilterModalVisible={setFilterModalVisible}
    zobrazenePrednasky={zobrazenePrednasky}
    mojeRezervace={mojeRezervace}
    oblibeneIds={oblibeneIds}
    otevriDetail={otevriDetail}
    handleLocationClick={handleLocationClick}
    clickTagNaProgram={clickTagNaProgram}
    prepniOblibene={prepniOblibene}
    hlavniScrollViewRef={hlavniScrollViewRef}
    hlavniScrollY={hlavniScrollY}
  />
)}
                
          {aktivniTab === 'Oblíbené' && !detailAkce && (
  <OblibeneScreen 
    isDesktop={isDesktop}
    themeColor={themeColor}
    dny={dny}
    vybranyDen={vybranyDen}
    setVybranyDen={setVybranyDen}
    vybranyTag={vybranyTag}
    setVybranyTag={setVybranyTag}
    sdilenyVyberIds={sdilenyVyberIds}
    setSdilenyVyberIds={setSdilenyVyberIds}
    zobrazitObrazky={zobrazitObrazky}
    prepniObrazky={prepniObrazky}
    oblibeneIds={oblibeneIds}
    oblibeneZobrazeni={oblibeneZobrazeni}
    sdiletOblibene={sdiletOblibene}
    mojeRezervace={mojeRezervace}
    otevriDetail={otevriDetail}
    handleLocationClick={handleLocationClick}
    clickTagNaProgram={clickTagNaProgram}
    prepniOblibene={prepniOblibene}
    hlavniScrollViewRef={hlavniScrollViewRef}
    hlavniScrollY={hlavniScrollY}
  />
)}
                
          {aktivniTab === 'Další' && !detailAkce && (
  <DalsiScreen 
    isDesktop={isDesktop}
    themeColor={themeColor}
    setAktivniTab={setAktivniTab}
    rozbaleno={rozbaleno}
    setRozbaleno={setRozbaleno}
    zobrazitNastaveniBarvy={zobrazitNastaveniBarvy}
    setZobrazitNastaveniBarvy={setZobrazitNastaveniBarvy}
    novaBarvaInput={novaBarvaInput}
    setNovaBarvaInput={setNovaBarvaInput}
    ulozNovyMotiv={ulozNovyMotiv}
  />
)}

          {detailAkce && (
            <EventDetail 
              item={detailAkce}
              isDesktop={isDesktop}
              themeColor={themeColor}
              mojeRezervace={mojeRezervace}
              oblibeneIds={oblibeneIds}
              rezervaceJmeno={rezervaceJmeno}
              setRezervaceJmeno={setRezervaceJmeno}
              rezervaceEmail={rezervaceEmail}
              setRezervaceEmail={setRezervaceEmail}
              odesilaRezervaci={odesilaRezervaci}
              rezervaceOdeslana={rezervaceOdeslana}
              rezervaceChyba={rezervaceChyba}
              chciDalsiRezervaci={chciDalsiRezervaci}
              setChciDalsiRezervaci={setChciDalsiRezervaci}
              handleOdeslatRezervaci={handleOdeslatRezervaci}
              setDetailAkce={setDetailAkce}
              handleLocationClick={handleLocationClick}
              sdiletAkci={sdiletAkci}
              clickTagNaProgram={clickTagNaProgram}
              prepniOblibene={prepniOblibene}
              setAktivniSelectedSpeaker={setAktivniSelectedSpeaker}
              setSpeakerModalVisible={setSpeakerModalVisible}
              stahniKalendar={stahniKalendar}
              detailScrollViewRef={detailScrollViewRef}
            />
          )}

          <SpeakerModal 
            visible={speakerModalVisible}
            onClose={() => setSpeakerModalVisible(false)}
            speaker={aktivniSelectedSpeaker}
            isDesktop={isDesktop}
            themeColor={themeColor}
            speakerEvents={speakerEvents}
            detailAkce={detailAkce}
            prejitNaAkciHost={prejitNaAkciHost}
          />

          <FilterModal 
            filterModalVisible={filterModalVisible}
            setFilterModalVisible={setFilterModalVisible}
            filterSubModalVisible={filterSubModalVisible}
            setFilterSubModalVisible={setFilterSubModalVisible}
            tempFilters={tempFilters}
            setTempFilters={setTempFilters}
            setActiveFilters={setActiveFilters}
            vychoziFiltry={vychoziFiltry}
            themeColor={themeColor}
            filterOptions={filterOptions}
            filterLabels={filterLabels}
            setVybranyDen={setVybranyDen}
            setVybranyTag={setVybranyTag}
          />

          <MobileNav 
            isDesktop={isDesktop}
            aktivniTab={aktivniTab}
            setAktivniTab={setAktivniTab}
            detailAkce={detailAkce}
            setDetailAkce={setDetailAkce}
            themeColor={themeColor}
            setVybranyDen={setVybranyDen}
            setVybranyTag={setVybranyTag}
            setActiveFilters={setActiveFilters}
            vychoziFiltry={vychoziFiltry}
            setMapFocus={setMapFocus}
            setHistorieAkce={setHistorieAkce}
          />
        </View>

        {homeMapaZvetsena && (
           <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, backgroundColor: '#F3F4F6' }}>
              {Platform.OS === 'web' ? (
                <iframe 
                  key="fullscreen-home-map-2" 
                  srcDoc={generateMapHtml(null, null, null, themeColor, true, true, prednaskyVsechny)} 
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
                  srcDoc={generateMapHtml(mapFocus?.lat, mapFocus?.lng, mapFocus?.title, themeColor, false, false, prednaskyVsechny)} 
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

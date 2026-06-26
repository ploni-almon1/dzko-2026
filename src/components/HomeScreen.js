import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, Image, Platform } from 'react-native';
import EventCard from './EventCard';
import Footer from './Footer';
import { styles } from '../styles';

export default function HomeScreen({
  isDesktop,
  heroImage,
  themeColor,
  setAktivniTab,
  highlightAkce,
  zobrazitObrazky,
  mojeRezervace,
  oblibeneIds,
  otevriDetail,
  handleLocationClick,
  clickTagNaProgram,
  prepniOblibene,
  generateMapHtml,
  prednaskyVsechny
}) {
  return (
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
              {highlightAkce.map(item => <EventCard 
                key={item.id}
                item={item} 
                forceGrid={true} 
                zobrazitObrazky={zobrazitObrazky} 
                isDesktop={isDesktop} 
                mojeRezervace={mojeRezervace} 
                themeColor={themeColor} 
                oblibeneIds={oblibeneIds} 
                otevriDetail={otevriDetail} 
                handleLocationClick={handleLocationClick} 
                clickTagNaProgram={clickTagNaProgram} 
                prepniOblibene={prepniOblibene} 
              />)}
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
                 srcDoc={generateMapHtml(null, null, null, themeColor, true, false, prednaskyVsechny)} 
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
      {isDesktop && <Footer isDesktop={isDesktop} />}
    </ScrollView>
  );
}
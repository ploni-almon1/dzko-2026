import React from 'react';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EventCard from './EventCard';
import Footer from './Footer';
import { styles } from '../styles';

export default function OblibeneScreen({
  isDesktop,
  themeColor,
  dny,
  vybranyDen,
  setVybranyDen,
  vybranyTag,
  setVybranyTag,
  sdilenyVyberIds,
  setSdilenyVyberIds,
  zobrazitObrazky,
  prepniObrazky,
  oblibeneIds,
  oblibeneZobrazeni,
  sdiletOblibene,
  mojeRezervace,
  otevriDetail,
  handleLocationClick,
  clickTagNaProgram,
  prepniOblibene,
  hlavniScrollViewRef,
  hlavniScrollY
}) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} ref={hlavniScrollViewRef} scrollEventThrottle={16} onScroll={(e) => { hlavniScrollY.current = e.nativeEvent.contentOffset.y; }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 1270, alignSelf: 'center', paddingHorizontal: 15 }}>
          <View style={[isDesktop ? styles.desktopContainer : null, { paddingBottom: 20 }]}>
            
            <View style={styles.pageTitleContainer}>
              <TouchableOpacity onPress={() => { setVybranyDen('VŠE'); setVybranyTag(null); }} activeOpacity={0.7} style={{ flex: 1 }}>
                <Text style={styles.pageTitle}>{sdilenyVyberIds ? 'SDÍLENÝ VÝBĚR' : 'OBLÍBENÉ'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={prepniObrazky} style={styles.toggleViewBtn}>
                <Ionicons name={zobrazitObrazky ? "reorder-three-outline" : "grid-outline"} size={24} color="black" />
              </TouchableOpacity>
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
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.daysContainer, isDesktop && styles.desktopDaysContainer, !isDesktop && { marginBottom: 8 }]}>
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

            {isDesktop && !sdilenyVyberIds && oblibeneIds.length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 20, justifyContent: 'flex-start', zIndex: 10 }}>
                <TouchableOpacity onPress={sdiletOblibene} style={styles.filterTriggerBtn} activeOpacity={0.7}>
                  <Ionicons name="share-social-outline" size={16} color={themeColor} />
                  <Text style={[styles.filterTriggerText, { color: themeColor }]}>Sdílet výběr</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={{ paddingBottom: 20, marginTop: !isDesktop ? 15 : 0 }}>
              {oblibeneZobrazeni.length > 0 ? (
                dny.map((den, index) => {
                  if (vybranyDen !== 'VŠE' && vybranyDen !== den) return null;
                  const akceDne = oblibeneZobrazeni.filter(item => item.den === den);
                  if (akceDne.length === 0) return null;

                  const isFirstVisibleDay = dny.find(d => 
                    (vybranyDen !== 'VŠE' && vybranyDen !== d) ? false : oblibeneZobrazeni.some(item => item.den === d)
                  ) === den;
                  
                  return (
                    <View key={index} style={{ marginBottom: 25 }}>
                      
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15 }}>
                        <Text style={[styles.favoriteDayHeader, { marginBottom: 0 }]}>{den}</Text>
                        
                        {!isDesktop && isFirstVisibleDay && !sdilenyVyberIds && oblibeneIds.length > 0 && (
                          <TouchableOpacity onPress={sdiletOblibene} style={styles.mobileFilterShareBtn} activeOpacity={0.7}>
                            <Ionicons name="share-social-outline" size={16} color={themeColor} />
                            <Text style={[styles.mobileFilterShareText, { color: themeColor }]}>Sdílet výběr</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      <View style={isDesktop ? styles.desktopGrid : undefined}>
                        {akceDne.map(item => <EventCard 
                          key={item.id}
                          item={item} 
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
                    </View>
                  );
                })
              ) : (
                <Text style={[styles.emptyText, { fontSize: 16, lineHeight: 24, marginTop: 120 }]}>Sem si můžete uložit oblíbené akce z programu kliknutím na srdíčko.</Text>
              )}
              {oblibeneZobrazeni.length > 0 && vybranyDen !== 'VŠE' && oblibeneZobrazeni.filter(item => item.den === vybranyDen).length === 0 && (
                <Text style={styles.emptyText}>Pro vybraný den nemáte uložené žádné oblíbené akce.</Text>
              )}
            </View>
          </View>
      </View>
      {isDesktop && <Footer isDesktop={isDesktop} />}
    </ScrollView>
  );
}
import React from 'react';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EventCard from './EventCard';
import Footer from './Footer';
import { styles } from '../styles';

export default function ProgramScreen({
  isDesktop,
  themeColor,
  dny,
  vybranyDen,
  setVybranyDen,
  vybranyTag,
  setVybranyTag,
  activeFilters,
  setActiveFilters,
  vychoziFiltry,
  hasActiveFilters,
  zobrazitObrazky,
  prepniObrazky,
  setTempFilters,
  setFilterModalVisible,
  zobrazenePrednasky,
  mojeRezervace,
  oblibeneIds,
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

            {isDesktop && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 20, justifyContent: 'flex-start', zIndex: 10 }}>
                <TouchableOpacity 
                  onPress={() => { setTempFilters(activeFilters); setFilterModalVisible(true); }} 
                  style={styles.filterTriggerBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="filter" size={16} color={themeColor} />
                  <Text style={[styles.filterTriggerText, { color: themeColor }]}>Filtrovat</Text>
                </TouchableOpacity>
                {hasActiveFilters && (
                  <TouchableOpacity onPress={() => setActiveFilters(vychoziFiltry)} style={{ marginLeft: 15 }}>
                    <Text style={{ fontFamily: 'Inter_400Regular', color: '#6B7280', fontSize: 13 }}>Zrušit filtry</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            
            <View style={{ paddingBottom: 20, marginTop: !isDesktop ? 15 : 0 }}>
              {zobrazenePrednasky.length > 0 ? (
                dny.map((den, index) => {
                  if (!hasActiveFilters && vybranyDen !== 'VŠE' && vybranyDen !== den) return null;

                  const akceDne = zobrazenePrednasky.filter(item => item.den === den);
                  if (akceDne.length === 0) return null;

                  const isFirstVisibleDay = dny.find(d => 
                    (!hasActiveFilters && vybranyDen !== 'VŠE' && vybranyDen !== d) ? false : zobrazenePrednasky.some(item => item.den === d)
                  ) === den;
                  
                  return (
                    <View key={index} style={{ marginBottom: 25 }}>
                      
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15 }}>
                        <Text style={[styles.favoriteDayHeader, { marginBottom: 0, top: !isDesktop ? 4 : 0 }]}>{den}</Text>
                        
                        {!isDesktop && isFirstVisibleDay && (
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {hasActiveFilters && (
                              <TouchableOpacity onPress={() => setActiveFilters(vychoziFiltry)} style={{ marginRight: 12 }}>
                                <Ionicons name="close-circle" size={24} color="#6B7280" />
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity 
                              onPress={() => { setTempFilters(activeFilters); setFilterModalVisible(true); }} 
                              style={styles.mobileFilterShareBtn}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="filter" size={16} color={themeColor} />
                              <Text style={[styles.mobileFilterShareText, { color: themeColor }]}>Filtrovat</Text>
                            </TouchableOpacity>
                          </View>
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
                <View style={{ marginTop: 20 }}>
                  {!isDesktop && hasActiveFilters && (
                     <TouchableOpacity onPress={() => setActiveFilters(vychoziFiltry)} style={{ alignSelf: 'center', marginBottom: 15, padding: 10 }}>
                        <Text style={{ fontFamily: 'Inter_400Regular', color: themeColor, fontSize: 15, fontWeight: 'bold' }}>Zrušit filtry</Text>
                     </TouchableOpacity>
                  )}
                  <Text style={styles.emptyText}>Zvoleným filtrům neodpovídá žádný program.</Text>
                </View>
              )}
            </View>
          </View>
      </View>
      {isDesktop && <Footer isDesktop={isDesktop} />}
    </ScrollView>
  );
}
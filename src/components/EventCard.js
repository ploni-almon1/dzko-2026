import React from 'react';
import { View, Text, TouchableOpacity, Image, Linking, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EventCard({ 
  item, 
  forceGrid, 
  zobrazitObrazky, 
  isDesktop, 
  mojeRezervace, 
  themeColor, 
  oblibeneIds, 
  otevriDetail, 
  handleLocationClick, 
  clickTagNaProgram, 
  prepniOblibene 
}) {
  const casParts = item.cas.split(' | ');
  const timeText = casParts.length > 2 ? `${casParts[0]} | ${casParts[1]}` : item.cas;
  const mistoText = casParts.length > 2 ? casParts[2] : null;
  const maRezervaci = mojeRezervace.includes(item.id);
  
  const jePlno = item.kapacita && item.pocetRezervaci >= item.kapacita;
  const isGrid = (forceGrid === true) ? true : zobrazitObrazky; 

  const wrapperStyle = isGrid
    ? (isDesktop ? styles.desktopCardWrapper : styles.mobileCardWrapper)
    : { width: '100%', paddingHorizontal: isDesktop ? 8 : 0, marginBottom: 15 };

  return (
    <View style={wrapperStyle}>
      <TouchableOpacity 
        style={[
          styles.card, 
          !isGrid && isDesktop && { flexDirection: 'row', height: 270 }
        ]} 
        onPress={() => otevriDetail(item)} 
        activeOpacity={0.7}
      >
        {item.image ? (
          <Image 
            source={{ uri: item.image }} 
            style={
              isGrid 
                ? (isDesktop ? styles.desktopCardImage : styles.cardImage) 
                : (isDesktop ? styles.listCardImageDesktop : styles.cardImage)
            } 
            resizeMode="cover" 
          />
        ) : (
          <View style={[
            isGrid 
              ? (isDesktop ? styles.desktopCardImage : styles.cardImage) 
              : (isDesktop ? styles.listCardImageDesktop : styles.cardImage),
            { backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' }
          ]}>
            <Text style={{color: '#9CA3AF'}}>Bez obrázku</Text>
          </View>
        )}

        <View style={[styles.cardContent, !isGrid && isDesktop && { flex: 1, paddingHorizontal: 25, paddingVertical: 20 }]}>
          <View style={styles.timeLocationRow}>
            <Text style={styles.cardTime}>{timeText}</Text>
            {mistoText && (
              <>
                <Text style={styles.desktopCardTime}> | </Text>
                <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); handleLocationClick(mistoText); }} activeOpacity={0.6} style={{ zIndex: 10 }}>
                  <Text style={styles.desktopCardTime}>{mistoText}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          
          <Text style={[styles.cardTitle, !isGrid && isDesktop && { fontSize: 22, marginTop: 5 }]} numberOfLines={isGrid ? undefined : 2}>{item.nazev}</Text>
          
          {item.host !== '' && <Text style={styles.cardHost} numberOfLines={isGrid ? undefined : 1}>{item.roleHosta}: {item.host}</Text>}
          
          {!isGrid && item.popis && (
            <Text style={styles.listAnnotation} numberOfLines={3}>
              {item.popis}
            </Text>
          )}
          
          <View style={[styles.cardBottomRow, !isGrid && isDesktop && { marginTop: 'auto', paddingTop: 10 }]}>
            <View style={styles.tagsContainer}>
              {item.tag && item.tag.map((t, index) => (
                <TouchableOpacity key={index} style={[styles.tagPill, { backgroundColor: themeColor, borderColor: themeColor }]} onPress={(e) => { e.stopPropagation?.(); clickTagNaProgram(t); }} activeOpacity={0.7}>
                  <Text style={styles.tagText}>{t}</Text>
                </TouchableOpacity>
              ))}
              
              {item.odkaz && (
                <TouchableOpacity style={[styles.tagPillOutline, { borderColor: themeColor }]} onPress={(e) => { e.stopPropagation?.(); Linking.openURL(item.odkaz); }} activeOpacity={0.7}>
                  <Text style={[styles.tagTextOutline, { color: themeColor }]}>VSTUPENKY</Text>
                </TouchableOpacity>
              )}

              {item.rezervace && (
                <TouchableOpacity 
                  style={[
                    styles.tagPillOutline, 
                    { borderColor: themeColor }, 
                    maRezervaci ? styles.tagPillRezervovano : (jePlno ? styles.tagPillPlno : null)
                  ]} 
                  onPress={(e) => { e.stopPropagation?.(); otevriDetail(item, true); }} 
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.tagTextOutline, 
                    { color: themeColor }, 
                    maRezervaci ? styles.tagTextRezervovano : (jePlno ? styles.tagTextPlno : null)
                  ]}>
                    {maRezervaci ? 'REZERVOVÁNO' : (jePlno ? 'OBSAZENO' : 'NUTNÁ REZERVACE')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); prepniOblibene(item.id); }} style={styles.heartIconBtn}>
              <Ionicons name={oblibeneIds.includes(item.id) ? "heart" : "heart-outline"} size={26} color="black" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  desktopCardWrapper: {
    width: '25%', 
    paddingHorizontal: 8,
    marginBottom: 20, 
  },
  mobileCardWrapper: {
    width: '100%',
    marginBottom: 15,
  },
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 10, 
    marginBottom: 0, 
    ...Platform.select({
      web: { boxShadow: '0px 4px 8px rgba(0,0,0,0.12)' },
      default: { elevation: 5 }
    })
  },
  cardContent: { padding: 15 },
  cardImage: { width: '100%', height: 160, borderTopLeftRadius: 10, borderTopRightRadius: 10, backgroundColor: '#E5E7EB' },
  desktopCardImage: {
    width: '100%',
    aspectRatio: 1.5, 
    borderTopLeftRadius: 10, 
    borderTopRightRadius: 10, 
    backgroundColor: '#E5E7EB'
  },
  listCardImageDesktop: {
    width: 360,
    height: 270,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    backgroundColor: '#E5E7EB'
  },
  timeLocationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, flexWrap: 'wrap' },
  cardTime: { fontFamily: 'Inter_400Regular', fontSize: 16, color: '#4B5563' },
  desktopCardTime: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#4B5563' },
  cardTitle: { fontFamily: 'Inter_400Regular', fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#111827' },
  cardHost: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#374151', marginBottom: 10 },
  listAnnotation: { fontFamily: 'Inter_400Regular', fontSize: 15, color: '#4B5563', lineHeight: 22, marginTop: 10, marginBottom: 15 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', flex: 1, paddingRight: 10 },
  tagPill: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 9, borderRadius: 15, marginRight: 6, marginTop: 6, borderWidth: 1 },
  tagText: { fontFamily: 'Inter_400Regular', color: 'white', fontSize: 11, fontWeight: '600' },
  tagPillOutline: { backgroundColor: 'transparent', alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 9, borderRadius: 15, marginRight: 6, marginTop: 6, borderWidth: 1 },
  tagTextOutline: { fontFamily: 'Inter_400Regular', fontSize: 11, fontWeight: '600' },
  tagPillRezervovano: { backgroundColor: 'transparent', borderColor: '#10B981' },
  tagTextRezervovano: { color: '#10B981' },
  tagPillPlno: { backgroundColor: '#D1D5DB', borderColor: '#D1D5DB' },
  tagTextPlno: { color: '#4B5563' },
  heartIconBtn: { paddingBottom: 0, paddingLeft: 10, marginBottom: -4 }
});
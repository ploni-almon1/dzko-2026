import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SpeakerModal({
  visible,
  onClose,
  speaker,
  isDesktop,
  themeColor,
  speakerEvents,
  detailAkce,
  prejitNaAkciHost
}) {
  if (!visible || !speaker) return null;

  return (
    <View style={styles.mobileSpeakerOverlay}>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      
      <View style={isDesktop ? styles.desktopSpeakerModalContent : styles.mobileSpeakerModalContent}>
        
        {isDesktop ? (
          /* DESKTOP LAYOUT (50:50) */
          <>
            <View style={[styles.desktopSpeakerModalImageContainer, !speaker.fotka && { backgroundColor: themeColor }]}>
              {speaker.fotka && <Image source={{ uri: speaker.fotka }} style={styles.speakerImage} resizeMode="cover" />}
            </View>
            <View style={styles.desktopSpeakerModalTextContainer}>
              <TouchableOpacity style={styles.desktopSpeakerCloseBtn} onPress={onClose}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
              <ScrollView style={{flex: 1}} contentContainerStyle={styles.desktopSpeakerModalInfo}>
                <Text style={styles.mobileSpeakerModalName}>{speaker.jmeno}</Text>
                {speaker.profese !== '' && <Text style={styles.mobileSpeakerModalJob}>{speaker.profese}</Text>}
                {speaker.popis !== '' && <Text style={styles.mobileSpeakerModalDesc}>{speaker.popis}</Text>}

                {/* KARTA PRO PŘECHOD NA AKCI (PC) */}
                {speakerEvents.length > 0 && !detailAkce && (
                  <View style={styles.speakerEventsSection}>
                    <Text style={styles.mobileSpeakerModalJob}>Program</Text>
                    {speakerEvents.map(ev => (
                      <TouchableOpacity key={ev.id} style={styles.speakerEventCard} activeOpacity={0.7} onPress={() => prejitNaAkciHost(ev)}>
                        <Text style={styles.speakerEventTime}>{ev.cas}</Text>
                        <Text style={styles.speakerEventTitle}>{ev.nazev}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          </>
        ) : (
          /* MOBILE LAYOUT (Čtverec nahoře, Text dole) */
          <>
            <View style={[styles.mobileSpeakerModalImageContainer, !speaker.fotka && { backgroundColor: themeColor }]}>
              {speaker.fotka && <Image source={{ uri: speaker.fotka }} style={styles.speakerImage} resizeMode="cover" />}
              <TouchableOpacity style={styles.mobileSpeakerCloseBtn} onPress={onClose}>
                <Ionicons name="close" size={20} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{flexShrink: 1}} contentContainerStyle={styles.mobileSpeakerModalInfo}>
              <Text style={styles.mobileSpeakerModalName}>{speaker.jmeno}</Text>
              {speaker.profese !== '' && <Text style={styles.mobileSpeakerModalJob}>{speaker.profese}</Text>}
              {speaker.popis !== '' && <Text style={styles.mobileSpeakerModalDesc}>{speaker.popis}</Text>}

              {/* KARTA PRO PŘECHOD NA AKCI (MOBIL) */}
              {speakerEvents.length > 0 && !detailAkce && (
                <View style={styles.speakerEventsSection}>
                  <Text style={styles.mobileSpeakerModalJob}>Program</Text>
                  {speakerEvents.map(ev => (
                    <TouchableOpacity key={ev.id} style={styles.speakerEventCard} activeOpacity={0.7} onPress={() => prejitNaAkciHost(ev)}>
                      <Text style={styles.speakerEventTime}>{ev.cas}</Text>
                      <Text style={styles.speakerEventTitle}>{ev.nazev}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mobileSpeakerOverlay: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.4)', 
    justifyContent: 'center', alignItems: 'center', padding: 25, zIndex: 1000,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(12px)' } : {}), 
  },
  desktopSpeakerModalContent: {
    width: '100%', maxWidth: 1000, height: 500, backgroundColor: '#fff',
    borderRadius: 16, overflow: 'hidden', flexDirection: 'row', 
    ...Platform.select({ web: { boxShadow: '0px 10px 40px rgba(0,0,0,0.15)' }, default: { elevation: 10 } })
  },
  desktopSpeakerModalImageContainer: { flex: 1, height: '100%' },
  speakerImage: { width: '100%', height: '100%' },
  desktopSpeakerModalTextContainer: { flex: 1, position: 'relative', backgroundColor: '#fff' },
  desktopSpeakerCloseBtn: {
    position: 'absolute', top: 20, right: 20, backgroundColor: 'white',
    width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', zIndex: 10,
    ...Platform.select({ web: { boxShadow: '0px 2px 5px rgba(0,0,0,0.2)' }, default: { elevation: 5 } })
  },
  desktopSpeakerModalInfo: { padding: 40, paddingTop: 60, paddingBottom: 40 },
  mobileSpeakerModalContent: {
    width: '100%', maxWidth: 400, maxHeight: '100%', backgroundColor: '#fff',
    borderRadius: 16, overflow: 'hidden',
    ...Platform.select({ web: { boxShadow: '0px 10px 40px rgba(0,0,0,0.15)' }, default: { elevation: 10 } })
  },
  mobileSpeakerModalImageContainer: { width: '100%', aspectRatio: 1, position: 'relative' },
  mobileSpeakerCloseBtn: {
    position: 'absolute', top: 15, right: 15, backgroundColor: 'white', width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', zIndex: 10,
    ...Platform.select({ web: { boxShadow: '0px 2px 5px rgba(0,0,0,0.2)' }, default: { elevation: 5 } })
  },
  mobileSpeakerModalInfo: { padding: 25 },
  mobileSpeakerModalName: { fontFamily: 'Inter_400Regular', fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
  mobileSpeakerModalJob: { fontFamily: 'Inter_400Regular', fontSize: 15, color: '#6B7280', marginBottom: 15 },
  mobileSpeakerModalDesc: { fontFamily: 'Inter_400Regular', fontSize: 16, color: '#374151', lineHeight: 24 },
  speakerEventsSection: { marginTop: 30 },
  speakerEventCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 10 },
  speakerEventTime: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#6B7280', marginBottom: 4 },
  speakerEventTitle: { fontFamily: 'Inter_400Regular', fontSize: 15, fontWeight: 'bold', color: '#111827' }
});
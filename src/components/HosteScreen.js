import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, Image } from 'react-native';
import Footer from './Footer';
import { styles } from '../styles';

export default function HosteScreen({
  isDesktop,
  themeColor,
  hosteVsechny,
  setAktivniSelectedSpeaker,
  setSpeakerModalVisible
}) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <View style={{ flex: 1, width: '100%', maxWidth: 1270, alignSelf: 'center', paddingHorizontal: 15, paddingTop: 10 }}>
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>HOSTÉ</Text>
        </View>
        
        <View style={{ paddingBottom: 20 }}>
          {hosteVsechny.length > 0 ? (
            // Přidán flexWrap pro mobilní zobrazení do dvou sloupců
            <View style={isDesktop ? styles.desktopGrid : { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {hosteVsechny.map((h, index) => (
                // Nastavení šířky na 48% zajistí 2 sloupce na mobilu
                <View key={index} style={isDesktop ? styles.desktopCardWrapper : { width: '48%', marginBottom: 15 }}>
                  <TouchableOpacity 
                    style={[styles.card, { height: '100%', borderRadius: 12, overflow: 'hidden' }]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setAktivniSelectedSpeaker(h);
                      setSpeakerModalVisible(true);
                    }}
                  >
                    {/* Změněn poměr stran obrázku na 1:1 (čtverec) podle tvého vzoru */}
                    <View style={{ width: '100%', aspectRatio: 1, backgroundColor: h.fotka ? 'transparent' : themeColor }}>
                      {h.fotka ? (
                        <Image source={{ uri: h.fotka }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      ) : null}
                    </View>
                    <View style={{ padding: 12 }}>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 2 }}>{h.jmeno}</Text>
                      {h.profese !== '' && (
                        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#6B7280' }}>{h.profese}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Zatím nebyli přidáni žádní hosté.</Text>
          )}
        </View>
      </View>
      {isDesktop && <Footer isDesktop={isDesktop} />}
    </ScrollView>
  );
}
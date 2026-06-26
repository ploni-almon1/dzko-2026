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
            <View style={isDesktop ? styles.desktopGrid : undefined}>
              {hosteVsechny.map((h, index) => (
                <View key={index} style={isDesktop ? styles.desktopCardWrapper : styles.mobileCardWrapper}>
                  <TouchableOpacity 
                    style={[styles.card, { height: '100%' }]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setAktivniSelectedSpeaker(h);
                      setSpeakerModalVisible(true);
                    }}
                  >
                    <View style={{ width: '100%', aspectRatio: 4/3, backgroundColor: h.fotka ? 'transparent' : themeColor, borderTopLeftRadius: 10, borderTopRightRadius: 10, overflow: 'hidden' }}>
                      {h.fotka ? (
                        <Image source={{ uri: h.fotka }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      ) : null}
                    </View>
                    <View style={{ padding: 15 }}>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>{h.jmeno}</Text>
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
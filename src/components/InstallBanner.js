import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Odchytíme událost úplně globálně hned při startu, aby nám neutekla
let deferredPrompt = null;
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}

export default function InstallBanner({ themeColor }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Spustíme jen na webu
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // Pokud už je aplikace nainstalovaná a otevřená, banner neukážeme
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return;

    // Zkontrolujeme, zda jsme opravdu na mobilním zařízení (nechceme to ukazovat na velkém monitoru)
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (!isMobile) return;

    const checkCooldownAndShow = async () => {
      try {
        const lastShownStr = await AsyncStorage.getItem('@install_banner_last_shown');
        if (lastShownStr) {
          const lastShown = parseInt(lastShownStr, 10);
          const now = Date.now();
          const hours24 = 24 * 60 * 60 * 1000;
          
          if (now - lastShown < hours24) {
            // 24 hodin ještě neuběhlo, kód ukončíme
            return;
          }
        }

        // Ukážeme banner a hned uložíme čas do paměti
        setIsVisible(true);
        AsyncStorage.setItem('@install_banner_last_shown', Date.now().toString()).catch(console.error);
      } catch (error) {
        console.error('Chyba při kontrole paměti pro banner:', error);
      }
    };

    // Dáme aplikaci půl vteřiny na načtení, aby banner naskočil plynule
    setTimeout(checkCooldownAndShow, 500);

  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Funkční nativní instalace (typicky Chrome na Androidu)
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      deferredPrompt = null;
    } else {
      // Fallback: Pokud prohlížeč nativní okno nedovolil (nebo jsme na iPhonu)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        window.alert('Pro instalaci na iPhone:\n\n1. Klikněte dole na ikonu sdílení (čtvereček se šipkou)\n2. Zvolte "Přidat na plochu" ➕');
      } else {
        window.alert('Pro instalaci:\n\n1. Klikněte na tři tečky v pravém horním rohu\n2. Zvolte "Přidat na plochu" nebo "Instalovat aplikaci"');
      }
    }
  };

  const handleCloseClick = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <View style={styles.bannerContainer}>
      <View style={styles.content}>
        
        {/* Místo barevného čtverečku teď načítáme skutečnou ikonu aplikace z assets */}
        <Image source={require('../../assets/icon.png')} style={styles.appIcon} />
        
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>Nainstalovat aplikaci DŽKO</Text>
          <Text style={styles.subtitle}>{window.location.hostname}</Text>
        </View>
        
        <TouchableOpacity onPress={handleInstallClick} activeOpacity={0.6} style={{ paddingHorizontal: 10 }}>
          {/* Tlačítko převedeno natvrdo na černou barvu */}
          <Text style={[styles.installButton, { color: '#000000' }]}>Instalovat</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleCloseClick} activeOpacity={0.6} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999, 
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    paddingRight: 5,
  },
  title: {
    fontFamily: 'Inter_400Regular',
    fontWeight: 'bold',
    fontSize: 14,
    color: '#111827',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  installButton: {
    fontFamily: 'Inter_400Regular',
    fontWeight: 'bold',
    fontSize: 14,
  },
  closeBtn: {
    marginLeft: 5,
    padding: 4,
  }
});
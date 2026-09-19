import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function InstallBanner({ themeColor }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Spustíme jen na webu
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // Pokud už je aplikace nainstalovaná a otevřená jako samostatné okno, banner neukážeme
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return;

    let promptHandler = null;

    const checkCooldownAndListen = async () => {
      try {
        // Podíváme se do paměti telefonu, kdy naposledy se banner ukázal
        const lastShownStr = await AsyncStorage.getItem('@install_banner_last_shown');
        if (lastShownStr) {
          const lastShown = parseInt(lastShownStr, 10);
          const now = Date.now();
          const hours24 = 24 * 60 * 60 * 1000; // 24 hodin v milisekundách
          
          if (now - lastShown < hours24) {
            // 24 hodin ještě neuběhlo, kód ukončíme a banner neukážeme
            return;
          }
        }

        // Pokud jsme tady, 24h uběhlo nebo to ještě nebylo zobrazeno
        promptHandler = (e) => {
          e.preventDefault();
          setDeferredPrompt(e);
          setIsVisible(true);
          
          // Ihned po zobrazení si uložíme aktuální čas do paměti
          AsyncStorage.setItem('@install_banner_last_shown', Date.now().toString()).catch(console.error);
        };

        window.addEventListener('beforeinstallprompt', promptHandler);
      } catch (error) {
        console.error('Chyba při kontrole paměti pro banner:', error);
      }
    };

    checkCooldownAndListen();

    // Úklid po zavření komponenty
    return () => {
      if (promptHandler) {
        window.removeEventListener('beforeinstallprompt', promptHandler);
      }
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Vyvoláme nativní okno telefonu pro instalaci
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleCloseClick = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <View style={styles.bannerContainer}>
      <View style={styles.content}>
        {/* Zde můžeš časem dát i logo, teď použijeme jen čistý barevný čtvereček v barvě aplikace */}
        <View style={[styles.iconPlaceholder, { backgroundColor: themeColor }]} />
        
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>Nainstalovat aplikaci DŽKO</Text>
          <Text style={styles.subtitle}>{window.location.hostname}</Text>
        </View>
        
        <TouchableOpacity onPress={handleInstallClick} activeOpacity={0.6} style={{ paddingHorizontal: 10 }}>
          <Text style={[styles.installButton, { color: themeColor }]}>Instalovat</Text>
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
    zIndex: 9999, // Zajistí, že to bude úplně nad vším ostatním
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconPlaceholder: {
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
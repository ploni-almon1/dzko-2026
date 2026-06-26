import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, Image, Linking, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Footer from './Footer';
import { styles } from '../styles';

export default function DalsiScreen({
  isDesktop,
  themeColor,
  setAktivniTab,
  rozbaleno,
  setRozbaleno,
  zobrazitNastaveniBarvy,
  setZobrazitNastaveniBarvy,
  novaBarvaInput,
  setNovaBarvaInput,
  ulozNovyMotiv
}) {

  // Funkce, kterou jsme přesunuli z App.js, aby tu nepřekážela
  const handleMenuPress = (nazev, type, content) => {
    if (type === 'action') {
      content(); 
    } else if (type === 'link') {
      Linking.openURL(content);
    } else {
      setRozbaleno(rozbaleno === nazev ? null : nazev);
    }
  };

  // Další funkce přesunutá z App.js
  const vykresliPolozkuMenu = (title, type, content) => (
    <View key={title} style={styles.menuItemWrapper}>
      <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress(title, type, content)} activeOpacity={0.6}>
        <Text style={styles.menuItemText}>{title}</Text>
        {type === 'expand' && (
          <Ionicons name={rozbaleno === title ? 'chevron-up' : 'chevron-down'} size={20} color="black" />
        )}
      </TouchableOpacity>
      
      {type === 'expand' && rozbaleno === title && (
        <View style={[styles.menuExpandedContent, { borderLeftColor: themeColor }]}>
          {typeof content === 'string' ? (
            <Text style={styles.menuExpandedText}>{content}</Text>
          ) : (
            content.map((item, index) => {
              if (item.isSpace) {
                return <View key={index} style={{ height: 22 }} />;
              }
              if (item.isLink) {
                return (
                  <TouchableOpacity key={index} onPress={() => Linking.openURL(item.url)} activeOpacity={0.6}>
                    <Text style={styles.menuExpandedText}>{item.text}</Text>
                  </TouchableOpacity>
                );
              }
              return (
                <Text key={index} style={styles.menuExpandedText}>{item.text}</Text>
              );
            })
          )}
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 1270, alignSelf: 'center', paddingHorizontal: 15 }}>
          <View style={styles.dalsiContainer}>
            <Text style={styles.dalsiHlavniNadpis}>DNY ŽIDOVSKÉ{'\n'}KULTURY OLOMOUC</Text>
            
            <View style={styles.menuList}>
              {vykresliPolozkuMenu('O festivalu', 'expand', 'Termín festivalu: 12.–18. října 2026\n\n19. ročník festivalu Dny židovské kultury Olomouc (12.–18. 10. 2026) se pod názvem „Morava – na periferii, nebo v centru?“ zaměří na historickou a kulturní roli Moravy v rámci židovských dějin. Program nabídne přednášky, koncerty, divadlo, film i komentované prohlídky a otevře diskusi o tom, zda byla Morava spíše periferií židovského světa, nebo svébytným a vlivným centrem. Pozornost bude věnována zásadním osobnostem pocházejícím z moravských židovských obcí, kulturním transferům, migracím a vztahům mezi centrem a periferií.')}
              {!isDesktop && vykresliPolozkuMenu('Hosté', 'action', () => setAktivniTab('Hoste'))}
              {vykresliPolozkuMenu('Archiv', 'link', 'https://muo.cz/central/dzko-2025/dzko-archiv-2025/')}
              {vykresliPolozkuMenu('Židovská obec Olomouc', 'link', 'https://kehila-olomouc.cz/rs/')}
              {vykresliPolozkuMenu('Stolpersteine Olomouc', 'link', 'https://kehila-olomouc.cz/stolpersteine/')}
              {vykresliPolozkuMenu('Pořadatelé / Partneři', 'action', () => setAktivniTab('Partneri'))}
              {vykresliPolozkuMenu('Kontakt', 'expand', [
                { text: 'Produkce festivalu' },
                { text: 'Alexandr Jeništa' },
                { text: 'jenista@muo.cz', url: 'mailto:jenista@muo.cz', isLink: true },
                { text: '+420 770 147 527', url: 'tel:+420770147527', isLink: true },
                { isSpace: true },
                { text: 'Pokladna MUO | CENTRAL' },
                { text: '+420 585 514 241', url: 'tel:+420585514241', isLink: true },
                { text: 'pokladna@muo.cz', url: 'mailto:pokladna@muo.cz', isLink: true },
                { text: 'út–ne 10-18 hodin' },
                { isSpace: true },
                { text: 'Muzeum umění Olomouc' },
                { text: 'Denisova 47, 771 11 Olomouc' },
                { text: '+420 585 514 111', url: 'tel:+420585514111', isLink: true },
                { text: 'info@muo.cz', url: 'mailto:info@muo.cz', isLink: true }
              ])}
            </View>

            <View style={styles.socialContainer}>
              <TouchableOpacity onPress={() => Linking.openURL('https://muo.cz/central/dzko-2025/')} activeOpacity={0.7}>
                <Image source={require('../../assets/muo-icon.png')} style={styles.customSocialIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://www.facebook.com/profile.php?id=61567469939592')} activeOpacity={0.7}>
                <Image source={require('../../assets/facebook-icon.png')} style={styles.customFacebookIconImg} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialCircleBtn} onPress={() => Linking.openURL('https://www.instagram.com/judaistika_upol/')}>
                <Ionicons name="logo-instagram" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialCircleBtn} onPress={() => {
                  if (!zobrazitNastaveniBarvy) setNovaBarvaInput(themeColor);
                  setZobrazitNastaveniBarvy(!zobrazitNastaveniBarvy);
              }}>
              </TouchableOpacity>
            </View>

            {zobrazitNastaveniBarvy && (
              <View style={styles.colorPickerContainer}>
                <Text style={styles.colorPickerTitle}>Nastavení motivu</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Zadejte HEX kód (např. #666666)"
                  value={novaBarvaInput}
                  onChangeText={setNovaBarvaInput}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: themeColor }]} onPress={ulozNovyMotiv}>
                  <Text style={styles.submitBtnText}>Uložit barvu</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
      </View>
      {isDesktop && <Footer isDesktop={isDesktop} />}
    </ScrollView>
  );
}
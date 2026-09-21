import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, Image, Platform, Linking } from 'react-native';
import Footer from './Footer';
import { styles } from '../styles';

export default function PartneriScreen({
  isDesktop,
  themeColor,
  partneri,
  hoveredPartnerId,
  setHoveredPartnerId
}) {

  // 1. ZDE SI MŮŽETE MĚNIT POŘADÍ HLAVNÍCH KATEGORIÍ
  const prioritniPoradi = [
    'Pořadatelé', 
    'Partneři', 
    'Podpora', 
    'Mediální partneři'
  ];

  // 2. Automatická detekce všech existujících kategorií v databázi
  const vsechnyKategorieZDat = [...new Set(partneri.map(p => p.kategorie).filter(Boolean))];

  // 3. Chytré poskládání kategorií (nejdřív ty prioritní, pak automaticky zbytek)
  const finalniKategorie = [];
  
  prioritniPoradi.forEach(prioritaKat => {
    const nalezena = vsechnyKategorieZDat.find(k => k.toLowerCase() === prioritaKat.toLowerCase());
    if (nalezena) {
      finalniKategorie.push(nalezena);
    }
  });

  const zbyvajiciKategorie = vsechnyKategorieZDat
    .filter(k => !prioritniPoradi.some(priK => priK.toLowerCase() === k.toLowerCase()))
    .sort(); // Nové, neznámé kategorie seřadíme abecedně a dáme na konec

  const usporadaneKategorie = [...finalniKategorie, ...zbyvajiciKategorie];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 1270, alignSelf: 'center', paddingHorizontal: 15, paddingTop: 40 }}>
        
        {usporadaneKategorie.map((kat) => {
          // Vyfiltrujeme partnery pro danou kategorii
          const partneriProKategorii = partneri.filter(p => p.kategorie && p.kategorie.toLowerCase() === kat.toLowerCase());
          
          if (partneriProKategorii.length === 0) return null;

          return (
            <View key={kat} style={{ marginBottom: 60 }}>
              <Text style={{ 
                fontFamily: 'Inter_400Regular', 
                fontSize: 32, 
                textTransform: 'uppercase', 
                marginBottom: 40, 
                color: '#000', 
                letterSpacing: 1 
              }}>
                {kat}
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 40 }}>
                {partneriProKategorii.map(p => {
                  const isHovered = hoveredPartnerId === p.id;
                  
                  const partnerContent = p.logo ? (
                    <Image 
                      source={{ uri: p.logo }} 
                      style={[
                        { width: '80%', height: '80%' },
                        isHovered && { tintColor: themeColor }
                      ]} 
                      resizeMode="contain" 
                    />
                  ) : (
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, textAlign: 'center', color: isHovered ? themeColor : '#000', fontWeight: 'bold' }}>{p.nazev}</Text>
                  );

                  const partnerStyle = { 
                    width: isDesktop ? '25%' : '50%', 
                    paddingHorizontal: 15, 
                    paddingVertical: 15, 
                    height: 120,        
                    marginBottom: isDesktop ? 40 : 25,   
                    justifyContent: 'center', 
                    alignItems: 'center',
                    textDecoration: 'none', 
                    display: 'flex' 
                  };

                  if (Platform.OS === 'web' && p.odkaz) {
                    return (
                      <a 
                        key={p.id}
                        href={p.odkaz}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={partnerStyle}
                        onMouseEnter={() => setHoveredPartnerId(p.id)}
                        onMouseLeave={() => setHoveredPartnerId(null)}
                      >
                        {partnerContent}
                      </a>
                    );
                  }

                  return (
                    <TouchableOpacity 
                      key={p.id} 
                      style={partnerStyle}
                      onPress={() => p.odkaz ? Linking.openURL(p.odkaz) : null}
                      activeOpacity={p.odkaz ? 0.7 : 1}
                      onMouseEnter={() => setHoveredPartnerId(p.id)}
                      onMouseLeave={() => setHoveredPartnerId(null)}
                    >
                      {partnerContent}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
      {isDesktop && <Footer isDesktop={isDesktop} />}
    </ScrollView>
  );
}
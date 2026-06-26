import React from 'react';
import { View, Image, Text, TouchableOpacity, Platform, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Footer({ isDesktop }) {
  return (
    <View style={styles.footerContainer}>
      <View style={[styles.footerInner, !isDesktop && { flexDirection: 'column', alignItems: 'flex-start' }]}>
        
        <View style={[styles.footerLogoCol, !isDesktop && { marginBottom: 35 }]}>
          <Image source={require('../../assets/star.png')} style={[styles.footerLogo, { tintColor: '#FFFFFF' }]} />
          <Text style={styles.footerTitleText}>DNY{'\n'}ŽIDOVSKÉ{'\n'}KULTURY{'\n'}OLOMOUC</Text>
        </View>

        <View style={[styles.footerTextCol, !isDesktop && { marginBottom: 30 }]}>
          <Text style={styles.footerLabel}>PRODUKCE FESTIVALU</Text>
          <Text style={styles.footerText}>Alexandr Jeništa{'\n'}jenista@muo.cz{'\n'}+420 770 147 527</Text>
        </View>

        <View style={[styles.footerTextCol, !isDesktop && { marginBottom: 30 }]}>
          <Text style={styles.footerLabel}>POKLADNA MUO | CENTRAL</Text>
          <Text style={styles.footerText}>+420 585 514 241{'\n'}pokladna@muo.cz{'\n'}út–ne 10-18 hodin</Text>
        </View>

        <View style={[styles.footerSocialCol, !isDesktop && { justifyContent: 'flex-start' }]}>
          {Platform.OS === 'web' ? (
            <>
              <a href="https://muo.cz/central/dzko-2025/" target="_blank" style={{...styles.footerSocialBtn, textDecoration: 'none'}}>
                <Image source={require('../../assets/muo2-icon.png')} style={styles.footerSocialIconImg} />
              </a>
              <a href="https://www.facebook.com/profile.php?id=61567469939592" target="_blank" style={{...styles.footerSocialBtn, textDecoration: 'none'}}>
                <Image source={require('../../assets/facebook2-icon.png')} style={styles.footerSocialIconImg} />
              </a>
              <a href="https://www.instagram.com/judaistika_upol/" target="_blank" style={{...styles.footerSocialBtn, textDecoration: 'none'}}>
                <Ionicons name="logo-instagram" size={24} color="black" />
              </a>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.footerSocialBtn} onPress={() => Linking.openURL('https://muo.cz/central/dzko-2025/')}>
                <Image source={require('../../assets/muo2-icon.png')} style={styles.footerSocialIconImg} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerSocialBtn} onPress={() => Linking.openURL('https://www.facebook.com/profile.php?id=61567469939592')}>
                <Image source={require('../../assets/facebook2-icon.png')} style={styles.footerSocialIconImg} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerSocialBtn} onPress={() => Linking.openURL('https://www.instagram.com/judaistika_upol/')}>
                <Ionicons name="logo-instagram" size={24} color="black" />
              </TouchableOpacity>
            </>
          )}
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: '#000000',
    width: '100%',
    paddingVertical: 25, 
    alignItems: 'center',
    marginTop: 60,
  },
  footerInner: {
    width: '100%',
    maxWidth: 1270,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', 
  },
  footerLogoCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLogo: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
    marginRight: 15,
  },
  footerTitleText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  footerTextCol: {
    justifyContent: 'flex-start',
  },
  footerLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 5,
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  footerSocialCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  footerSocialBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex', 
  },
  footerSocialIconImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'cover',
  }
});
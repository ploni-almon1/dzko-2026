import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FilterModal({
  filterModalVisible,
  setFilterModalVisible,
  filterSubModalVisible,
  setFilterSubModalVisible,
  tempFilters,
  setTempFilters,
  setActiveFilters,
  vychoziFiltry,
  themeColor,
  filterOptions,
  filterLabels,
  setVybranyDen,
  setVybranyTag
}) {
  return (
    <>
      {/* 👇 HLAVNÍ VYSKAKOVACÍ OKNO FILTRU 👇 */}
      <Modal visible={filterModalVisible} transparent={true} animationType="fade" onRequestClose={() => setFilterModalVisible(false)}>
        <View style={styles.filterModalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setFilterModalVisible(false)} />
          
          <View style={styles.filterModalContent}>
            <View style={styles.filterHeaderRow}>
              <Text style={styles.filterMainTitle}>Filtrovat</Text>
              <TouchableOpacity onPress={() => setTempFilters(vychoziFiltry)} style={styles.filterResetBtn}>
                <Text style={styles.filterResetText}>reset</Text>
              </TouchableOpacity>
            </View>

            {['den', 'typ', 'misto', 'hoste'].map(filterKey => {
              if (!filterOptions || !filterOptions[filterKey] || filterOptions[filterKey].length === 0) return null;
              
              const vybranePocet = tempFilters[filterKey] ? tempFilters[filterKey].length : 0;
              const labelText = vybranePocet > 0 ? `Vybráno (${vybranePocet})` : '';

              return (
                <View key={filterKey} style={styles.filterFieldWrapper}>
                  <Text style={styles.filterFieldLabel}>{filterLabels[filterKey]}</Text>
                  <TouchableOpacity 
                    style={styles.filterFieldBox} 
                    activeOpacity={0.7}
                    onPress={() => setFilterSubModalVisible(filterKey)}
                  >
                    <Text style={[styles.filterFieldText, vybranePocet > 0 && { color: themeColor, fontWeight: 'bold' }]}>
                      {labelText}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#111827" />
                  </TouchableOpacity>
                </View>
              );
            })}

            <TouchableOpacity 
              style={[styles.filterConfirmBtn, { backgroundColor: themeColor }]}
              onPress={() => {
                setActiveFilters(tempFilters);
                setVybranyDen('VŠE');
                setVybranyTag(null);
                setFilterModalVisible(false);
              }}
            >
              <Text style={styles.filterConfirmBtnText}>Potvrdit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 👇 SUB-MODAL PRO VÝBĚR KONKRÉTNÍCH POLOŽEK VE FILTRU 👇 */}
      <Modal visible={!!filterSubModalVisible} transparent={true} animationType="fade" onRequestClose={() => setFilterSubModalVisible(null)}>
        <View style={styles.filterModalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setFilterSubModalVisible(null)} />
          
          <View style={[styles.filterModalContent, { paddingHorizontal: 0, paddingBottom: 25 }]}>
            <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ paddingHorizontal: 25, paddingTop: 20 }}>
              
              {filterSubModalVisible && (() => {
                const currentOptions = filterOptions[filterSubModalVisible] || [];
                const selectedOptions = tempFilters[filterSubModalVisible] || [];
                const isAllSelected = selectedOptions.length === currentOptions.length;

                return (
                  <>
                    <TouchableOpacity 
                      style={styles.filterCheckboxRow}
                      onPress={() => {
                        if (isAllSelected) {
                          setTempFilters({ ...tempFilters, [filterSubModalVisible]: [] });
                        } else {
                          setTempFilters({ ...tempFilters, [filterSubModalVisible]: [...currentOptions] });
                        }
                      }}
                    >
                      <Ionicons name={isAllSelected ? "checkmark-circle" : "ellipse-outline"} size={22} color={isAllSelected ? themeColor : "#D1D5DB"} />
                      <Text style={styles.filterCheckboxText}>OZNAČIT VŠE</Text>
                    </TouchableOpacity>
                    
                    <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 10 }} />

                    {currentOptions.map((option, idx) => {
                      const isSelected = selectedOptions.includes(option);
                      return (
                        <TouchableOpacity 
                          key={idx} 
                          style={styles.filterCheckboxRow}
                          onPress={() => {
                            if (isSelected) {
                              setTempFilters({ ...tempFilters, [filterSubModalVisible]: selectedOptions.filter(o => o !== option) });
                            } else {
                              setTempFilters({ ...tempFilters, [filterSubModalVisible]: [...selectedOptions, option] });
                            }
                          }}
                        >
                          <Ionicons name={isSelected ? "checkmark-circle" : "ellipse-outline"} size={22} color={isSelected ? themeColor : "#D1D5DB"} />
                          <Text style={[styles.filterCheckboxText, isSelected && { fontWeight: 'bold', color: '#000' }]}>{option}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </>
                );
              })()}

            </ScrollView>

            <View style={styles.filterSubModalActions}>
              <TouchableOpacity 
                style={[styles.filterSubConfirmBtn, { backgroundColor: themeColor }]}
                onPress={() => setFilterSubModalVisible(null)}
              >
                <Text style={styles.filterConfirmBtnText}>Potvrdit</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.filterSubCancelBtn}
                onPress={() => setFilterSubModalVisible(null)}
              >
                <Text style={styles.filterSubCancelText}>Zrušit</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(5px)' } : {}), 
  },
  filterModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    ...Platform.select({ web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.1)' }, default: { elevation: 8 } })
  },
  filterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  filterMainTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 22,
    color: '#000',
    fontWeight: 'bold'
  },
  filterResetBtn: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12
  },
  filterResetText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#4B5563'
  },
  filterFieldWrapper: {
    marginBottom: 20
  },
  filterFieldLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#000',
    marginBottom: 8
  },
  filterFieldBox: {
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  filterFieldText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280'
  },
  filterConfirmBtn: {
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 30
  },
  filterConfirmBtnText: {
    fontFamily: 'Inter_400Regular',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15
  },
  filterCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12
  },
  filterCheckboxText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#374151',
    marginLeft: 10
  },
  filterSubModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 20,
    borderTopWidth: 1,
    borderColor: '#E5E7EB'
  },
  filterSubConfirmBtn: {
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    paddingHorizontal: 25,
    marginRight: 15
  },
  filterSubCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 15
  },
  filterSubCancelText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#000'
  }
});
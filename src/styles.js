import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  homeHeroContainer: {
    width: '100%',
    aspectRatio: 2/1, 
    position: 'relative',
  },
  homeHeroImage: {
    width: '100%',
    height: '100%',
  },
  homeHeroOverlay: {
    position: 'absolute',
    bottom: 170,
    width: '100%',
    alignItems: 'center',
  },
  homeHeroBtn: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    borderWidth: 2, 
    backgroundColor: 'transparent', 
  },
  homeHeroBtnText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  homeContentSection: {
    width: '100%',
    maxWidth: 1270, 
    alignSelf: 'center',
    paddingHorizontal: 15, 
    paddingTop: 60,
  },
  homeSectionTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 32,
    letterSpacing: 1,
    marginBottom: 20,
    color: '#000',
  },
  homeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    color: '#333',
    lineHeight: 28,
  },

  desktopCardImage: {
    width: '100%',
    aspectRatio: 1.5, 
    borderTopLeftRadius: 10, 
    borderTopRightRadius: 10, 
    backgroundColor: '#E5E7EB'
  },

  detailTagPill: {
    alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 18, marginRight: 8, marginTop: 8, borderWidth: 1
  },
  detailTagText: {
    fontFamily: 'Inter_400Regular', color: 'white', fontSize: 13, fontWeight: '600'
  },
  detailTagPillOutline: {
    backgroundColor: 'transparent', alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 18, marginRight: 8, marginTop: 8, borderWidth: 1
  },
  detailTagTextOutline: {
    fontFamily: 'Inter_400Regular', fontSize: 13, fontWeight: '600'
  },

  desktopDetailScrollView: {
    flex: 1, 
    width: '100%',
    maxWidth: 1270, 
    alignSelf: 'center',
    paddingHorizontal: 15,
  },
  desktopBreadcrumbsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  desktopBreadcrumbLink: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6B7280', 
  },
  desktopBreadcrumbText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#000000',
  },
  desktopDetailLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  },
  
  desktopDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    marginBottom: 20, 
    ...Platform.select({
      web: { boxShadow: '0px 2px 6px rgba(0,0,0,0.05)' },
      default: { elevation: 2 }
    })
  },

  desktopTimeLocationRow: {
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10,
  },
  desktopCardTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#4B5563',
  },
  desktopDetailMainTitle: {
    fontFamily: 'Inter_400Regular', 
    fontSize: 32, 
    color: '#000000', 
    fontWeight: 'bold',
    marginBottom: 10,
    lineHeight: 38,
  },
  desktopDetailHost: {
    fontFamily: 'Inter_400Regular', 
    fontSize: 16, 
    color: '#000000', 
    marginBottom: 25,
  },
  desktopDetailDescription: {
    fontFamily: 'Inter_400Regular', 
    fontSize: 18, 
    color: '#000000', 
    lineHeight: 28, 
    marginBottom: 30,
  },
  desktopDetailRightColumn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-end', 
  },
  desktopDetailImage: {
    width: '100%',
    aspectRatio: 1.5, 
    borderRadius: 16,
    marginBottom: 15,
  },
  desktopDetailBottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  detailBottomRowInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', 
    marginBottom: 30,
  },
  detailCapacityWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 4, 
  },
  capacityText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#4B5563',
  },
  capacityBold: {
    fontWeight: 'bold',
    color: '#000000',
  },
  capacityLight: {
    color: '#6B7280',
  },
  detailHeartWrapper: {
    alignItems: 'center',
    minWidth: 40,
  },
  detailHeartIconBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailHeartCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#4B5563',
    marginTop: 4,
  },

  desktopHeaderFavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
  },
  desktopHeaderFavCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    color: '#000000',
    marginLeft: 6, 
  },

  desktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8, 
  },
  desktopCardWrapper: {
    width: '25%', 
    paddingHorizontal: 8,
    marginBottom: 20, 
  },
  mobileCardWrapper: {
    width: '100%',
    marginBottom: 15,
  },

  desktopHeader: { 
    height: 55,
    width: '100%',
    backgroundColor: '#FFFFFF', 
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    zIndex: 50,
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.08)' },
      default: { elevation: 4 }
    })
  },
  desktopHeaderInner: {
    width: '100%',
    maxWidth: 1240, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -5, 
  },
  desktopHeaderMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 25,
  },
  desktopMenuText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#000000',
    letterSpacing: 0.5,
  },
  
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: -15,
    backgroundColor: '#FFFFFF',
    minWidth: 150,
    borderRadius: 8,
    paddingVertical: 8,
    zIndex: 100,
    ...Platform.select({
      web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.15)' },
      default: { elevation: 5 }
    })
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  dropdownItemText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
  },

  desktopContainer: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    paddingTop: 10,
  },

  mainContainer: { flex: 1 }, 
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  
  header: { 
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 15, 
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLogo: { width: 36, height: 36, marginRight: 10, resizeMode: 'contain' },
  headerText: { fontFamily: 'Inter_400Regular', color: '#000000', fontSize: 22, includeFontPadding: false },
  
  content: { flex: 1, paddingHorizontal: 15 },
  mapTabContainer: { flex: 1, paddingHorizontal: 15 },

  pageTitleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 15 },
  pageTitle: { fontFamily: 'Inter_400Regular', fontSize: 32, letterSpacing: 1 },

  toggleViewBtn: {
    width: 44,
    height: 44,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  favoriteDayHeader: { fontFamily: 'Inter_400Regular', fontSize: 20, color: '#000', marginBottom: 15, marginTop: 0 }, 
  
  webMap: { flex: 1, width: '100%', borderRadius: 15, marginBottom: 15, borderWidth: 0, minHeight: 350 },
  daysContainer: { flexDirection: 'row', marginBottom: 20 },
  dayPill: { height: 29, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, marginRight: 8, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  dayText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  dayTextActive: { fontFamily: 'Inter_400Regular', color: 'white' },
  
  desktopDaysContainer: { marginBottom: 30 },
  desktopDayPill: { width: 86, height: 36, borderRadius: 18, marginRight: 16, paddingVertical: 0, paddingHorizontal: 0 },
  desktopDayText: { fontSize: 14 },
  
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
  
  timeLocationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, flexWrap: 'wrap' },
  cardTime: { fontFamily: 'Inter_400Regular', fontSize: 16, color: '#4B5563' },
  locationLink: { fontFamily: 'Inter_400Regular', fontSize: 16, color: '#4B5563' },
  cardTitle: { fontFamily: 'Inter_400Regular', fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#111827' },
  cardHost: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#374151', marginBottom: 10 },
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

  heartIconBtn: { paddingBottom: 0, paddingLeft: 10, marginBottom: -4 },
  emptyText: { fontFamily: 'Inter_400Regular', color: '#6B7280', textAlign: 'center', marginTop: 30, lineHeight: 22 },
  
  backBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 15, alignSelf: 'flex-start' },
  backBtnText: { fontFamily: 'Inter_400Regular', fontSize: 16, marginLeft: 5 },
  
  detailTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  detailMainTitle: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 26, fontWeight: 'bold', color: '#111827', lineHeight: 32 },
  
  detailHost: { fontFamily: 'Inter_400Regular', fontSize: 18, color: '#374151', marginBottom: 15, marginTop: -5 },
  
  detailTimeLocationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, flexWrap: 'wrap' },
  wireframeImage: { width: '100%', height: 200, backgroundColor: '#E5E7EB', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  wireframeText: { fontFamily: 'Inter_400Regular', color: '#9CA3AF', marginTop: 10 },
  detailDescription: { fontFamily: 'Inter_400Regular', fontSize: 16, color: '#374151', lineHeight: 24, marginBottom: 15 },
  
  detailTagsWrapper: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 25 },
  
  formContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 10, marginBottom: 30, borderWidth: 1, borderColor: '#E5E7EB', ...Platform.select({ web: { boxShadow: '0px 1px 2px rgba(0,0,0,0.05)' }, default: { elevation: 1 }}) },
  formTitle: { fontFamily: 'Inter_400Regular', fontSize: 18, marginBottom: 15, color: '#111827', fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 12, fontFamily: 'Inter_400Regular', fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB' },
  submitBtn: { padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  submitBtnText: { color: 'white', fontFamily: 'Inter_400Regular', fontSize: 14, fontWeight: 'bold' },
  successText: { color: '#10B981', fontFamily: 'Inter_400Regular', fontSize: 15, textAlign: 'center', marginVertical: 10, fontWeight: 'bold' },
  errorText: { color: '#EF4444', fontFamily: 'Inter_400Regular', fontSize: 13, marginBottom: 12, lineHeight: 18 }, 

  dalsiContainer: { paddingTop: 20, paddingBottom: 40 },
  dalsiHlavniNadpis: { fontFamily: 'Inter_400Regular', fontSize: 32, letterSpacing: 1, color: '#000', marginBottom: 30, lineHeight: 38 },
  menuList: { marginBottom: 30 },
  menuItemWrapper: { marginBottom: 15 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  menuItemText: { fontFamily: 'Inter_400Regular', fontSize: 20, color: '#000' },
  menuExpandedContent: { marginTop: 10, paddingLeft: 10, borderLeftWidth: 2 },
  menuExpandedText: { fontFamily: 'Inter_400Regular', fontSize: 16, color: '#4B5563', lineHeight: 22 },
  contentLinkRow: { paddingVertical: 6, paddingLeft: 5 },
  contentInlineLink: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#4B5563' },
  
  socialContainer: { flexDirection: 'row', gap: 15, marginTop: 10 },
  socialCircleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  customSocialIcon: { width: 36, height: 36, borderRadius: 18, resizeMode: 'cover' },
  customFacebookIconImg: { width: 36, height: 36, borderRadius: 18, resizeMode: 'cover' },
  
  colorPickerContainer: { marginTop: 25, padding: 15, backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#D1D5DB' },
  colorPickerTitle: { fontFamily: 'Inter_400Regular', fontSize: 16, marginBottom: 10, color: '#111827', fontWeight: 'bold' },

  bottomNav: { flexDirection: 'row', justifyContent: 'space-evenly', backgroundColor: 'white', borderTopWidth: 1, borderColor: '#E5E7EB', height: Platform.OS === 'web' ? 60 : 'auto', alignItems: Platform.OS === 'web' ? 'center' : 'stretch', paddingTop: Platform.OS === 'web' ? 0 : 10, paddingBottom: Platform.OS === 'web' ? 0 : (Platform.OS === 'android' ? 50 : 40) },
  navItem: { flex: 1, alignItems: 'center', justifyContent: Platform.OS === 'web' ? 'center' : 'flex-start' },
  navText: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: Platform.OS === 'web' ? 2 : 4 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 25,
    width: '85%',
    maxWidth: 340,
    alignItems: 'center',
    ...Platform.select({ web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.15)' }, default: { elevation: 8 } })
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
    zIndex: 10
  },
  modalTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#111827',
    textAlign: 'center'
  },
  modalText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22
  },
  
  mapModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)', 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(12px)' } : {}), 
  },
  mapModalContent: {
    width: '100%',
    maxWidth: 900,
    height: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({ web: { boxShadow: '0px 10px 40px rgba(0,0,0,0.15)' }, default: { elevation: 10 } })
  },
  mapModalCloseBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'white',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999, 
    ...Platform.select({ web: { boxShadow: '0px 2px 5px rgba(0,0,0,0.15)' }, default: { elevation: 5 } })
  },

  listCardImageDesktop: {
    width: 360,
    height: 270,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    backgroundColor: '#E5E7EB'
  },
  listAnnotation: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 15,
  },

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
  },

  speakerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 220, 
  },
  speakerImageContainer: {
    width: 200, 
  },
  speakerImage: {
    width: '100%',
    height: '100%',
  },
  speakerInfo: {
    flex: 1,
    padding: 25,
    justifyContent: 'flex-start',
  },
  speakerName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  speakerJob: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  speakerDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },

  mobileSpeakerTrigger: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  mobileSpeakerTriggerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  
  mobileSpeakerOverlay: {
    position: 'absolute',
    top: 0, 
    bottom: 0, 
    left: 0, 
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.4)', 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25, 
    zIndex: 1000,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(12px)' } : {}), 
  },
  desktopSpeakerModalContent: {
    width: '100%',
    maxWidth: 1000, 
    height: 500,    
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row', 
    ...Platform.select({ web: { boxShadow: '0px 10px 40px rgba(0,0,0,0.15)' }, default: { elevation: 10 } })
  },
  desktopSpeakerModalImageContainer: {
    flex: 1, 
    height: '100%',
  },
  desktopSpeakerModalTextContainer: {
    flex: 1, 
    position: 'relative',
    backgroundColor: '#fff',
  },
  desktopSpeakerCloseBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'white',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...Platform.select({ web: { boxShadow: '0px 2px 5px rgba(0,0,0,0.2)' }, default: { elevation: 5 } })
  },
  desktopSpeakerModalInfo: {
    padding: 40,
    paddingTop: 60, 
    paddingBottom: 40,
  },

  // Mobilní vyskakovací okno
  mobileSpeakerModalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '100%', 
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({ web: { boxShadow: '0px 10px 40px rgba(0,0,0,0.15)' }, default: { elevation: 10 } })
  },
  mobileSpeakerModalImageContainer: {
    width: '100%',
    aspectRatio: 1, 
    position: 'relative',
  },
  mobileSpeakerCloseBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'white',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...Platform.select({ web: { boxShadow: '0px 2px 5px rgba(0,0,0,0.2)' }, default: { elevation: 5 } })
  },
  mobileSpeakerModalInfo: {
    padding: 25,
  },
  mobileSpeakerModalName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  mobileSpeakerModalJob: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 15,
  },
  mobileSpeakerModalDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },

  speakerEventsSection: {
    marginTop: 30,
  },
  speakerEventCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  speakerEventTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  speakerEventTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },

  // 👇 STYLY PRO FILTR MODAL 👇
  filterTriggerBtn: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#E0E7FF', 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    alignSelf: 'flex-start'
  },
  filterTriggerText: {
    fontFamily: 'Inter_400Regular', 
    marginLeft: 6, 
    fontWeight: 'bold', 
    fontSize: 13
  },

  // 👇 NOVÉ TŘÍDY POUZE PRO MOBIL 👇
  mobileFilterShareBtn: {
    height: 29, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#E0E7FF', 
    paddingHorizontal: 12, 
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  mobileFilterShareText: {
    fontFamily: 'Inter_400Regular', 
    marginLeft: 6, 
    fontWeight: 'bold', 
    fontSize: 13,
  },

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
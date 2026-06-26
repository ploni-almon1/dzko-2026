import { Platform, Linking } from 'react-native';

// --- GENERÁTOR MAPY ---
export const generateMapHtml = (focusLat, focusLng, focusTitle, themeColor, showExpandButton = false, isExpanded = false, events = []) => {
  const safeEvents = events.map(e => ({ id: e.id, nazev: e.nazev, cas: e.cas || '' }));
  const eventsJson = JSON.stringify(safeEvents).replace(/</g, '\\u003c');

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { padding: 0; margin: 0; }
        html, body, #map { height: 100%; width: 100%; background-color: #F3F4F6; }
        .leaflet-tile-pane { filter: grayscale(95%) brightness(1.1) contrast(0.9); }
        .dzko-pin-wrapper { background: transparent; border: none; }
        .dzko-pin { width: 32px; height: 32px; background-color: ${themeColor || '#3A24DC'}; border: 2px solid white; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: -2px 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; }
        .dzko-pin i { transform: rotate(45deg); font-size: 14px; color: white; margin-bottom: 2px; margin-left: 2px; }
        .leaflet-popup-content-wrapper { border-radius: 8px; }
        .leaflet-popup-content { font-family: sans-serif; font-weight: bold; color: #374151; text-align: center; margin: 10px 15px; }
        
        .dzko-legend { position: absolute; top: 10px; right: 10px; z-index: 1000; background: white; border-radius: 12px; padding: 15px; width: 280px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); display: none; max-height: 85%; overflow-y: auto; }
        .dzko-legend-close { position: absolute; top: 10px; right: 10px; cursor: pointer; background: #F3F4F6; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; color: #374151; }
        .dzko-accordion-item { border-bottom: 1px dashed #E5E7EB; padding: 10px 0; }
        .dzko-accordion-item:last-child { border-bottom: none; }
        .dzko-accordion-header { font-family: sans-serif; font-weight: bold; font-size: 14px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; color: #111827; }
        .dzko-accordion-body { display: none; padding-top: 10px; }
        .dzko-event-link { display: block; text-decoration: none; color: inherit; padding: 8px 0; margin-left: 8px; font-family: sans-serif; font-size: 13px; cursor: pointer; border-bottom: 1px dashed #E5E7EB; }
        .dzko-event-link:last-child { border-bottom: none; }
        .dzko-event-link:hover { opacity: 0.6; }
        .dzko-no-events { font-family: sans-serif; font-size: 13px; color: #9CA3AF; font-style: italic; padding: 5px 0; }
    </style>
</head>
<body>
    <div id="map"></div>
    <div id="mapLegend" class="dzko-legend"></div>
    
    <script>
        var map = L.map('map');
        var apiKey = 'gRioCnF44GOOJJaSU3aLnzGM48hcumaNIilX_748pbM';
        L.tileLayer('https://api.mapy.cz/v1/maptiles/basic/256/{z}/{x}/{y}?apikey=' + apiKey, { minZoom: 10, maxZoom: 19, attribution: '&copy; <a href="https://www.seznam.cz" target="_blank">Seznam.cz, a.s.</a>' }).addTo(map);

        var vsechnyPiny = [];
        function pridejMisto(lat, lng, nazev, iconName) {
            var currentIcon = iconName || 'fa-building';
            var dzkoIcon = L.divIcon({ className: 'dzko-pin-wrapper', html: '<div class="dzko-pin"><i class="fa-solid ' + currentIcon + '"></i></div>', iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -36] });
            var marker = L.marker([lat, lng], {icon: dzkoIcon}).addTo(map).bindPopup(nazev);
            vsechnyPiny.push(marker);
            var targetTitle = ${focusTitle ? `'${focusTitle}'` : 'null'};
            if (targetTitle === nazev) setTimeout(() => marker.openPopup(), 300);
        }

        pridejMisto(49.5980481, 17.2610522, 'Mozarteum', 'fa-landmark');
        pridejMisto(49.5904358, 17.2513681, 'Centrum judaistických studií', 'fa-graduation-cap');
        pridejMisto(49.5970906, 17.2627506, 'Židovská obec Olomouc', 'fa-star-of-david');
        pridejMisto(49.5695, 17.2912, 'Sladovna Holice', 'fa-industry');
        pridejMisto(49.5963561, 17.2563322, 'MUO CENTRAL', 'fa-film');

        var focusLat = ${focusLat || 'null'};
        var focusLng = ${focusLng || 'null'};
        if (focusLat && focusLng) {
            map.setView([focusLat, focusLng], 17);
        } else {
            var skupinaPinu = new L.featureGroup(vsechnyPiny);
            map.fitBounds(skupinaPinu.getBounds(), { padding: [40, 40] }); 
        }

        var eventsData = ${eventsJson};
        
        function buildLegend() {
            var mistoMapovani = [
                { nazev: 'Centrum judaistických studií', klic: 'CJS' },
                { nazev: 'Mozarteum', klic: 'Mozarteum' },
                { nazev: 'MUO CENTRAL', klic: 'Central' },
                { nazev: 'Židovská obec Olomouc', klic: 'ŽOO' },
                { nazev: 'Sladovna Holice', klic: 'Sladovna Holice' }
            ];
            
            var legendDiv = document.getElementById('mapLegend');
            var closeBtn = '<div class="dzko-legend-close" onclick="document.getElementById(\\'mapLegend\\').style.display=\\'none\\'"><i class="fa-solid fa-xmark"></i></div>';
            var content = closeBtn + '<div style="margin-top: 15px;">';
            
            mistoMapovani.forEach(function(m) {
                var locEvents = eventsData.filter(function(e) { return e.cas && e.cas.indexOf(m.klic) !== -1; });
                var eventsHtml = locEvents.map(function(e) {
                    return '<a class="dzko-event-link" onclick="window.parent.postMessage({ type: \\'OPEN_EVENT\\', id: \\'' + e.id + '\\' }, \\'*\\'); return false;">' + e.nazev + '</a>';
                }).join('');
                
                if(locEvents.length === 0) eventsHtml = '<div class="dzko-no-events">Žádné akce</div>';
                
                content += '<div class="dzko-accordion-item">' +
                    '<div class="dzko-accordion-header" onclick="toggleAccordion(this)">' + m.nazev + ' <i class="fa-solid fa-chevron-down"></i></div>' +
                    '<div class="dzko-accordion-body">' + eventsHtml + '</div>' +
                '</div>';
            });
            content += '</div>';
            legendDiv.innerHTML = content;
        }
        buildLegend();
        
        window.toggleAccordion = function(el) {
            var body = el.nextElementSibling;
            var icon = el.querySelector('i');
            if(body.style.display === 'block') {
                body.style.display = 'none';
                icon.className = 'fa-solid fa-chevron-down';
            } else {
                body.style.display = 'block';
                icon.className = 'fa-solid fa-chevron-up';
            }
        };

        map.locate({setView: false, maxZoom: 16, watch: true, enableHighAccuracy: true});
        var userMarker = null;
        function onLocationFound(e) {
            if (!userMarker) {
                var userIcon = L.divIcon({ className: 'dzko-user-pin', html: '<div style="background-color: ${themeColor || '#3A24DC'}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>', iconSize: [22, 22], iconAnchor: [11, 11] });
                userMarker = L.marker(e.latlng, {icon: userIcon, zIndexOffset: 1000}).addTo(map).bindPopup("Vaše aktuální poloha");
            } else {
                userMarker.setLatLng(e.latlng);
            }
        }
        map.on('locationfound', onLocationFound);

        var customControls = L.control({position: 'topleft'});
        customControls.onAdd = function () {
            var div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
            
            var infoBtn = L.DomUtil.create('a', '', div);
            infoBtn.href = '#';
            infoBtn.title = 'Zobrazit informace o místech a akcích';
            infoBtn.style.display = 'flex'; infoBtn.style.alignItems = 'center'; infoBtn.style.justifyContent = 'center'; infoBtn.style.color = 'black';
            infoBtn.innerHTML = '<i class="fa-solid fa-info" style="font-size: 16px;"></i>';
            infoBtn.onclick = function(e){
                e.preventDefault();
                var leg = document.getElementById('mapLegend');
                leg.style.display = leg.style.display === 'block' ? 'none' : 'block';
            };

            if (${showExpandButton}) {
                var expandBtn = L.DomUtil.create('a', '', div);
                expandBtn.href = '#';
                expandBtn.title = ${isExpanded ? "'Zmenšit mapu'" : "'Zvětšit mapu'"};
                expandBtn.style.display = 'flex'; expandBtn.style.alignItems = 'center'; expandBtn.style.justifyContent = 'center'; expandBtn.style.color = 'black';
                expandBtn.innerHTML = '<i class="fa-solid ${isExpanded ? "fa-compress" : "fa-expand"}" style="font-size: 16px;"></i>';
                expandBtn.onclick = function(e){ e.preventDefault(); window.parent.postMessage(${isExpanded ? "'CONTRACT_MAP'" : "'EXPAND_MAP'"}, '*'); };
            }

            var locateBtn = L.DomUtil.create('a', '', div);
            locateBtn.href = '#';
            locateBtn.title = 'Ukaž moji polohu';
            locateBtn.style.display = 'flex'; locateBtn.style.alignItems = 'center'; locateBtn.style.justifyContent = 'center'; locateBtn.style.color = 'black';
            locateBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs" style="font-size: 16px;"></i>';
            locateBtn.onclick = function(e){ e.preventDefault(); map.locate({setView: true, maxZoom: 16, enableHighAccuracy: true}); };
            return div;
        };
        customControls.addTo(map);
    </script>
</body>
</html>
`;
};

// --- URČENÍ VÝCHOZÍHO DNE ---
export const ziskejVychoziDen = () => {
  const dnes = new Date();
  const rok = dnes.getFullYear();
  const mesic = dnes.getMonth(); 
  const den = dnes.getDate();
  if (rok === 2026 && mesic === 9) {
    switch (den) {
      case 12: return 'PO 12';
      case 13: return 'ÚT 13';
      case 14: return 'ST 14';
      case 15: return 'ČT 15';
      case 16: return 'PÁ 16';
      case 17: return 'SO 17';
      case 18: return 'NE 18';
      default: return 'VŠE'; 
    }
  }
  return 'VŠE'; 
};

// --- PŘIDÁNÍ DO KALENDÁŘE ---
export const stahniKalendar = (akce) => {
  const denCislo = akce.den.replace(/[^0-9]/g, ''); 
  
  let casZacatek = '00:00';
  const casParts = akce.cas.split(' | ');
  if (casParts.length > 1) {
      casZacatek = casParts[1].trim(); 
  }

  const zDate = `202610${denCislo}T${casZacatek.replace(':', '')}00`;
  
  let hodinaZacatek = parseInt(casZacatek.split(':')[0], 10);
  let konecDate = `202610${denCislo}T${String(hodinaZacatek + 1).padStart(2, '0')}${casZacatek.split(':')[1] || '00'}00`;

  const mistoText = casParts.length > 2 ? casParts[2] : 'Olomouc';

  const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//DZKO//Festival//CS\nBEGIN:VEVENT\nUID:${akce.id}@dzko.cz\nDTSTAMP:${zDate}\nDTSTART:${zDate}\nDTEND:${konecDate}\nSUMMARY:${akce.nazev}\nLOCATION:${mistoText}\nDESCRIPTION:Festival Dny židovské kultury Olomouc. ${akce.popis ? akce.popis.replace(/\n/g, '\\n') : ''}\nEND:VEVENT\nEND:VCALENDAR`;

  if (Platform.OS === 'web') {
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `${akce.nazev.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  } else {
      const startDate = `202610${denCislo}T${casZacatek.replace(':', '')}00Z`; 
      const endDate = `202610${denCislo}T${String(hodinaZacatek + 1).padStart(2, '0')}${casZacatek.split(':')[1] || '00'}00Z`;
      const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(akce.nazev)}&dates=${startDate}/${endDate}&details=${encodeURIComponent('Festival Dny židovské kultury Olomouc.')}&location=${encodeURIComponent(mistoText)}`;
      Linking.openURL(googleCalUrl);
  }
};
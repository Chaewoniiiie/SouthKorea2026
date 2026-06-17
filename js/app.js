const map = L.map('map').setView([36.3,127.9],7);

var OpenStreetMap_DE = L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var CartoDB_VoyagerLabelsUnder = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 20
});

var CartoDB_DarkMatter = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 20
});
var googleSat = L.tileLayer('https://{s}.google.com/vt?lyrs=s&x={x}&y={y}&z={z}',{
    maxZoom: 21,
    subdomains:['mt0','mt1','mt2','mt3']
	
});


var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});
var baseMaps = {
    "OpenStreetMap": OpenStreetMap_DE,
	"Carto Voyager": CartoDB_VoyagerLabelsUnder,
	"Carto Dark": CartoDB_DarkMatter,
    "Google Satellit": googleSat,
    "Esri World Imagery": Esri_WorldImagery
};

var layerControl = L.control.layers(baseMaps).addTo(map);

const hotelIcon = L.icon({
    iconUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="14" fill="white" stroke="%23333" stroke-width="2"/%3E%3Cpath d="M9 18v-5h4a2 2 0 0 1 2 2v1h6a2 2 0 0 1 2 2v3h-1v-2H10v2H9z" fill="%23000"/%3E%3C/svg%3E',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

let hotelLayer;
fetch('data/Unterkuenfte.geojson')
.then(response => response.json())
.then(data => {

    hotelLayer = L.geoJSON(data, {
        pointToLayer: function(feature, latlng) {

            const marker = L.marker(latlng, {
                icon: hotelIcon
            });
			
            marker.bindTooltip(feature.properties?.name || 'Unterkunft', {
                permanent: false,
            	direction: 'top',
            	offset: [0, -10],
				className: 'marker-tooltip'
            });
			 marker.bindPopup(`
	            <div style="min-width:150px">
	                <h2>${feature.properties.name}</h2><br>
					<img 
			            src="${feature.properties.image}" 
			            alt="${feature.properties.name}"
			            style="
			                width:100%;
			                height:120px;
			                object-fit:cover;
			                border-radius:8px;
			                margin-bottom:8px;
			            "
			        />
	                <span><strong>Zeitraum:</strong> ${feature.properties.Zeit}</span><br>
	                <p style="margin-top:6px"><strong>Adresse:</strong> ${feature.properties.Adresse || ''}</p>
	            </div>
        `);
            return marker;
        }
		
    });

    // hotelLayer.addTo(map);
    layerControl.addOverlay(hotelLayer, "Unterkünfte");

})
.catch(err => console.error('Hotel layer error:', err));


let items = [];
let markers = [];
let currentIndex = -1;
let directionCone = null;
let isOverviewMode = true;


const markerClusterGroup = L.markerClusterGroup({disableClusteringAtZoom: 16});

// Configure which properties should display in the info panel
const INFO_PANEL_PROPERTIES = [
    { label: 'Datum', keys: ['Datum', 'Zeit'], separator: 'um ' },
    { label: 'Ort (Administrativ)', keys: ['Stadt', 'Bezirk', 'Nachbarschaft'], separator: ', ' },
    { key: 'Beschreibung', label: '' },  // No label for description
    // Beispiel für mehrere Keys in einer Zeile:
    // { label: 'Ort', keys: ['stadt', 'bezirk', 'nachbarschaft'], separator: ', ' }
];

const defaultIcon = L.icon({
    iconUrl:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Ccircle cx="12" cy="12" r="10" fill="%233b82f6" stroke="white" stroke-width="2"/%3E%3C/svg%3E',
    iconSize:[24,24],
    iconAnchor:[12,12]
});

// Altes Icon mit SüdKorea Flagge
// const activeIcon = L.icon({
//     iconUrl:'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Flag_of_South_Korea.svg/1920px-Flag_of_South_Korea.svg.png',
//     iconSize:[27,18],
//     className:'active-marker'
// });
const activeIcon = L.icon({
    iconUrl:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"%3E%3Ccircle cx="20" cy="20" r="18" fill="%23f97316" stroke="white" stroke-width="3"/%3E%3Cpath d="M12 16h4l2-3h4l2 3h4a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" fill="none" stroke="white" stroke-width="2"/%3E%3Ccircle cx="20" cy="22" r="4" fill="none" stroke="white" stroke-width="2"/%3E%3C/svg%3E',
    iconSize:[40,40],
    iconAnchor:[20,20],
	className:'active-marker'
});

fetch('data/locations.geojson')
.then(response => response.json())
.then(data => {

    items = data.features;

    createMarkers();

    if(items.length > 0){
        showOverview();
    }

})
.catch(error => console.error('Failed to load locations:', error));




function createMarkers(){

    items.forEach((item,index)=>{

        const marker = L.marker(
            [
                item.geometry.coordinates[1],
                item.geometry.coordinates[0]
            ],
            {
                icon:defaultIcon
            }
        );
		 marker.bindTooltip(
		    `${item.properties.title || ''}<br>
		     ${formatDateTime(item.properties.Datum,item.properties.Zeit)}`,
		    {
		        permanent: false,
		        direction: 'top',
		        offset: [0, -10],
		        className: 'marker-tooltip'
		    }
		);
		
        marker.on('click',()=>{
            isOverviewMode = false;
            showMedia(index);
        });

        markers.push(marker);

        markerClusterGroup.addLayer(marker);

    });

    map.addLayer(markerClusterGroup);

}

function showOverview() {
    isOverviewMode = true;
    currentIndex = -1;
    
    // Fit map to show all markers
    if (markerClusterGroup.getLayers().length > 0) {
        map.fitBounds(markerClusterGroup.getBounds(), { padding: [50, 50], animate: false });
    }

    // Show welcome image in media container
    const container = document.getElementById('mediaContainer');
    container.innerHTML = '';
    
    const img = document.createElement('img');
    img.src = 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Flag_of_South_Korea.png';
    img.alt = 'Welcome Overview';
    img.style.objectFit = 'cover';
    
    // Disable context menu for welcome image
    img.addEventListener('contextmenu', (e) => e.preventDefault());
    img.addEventListener('dragstart', (e) => e.preventDefault());
    
    container.appendChild(img);
    
    // Update info panel
    document.getElementById('title').textContent = 'Korea Urlaub 2026';
    document.getElementById('infoContent').innerHTML = '<p>Klicken Sie auf einen Marker oder verwenden Sie die Pfeile zum Erkunden</p>';
    
    // Clear markers
    markers.forEach(marker => marker.setIcon(defaultIcon));
}

function formatDateTime(dateStr, timeStr) {

    const [year, month, day ] = dateStr.split('-');

    const date = new Date(
        `${year}-${month}-${day}T${timeStr || '00:00:00'}`
    );

    let formatted = date.toLocaleDateString('de-DE', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    formatted =
        formatted.charAt(0).toUpperCase() +
        formatted.slice(1);

    return `${formatted} um ${timeStr.substring(0,5)} Uhr`;
}

function getDriveImage(id){

    return `https://drive.google.com/thumbnail?id=${id}&sz=w2000`;

}

function getDriveVideo(id){
    return `https://drive.google.com/file/d/${id}/preview`;
}

function toggleFullscreen(element) {

    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else if (element.requestFullscreen) {
        element.requestFullscreen();
    }

}

function createDirectionCone(latlng, direction) {
    // Remove existing cone if any
    if (directionCone) {
        map.removeLayer(directionCone);
    }

    // Cone parameters
    const radius = 300; // meters
    const coneAngle = 60; // degrees (total cone width)
    const points = 30; // number of points for smooth cone

    // Create cone polygon points
    const conePoints = [];
    
    // Center point
    conePoints.push(latlng);
    
    // Arc points
    const halfAngle = coneAngle / 2;
    for (let i = 0; i <= points; i++) {
        const angle = (direction - halfAngle) + (i / points) * coneAngle;
        const bearing = (angle * Math.PI) / 180;
        
        const lat = latlng.lat;
        const lon = latlng.lng;
        const R = 6371000; // Earth radius in meters
        
        const newLat = Math.asin(
            Math.sin(lat * Math.PI / 180) * Math.cos(radius / R) +
            Math.cos(lat * Math.PI / 180) * Math.sin(radius / R) * Math.cos(bearing)
        ) * 180 / Math.PI;
        
        const newLon = (lon * Math.PI / 180 + Math.atan2(
            Math.sin(bearing) * Math.sin(radius / R) * Math.cos(lat * Math.PI / 180),
            Math.cos(radius / R) - Math.sin(lat * Math.PI / 180) * Math.sin(newLat * Math.PI / 180)
        )) * 180 / Math.PI;
        
        conePoints.push(L.latLng(newLat, newLon));
    }
    
    // Close the polygon
    conePoints.push(latlng);

    // Create polygon with transparent blue fill
    directionCone = L.polygon(conePoints, {
        color: '#3b82f6',
        weight: 0,
        opacity: 0.6,
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
        interactive: false
    });

    directionCone.addTo(map);
}

function updateActiveMarker(index){

    markers.forEach(marker=>{

        marker.setIcon(defaultIcon);

    });

    const activeMarker = markers[index];

    // activeMarker.setIcon(activeIcon);

    const item = items[index];
    const direction = item.properties.direction || 0;

    // Add direction cone visualization
    const originalLatLng = L.latLng(
	    item.geometry.coordinates[1],
	    item.geometry.coordinates[0]
	);
	

	
    map.once('moveend', () => {
        createDirectionCone(originalLatLng, direction);
		activeMarker.setIcon(activeIcon);
    });

    // map.setView(
    //     activeMarker.getLatLng(),
    //     17,
    //     {
    //         animate:true
    //     }
    // );

}

function buildInfoPanel(props) {
    let html = '';
    
    INFO_PANEL_PROPERTIES.forEach((config) => {
        let value = '';
        
        if (config.keys) {

		    // Sonderbehandlung für Datum + Zeit
		    if (
		        config.label === 'Datum' &&
		        props.Datum
		    ) {
		        value = formatDateTime(props.Datum, props.Zeit);
		    } else {
		        const values = config.keys
		            .map(key => props[key])
		            .filter(v => v && v.toString().trim());
		
		        value = values.join(config.separator || ', ');
		    }
		}else {
            // Single key
            value = props[config.key];
        }
        
        // Nur anzeigen wenn Wert vorhanden
        if (value && value.toString().trim()) {
            if (config.label) {
                // Property with a label
                html += `<p><strong>${config.label}:</strong> <span>${value}</span></p>`;
            } else {
                // Property without a label (like description)
                html += `<p>${value}</p>`;
            }
        }
    });
    
    return html;
}

function showMedia(index) {

    isOverviewMode = false;
    currentIndex = index;

    const item = items[index];
    const props = item.properties;

    const container = document.getElementById('mediaContainer');
    container.innerHTML = '';

    if (props.type === 'image') {

        const img = document.createElement('img');
        img.src = getDriveImage(props.driveId);
        img.alt = props.title || '';

        img.addEventListener('contextmenu', e => e.preventDefault());
        img.addEventListener('dragstart', e => e.preventDefault());
        img.addEventListener('dblclick', () => toggleFullscreen(img));

        container.appendChild(img);

    } else {

        const iframe = document.createElement('iframe');
        iframe.src = getDriveVideo(props.driveId);
        iframe.width = "100%";
        iframe.height = "100%";
        iframe.allow = "autoplay; fullscreen";
        iframe.style.border = "none";
        iframe.style.borderRadius = "15px";

        iframe.addEventListener('dblclick', () => toggleFullscreen(iframe));

        container.appendChild(iframe);
    }

    document.getElementById('title').textContent = props.title || '';

    document.getElementById('infoContent').innerHTML = buildInfoPanel(props);

    setTimeout(() => {

        map.invalidateSize();
        // updateActiveMarker(index);
		markerClusterGroup.unspiderfy();
        const originalLatLng = L.latLng(
		    item.geometry.coordinates[1],
		    item.geometry.coordinates[0]
		);
		console.log('Marker position:', markers[index].getLatLng());

		console.log('GeoJSON position:', L.latLng(
		    item.geometry.coordinates[1],
		    item.geometry.coordinates[0]
		));

		updateActiveMarker(index);
		
		map.flyTo(
		    originalLatLng,
		    19,
		    { duration: 1.5, easeLinearity: 0.2 }
		);
		
		
		
        console.log('Map center:', map.getCenter());
        console.log('Marker:', markers[index].getLatLng());

    }, 100);
}

document.getElementById('nextBtn')
.addEventListener('click',()=>{

    if (isOverviewMode) {
        // First click from overview goes to first item
        showMedia(0);
    } else {
        currentIndex++;

        if(currentIndex >= items.length){
            showOverview();
        } else {
            showMedia(currentIndex);
        }
    }

});

document.getElementById('prevBtn')
.addEventListener('click',()=>{

    if (isOverviewMode) {
        // From overview, go to last item
        showMedia(items.length - 1);
    } else {
        currentIndex--;

        if(currentIndex < 0){
            showOverview();
        } else {
            showMedia(currentIndex);
        }
    }

});



document.addEventListener('keydown',(event)=>{

    if(event.key === 'ArrowRight'){

        if (isOverviewMode) {
            showMedia(0);
        } else {
            currentIndex++;

            if(currentIndex >= items.length){
                showOverview();
            } else {
                showMedia(currentIndex);
            }
        }

    }

    if(event.key === 'ArrowLeft'){

        if (isOverviewMode) {
            showMedia(items.length - 1);
        } else {
            currentIndex--;

            if(currentIndex < 0){
                showOverview();
            } else {
                showMedia(currentIndex);
            }
        }

    }

	if(event.key.toLowerCase() === 'f'){

	    const media =
	    document.querySelector(
	        '#mediaContainer img, #mediaContainer iframe'
	    );
	
	    if(media){
	        toggleFullscreen(media);
	    }
	
	}
}); 

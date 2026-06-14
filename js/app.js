const map = L.map('map').setView([36.3,127.9],7);

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution:'© OpenStreetMap'
    }
).addTo(map);

let items = [];
let markers = [];
let currentIndex = -1;
let directionCone = null;
let isOverviewMode = true;

const markerClusterGroup = L.markerClusterGroup();

const defaultIcon = L.icon({
    iconUrl:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Ccircle cx="12" cy="12" r="10" fill="%233b82f6" stroke="white" stroke-width="2"/%3E%3C/svg%3E',
    iconSize:[24,24],
    iconAnchor:[12,12]
});

const activeIcon = L.icon({
    iconUrl:'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Flag_of_South_Korea.svg/1920px-Flag_of_South_Korea.svg.png',
    iconSize:[36,24],
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
    
    container.appendChild(img);
    
    // Update info panel
    document.getElementById('title').textContent = 'Korea Urlaub 2026';
    document.getElementById('date').textContent = '';
    document.getElementById('description').textContent = 'Klicken Sie auf einen Marker oder verwenden Sie die Pfeile zum Erkunden';
    
    // Clear markers
    markers.forEach(marker => marker.setIcon(defaultIcon));
}

function getDriveImage(id){

    return `https://drive.google.com/thumbnail?id=${id}&sz=w2000`;

}

function getDriveVideo(id){
    return `https://drive.google.com/file/d/${id}/preview`;
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
        weight: 2,
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

    activeMarker.setIcon(activeIcon);

    const item = items[index];
    const direction = item.properties.direction || 0;

    // Add direction cone visualization
    createDirectionCone(activeMarker.getLatLng(), direction);

    map.setView(
        activeMarker.getLatLng(),
        17,
        {
            animate:true
        }
    );

}

function showMedia(index){

    isOverviewMode = false;
    currentIndex = index;

    const item = items[index];

    const props = item.properties;

    const container =
    document.getElementById('mediaContainer');

    container.innerHTML = '';

    if(props.type === 'image'){

        const img =
        document.createElement('img');

        img.src =
        getDriveImage(props.driveId);
        
        img.alt =
        props.title || '';
        
        img.addEventListener('dblclick',()=>{
            if(img.requestFullscreen){
                img.requestFullscreen();
            }
        });
        
        container.appendChild(img);
    }
    else{

        const iframe = document.createElement('iframe');

        iframe.src = getDriveVideo(props.driveId);
        
        iframe.width = "100%";
        iframe.height = "100%";
        
        iframe.allow =
        "autoplay; fullscreen";
        
        iframe.style.border = "none";
        iframe.style.borderRadius = "15px";
        
        iframe.addEventListener('dblclick',()=>{
            if(iframe.requestFullscreen){
                iframe.requestFullscreen();
            }
        });
        
        container.appendChild(iframe);

    }

    document.getElementById('title').textContent =
    props.title || '';

    document.getElementById('date').textContent =
    props.date || '';

    document.getElementById('description').textContent =
    props.description || '';

    updateActiveMarker(index);

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
            media.requestFullscreen();
        }

    }

});

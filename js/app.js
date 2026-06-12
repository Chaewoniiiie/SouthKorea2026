const map = L.map('map').setView([36.3,127.9],7);

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution:'© OpenStreetMap'
    }
).addTo(map);

let items = [];
let markers = [];
let currentIndex = 0;

const markerClusterGroup = L.markerClusterGroup();

const defaultIcon = L.divIcon({
    html: `
        <div class="flag-marker">
            🇰🇷
        </div>
    `,
    className: '',
    iconSize: [40,40]
});

const activeIcon = L.divIcon({
    html: `
        <div class="flag-marker active">
            🇰🇷
        </div>
    `,
    className: '',
    iconSize: [55,55]
});

fetch('data/locations.geojson')
.then(response => response.json())
.then(data => {

    items = data.features;

    createMarkers();

    if(items.length > 0){
        showMedia(0);
    }

});

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

            showMedia(index);

        });

        markers.push(marker);

        markerClusterGroup.addLayer(marker);

    });

    map.addLayer(markerClusterGroup);

}

function getDriveImage(id){

    return `https://drive.google.com/thumbnail?id=${id}&sz=w2000`;

}

function getDriveVideo(id){

    return `https://drive.google.com/uc?export=download&id=${id}`;

}

function updateActiveMarker(index){

    markers.forEach(marker=>{

        marker.setIcon(defaultIcon);

    });

    const activeMarker = markers[index];

    activeMarker.setIcon(activeIcon);

    map.setView(
        activeMarker.getLatLng(),
        Math.max(map.getZoom(),10),
        {
            animate:true
        }
    );

}

function showMedia(index){

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

        container.appendChild(img);

    }
    else{

        const video =
        document.createElement('video');

        video.src =
        getDriveVideo(props.driveId);

        video.controls = true;

        container.appendChild(video);

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

    currentIndex++;

    if(currentIndex >= items.length){
        currentIndex = 0;
    }

    showMedia(currentIndex);

});

document.getElementById('prevBtn')
.addEventListener('click',()=>{

    currentIndex--;

    if(currentIndex < 0){
        currentIndex = items.length - 1;
    }

    showMedia(currentIndex);

});

document.getElementById('fullscreenBtn')
.addEventListener('click',()=>{

    const media =
    document.querySelector(
        '#mediaContainer img, #mediaContainer video'
    );

    if(media && media.requestFullscreen){

        media.requestFullscreen();

    }

});

document.addEventListener('keydown',(event)=>{

    if(event.key === 'ArrowRight'){

        currentIndex++;

        if(currentIndex >= items.length){
            currentIndex = 0;
        }

        showMedia(currentIndex);

    }

    if(event.key === 'ArrowLeft'){

        currentIndex--;

        if(currentIndex < 0){
            currentIndex = items.length - 1;
        }

        showMedia(currentIndex);

    }

    if(event.key.toLowerCase() === 'f'){

        const media =
        document.querySelector(
            '#mediaContainer img, #mediaContainer video'
        );

        if(media){
            media.requestFullscreen();
        }

    }

});

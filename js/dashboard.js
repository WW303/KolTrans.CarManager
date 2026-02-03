import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAFp4tfV1bvfafRzu9OX9SJzst3EWsR3YE",
    authDomain: "kol-trans-car-manager-login.firebaseapp.com",
    projectId: "kol-trans-car-manager-login",
    storageBucket: "kol-trans-car-manager-login.firebasestorage.app",
    messagingSenderId: "278853848291",
    appId: "1:278853848291:web:6ca943722debac13b4c9d6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggleBtn');
const closeSidebar = document.getElementById('closeSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const nMap = document.getElementById('navMap');
const nVehicles = document.getElementById('navVehicles');
const sMap = document.getElementById('sectionMap');
const sVehicles = document.getElementById('sectionVehicles');
const title = document.getElementById('pageTitle');
const brandLogo = document.querySelector('aside h1');
const brandSub = document.querySelector('aside p');
const body = document.body;

// --- Logika Sidebara ---
function openMenu() {
    sidebar.classList.add('open');
    sidebar.classList.remove('-translate-x-full');
    sidebarOverlay.classList.remove('hidden');
}
function closeMenu() {
    sidebar.classList.remove('open');
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('hidden');
}

toggleBtn.addEventListener('click', () => {
    if (window.innerWidth >= 768) {
        sidebar.classList.toggle('sidebar-hidden');
    } else {
        openMenu();
    }
});

if (closeSidebar) closeSidebar.addEventListener('click', closeMenu);
if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeMenu);

// --- Logika Dark Mode (Poprawiona) ---
const themeToggle = document.getElementById('themeToggle');
const sunIcon = document.getElementById('sunIcon');
const moonIcon = document.getElementById('moonIcon');
const themeText = document.getElementById('themeText');

function setDarkMode() {
    body.classList.add('dark');
    sunIcon?.classList.remove('hidden');
    moonIcon?.classList.add('hidden');
    if (themeText) themeText.innerText = "Tryb Jasny";
    localStorage.setItem('theme', 'dark');
}

function setLightMode() {
    body.classList.remove('dark');
    sunIcon?.classList.add('hidden');
    moonIcon?.classList.remove('hidden');
    if (themeText) themeText.innerText = "Tryb Ciemny";
    localStorage.setItem('theme', 'light');
}

if (localStorage.getItem('theme') === 'light') setLightMode(); else setDarkMode();

themeToggle?.addEventListener('click', () => {
    body.classList.contains('dark') ? setLightMode() : setDarkMode();
});

// --- Zakładki ---
function switchTab(target) {
    nMap.classList.remove('active');
    nVehicles.classList.remove('active');
    sMap.classList.add('hidden');
    sVehicles.classList.add('hidden');

    if(target === 'map') {
        nMap.classList.add('active');
        sMap.classList.remove('hidden');
        title.innerText = "Mapa Lokalizacji";
    } else {
        nVehicles.classList.add('active');
        sVehicles.classList.remove('hidden');
        title.innerText = "Odebrane Pojazdy";
    }
    if (window.innerWidth < 768) closeMenu();
}

nMap.addEventListener('click', () => switchTab('map'));
nVehicles.addEventListener('click', () => switchTab('vehicles'));

// --- Logika Mapy ---
const showMapBtn = document.getElementById("showMapBtn");
const mapDiv = document.getElementById("map");
const placeholder = document.getElementById("mapPlaceholder");
const addressInput = document.getElementById("address_input");
const addAddressBtn = document.getElementById("addAddressBtn");
const addressStatus = document.getElementById("address_status");
const carMakeInput = document.getElementById("car_make_input");
const carModelInput = document.getElementById("car_model_input");
const carNotesInput = document.getElementById("car_notes_input");

showMapBtn.onclick = () => {
    const apiKeyInput = document.getElementById('api_key_input');
    const currentKey = localStorage.getItem('google_maps_api_key') || apiKeyInput.value.trim();

    if (!currentKey) {
        alert("Najpierw wprowadź i zapisz klucz API Google Maps.");
        return;
    }

    if (mapDiv.style.display === "block") {
        mapDiv.style.display = "none";
        placeholder.style.display = "flex";
        showMapBtn.innerText = "Wczytaj Mapę";
        showMapBtn.classList.replace("bg-red-500", "bg-indigo-600");
    } else {
        mapDiv.style.display = "block";
        placeholder.style.display = "none";
        showMapBtn.innerText = "Ukryj Mapę";
        showMapBtn.classList.replace("bg-indigo-600", "bg-red-500");
        loadMap(currentKey);
    }
};

function setAddressStatus(message, type = "info") {
    if (!addressStatus) return;
    addressStatus.innerText = message;
    addressStatus.classList.remove("hidden", "text-slate-500", "text-red-400", "text-emerald-400");
    if (type === "error") addressStatus.classList.add("text-red-400");
    else if (type === "success") addressStatus.classList.add("text-emerald-400");
    else addressStatus.classList.add("text-slate-500");
}

function addAddressPoint() {
    const address = addressInput?.value.trim();
    if (!address) {
        setAddressStatus("Wpisz adres.", "error");
        addressInput?.focus();
        return;
    }
    if (!window.mapInstance || !window.mapGeocoder) {
        setAddressStatus("Najpierw wczytaj mape.", "error");
        return;
    }

    const carMake = carMakeInput?.value.trim() || "Nie podano";
    const carModel = carModelInput?.value.trim() || "Nie podano";
    const carNotes = carNotesInput?.value.trim() || "Brak uwag";

    setAddressStatus("Szukam adresu...", "info");
    window.mapGeocoder.geocode({ address }, (results, status) => {
        if (status === "OK" && results && results.length) {
            const location = results[0].geometry.location;
            const marker = new google.maps.Marker({
                map: window.mapInstance,
                position: location,
                title: address,
            });
            const infoContent = `
                <div style="min-width:220px">
                    <div style="font-weight:600;margin-bottom:4px">${address}</div>
                    <div><strong>Marka:</strong> ${carMake}</div>
                    <div><strong>Model:</strong> ${carModel}</div>
                    <div style="margin-top:6px"><strong>Uwagi:</strong> ${carNotes}</div>
                </div>
            `;
            marker.addListener("click", () => {
                window.mapInfoWindow.setContent(infoContent);
                window.mapInfoWindow.open(window.mapInstance, marker);
            });
            if (!window.mapMarkers) window.mapMarkers = [];
            window.mapMarkers.push(marker);
            window.mapInstance.setCenter(location);
            window.mapInstance.setZoom(14);
            setAddressStatus("Dodano punkt na mapie.", "success");
        } else {
            setAddressStatus("Nie znaleziono adresu.", "error");
        }
    });
}

addAddressBtn?.addEventListener("click", addAddressPoint);
addressInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") addAddressPoint();
});

function loadMap(key) {
    if(window.mapLoaded) return;
    window.mapLoaded = true;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
    script.async = true;
    script.onload = () => {
        window.mapInstance = new google.maps.Map(mapDiv, {
            center: { lat: 52.2297, lng: 21.0122 },
            zoom: 10,
        });
        window.mapGeocoder = new google.maps.Geocoder();
        window.mapInfoWindow = new google.maps.InfoWindow();
        window.mapMarkers = [];
        setAddressStatus("Mapa gotowa. Wpisz adres i dodaj punkt.", "info");
    };
    document.head.appendChild(script);
}

onAuthStateChanged(auth, user => {
    if (!user) window.location.href = "index.html";
});

document.getElementById("logoutBtn").onclick = () => {
    signOut(auth).then(() => { window.location.href = "index.html"; });
};

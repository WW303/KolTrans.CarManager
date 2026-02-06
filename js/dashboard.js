import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

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
const supabase = createClient(
    "https://wxmqeaxdptyajowxmawj.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4bXFlYXhkcHR5YWpvd3htYXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTA4MDksImV4cCI6MjA4NTk2NjgwOX0.1yfbvv-kXB-usCeJhpV1Xkc74Nbd5V7lxlUZB4qvYHI"
);

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
const destinationInput = document.getElementById("destination_input");
const carMakeInput = document.getElementById("car_make_input");
const carModelInput = document.getElementById("car_model_input");
const phoneInput = document.getElementById("phone_input");
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
        if (window.mapLoaded) {
            loadMarkersFromDb();
        } else {
            loadMap(currentKey);
        }
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

async function addAddressPoint() {
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
    const phone = phoneInput?.value.trim() || "Nie podano";
    const destination = destinationInput?.value.trim() || "Nie podano";
    const carNotes = carNotesInput?.value.trim() || "Brak uwag";

    setAddressStatus("Szukam adresu...", "info");
    window.mapGeocoder.geocode({ address }, async (results, status) => {
        if (status !== "OK" || !results || !results.length) {
            setAddressStatus("Nie znaleziono adresu.", "error");
            return;
        }

        const location = results[0].geometry.location;
        const lat = typeof location.lat === "function" ? location.lat() : location.lat;
        const lng = typeof location.lng === "function" ? location.lng() : location.lng;

        setAddressStatus("Zapisuję punkt w bazie...", "info");
        const { error } = await supabase.from("cars").insert([
            {
                adres: address,
                marka: carMake,
                model: carModel,
                uwagi: carNotes,
                czyOdebrany: false,
                docelowo: destination,
                numerTelefonu: phone,
                lat,
                lng,
            },
        ]);

        if (error) {
            setAddressStatus("Nie udało się zapisać punktu.", "error");
            return;
        }

        setAddressStatus("Punkt zapisany. Odświeżam mapę...", "success");
        await loadMarkersFromDb();
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
        setAddressStatus("Mapa gotowa. Wczytuję punkty...", "info");
        loadMarkersFromDb();
    };
    document.head.appendChild(script);
}

function buildInfoContent(record) {
    const address = record.adres || "Nie podano";
    const destination = record.docelowo || "Nie podano";
    const carMake = record.marka || "Nie podano";
    const carModel = record.model || "Nie podano";
    const phone = record.numerTelefonu || "Nie podano";
    const carNotes = record.uwagi || "Brak uwag";
    return `
        <div style="min-width:220px;color:#000">
            <div style="font-weight:600;margin-bottom:4px">${address}</div>
            <div><strong>Miejsce docelowe:</strong> ${destination}</div>
            <div><strong>Marka:</strong> ${carMake}</div>
            <div><strong>Model:</strong> ${carModel}</div>
            <div><strong>Telefon:</strong> ${phone}</div>
            <div style="margin-top:6px"><strong>Uwagi:</strong> ${carNotes}</div>
        </div>
    `;
}

async function loadMarkersFromDb() {
    if (!window.mapInstance || !window.mapGeocoder) return;
    if (window.mapMarkers?.length) {
        window.mapMarkers.forEach(marker => marker.setMap(null));
        window.mapMarkers = [];
    }

    const { data, error } = await supabase
        .from("cars")
        .select("id, adres, marka, model, uwagi, docelowo, numerTelefonu, lat, lng")
        .eq("czyOdebrany", false)
        .order("id", { ascending: false });

    if (error) {
        setAddressStatus("Błąd wczytywania punktów z bazy.", "error");
        return;
    }

    if (!data?.length) {
        setAddressStatus("Brak punktów do wyświetlenia.", "info");
        return;
    }

    let firstLocation = null;
    data.forEach(record => {
        const lat = Number(record.lat);
        const lng = Number(record.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return;
        }
        const location = { lat, lng };
        if (!firstLocation) firstLocation = location;
        const marker = new google.maps.Marker({
            map: window.mapInstance,
            position: location,
            title: record.adres || "",
        });
        const infoContent = buildInfoContent(record);
        marker.addListener("click", () => {
            window.mapInfoWindow.setContent(infoContent);
            window.mapInfoWindow.open(window.mapInstance, marker);
        });
        window.mapMarkers.push(marker);
    });

    if (firstLocation) {
        window.mapInstance.setCenter(firstLocation);
        window.mapInstance.setZoom(11);
        setAddressStatus("Punkty wczytane z bazy.", "success");
    } else {
        setAddressStatus("Brak punktów z poprawnymi współrzędnymi.", "info");
    }
}

onAuthStateChanged(auth, user => {
    if (!user) window.location.href = "index.html";
});

document.getElementById("logoutBtn").onclick = () => {
    signOut(auth).then(() => { window.location.href = "index.html"; });
};


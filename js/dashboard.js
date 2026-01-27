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

// --- Elementy DOM ---
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggleBtn');
const nMap = document.getElementById('navMap');
const nVehicles = document.getElementById('navVehicles');
const sMap = document.getElementById('sectionMap');
const sVehicles = document.getElementById('sectionVehicles');
const title = document.getElementById('pageTitle');

// Elementy napisów do zmiany koloru
const brandLogo = document.querySelector('aside h1');
const brandSub = document.querySelector('aside p');
const navLinks = document.querySelectorAll('.nav-link span');

// --- Logika Dark Mode ---
const themeToggle = document.getElementById('themeToggle');
const sunIcon = document.getElementById('sunIcon');
const moonIcon = document.getElementById('moonIcon');
const themeText = document.getElementById('themeText');
const body = document.body;

function setDarkMode() {
    body.classList.add('dark');
    sunIcon?.classList.remove('hidden');
    moonIcon?.classList.add('hidden');
    if (themeText) themeText.innerText = "Tryb Jasny";

    // Przywracanie jasnych kolorów dla ciemnego tła
    brandLogo.classList.replace('text-indigo-700', 'text-indigo-400');
    brandSub.classList.replace('text-slate-900', 'text-slate-500');

    localStorage.setItem('theme', 'dark');
}

function setLightMode() {
    body.classList.remove('dark');
    sunIcon?.classList.add('hidden');
    moonIcon?.classList.remove('hidden');
    if (themeText) themeText.innerText = "Tryb Ciemny";

    // Zmiana napisów na ciemne (czarne/ciemny slate)
    brandLogo.classList.replace('text-indigo-400', 'text-indigo-700');
    brandSub.classList.replace('text-slate-500', 'text-slate-900');

    localStorage.setItem('theme', 'light');
}

// Inicjalizacja motywu
if (localStorage.getItem('theme') === 'light') {
    setLightMode();
} else {
    setDarkMode();
}

themeToggle?.addEventListener('click', () => {
    if (body.classList.contains('dark')) {
        setLightMode();
    } else {
        setDarkMode();
    }
});

// --- Obsługa Sidebara i Zakładek ---
toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('sidebar-hidden');
});

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
}

nMap.addEventListener('click', () => switchTab('map'));
nVehicles.addEventListener('click', () => switchTab('vehicles'));

// --- Logika Mapy ---
const showMapBtn = document.getElementById("showMapBtn");
const mapDiv = document.getElementById("map");
const placeholder = document.getElementById("mapPlaceholder");

showMapBtn.onclick = () => {
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
        loadMap();
    }
};

function loadMap() {
    if(window.mapLoaded) return;
    window.mapLoaded = true;
    const script = document.createElement("script");
    script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyCDwQLig57_MHm7OrUpsqZxRYco9bI12gI";
    script.async = true;
    script.onload = () => {
        new google.maps.Map(mapDiv, {
            center: { lat: 52.2297, lng: 21.0122 },
            zoom: 10
        });
    };
    document.head.appendChild(script);
}

// --- Firebase Auth ---
onAuthStateChanged(auth, user => {
    if (!user) window.location.href = "index.html";
});

document.getElementById("logoutBtn").onclick = () => {
    signOut(auth).then(() => { window.location.href = "index.html"; });
};
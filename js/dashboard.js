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
const nDeliveredVehicles = document.getElementById('navDeliveredVehicles');
const sMap = document.getElementById('sectionMap');
const sVehicles = document.getElementById('sectionVehicles');
const sDeliveredVehicles = document.getElementById('sectionDeliveredVehicles');
const title = document.getElementById('pageTitle');
const brandLogo = document.querySelector('aside h1');
const brandSub = document.querySelector('aside p');
const body = document.body;
const vehiclesList = document.getElementById('vehiclesList');
const deliveredVehiclesList = document.getElementById('deliveredVehiclesList');
const groupByDestinationBtn = document.getElementById('groupByDestinationBtn');
const vehiclesSearchInput = document.getElementById("vehiclesSearchInput");
let receivedVehiclesCache = [];
let deliveredVehiclesCache = [];
let groupByDestination = false;
let vehicleSearchQuery = "";

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
    nDeliveredVehicles.classList.remove('active');
    sMap.classList.add('hidden');
    sVehicles.classList.add('hidden');
    sDeliveredVehicles.classList.add('hidden');

    if(target === 'map') {
        nMap.classList.add('active');
        sMap.classList.remove('hidden');
        title.innerText = "Mapa Lokalizacji";
    } else if (target === 'vehicles') {
        nVehicles.classList.add('active');
        sVehicles.classList.remove('hidden');
        title.innerText = "Pojazdy";
        loadReceivedVehicles();
    } else {
        nDeliveredVehicles.classList.add('active');
        sDeliveredVehicles.classList.remove('hidden');
        title.innerText = "Dostarczone pojazdy";
        loadDeliveredVehicles();
    }
    if (window.innerWidth < 768) closeMenu();
}

nMap.addEventListener('click', () => switchTab('map'));
nVehicles.addEventListener('click', () => switchTab('vehicles'));
nDeliveredVehicles.addEventListener('click', () => switchTab('delivered'));

// --- Logika Mapy ---
const showMapBtn = document.getElementById("showMapBtn");
const saveKeyBtn = document.getElementById("saveKeyBtn");
const apiKeyInput = document.getElementById("api_key_input");
const FORCED_MAP_ID = "AIzaSyCDwQLig57_MHm7OrUpsqZxRYco9bI12gI";
const mapDiv = document.getElementById("map");
const placeholder = document.getElementById("mapPlaceholder");
const countryFilterAllBtn = document.getElementById("countryFilterAllBtn");
const countryFilterPolandBtn = document.getElementById("countryFilterPolandBtn");
const countryFilterFranceBtn = document.getElementById("countryFilterFranceBtn");
const addressInput = document.getElementById("address_input");
const addAddressBtn = document.getElementById("addAddressBtn");
const addAddressAsReceivedBtn = document.getElementById("addAddressAsReceivedBtn");
const addressStatus = document.getElementById("address_status");
const destinationInput = document.getElementById("destination_input");
const destinationCountryInput = document.getElementById("destination_country_input");
const carMakeInput = document.getElementById("car_make_input");
const carModelInput = document.getElementById("car_model_input");
const phoneInput = document.getElementById("phone_input");
const pickupPhoneInput = document.getElementById("pickup_phone_input");
const carNotesInput = document.getElementById("car_notes_input");
const addressFormFields = document.getElementById("addressFormFields");
let addressFormHideTimer = null;
let selectedCountryFilter = "all";
window.mapHasMapId = false;

if (apiKeyInput) {
    apiKeyInput.value = localStorage.getItem("google_maps_api_key") || "";
}

function updateCountryFilterButtons() {
    const setState = (button, isActive) => {
        if (!button) return;
        button.classList.toggle("bg-indigo-600", isActive);
        button.classList.toggle("hover:bg-indigo-500", isActive);
        button.classList.toggle("text-white", isActive);
        button.classList.toggle("border-indigo-500", isActive);
        button.classList.toggle("bg-slate-800", !isActive);
        button.classList.toggle("hover:bg-slate-700", !isActive);
        button.classList.toggle("text-slate-300", !isActive);
        button.classList.toggle("border-slate-700", !isActive);
    };

    setState(countryFilterAllBtn, selectedCountryFilter === "all");
    setState(countryFilterPolandBtn, selectedCountryFilter === "Polska");
    setState(countryFilterFranceBtn, selectedCountryFilter === "Francja");
}

function setCountryFilter(filter) {
    selectedCountryFilter = filter;
    updateCountryFilterButtons();
    loadMarkersFromDb();
}

saveKeyBtn?.addEventListener("click", () => {
    const key = apiKeyInput?.value.trim() || "";
    if (key) localStorage.setItem("google_maps_api_key", key);
    else localStorage.removeItem("google_maps_api_key");
    setAddressStatus("Zapisano ustawienia Google Maps.", "success");
});

showMapBtn.onclick = () => {
    const currentKey = localStorage.getItem("google_maps_api_key") || apiKeyInput?.value.trim();
    const currentMapId = FORCED_MAP_ID;

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
            loadMap(currentKey, currentMapId);
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

function toggleAddressForm(hidden) {
    if (!addressFormFields) return;
    addressFormFields.classList.toggle("hidden", hidden);
}

function resetAddressForm() {
    if (addressInput) addressInput.value = "";
    if (carMakeInput) carMakeInput.value = "";
    if (carModelInput) carModelInput.value = "";
    if (phoneInput) phoneInput.value = "";
    if (pickupPhoneInput) pickupPhoneInput.value = "";
    if (destinationInput) destinationInput.value = "";
    if (destinationCountryInput) destinationCountryInput.value = "";
    if (carNotesInput) carNotesInput.value = "";
}

async function addAddressPoint(isReceived = false) {
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
    const pickupPhone = pickupPhoneInput?.value.trim() || "Nie podano";
    const destination = destinationInput?.value.trim() || "Nie podano";
    const destinationCountry = destinationCountryInput?.value.trim() || "";
    const carNotes = carNotesInput?.value.trim() || "Brak uwag";

    if (!destinationCountry) {
        setAddressStatus("Wybierz kraj docelowy.", "error");
        destinationCountryInput?.focus();
        return;
    }

    if (addressFormHideTimer) {
        clearTimeout(addressFormHideTimer);
        addressFormHideTimer = null;
    }
    toggleAddressForm(true);
    setAddressStatus("Szukam adresu...", "info");
    window.mapGeocoder.geocode({ address }, async (results, status) => {
        if (status !== "OK" || !results || !results.length) {
            setAddressStatus("Nie znaleziono adresu.", "error");
            toggleAddressForm(false);
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
                czyOdebrany: isReceived,
                docelowo: destination,
                krajDocelowy: destinationCountry,
                numerTelefonu: phone,
                numerTelefonuOdbioru: pickupPhone,
                lat,
                lng,
            },
        ]);

        if (error) {
            setAddressStatus("Nie udało się zapisać punktu.", "error");
            toggleAddressForm(false);
            return;
        }

        setAddressStatus("Punkt zapisany. Odświeżam mapę...", "success");
        await loadMarkersFromDb();
        resetAddressForm();
        addressFormHideTimer = setTimeout(() => {
            toggleAddressForm(false);
        }, 1200);
    });
}

addAddressBtn?.addEventListener("click", () => addAddressPoint(false));
addAddressAsReceivedBtn?.addEventListener("click", () => addAddressPoint(true));
countryFilterAllBtn?.addEventListener("click", () => setCountryFilter("all"));
countryFilterPolandBtn?.addEventListener("click", () => setCountryFilter("Polska"));
countryFilterFranceBtn?.addEventListener("click", () => setCountryFilter("Francja"));
addressInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") addAddressPoint(false);
});

function loadMap(key, mapId = "") {
    if(window.mapLoaded) return;
    window.mapLoaded = true;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=marker`;
    script.async = true;
    script.onload = async () => {
        const mapOptions = {
            center: { lat: 52.2297, lng: 21.0122 },
            zoom: 10,
        };
        const trimmedMapId = String(mapId || "").trim();
        if (trimmedMapId) {
            mapOptions.mapId = trimmedMapId;
            window.mapHasMapId = true;
        } else {
            window.mapHasMapId = false;
        }
        window.mapInstance = new google.maps.Map(mapDiv, mapOptions);
        if (window.mapHasMapId) {
            try {
                const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
                window.AdvancedMarkerElement = AdvancedMarkerElement;
            } catch (error) {
                window.AdvancedMarkerElement = null;
            }
        } else {
            window.AdvancedMarkerElement = null;
        }
        window.mapGeocoder = new google.maps.Geocoder();
        window.mapInfoWindow = new google.maps.InfoWindow();
        window.mapMarkers = [];
        setAddressStatus("Mapa gotowa. Wczytuję punkty...", "info");
        loadMarkersFromDb();
    };
    document.head.appendChild(script);
}

function buildInfoContent(record) {
    const escapeHtml = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    const rawAddress = (record.adres || "").trim();
    const address = escapeHtml(rawAddress || "Nie podano");
    const destination = escapeHtml(record.docelowo || "Nie podano");
    const destinationCountry = escapeHtml(record.krajDocelowy || "Nie podano");
    const carMake = escapeHtml(record.marka || "Nie podano");
    const carModel = escapeHtml(record.model || "Nie podano");
    const rawPhone = (record.numerTelefonu || "").trim();
    const rawPickupPhone = (record.numerTelefonuOdbioru || "").trim();
    const phone = escapeHtml(rawPhone || "Nie podano");
    const pickupPhone = escapeHtml(rawPickupPhone || "Nie podano");
    const carNotes = escapeHtml(record.uwagi || "Brak uwag");
    const id = escapeHtml(record.id || "Nie podano");
    const mapHref = rawAddress
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rawAddress)}`
        : "";
    const normalizedPhone = rawPhone.replace(/[^\d+]/g, "");
    const normalizedPickupPhone = rawPickupPhone.replace(/[^\d+]/g, "");
    const phoneHref = /\d/.test(normalizedPhone) ? `tel:${normalizedPhone}` : "";
    const pickupPhoneHref = /\d/.test(normalizedPickupPhone) ? `tel:${normalizedPickupPhone}` : "";
    const addressView = mapHref
        ? `<a class="map-popup-link" href="${mapHref}" target="_blank" rel="noopener noreferrer">${address}</a>`
        : address;
    const phoneView = phoneHref
        ? `<a class="map-popup-link" href="${phoneHref}">${phone}</a>`
        : phone;
    const pickupPhoneView = pickupPhoneHref
        ? `<a class="map-popup-link" href="${pickupPhoneHref}">${pickupPhone}</a>`
        : pickupPhone;

    return `
        <div class="map-popup" role="dialog" aria-label="Szczegoly pojazdu">
            <div class="map-popup-header">
                <div class="map-popup-title">${carMake} ${carModel}</div>
                <div class="map-popup-id">ID ${id}</div>
            </div>

            <div class="map-popup-row">
                <div class="map-popup-label">Adres</div>
                <div class="map-popup-value">${addressView}</div>
            </div>
            <div class="map-popup-row">
                <div class="map-popup-label">Miejsce docelowe</div>
                <div class="map-popup-value">${destination}</div>
            </div>
            <div class="map-popup-row">
                <div class="map-popup-label">Kraj docelowy</div>
                <div class="map-popup-value">${destinationCountry}</div>
            </div>
            <div class="map-popup-row">
                <div class="map-popup-label">Telefon</div>
                <div class="map-popup-value">${phoneView}</div>
            </div>
            <div class="map-popup-row">
                <div class="map-popup-label">Telefon odbioru</div>
                <div class="map-popup-value">${pickupPhoneView}</div>
            </div>
            <div class="map-popup-row">
                <div class="map-popup-label">Uwagi</div>
                <div class="map-popup-notes">${carNotes}</div>
            </div>

            <div class="map-popup-actions">
                <button class="map-popup-btn map-popup-btn-success mark-received-btn" data-id="${record.id}">
                    Oznacz odebrany
                </button>
                <button class="map-popup-btn map-popup-btn-danger delete-vehicle-btn" data-id="${record.id}">
                    Usun pojazd
                </button>
            </div>
        </div>
    `;
}
async function markAsReceived(recordId, button) {
    if (!recordId) return;
    if (button) {
        button.disabled = true;
        button.innerText = "Zmieniam status...";
    }
    const { error } = await supabase
        .from("cars")
        .update({ czyOdebrany: true })
        .eq("id", recordId);

    if (error) {
        if (button) {
            button.disabled = false;
            button.innerText = "Blad. Sprobuj ponownie";
        }
        return;
    }

    window.mapInfoWindow?.close();
    await loadMarkersFromDb();
}

async function deleteVehicle(recordId, button) {
    if (!recordId) return;
    if (button) {
        button.disabled = true;
        button.innerText = "Usuwam...";
    }
    const { error } = await supabase
        .from("cars")
        .delete()
        .eq("id", recordId);

    if (error) {
        if (button) {
            button.disabled = false;
            button.innerText = "Blad. Sprobuj ponownie";
        }
        return;
    }

    window.mapInfoWindow?.close();
    await loadMarkersFromDb();
}

async function markAsDelivered(recordId, button) {
    if (!recordId) return;
    if (button) {
        button.disabled = true;
        button.innerText = "Aktualizuje...";
    }
    const { error } = await supabase
        .from("cars")
        .update({ czyDostarczony: true, czyOdebrany: true })
        .eq("id", recordId);

    if (error) {
        if (button) {
            button.disabled = false;
            button.innerText = "Blad. Sprobuj ponownie";
        }
        return;
    }

    await loadReceivedVehicles();
    await loadDeliveredVehicles();
    await loadMarkersFromDb();
}

function updateGroupButtonLabel() {
    if (!groupByDestinationBtn) return;
    groupByDestinationBtn.innerText = groupByDestination
        ? "Pokaz wszystkie razem"
        : "Grupuj po miejscu docelowym";
}

function buildVehicleCard(record) {
    const escapeHtml = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    const rawAddress = (record.adres || "").trim();
    const address = escapeHtml(rawAddress || "Nie podano");
    const destination = record.docelowo || "Nie podano";
    const destinationCountry = record.krajDocelowy || "Nie podano";
    const carMake = record.marka || "Nie podano";
    const carModel = record.model || "Nie podano";
    const rawPhone = (record.numerTelefonu || "").trim();
    const rawPickupPhone = (record.numerTelefonuOdbioru || "").trim();
    const phone = escapeHtml(rawPhone || "Nie podano");
    const pickupPhone = escapeHtml(rawPickupPhone || "Nie podano");
    const carNotes = record.uwagi || "Brak uwag";
    const statusClass = record.czyOdebrany ? "vehicle-received" : "vehicle-pending";
    const statusText = record.czyOdebrany ? "Odebrany" : "Nieodebrany";
    const isDelivered = Boolean(record.czyDostarczony);
    const deliveryLabel = isDelivered ? "Dostarczony" : "Oznacz jako dostarczony";
    const mapHref = rawAddress
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rawAddress)}`
        : "";
    const normalizedPhone = rawPhone.replace(/[^\d+]/g, "");
    const normalizedPickupPhone = rawPickupPhone.replace(/[^\d+]/g, "");
    const phoneHref = /\d/.test(normalizedPhone) ? `tel:${normalizedPhone}` : "";
    const pickupPhoneHref = /\d/.test(normalizedPickupPhone) ? `tel:${normalizedPickupPhone}` : "";
    const addressView = mapHref
        ? `<a class="vehicle-link" href="${mapHref}" target="_blank" rel="noopener noreferrer">${address}</a>`
        : address;
    const phoneView = phoneHref
        ? `<a class="vehicle-link vehicle-phone-link" href="${phoneHref}">${phone}</a>`
        : phone;
    const pickupPhoneView = pickupPhoneHref
        ? `<a class="vehicle-link vehicle-phone-link" href="${pickupPhoneHref}">${pickupPhone}</a>`
        : pickupPhone;

    return `
        <div class="vehicle-card ${statusClass}">
            <div class="vehicle-card-header">
                <div class="vehicle-main">${carMake} ${carModel}</div>
                <div class="vehicle-destination"><span class="vehicle-destination-label">Miejsce docelowe:</span> ${destination}</div>
                <div class="vehicle-destination"><span class="vehicle-destination-label">Kraj docelowy:</span> ${destinationCountry}</div>
            </div>
            <div class="vehicle-grid">
                <div><span class="vehicle-label">Adres:</span> ${addressView}</div>
                <div><span class="vehicle-label">Telefon:</span> ${phoneView}</div>
                <div><span class="vehicle-label">Telefon odbioru:</span> ${pickupPhoneView}</div>
                <div><span class="vehicle-label">Status:</span> <span class="vehicle-status-text">${statusText}</span></div>
                <div class="vehicle-notes"><span class="vehicle-label">Uwagi:</span> ${carNotes}</div>
            </div>
            <div class="vehicle-card-actions">
                <button class="vehicle-delivery-btn mark-delivered-btn" data-id="${record.id}" ${isDelivered ? "disabled" : ""}>
                    ${deliveryLabel}
                </button>
            </div>
        </div>
    `;
}

function bindGroupToggles() {
    const toggles = document.querySelectorAll(".vehicle-group-toggle");
    toggles.forEach(toggle => {
        toggle.addEventListener("click", () => {
            const targetId = toggle.getAttribute("data-target");
            const list = document.getElementById(targetId);
            if (!list) return;
            const isCollapsed = list.classList.toggle("is-collapsed");
            toggle.setAttribute("aria-expanded", String(!isCollapsed));
        });
    });
}

function bindDeliveryButtons() {
    const buttons = document.querySelectorAll(".mark-delivered-btn");
    buttons.forEach(button => {
        const id = button.getAttribute("data-id");
        if (!id || button.disabled) return;
        button.addEventListener("click", () => markAsDelivered(id, button), { once: true });
    });
}

function normalizeSearchText(value) {
    return String(value || "")
        .toLocaleLowerCase("pl-PL")
        .trim();
}

function filterReceivedVehicles(records) {
    const query = normalizeSearchText(vehicleSearchQuery);
    if (!query) return records;

    const tokens = query.split(/\s+/).filter(Boolean);
    if (!tokens.length) return records;

    return records.filter(record => {
        const searchable = normalizeSearchText(
            `${record.marka || ""} ${record.model || ""} ${record.adres || ""}`
        );
        return tokens.every(token => searchable.includes(token));
    });
}

function renderReceivedVehicles(records) {
    if (!vehiclesList) return;
    if (!records?.length) {
        vehiclesList.innerHTML = `
            <div class="vehicles-empty">
                Brak pojazdow do wyswietlenia.
            </div>
        `;
        return;
    }

    const filteredRecords = filterReceivedVehicles(records);
    if (!filteredRecords.length) {
        vehiclesList.innerHTML = `
            <div class="vehicles-empty">
                Brak pojazdow pasujacych do wyszukiwania.
            </div>
        `;
        return;
    }

    if (!groupByDestination) {
        vehiclesList.innerHTML = filteredRecords.map(buildVehicleCard).join("");
        bindDeliveryButtons();
        return;
    }

    const groups = filteredRecords.reduce((acc, record) => {
        const destinationRaw = (record.docelowo || "Nie podano").trim();
        const normalizedKey = destinationRaw.toLocaleLowerCase("pl-PL");
        if (!acc[normalizedKey]) {
            acc[normalizedKey] = {
                label: destinationRaw,
                items: [],
            };
        }
        acc[normalizedKey].items.push(record);
        return acc;
    }, {});

    vehiclesList.innerHTML = Object.entries(groups)
        .map(([, group], index) => `
            <div class="vehicle-group">
                <button class="vehicle-group-toggle" type="button" aria-expanded="false" data-target="vehicle-group-${index}">
                    <span class="vehicle-group-title">${group.label}</span>
                    <span class="vehicle-group-count">${group.items.length}</span>
                </button>
                <div class="vehicle-group-list is-collapsed" id="vehicle-group-${index}">
                    ${group.items.map(buildVehicleCard).join("")}
                </div>
            </div>
        `)
        .join("");
    bindGroupToggles();
    bindDeliveryButtons();
}

function renderDeliveredVehicles(records) {
    if (!deliveredVehiclesList) return;
    if (!records?.length) {
        deliveredVehiclesList.innerHTML = `
            <div class="vehicles-empty">
                Brak dostarczonych pojazdow do wyswietlenia.
            </div>
        `;
        return;
    }

    deliveredVehiclesList.innerHTML = records.map(buildVehicleCard).join("");
    bindDeliveryButtons();
}

async function loadReceivedVehicles() {
    if (!vehiclesList) return;
    vehiclesList.innerHTML = `<div class="vehicles-loading">Wczytuje pojazdy...</div>`;

    const { data, error } = await supabase
        .from("cars")
        .select("id, adres, marka, model, uwagi, docelowo, krajDocelowy, numerTelefonu, numerTelefonuOdbioru, czyOdebrany, czyDostarczony")
        .or("czyDostarczony.is.null,czyDostarczony.eq.false")
        .order("id", { ascending: false });

    if (error) {
        vehiclesList.innerHTML = `<div class="vehicles-empty">Nie udalo sie wczytac pojazdow.</div>`;
        return;
    }

    receivedVehiclesCache = data || [];
    renderReceivedVehicles(receivedVehiclesCache);
}

async function loadDeliveredVehicles() {
    if (!deliveredVehiclesList) return;
    deliveredVehiclesList.innerHTML = `<div class="vehicles-loading">Wczytuje dostarczone pojazdy...</div>`;

    const { data, error } = await supabase
        .from("cars")
        .select("id, adres, marka, model, uwagi, docelowo, krajDocelowy, numerTelefonu, numerTelefonuOdbioru, czyOdebrany, czyDostarczony")
        .eq("czyDostarczony", true)
        .order("id", { ascending: false });

    if (error) {
        deliveredVehiclesList.innerHTML = `<div class="vehicles-empty">Nie udalo sie wczytac dostarczonych pojazdow.</div>`;
        return;
    }

    deliveredVehiclesCache = data || [];
    renderDeliveredVehicles(deliveredVehiclesCache);
}

async function loadMarkersFromDb() {
    if (!window.mapInstance || !window.mapGeocoder) return;
    if (window.mapMarkers?.length) {
        window.mapMarkers.forEach(marker => marker.setMap(null));
        window.mapMarkers = [];
    }

    let pointsQuery = supabase
        .from("cars")
        .select("id, adres, marka, model, uwagi, docelowo, krajDocelowy, numerTelefonu, numerTelefonuOdbioru, lat, lng")
        .eq("czyOdebrany", false);

    if (selectedCountryFilter !== "all") {
        pointsQuery = pointsQuery.eq("krajDocelowy", selectedCountryFilter);
    }

    const { data, error } = await pointsQuery.order("id", { ascending: false });

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
            window.mapInfoWindow.open({
                anchor: marker,
                map: window.mapInstance,
            });
            google.maps.event.addListenerOnce(window.mapInfoWindow, "domready", () => {
                const markReceivedSelector = `.mark-received-btn[data-id="${record.id}"]`;
                const markReceivedButton = document.querySelector(markReceivedSelector);
                if (markReceivedButton) {
                    markReceivedButton.addEventListener("click", () => markAsReceived(record.id, markReceivedButton), { once: true });
                }

                const deleteVehicleSelector = `.delete-vehicle-btn[data-id="${record.id}"]`;
                const deleteVehicleButton = document.querySelector(deleteVehicleSelector);
                if (deleteVehicleButton) {
                    deleteVehicleButton.addEventListener("click", () => deleteVehicle(record.id, deleteVehicleButton), { once: true });
                }
            });
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

groupByDestinationBtn?.addEventListener("click", () => {
    groupByDestination = !groupByDestination;
    updateGroupButtonLabel();
    renderReceivedVehicles(receivedVehiclesCache);
});

vehiclesSearchInput?.addEventListener("input", () => {
    vehicleSearchQuery = vehiclesSearchInput.value || "";
    renderReceivedVehicles(receivedVehiclesCache);
});

updateGroupButtonLabel();
updateCountryFilterButtons();

onAuthStateChanged(auth, user => {
    if (!user) window.location.href = "index.html";
});

document.getElementById("logoutBtn").onclick = () => {
    signOut(auth).then(() => { window.location.href = "index.html"; });
};




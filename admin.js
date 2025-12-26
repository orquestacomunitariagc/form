import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Config from script.js
const firebaseConfig = {
    apiKey: "AIzaSyC7IguKInyXAEhyk_5K49IQbeBGGqEj5Xo",
    authDomain: "form-a16e8.firebaseapp.com",
    projectId: "form-a16e8",
    storageBucket: "form-a16e8.firebasestorage.app",
    messagingSenderId: "1048427648466",
    appId: "1:1048427648466:web:f8388c97ba9e7b1258640b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const responsesBody = document.getElementById('responsesBody');
const totalCount = document.getElementById('total-count');
const filteredCountLabel = document.getElementById('filtered-count-label');
const exportBtn = document.getElementById('exportBtn');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');

// Filters
const filters = {
    attendance: document.getElementById('filterAttendance'),
    group: document.getElementById('filterGroup'),
    instrument: document.getElementById('filterInstrument'),
    voice: document.getElementById('filterVoice'),
    island: document.getElementById('filterIsland'),
    resident: document.getElementById('filterResident'),
    room: document.getElementById('filterRoom')
};

let allData = [];

// Auth State Observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        loadData();
    } else {
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    }
});

// Login Handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        loginError.textContent = "Error: Credenciales incorrectas o usuario no encontrado.";
        loginError.style.display = 'block';
    }
});

logoutBtn.addEventListener('click', () => signOut(auth));

// Load Data
async function loadData() {
    try {
        const q = query(collection(db, "responses"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        allData = [];
        querySnapshot.forEach((doc) => {
            allData.push(doc.data());
        });

        // Populate dynamic filters from data
        populateDynamicFilters();

        // Render table
        renderTable(allData);

    } catch (error) {
        console.error("Error loading data:", error);
        alert("Error al cargar datos. Verifica permisos.");
    }
}

function getUniqueValues(key) {
    const values = new Set();
    allData.forEach(row => {
        if (row[key]) values.add(row[key]);
    });
    return Array.from(values).sort();
}

function populateDynamicFilters() {
    const instruments = getUniqueValues('instrument');
    const voices = getUniqueValues('voiceType');
    const islands = getUniqueValues('island');

    populateSelect(filters.instrument, instruments, "Instrumento (Todos)");
    populateSelect(filters.voice, voices, "Voz (Todos)");
    populateSelect(filters.island, islands, "Isla (Todos)");
}

function populateSelect(selectResult, options, defaultText) {
    selectResult.innerHTML = `<option value="">${defaultText}</option>`;
    options.forEach(opt => {
        selectResult.innerHTML += `<option value="${opt}">${opt}</option>`;
    });
}

function renderTable(data) {
    responsesBody.innerHTML = '';
    let count = 0;

    data.forEach(row => {
        count++;
        const date = row.timestamp ? new Date(row.timestamp.seconds * 1000).toLocaleString() : 'N/A';
        const instrumentOrVoice = row.groupType === 'Coro' ? (row.voiceType || '-') : (row.instrument || '-');

        const tr = `
            <tr>
                <td>${date}</td>
                <td><strong>${row.fullName}</strong></td>
                <td>${row.attendance === 'yes' ? '<span style="color:green">Sí</span>' : '<span style="color:red">No</span>'}</td>
                <td>${row.groupType || '-'}</td>
                <td>${instrumentOrVoice}</td>
                <td>${row.island || '-'}</td>
                <td>${row.residentCert === 'yes' ? 'Sí' : (row.attendance === 'yes' ? 'No' : '-')}</td>
                <td>
                    ${row.roomSharing === 'selected' ? 'Compartir' : (row.roomSharing === 'organization' ? 'Asignar' : '-')}
                </td>
                <td>${row.roommateNames || '-'}</td>
                <td>${row.medicalInfo || '-'}</td>
            </tr>
        `;
        responsesBody.innerHTML += tr;
    });

    totalCount.textContent = allData.length;
    if (data.length !== allData.length) {
        filteredCountLabel.textContent = `(Filtrados: ${count})`;
    } else {
        filteredCountLabel.textContent = '';
    }
}

// Filter Logic
function applyFilters() {
    const filtersValues = {
        attendance: filters.attendance.value,
        groupType: filters.group.value,
        instrument: filters.instrument.value,
        voiceType: filters.voice.value,
        island: filters.island.value,
        residentCert: filters.resident.value,
        roomSharing: filters.room.value
    };

    const filteredData = allData.filter(row => {
        return Object.keys(filtersValues).every(key => {
            const filterVal = filtersValues[key];
            if (!filterVal) return true; // No filter selected for this key
            return row[key] === filterVal;
        });
    });

    renderTable(filteredData);
}

// Add listeners to filters
Object.values(filters).forEach(select => {
    select.addEventListener('change', applyFilters);
});

clearFiltersBtn.addEventListener('click', () => {
    Object.values(filters).forEach(select => select.value = "");
    applyFilters();
});

// CSV Export uses current filtered list or all? Usually all, but filtered is nice.
// User requested "all responses" generally, but filters "to view". 
// Let's export currently visible (filtered) for flexibility.
exportBtn.addEventListener('click', () => {
    // Re-calculate filtered data to be sure (or store it in global)
    // For simplicity, just re-apply filters logic or grab from table. 
    // Let's just use allData for export to be safe unless user specifically asks for "filtered export".
    // "quiero crear filtros ... para ver todas las respuestas" -> Export logic untouched (All Data) is safest.

    if (allData.length === 0) return;

    const headers = ["Fecha", "Nombre", "Asistencia", "Agrupación", "Instrumento", "Voz", "Isla", "Cert. Residente", "Habitación", "Compañeros", "Info Médica"];
    const csvRows = [headers.join(',')];

    allData.forEach(row => {
        const date = row.timestamp ? new Date(row.timestamp.seconds * 1000).toLocaleString().replace(',', '') : 'N/A';
        const values = [
            date,
            `"${row.fullName || ''}"`,
            row.attendance,
            row.groupType || '',
            `"${row.instrument || ''}"`,
            row.voiceType || '',
            row.island || '',
            row.residentCert || '',
            row.roomSharing || '',
            `"${row.roommateNames || ''}"`,
            `"${row.medicalInfo || ''}"`
        ];
        csvRows.push(values.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "respuestas_formulario.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
    apiKey: "AIzaSyC7IguKInyXAEhyk_5K49IQbeBGGqEj5Xo",
    authDomain: "form-a16e8.firebaseapp.com",
    projectId: "form-a16e8",
    storageBucket: "form-a16e8.firebasestorage.app",
    messagingSenderId: "1048427648466",
    appId: "1:1048427648466:web:f8388c97ba9e7b1258640b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('responseForm');
    const attendanceRadios = document.getElementsByName('attendance');
    const basicInfoSection = document.getElementById('basic-info');
    const detailedInfoSection = document.getElementById('detailed-info');
    const conditionalRequiredInputs = document.querySelectorAll('.conditional-required');

    // Group/Instrument/Voice logic
    const groupTypeSelect = document.getElementById('groupType');
    const instrumentGroup = document.getElementById('instrument-group');
    const instrumentSelect = document.getElementById('instrument');
    const voiceGroup = document.getElementById('voice-group');
    const voiceSelect = document.getElementById('voiceType');

    // Roommate logic
    const roomSharingRadios = document.getElementsByName('roomSharing');
    const roommateNamesGroup = document.getElementById('roommate-names-group');
    const roommate1Name = document.getElementById('roommate1Name');
    const roommate2Name = document.getElementById('roommate2Name');

    // Toggle Details Section based on Attendance
    attendanceRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'yes') {
                detailedInfoSection.classList.remove('hidden');
                // Make static conditional fields required
                conditionalRequiredInputs.forEach(input => input.required = true);
            } else {
                detailedInfoSection.classList.add('hidden');
                // Remove required attribute from all conditional fields (static and dynamic)
                conditionalRequiredInputs.forEach(input => input.required = false);
                instrumentSelect.required = false;
                voiceSelect.required = false;
            }
        });
    });

    // Toggle Instrument/Voice based on Group Type
    groupTypeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'Orquesta') {
            instrumentGroup.classList.remove('hidden');
            voiceGroup.classList.add('hidden');
            instrumentSelect.required = true;
            voiceSelect.required = false;
            voiceSelect.value = ""; // Reset
        } else if (e.target.value === 'Coro') {
            instrumentGroup.classList.add('hidden');
            voiceGroup.classList.remove('hidden');
            instrumentSelect.required = false;
            voiceSelect.required = true;
            instrumentSelect.value = ""; // Reset
        } else {
            // Should not happen with valid selection, but reset just in case
            instrumentGroup.classList.add('hidden');
            voiceGroup.classList.add('hidden');
            instrumentSelect.required = false;
            voiceSelect.required = false;
        }
    });

    // Toggle Roommate Names field
    roomSharingRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'selected') {
                roommateNamesGroup.classList.remove('hidden');
                roommate1Name.required = true;
            } else {
                roommateNamesGroup.classList.add('hidden');
                roommate1Name.required = false;
                roommate1Name.value = ''; // Clear values
                roommate2Name.value = '';
                document.getElementById('roommate1Instrument').value = '';
                document.getElementById('roommate2Instrument').value = '';
            }
        });
    });

    // Handle Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('submitBtn');
        const originalBtnText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerText = 'Enviando...';

        try {
            // Collect form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Add timestamp
            data.timestamp = serverTimestamp();

            // Save to Firestore
            const docRef = await addDoc(collection(db, "responses"), data);

            console.log("Document written with ID: ", docRef.id);
            // Redirect to thank you page
            window.location.href = 'thank-you.html';
            form.reset();

            // Reset visibility
            detailedInfoSection.classList.add('hidden');
            roommateNamesGroup.classList.add('hidden');

        } catch (e) {
            console.error("Error adding document: ", e);
            alert("Hubo un error al guardar tu respuesta. Por favor, intenta de nuevo. (Revisa la consola si eres el administrador)");
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = originalBtnText;
        }
    });
});

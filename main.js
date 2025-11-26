
//-----------------------------------------------------------------------------
// Routing i obsługa widoków na podstawie hash-y w URL
// Przejścia między widokami za pomocą window.location.hash
// Aplikacja obsługuje 3 widoki: add, list, edit
// spisane w jednym pliku HTML. Przejścia opierają się na ustawianiu flagi 
// 'active' dla odpowiedniego <div> zawierającego widok
//-----------------------------------------------------------------------------
const views = {
    add: document.getElementById('view-add'),
    list: document.getElementById('view-list'),
    edit: document.getElementById('view-edit'),
}
// TODO Sprawdzić czy curretView jest faktycznie potrzebne
// TODO Zmiana domyślnego na 'list'
let currentView = 'add';

// TODO Zmiana domyślnego na view-list
function showView(view = 'add') {
    Object.values(views).forEach(view => {
        view.classList.remove('active');
    });
    
    if (views[view]) {
        views[view].classList.add('active');
        currentView = view;
        
        //TODO Dodać handler dla widoków
    } else {
        console.error(`Widok ${view} nie istnieje`);
    }
}
// Obsługa zmiany URL i aktualizacja widoków
window.addEventListener('hashchange', () => {
    const view = window.location.hash.slice(1);
    if (view && views[view]) {
        showView(view);
    } else {
        console.error(`View ${view} does not exist`);
    }
});
function initRouter() {
    const hash = window.location.hash.slice(1);
    if (hash && views[hash]) {
        showView(hash);
    } else {
        // TODO Zmiana domyślnego na 'add'
        const defaultView = 'add';
        window.location.hash = defaultView;
        showView(defaultView);
    }
}
initRouter();

//-----------------------------------------------------------------------------
// Widok dodawania notatki
// Nagrywanie audio, rozpoznawanie mowy (tylko Chrome na PC), zapis do IndexedDB
//-----------------------------------------------------------------------------

const recordBtn = document.getElementById('recordBtn');
const saveBtn = document.getElementById('saveBtn');
const noteText = document.getElementById('noteText');
const audioDiv = document.getElementById('audio-wrapper');
const errorMessageDiv = document.getElementById('errorMessageDiv');
const mobileErrorMessageDiv = document.getElementById('mobileErrorMessageDiv');
let mediaRecorder;
let recognition = null;
let audioChunk = [];
let lastRecordedBlob = null;

// Wypisanie informacji o błędach dla użytkownika
function audioStreamErrorMessage(error) {
    if (errorMessageDiv.firstChild) {
        errorMessageDiv.removeChild(errorMessageDiv.firstChild);
    }
    const p = document.createElement('p');
    let message = '';

    switch (error.message) {
        case 'Audio recording is not supported in this browser':
            message = 'Nagrywanie dźwięku nie jest obsługiwane w przeglądarce';
            break;
        case 'No permission to use microphone':
            message = 'Brak uprawnień do użycia mikrofonu';
            break;
        case 'Microphone not found':
            message = 'Mikrofon nie został znaleziony';
            break;
        case 'Wrong protocol. Recording only works on HTTPS':
            message = 'Błąd protokołu sieciowego.Nagrywanie dźwięku działa tylko na HTTPS';
            break;
        case 'Audio playback failed':
            message = 'Nie udało się odtworzyć audio';
            break;
        default:
            message = 'Nie udało się pobierać strumienia audio';
    }
    p.textContent = message;
    errorMessageDiv.appendChild(p);
}
function moblileVersionErrorMessage() {
    if (mobileErrorMessageDiv.firstChild) {
        mobileErrorMessageDiv.removeChild(mobileErrorMessageDiv.firstChild);
    }
    const p = document.createElement('p');
    p.textContent = ('Wersja Android nie obsługuje rozpoznawania mowy');
    mobileErrorMessageDiv.appendChild(p);
}

// Sprawdzenie czy przeglądarka w ogóle obsługuje rozpoznawanie mowy
// Jeśli obsługuje, to tworzymy obiekt do ciągłęgo rozpoznawania mowy.
// Rozpoznane wyniki dopisujemy do tekstu notatki
// Z racji na działanie przeglądarki na Androidzie, rozpoznawanie mowy jest wyłączone!
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'pl-PL';
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.addEventListener('result', (e) => {
        let finalTranscript = '';
        for (let i = 0; i < e.results.length; i++) {
            console.log(e.results[i][0].transcript);
            finalTranscript = finalTranscript + e.results[i][0].transcript.trim() + '\n';
        };
        noteText.value = finalTranscript;
    });
    recognition.addEventListener('error', (e) => {
        console.error("Speech Recognition Error: ", e.error);
    });
    recognition.addEventListener('end', () => {
        console.log("Speech Recognition ended");
    });
}

function isAndroid() {
    return /android/i.test(navigator.userAgent);
}

function checkMediaRecorderSupport() {
    if (typeof MediaRecorder === 'undefined') {
        throw new Error('MediaRecorder is not supported in this browser');
    }
}

async function getAudioStream() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Audio recording is not supported in this browser");
    }

    try {
        return await navigator.mediaDevices.getUserMedia({ audio: true});
    } catch (e) {
        if (e.name === "NotAllowedError" || e.name === "SeciurityError") {
            throw new Error("No permission to use microphone");
        }
        if (e.name === "NotFoundError") {
            throw new Error("Microphone not found");
        }
        if (location.protocol !== "https:") {
            throw new Error("Wrong protocol. Recording only works on HTTPS");
        }

        throw new Error("Could not get audio stream: " + e.message);

    }
}

// Rozpoczęcie nagrywania audio i ewentualnego rozpoznawania mowy
recordBtn.addEventListener('click', async () => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        try {
            checkMediaRecorderSupport();

            // Rozpoznawania mowy nie inicjujemy na Androidzie ze względów na ograniczenia w przeglądarce.
            if (recognition && !isAndroid()) {
                recognition.start();
            }
            if (isAndroid()) {
                moblileVersionErrorMessage();
            }

            const stream = await getAudioStream();
            mediaRecorder = new MediaRecorder(stream);
            audioChunk = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunk.push(e.data);
            }

            mediaRecorder.onstop = async () => {
                const blob = new Blob(audioChunk, { type: 'audio/wav' });
                lastRecordedBlob = blob;

                const audioUrl = URL.createObjectURL(blob);
                const audio = new Audio(audioUrl);

                audio.controls = true;
                if (audioDiv.firstChild) {
                    audioDiv.removeChild(audioDiv.firstChild);
                    audioDiv.style.display = "none";
                }
                audioDiv.appendChild(audio);
                audioDiv.style.display = "block";

                try {
                    audio.play();
                } catch (e) {
                    console.error(e);
                    audioErrorMessage(e);
                }

                audioChunk = [];
            };

            mediaRecorder.start();
            recordBtn.textContent = 'Zatrzymaj nagrywanie...';
        } catch (e) {
            console.error(e);
            audioStreamErrorMessage(e);
            return;
        }
    } else {
        if (recognition && !isAndroid()) recognition.stop();
        mediaRecorder.stop();
        recordBtn.textContent = 'Rozpocznij nagrywanie';
    }
});



// Baza danych i zapis do niej

let db;
const openRequest = indexedDB.open('notes', 1);

openRequest.onerror = function() {
    console.error("DB Error", openRequest.error);
};
openRequest.onsuccess = (e) => {
    db = e.target.result;
    console.log("DB opened succesfully");
};

openRequest.onupgradeneeded = (e) => {
    db = e.target.result;
    const objectStoreNotes = db.createObjectStore("text", { keyPath: 'id'});
    const objectStoreAudio = db.createObjectStore("audio", { keyPath: 'id'});

    objectStoreAudio.createIndex("noteId", "noteId", { unique: true });
};

function dbGetAllText() {
    const notes = [];
    try {
        db
        .transaction("text", "readonly")
        .objectStore("text")
        .openCursor()
        .onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
                notes.push(cursor.value);
                cursor.continue();
            }
        }
    } catch (e) {
        console.error(e);
    }
    return notes;
}
function dbGetAudio(id, noteId = null) {
    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction("audio", "readonly");
            const store = tx.objectStore("audio");
            if (id) {
                const req = store.get(id);
                req.onsuccess = (e) => resolve(e.target.result);
                req.onerror = (e) => reject(e.target.error || new Error("DB request failed"));
            } else if (noteId) {
                const index = store.index("noteId");
                const req = index.get(noteId);
                req.onsuccess = (e) => resolve(e.target.result);
                req.onerror = (e) => reject(e.target.error || new Error("DB request failed"));
            } else {
                reject(new Error("dbGetAudio requires id or noteId"));
            }
        } catch (e) {
            reject(e);
        }
    });
}

function dbAddNote(text, audio = null) {
    const noteId = crypto.randomUUID();
    try {
        db
        .transaction("text", "readwrite")
        .objectStore("text")
        .add({
            id: noteId,
            text: text.trim(),
            hasAudio: !!audio,
            createdAt: Date.now(),
            updatedAt: Date.now()
        })
        .onsuccess = ((e) => {
            console.log(`Text of note added.`);
        })
    } catch (e) {
        console.error(e);
    }
    if (!!audio) {
        try {
            db
            .transaction("audio", "readwrite")
            .objectStore("audio")
            .add({
                id: crypto.randomUUID(),
                noteId: noteId,
                blob: audio
            });
            // TODO
            idLastRecordedNote = noteId;
        } catch (e) {
            console.error(e);
        }
    }
}

function saveNote() {
    const checked = document.getElementById('checkbox').checked;
    dbAddNote(noteText.value, checked ? lastRecordedBlob : null);
}
saveBtn.addEventListener('click', () => {
    console.log("trying to save note");
    saveNote();
});

let idLastRecordedNote = null;// TODO
const testBtn = document.getElementById('testBtn');
const testAudioDiv = document.getElementById('test-audio-wrapper');
testBtn.addEventListener("click", async () => {
    if (!!idLastRecordedNote) {
        try {
            const result = await dbGetAudio(null, idLastRecordedNote);
            if (!result || !result.blob) {
                console.warn("No audio for this note");
                return;
            }

            const audio = new Audio(URL.createObjectURL(result.blob));
            audio.controls = true;

            if (testAudioDiv.firstChild) {
                testAudioDiv.removeChild(testAudioDiv.firstChild);
                testAudioDiv.style.display = "none";
            }
            testAudioDiv.appendChild(audio);
            testAudioDiv.style.display = "block";
        } catch (e) {
            console.error(e);
        }
    }
});
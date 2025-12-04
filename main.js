//-----------------------------------------------------------------------------
// Zmienne globalne i funkcje inicjujące
//-----------------------------------------------------------------------------

const colorAccent = "#007BE5";

// Widok wyświetlania notatek
const notesList = document.getElementById('notesList');
const emptyList = document.getElementById('emptyList');
// Widok dodawania notatki
const recordBtn = document.getElementById('recordBtn');
const saveBtn = document.getElementById('saveBtn');
const noteText = document.getElementById('noteText');
const audioAddDiv = document.getElementById('audioWrapperAdd');
const errorMessageDiv = document.getElementById('errorMessageDiv');
const mobileErrorMessageDiv = document.getElementById('mobileErrorMessageDiv');
let mediaRecorder;
let recognition = null;
let audioChunk = [];
let lastRecordedBlob = null;
// Widok edycji notatki
const editNoteText = document.getElementById('editNoteText');
const editCreatedAt = document.getElementById('editCreatedAt');
const editUpdatedAt = document.getElementById('editUpdatedAt');
const audioEditDiv = document.getElementById('audioWrapperEdit');
const updateBtn = document.getElementById('updateBtn');
const deleteAudioBtn = document.getElementById('deleteAudioBtn');
const deleteBtn = document.getElementById('deleteBtn');
const cancelEditBtn = document.getElementById('cancelBtn');


let db;
function initDb () {
    return new Promise((resolve, reject) => {
        const openRequest = indexedDB.open('notes', 1);
        openRequest.onerror = function() {
            console.error("DB Error", openRequest.error);
            reject(openRequest.error);
        };
        openRequest.onsuccess = (e) => {
            db = e.target.result;
            console.log("DB opened succesfully");
            resolve(db);
        };
        
        openRequest.onupgradeneeded = (e) => {
            db = e.target.result;
            if (!db.objectStoreNames.contains("text")) 
                db.createObjectStore("text", { keyPath: 'id'});
            
            if (!db.objectStoreNames.contains("audio")) {
                const objectStoreAudio = db.createObjectStore("audio", { keyPath: 'id'});
                objectStoreAudio.createIndex("noteId", "noteId", { unique: true });
            }
        };
    })
}

function iconsInNavBar() {
    const navListBtn = document.getElementById('navListBtn');
    navListBtn.textContent = '';
    navListBtn.appendChild(
        createSvgIcon("M9.35547 0.235089C9.72769 -0.0783629 10.2723 -0.0783629 10.6445 0.235089L19.6445 7.81419C19.8698 8.00419 20 8.28411 20 8.57884V18.9997C19.9999 19.5519 19.5522 19.9997 19 19.9997H1C0.447803 19.9997 0.000141967 19.5519 0 18.9997V8.57884C0 8.28411 0.130186 8.00419 0.355469 7.81419L9.35547 0.235089ZM2 9.04368V17.9997H6.63184V11.4206C6.63192 10.8684 7.0796 10.4206 7.63184 10.4206H12.3682C12.9204 10.4206 13.3681 10.8684 13.3682 11.4206V17.9997H18V9.04368L10 2.30638L2 9.04368ZM8.63184 17.9997H11.3682V12.4206H8.63184V17.9997Z")
    );

    const navAddBtn = document.getElementById('navAddBtn');
    navAddBtn.textContent = '';
    navAddBtn.appendChild(
        createSvgIcon('M10 0C4.477 0 0 4.477 0 10C0 15.523 4.477 20 10 20C15.523 20 20 15.523 20 10C20 4.477 15.523 0 10 0ZM15 11H11V15H9V11H5V9H9V5H11V9H15V11Z')
    );
}

async function init() {
    console.log('App inicializing...');
    try {
        await initDb();
        initRouter();
        iconsInNavBar();
        console.log('App initialized.');
    } catch (e) {
        console.error(e);
    }
}


//-----------------------------------------------------------------------------
// Obsługa bazy danych
//-----------------------------------------------------------------------------
function dbGetAllText() {
    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction("text", "readonly");
            const store = tx.objectStore("text");
            const req = store.getAll();
            req.onsuccess = (e) => resolve(e.target.result);
            req.onerror = (e) => reject(e.target.error || new Error("DB request failed"));
        } catch (e) {
            reject(e);
        }
    });
}
function dbGetText(noteId) {
    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction("text", "readonly");
            const store = tx.objectStore("text");
            const req = store.get(noteId);
            req.onsuccess = (e) => resolve(e.target.result);
            req.onerror = (e) => reject(e.target.error || new Error("DB request failed"));
        } catch (e) {
            reject(e);
        }
    });
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
function dbGetAudioId(noteId) {
    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction("audio", "readonly");
            const store = tx.objectStore("audio");
            const index = store.index("noteId");
            const req = index.get(noteId);
            req.onsuccess = (e) => {
                if (!e.target.result) {
                    resolve(null);
                } else {
                    resolve(e.target.result.id);
                }
            }
            req.onerror = (e) => reject(e.target.error || new Error("DB request failed"));
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

async function dbDeleteNote(noteId, audioId = null) {
    try {
        if (!audioId)
            audioId = await dbGetAudioId(noteId);
        await new Promise((resolve, reject) => {
            const textTx = db.transaction("text", "readwrite");
            const textStore = textTx.objectStore("text");
            const textReq = textStore.delete(noteId);
            textReq.onsuccess = (e) => resolve(e);
            textReq.onerror = (e) => reject(e.target.error || new Error("DB request failed"));
        })
        if (audioId) {
            await new Promise((resolve, reject) => {
                const audioTx = db.transaction("audio", "readwrite");
                const audioStore = audioTx.objectStore("audio");
                const audioReq = audioStore.delete(audioId);
                audioReq.onsuccess = (e) => resolve(e);
                audioReq.onerror = (e) => reject(e.target.error || new Error("DB request failed"));
            })
        }
        return true;
    } catch (e) {
        console.error("DB delete error", e);
        throw e;
    }
}
async function dbDeleteAudio(noteId, audioId = null) {
    try {
        if (!audioId)
            audioId = await dbGetAudioId(noteId);

        await new Promise((resolve, reject) => {
            const audioTx = db.transaction("audio", "readwrite");
            const audioStore = audioTx.objectStore("audio");
            const audioReq = audioStore.delete(audioId);
            audioReq.onsuccess = (e) => resolve(e);
            audioReq.onerror = (e) => reject(e.target.error || new Error("DB request failed"));
        })
        await new Promise((resolve, reject) => {
            const textTx = db.transaction("text", "readwrite");
            const textStore = textTx.objectStore("text");
            const textReq = textStore.get(noteId);
            textReq.onsuccess = (e) => {
                textReq.result.hasAudio = false;
                textReq.result.updatedAt = Date.now();
                textStore.put(textReq.result);
                resolve(e);
            }
            textReq.onerror = (e) => reject(e.target.error || new Error("DB request failed"));
        })
        return true;
    } catch (e) {
        console.error("DB delete audio error", e);
        throw e;
    }
}





//-----------------------------------------------------------------------------
// Routing i obsługa widoków na podstawie hash-y w URL
// Przejścia między widokami za pomocą window.location.hash
// Aplikacja obsługuje 3 widoki: add, list, edit
// spisane w jednym pliku HTML. Przejścia opierają się na ustawianiu flagi 
// 'active' dla odpowiedniego <div> zawierającego widok
//-----------------------------------------------------------------------------
const views = {
    add: document.getElementById('viewAdd'),
    list: document.getElementById('viewList'),
    edit: document.getElementById('viewEdit'),
}

const navBtns = {
    add: document.getElementById('navAddBtn'),
    list: document.getElementById('navListBtn'),
}

// TODO Sprawdzić czy curretView jest faktycznie potrzebne
// TODO Zmiana domyślnego na 'list'
let currentView = 'add';
const getViewAndParams = () => {
    const dividedHashAndParams = window.location.hash.slice(1).split('?');
    const params = {};
    if (dividedHashAndParams[1]) {
        dividedHashAndParams[1].split('&').forEach(param => {
            const [key, value] = param.split('=');
            params[key] = value;
        });
    }
    return [dividedHashAndParams[0], params];
}

// TODO Zmiana domyślnego na view-list
function showView(view = 'add', params = undefined) {
    Object.values(views).forEach(view => {
        view.classList.remove('active');
    });
    Object.values(navBtns).forEach(btn => {
        btn.classList.remove('active');
    })
    
    if (views[view]) {
        views[view].classList.add('active');
        currentView = view;
        
        // TODO Dodać handler dla widoków
        if (view == 'list') {
            navBtns[view].classList.add('active');
            goToList();
        }
        if (view == 'edit') {
            goToEdit(params);
        }
        if (view == 'add') {
            navBtns[view].classList.add('active');
        }
    } else {
        console.error(`View ${view} does not exist`);
    }
}
// Obsługa zmiany URL i aktualizacja widoków
window.addEventListener('hashchange', () => {
    const [view, params] = getViewAndParams();
    if (view && views[view]) {
        showView(view, params);
    } else {
        console.error(`View ${view} does not exist`);
    }
});
function initRouter() {
    const [hash, params] = getViewAndParams();
    if (hash && views[hash]) {
        showView(hash, params);
    } else {
        // TODO Zmiana domyślnego na 'add'
        const defaultView = 'add';
        window.location.hash = defaultView;
        showView(defaultView);
    }
}



//-----------------------------------------------------------------------------
// Handlery przejść między widokami
//-----------------------------------------------------------------------------

function goToList() {
    showNotes();
}
function goToEdit(param = undefined) {
    if (param && param.id) {
        renderEditView(param.id);
    } else {
        // TODO Zmiana domyślnego na 'add'
        const defaultView = 'add';
        window.location.hash = defaultView
        showNotes();
    }
}

//-----------------------------------------------------------------------------
// Widok dodawania notatki
// Nagrywanie audio, rozpoznawanie mowy (tylko Chrome na PC), zapis do IndexedDB
//-----------------------------------------------------------------------------

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
                if (audioAddDiv.firstChild) {
                    audioAddDiv.removeChild(audioAddDiv.firstChild);
                    audioAddDiv.style.display = "none";
                }
                audioAddDiv.appendChild(audio);
                audioAddDiv.style.display = "block";

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

function saveNote(text, checked = false) {
    dbAddNote(noteText.value, checked ? lastRecordedBlob : null);
}
saveBtn.addEventListener('click', () => {
    if (!noteText.value) {
        alert("Notatka nie może być pusta!");
        return;
    }
    const checked = document.getElementById('checkbox').checked;
    try {
        saveNote(noteText.value, checked);
        noteText.value = '';
        lastRecordedBlob = null;
        if (audioAddDiv.firstChild) {
            audioAddDiv.removeChild(audioAddDiv.firstChild);
            audioAddDiv.style.display = "none";
        }
        window.location.hash = 'list';
    } catch (e) {
        console.error(e);
        audioStreamErrorMessage(e);
    }
});

let idLastRecordedNote = null;// TODO
const testBtn = document.getElementById('testBtn');
const testAudioDiv = document.getElementById('testAudioWrapper');
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





//-----------------------------------------------------------------------------
// Widok ogólny, listy wszystkich notatek
//-----------------------------------------------------------------------------


// {id: '6186d8ba-147b-491b-b9c9-b2e8e4eb7e2c', text: 'słowo', hasAudio: true, createdAt: 1764180604001, updatedAt: 1764180604001}
// {id: '7763c555-8f5b-4d27-8778-3c8eda0dd28b', text: 'słowo', hasAudio: false, createdAt: 1764180602514, updatedAt: 1764180602514}

function createSvgIcon(pathD, size = 20) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', `0 0 ${size}  ${size}`);

    if (typeof pathD === 'object') {
        for (let i = 0; i < pathD.length; i++) {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('fill', colorAccent);
            path.setAttribute('d', pathD[i]);
            svg.appendChild(path);
        }
    } else {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('fill', colorAccent);
        path.setAttribute('d', pathD);
        svg.appendChild(path);
    }

    return svg;
}

// Otrzymuje 'pudełko' na element <audio>, usuwa, jeśli jest w nim stary odtwarzacz i dodaje nowy
function handlePlayOriginalAudio(audioElementDiv, blob, playAudio = true) {
    try {
        const audio = audioElementDiv.querySelector('audio');
        if (audio) {
            audio.src = URL.createObjectURL(blob);
            audio.load();
            audio.controls = true;
            audio.play();
        } else {
            const newAudio = document.createElement('audio');
            newAudio.src = URL.createObjectURL(blob);
            newAudio.load();
            newAudio.controls = true;
            newAudio.autoplay = playAudio;// Nie słucha się mnie przeglądarka :(((
            playAudio ? newAudio.play() : newAudio.pause();
            audioElementDiv.appendChild(newAudio);
        }
    } catch (e) {
        console.error("Error playing audio: ", e);
    }
}

async function handleNoteClick(e) {
    const noteDiv = e.target.closest('.note');
    if (!noteDiv) return;

    const noteId = noteDiv.dataset.id;

    if (e.target.classList.contains('notePreview')) {
        const text = noteDiv.querySelector('.noteText').textContent;
        speakText(text);
        return;
    }
    
    if (e.target.closest('.noteHeader')) {
        const body = noteDiv.querySelector('.noteBody');
        const toggle = noteDiv.querySelector('.noteToggle');
        
        const isOpen = body.classList.contains('expanded');
        
        document
        .querySelectorAll('.noteBody.expanded')
        .forEach(el => {
            el.classList.remove('expanded');
        });
        
        if(!isOpen) {
            body.classList.add('expanded');
        }
        return;
    }
    
    if (e.target.closest('.noteSpeak')) {
        const text = noteDiv.querySelector('.noteText').textContent;
        speakText(text);
        return;
    }

    if (e.target.closest('.noteEdit')) {
        window.location.hash = `edit?id=${noteId}`;
        return;
    }

    if (e.target.closest('.noteAudio')) {
        try {
            const result = await dbGetAudio(null, noteId);
            const blob = result.blob;
            handlePlayOriginalAudio(noteDiv.querySelector('.audioWrapper'), blob);
        } catch (e) {
            console.error(e);
            alert("Nie udało się odtworzyć orginalnego audio");
        }
        return;
    }

}

function renderNote(note) {
    const noteDiv = document.createElement('div');
    noteDiv.classList.add("note");
    noteDiv.dataset.id = note.id;

    const noteHeader = document.createElement('div');
    noteHeader.classList.add("noteHeader");
    noteDiv.appendChild(noteHeader);
    
    const notePreview = document.createElement('div');
    notePreview.classList.add("notePreview");
    const endline = note.text.indexOf('\n') !== -1 ? note.text.indexOf('\n') : note.text.length;
    notePreview.textContent = note.text.length > 40 ? 
        note.text.substring(0, 40).substring(0, endline) + '...' : note.text.substring(0, endline);
    noteHeader.appendChild(notePreview);

    const noteToggle = document.createElement('div');
    noteToggle.classList.add("noteToggle");
    noteToggle.textContent = '\\/';
    noteHeader.appendChild(noteToggle);

    const noteBody = document.createElement('div');
    noteBody.classList.add("noteBody");
    noteDiv.appendChild(noteBody);

    const noteText = document.createElement('p');
    noteText.classList.add("noteText");
    noteText.textContent = note.text;
    noteBody.appendChild(noteText);

    const noteActions = document.createElement('div');
    noteActions.classList.add("noteActions");
    noteBody.appendChild(noteActions);

    const speakBtn = document.createElement('div');
    speakBtn.classList.add("noteSpeak");
    // speakBtn.textContent = 'Mów';
    speakBtn.appendChild(createSvgIcon([
        "M0 4H1.5873V16H0V4Z",
        "M13.8094 4H15.3967V16H13.8094V4Z",
        "M4.60317 2H6.19047V18H4.60317V2Z",
        "M18.4127 0H20V20H18.4127V0Z",
        "M9.20635 6H10.7936V14H9.20635V6Z"
    ]))
    noteActions.appendChild(speakBtn);

    const editBtn = document.createElement('div');
    editBtn.classList.add("noteEdit");
    // editBtn.textContent = 'Edytuj';
    editBtn.appendChild(createSvgIcon(
        "M19.6751 4.48889C19.7781 4.3861 19.8598 4.264 19.9156 4.12958C19.9713 3.99517 20 3.85108 20 3.70556C20 3.56004 19.9713 3.41594 19.9156 3.28153C19.8598 3.14711 19.7781 3.02502 19.6751 2.92222L17.0755 0.322222C16.8533 0.0999999 16.5755 0 16.2867 0C15.9978 0 15.7201 0.111111 15.509 0.322222L13.4759 2.35556L17.642 6.52222L19.6751 4.48889ZM0 15.8333V20H4.1661L16.4533 7.71111L12.2872 3.54444L0 15.8333ZM3.244 17.7778H2.22192V16.7556L12.2872 6.68889L13.3093 7.71111L3.244 17.7778Z"
    ))
    noteActions.appendChild(editBtn);

    if (note.hasAudio) {
        const audioBtn = document.createElement('div');
        audioBtn.classList.add("noteAudio");
        // audioBtn.textContent = 'Odtwórz';
        audioBtn.appendChild(createSvgIcon(
            "M0.75 9.25438V3.15143C0.75 1.26197 2.7847 0.117189 4.33779 1.13371L13.6713 7.23666C15.1096 8.17756 15.1096 10.3312 13.6713 11.2721L4.33779 17.3751C2.7847 18.3906 0.75 17.2468 0.75 15.3573V9.25438Z"
        ));        
        noteActions.appendChild(audioBtn);

        const audioElementDiv = document.createElement('div');
        audioElementDiv.classList.add('audioWrapper', 'list');
        noteBody.appendChild(audioElementDiv);
    }

    notesList.appendChild(noteDiv);
}

async function showNotes() {
    try {
        const notes = await dbGetAllText();
        while (notesList.firstChild) {
            notesList.removeChild(notesList.firstChild);
        }
        if (notes.length === 0) {
            emptyList.style.display = "block";
            return;
        }
        emptyList.style.display = "none";
        notes.sort((a, b) => b.createdAt - a.createdAt);
        notes.forEach(note => renderNote(note));
    } catch (e) {
        console.error("List error", e);
    }

}

function speakText(text) {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.lang = "pl-PL";
    utterance.rate = 1.1;
    utterance.onerror = (e) => {
        console.error("Speech synthesis error: " + e.error);
    };
    if (synth !== undefined && utterance !== undefined) {
        synth.speak(utterance);
    }
}

// TODO To chyba trzeba przenieść do innego miejsca!!!!
notesList.addEventListener('click', handleNoteClick);


//-----------------------------------------------------------------------------
// Widok edycji notatki
//-----------------------------------------------------------------------------

async function renderEditView(noteId) {
    try {
        while (audioEditDiv.firstChild) {
            audioEditDiv.removeChild(audioEditDiv.firstChild);
        }
        const noteToEdit = await dbGetText(noteId);
        if (!noteToEdit) {
            window.location.hash = 'list';
            showView('list');
            return;
        }
        editNoteText.value = noteToEdit.text;
        editCreatedAt.textContent = `Dodano: ${new Date(noteToEdit.createdAt).toLocaleString()}`;
        editUpdatedAt.textContent = `Ostatnia edycja: ${new Date(noteToEdit.updatedAt).toLocaleString()}`;
        if (noteToEdit.hasAudio) {
            const audio = await dbGetAudio(null, noteId);
            if (audio && audio.blob) {
                handlePlayOriginalAudio(audioEditDiv, audio.blob, false);
            }
            deleteAudioBtn.style.display = "block";
        } else if (!noteId.hasAudio) {
            deleteAudioBtn.style.display = "none";
        }
    } catch (e) {
        console.error(e);
    }
}

async function handleDeleteAudio(noteId, audioId = null) {
    try {
        await dbDeleteAudio(noteId, audioId);
        while (audioEditDiv.firstChild) {
            audioEditDiv.removeChild(audioEditDiv.firstChild);
        };
    } catch (e) {
        console.error(e);
    }
}

cancelEditBtn.addEventListener('click', () => {
    showView('list');
});
deleteAudioBtn.addEventListener('click', async () => {
    try {
        await handleDeleteAudio(getViewAndParams()[1].id);
    } catch (e) {
        console.error('Could not delete audio:\t', e);
    }
});
deleteBtn.addEventListener('click', async () => {
    try {
        const id = getViewAndParams()[1].id;
        await dbDeleteNote(id);
        showView('list');
    } catch (e) {
        console.error(e);
    }
});

init();
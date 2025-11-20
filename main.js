const recordBtn = document.getElementById('recordBtn');
const saveBtn = document.getElementById('saveBtn');
const noteText = document.getElementById('noteText');
const audioDiv = document.getElementById('audio-wrapper');

let mediaRecorder;
let recognition = new SpeechRecognition();
let audioChunk = [];
let lastRecordedBlob = null;


if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.lang = 'pl-PL';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (e) => {
        let finalTranscript = '';
        for (let i = 0; i < e.results.length; i++) {
            console.log(e.results[i][0].transcript);
            finalTranscript = finalTranscript + e.results[i][0].transcript.trim() + '\n';
        };
        noteText.value = finalTranscript;
    };
}

// Nagrywanie audio
recordBtn.addEventListener('click', async () => {
    if(mediaRecorder) console.log(mediaRecorder.state);
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        try {
            //TODO Dodać weryfikację połączenia oraz inicjalizację rozpoznawania mowy
            if (recognition) recognition.start();
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            console.log(mediaRecorder);
            audioChunk = [];

            mediaRecorder.ondataavailable = (e) => {
                console.log(`data`, e);
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
                audio.play();

                audioChunk = [];
            };

            mediaRecorder.start();
            recordBtn.textContent = 'Zatrzymaj nagrywanie...';
        } catch (e) {
            console.error(e);
            alert('Błąd nagrywania: ' + e.message);
            return;
        }        
    } else {
        if (recognition) recognition.stop();
        mediaRecorder.stop();
        recordBtn.textContent = 'Rozpocznij nagrywanie';
    }
});


const openRequest = indexedDB.open('test', 5);
let db;

const testData = [
    { name: 'ford', vin: 1234567, year: 1999, color: 'red' },
    { name: 'fiat', vin: 4567890, year: 1998, color: 'purple' },
    { name: 'opel', vin: 2345678, year: 2002, color: 'blue' },
    { name: 'fiat', vin: 3456789, year: 2004, color: 'green' },
];


openRequest.onerror = function() {
    console.error("DB Error", openRequest.error);
};
openRequest.onsuccess = (e) => {
    db = e.target.result;
    console.log("DB opened succesfully");
};

openRequest.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("cars")) {
        db.deleteObjectStore("cars");
    
        const objectStore = db.createObjectStore("cars", { keyPath: 'vin'});
    
        objectStore.createIndex("name", "name", { unique: false });
    
        objectStore.transaction.oncomplete = (event) => {
            const carsObjectStore = db
            .transaction("cars", "readwrite")
            .objectStore("cars");
    
            testData.forEach((car) => {
                carsObjectStore.add(car);
            });
        };
    }


    const objectStoreNotes = db.createObjectStore("notes", { keyPath: 'id'});
    const objectStoreAudio = db.createObjectStore("audio", { keyPath: 'id'});

    objectStoreAudio.createIndex("noteId", "noteId", { unique: true });

};

// testBtn.addEventListener("click", async () => {
//     const tx = db.transaction("cars", "readonly");
//     const store = tx.objectStore("cars");
//     const index = store.index("name");
//     // index.get("fiat").onsuccess = (e) => {
//     //     console.log('index success');
//     //     console.log(e.target.result);
//     // }
//     let i = 0;
//     const findMyFiat = IDBKeyRange.only("fiat");
//     index.openCursor(findMyFiat).onsuccess = (e) => {
//         const cursor = e.target.result;
//         if (cursor) {
//             console.log('cursor success');
//             console.log(cursor.value);
//             i += 1;
//             console.log(i);
//             cursor.continue();
//         }
//     };
// });

// testBtn1.addEventListener("click", async () => {
//     db
//     .transaction("cars")
//     .objectStore("cars")
//     .get(1234567)
//     .onsuccess = (e) => {
//         console.log("request success 1");
//         console.log(e.target.result);
//         // console.log(e.target);
//     }
// });

function saveNote() {
    const checked = document.getElementById('checkbox').checked;
    const noteId = crypto.randomUUID();
    const audioId = crypto.randomUUID();

    console.log(
        {
            id: noteId,
            note: noteText.value.trim(),
            hasAudio: !!checked,
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
    );

    db
    .transaction("notes", "readwrite")
    .objectStore("notes")
    .add({
        id: noteId,
        note: noteText.value.trim(),
        hasAudio: !!checked,
        createdAt: Date.now(),
        updatedAt: Date.now()
    })
    .onsuccess = ((e) => {
        console.log("Note added");
    })

    if (!!checked) {
        db
        .transaction("audio", "readwrite")
        .objectStore("audio")
        .add({
            id: audioId,
            noteId: noteId,
            blob: lastRecordedBlob
        });
        // TODO
        idLastRecordedNote = noteId;
    }
}


saveBtn.addEventListener('click', () => {
    console.log("trying to save note");
    saveNote();
});

let idLastRecordedNote = null;// TODO
const testBtn = document.getElementById('testBtn');
testBtn.addEventListener("click", async () => {
    if (!!idLastRecordedNote) {
        db
        .transaction("audio", "readonly")
        .objectStore("audio")
        .index("noteId")
        .get(idLastRecordedNote)
        .onsuccess = (e) => {
            const blob = e.target.result.blob;
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);

            audio.controls = true;

            const testAudioDiv = document.getElementById('test-audio-wrapper');
            testAudioDiv.appendChild(audio);
            testAudioDiv.style.display = "block";
        }
    }
});
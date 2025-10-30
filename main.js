const recordBtn = document.getElementById('recordBtn');
const noteText = document.getElementById('noteText');
const logDiv = document.getElementById('test');

let mediaRecorder;
let recognition;
let audioChunk = [];

function log(message) {
    const logEntry = document.createElement('p');
    logEntry.textContent = message;
    logDiv.appendChild(logEntry);
}


if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.lang = 'pl-PL';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onstart = () => console.log('[webkitSpeechRecognition] Rozpoczynam nagrywanie.');
    recognition.onend = () => console.log('[webkitSpeechRecognition] Koniec nagrywania.');

    recognition.onresult = (e) => {
        alert(e.results[0][0].transcript);
        const transcript = e.results[0][0].transcript;
        noteText.value = transcript;
        console.log(`Transkrypcja: ${transcript}`);
        log(`Transkrypcja: ${transcript}`);
    };
}

// Nagrywanie audio
recordBtn.addEventListener('click', async () => {
    console.log(mediaRecorder);
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        try {
            //TODO Dodać weryfikację połączenia oraz inicjalizację rozpoznawania mowy
            // if (recognition) recognition.start();
            
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
                
                const audioUrl = URL.createObjectURL(blob);
                const audio = new Audio(audioUrl);

                audio.controls = true;
                logDiv.appendChild(audio);
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
        // if (recognition) recognition.stop();
        mediaRecorder.stop();
        recordBtn.textContent = 'Rozpocznij nagrywanie';
    }
});
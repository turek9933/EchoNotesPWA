# EchoNotesPWA
### Tomasz Turek
2025

EchoNotes to prosta aplikacja przeglądarkowa, która pozwala na tworzenie, osdłuchiwanie i edycję notatek w formie tekstowej na podstawie nagranego audio. Projekt działa po stronie użytkownika. Wykorzystuje technologie dostępne w przeglądarce m.in. IndexedDB, MediaRecorder, Web Speech API. Aplikajca korzysta z routingu opartego o hash oraz z funkcjonalności PWA.

## Funkcje
- Nagrywanie notatek audio i przechowywanie ich bezpośrednio w przeglądarce.
- Rozpoznawanie mowy (dostępne tylko w Chrome na PC).
- Zapis treści notatki oraz orginalnego audio w IndexedDB.
- Podgląd notatek wraz z możliwością odsłuchu poprzez syntezę mowy lub odtworzenie orginalnego audio.
- Edycja notatek - zmiana treści, usunięcie audio.
- Routing oparty na adresie hash
- Działanie offline (z wyjątkiem Web Speech API).

## Technologie
- HTML5
- CSS3
- JavaScript
- IndexedDB
- MediaRecorder API
- Web Speech API (rozpoznawanie i synteza mowy)
- Service Worker, manifest

## Struktura projektu
```
/
|- fonts
|- icons
|- EchoNotes.png
|- index.html
|- main.js
|- manifest.webmanifest
|- offline.html
|- README.md
|- style.css
|- sw.js
```

## Uruchomienie projektu

Ze względu na wymagane połączenie HTTPS dla użytych API zalecane jest korzystanie z wersji udostępnionej w sieci pod adresem:
https://echonotespwa.netlify.app/

## Kompatybilność wybranych funkcji

Aplikacja działa najlepiej w przeglądarce Chrome. Część funkcji działa na przeglądarkach opartych na Chromium, lecz zdażają się problemy. 

| Funkcja    | Chrome PC | Chrome Android |
| - | - | - |
| Nagrywanie audio | Tak | Tak |
| Rozpoznawanie mowy | Tak | Nie* |
| Odtwarzanie nagrań | Tak | Tak |
| Działanie offline | Tak | Tak |

\* Rozpoznawanie mowy nie działa na Androidze również w uruchomionej wersji na komputer
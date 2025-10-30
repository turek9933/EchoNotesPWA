# pwa_hosting_test



## Kryteria Projektu

Technologie: HTML, CSS, JavaScript

1. Aplikacja powinna dać się zainstalować:
- Wyjaśnienie: Aplikacja powinna posiadać plik manifestu, który określa metadane aplikacji, między innymi takie jak nazwa, ikony, kolor motywu i start_url. Dzięki temu użytkownicy będą mogli dodać aplikację do ekranu głównego swojego urządzenia.

2. Wykorzystanie natywnych możliwości urządzenia:
- Wyjaśnienie: Aplikacja powinna wykorzystywać co najmniej dwie natywne funkcję urządzenia, taką jak dostęp do kamery, mikrofonu, geolokalizacji, powiadomień push itp.
- Dodatkowe kryterium: Studenci powinni być w stanie opisać, jakie natywne funkcje zostały wykorzystane i jak je zaimplementowali.

3. Aplikacja powinna działać w trybie offline:
- Wyjaśnienie: Aplikacja powinna korzystać z Service Workers i Cache API, aby przechowywać zasoby i umożliwiać działanie aplikacji bez dostępu do internetu.
- Dodatkowe kryterium: Aplikacja powinna informować użytkownika o braku połączenia i oferować funkcje dostępne offline.

4. Min. 3 widoki ze spójnym flow:
- Wyjaśnienie: Aplikacja powinna posiadać co najmniej trzy różne ekrany lub widoki, które są logicznie powiązane i oferują spójne doświadczenie użytkownika.
- Dodatkowe kryterium: Każdy widok powinien posiadać jasno zdefiniowany cel i funkcjonalność, a przejścia między widokami powinny być intuicyjne.

5. Aplikacja postawiona na hostingu:
- Wyjaśnienie: Aplikacja powinna być dostępna online za pomocą bezpiecznego połączenia HTTPS.

6. Responsywność:
- Wyjaśnienie: Aplikacja powinna być responsywna, co oznacza, że powinna dostosowywać się do różnych rozmiarów ekranu.

7. Wydajność:
- Wyjaśnienie: Aplikacja powinna ładować się szybko i działać płynnie. Można użyć narzędzi takich jak Lighthouse do oceny wydajności aplikacji.

8. Strategia buforowania:
- Wyjaśnienie: Strategie buforowania używane w Service Worker powinny być odpowiednie odpowiednie dla różnych rodzajów zasobów.

9. Jakość kodu:
- Wyjaśnienie: Kod powinien być czytelny, dobrze zorganizowany i zgodny z najlepszymi praktykami.

10. Dokumentacja kodu i projektu
- Wyjaśnienie: Kod źródłowy powinien być odpowiednio skomentowany, a README projektu na GitHubie powinno zawierać instrukcje uruchomienia projektu, zależności, użyte technologie i funkcjonalności.
 


### Widoki

1. Główny
- Lista z notatkami, naciśnięcie dowolnej pozwala na jej odsłuchanie

2. Nagrywki
- Ekran do nagrania nowej notatki oraz jej edycji.

3. Edycja
- Edycja/Usunięcie już istniejącej notatki.
# Discord Betting Bot - System Zakładów Piłkarskich ⚽

Bot Discord z systemem punktów i zakładów na mecze piłkarskie. Użytkownicy zdobywają punkty za aktywność na serwerze (wiadomości, kanały głosowe) i mogą je obstawiać w zakładach na prawdziwe mecze piłkarskie.

## 🌟 Funkcje

### 1. System Punktów
- **Cicha akumulacja punktów** - brak powiadomień o zdobywaniu punktów
- **Punkty za wiadomości**: 1 punkt co 5 minut aktywności
- **Punkty za głos**: 1 punkt za każde 5 minut spędzonych na kanale głosowym
- **Balans i suma punktów**: śledzenie obecnego balansu i łącznych zdobytych punktów
- **Komenda `/balance`**: sprawdź swój balans i rangę

### 2. System Zakładów Piłkarskich
- **Mecze z top 5 lig**: Premier League, LaLiga, Bundesliga, Serie A, Ligue 1
- **Puchary europejskie**: Liga Mistrzów, Liga Europy, Liga Konferencji
- **Polskie ligi**: Ekstraklasa, Pierwsza Liga
- **Typy zakładów**: Wygrana gospodarzy, Remis, Wygrana gości
- **Automatyczne rozliczanie**: zakłady są automatycznie rozliczane po zakończeniu meczu

### 3. System Rang
Rangi oparte na **łącznej sumie zdobytych punktów** (nie obecnym balansie):
- 🥉 **Brąz** - 0 punktów
- 🥈 **Srebro** - 100 punktów
- 🥇 **Złoto** - 500 punktów
- 💎 **Platyna** - 1,500 punktów
- 💠 **Diament** - 5,000 punktów
- 👑 **Mistrz** - 10,000 punktów
- ⚡ **Legenda** - 25,000 punktów

**Powiadomienia o awansie** wysyłane są przez prywatną wiadomość (DM).

## 📋 Wymagania

- Node.js 18.x lub nowszy (LTS)
- Konto Discord Bot z włączonymi odpowiednimi uprawnieniami
- (Opcjonalnie) Klucz API RapidAPI dla API-Football (dla prawdziwych meczów)

## 🚀 Instalacja

1. **Sklonuj lub pobierz repozytorium**
```bash
git clone <repository-url>
cd discord-betting-bot
```

2. **Zainstaluj zależności**
```bash
npm install
```

3. **Skonfiguruj zmienne środowiskowe**

Skopiuj plik `.env.example` do `.env`:
```bash
cp .env.example .env
```

Edytuj plik `.env` i wypełnij wymagane dane:
```env
BOT_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here
RAPIDAPI_KEY=your_rapidapi_key_here
```

### Jak uzyskać dane do .env:

**BOT_TOKEN i CLIENT_ID:**
1. Przejdź do [Discord Developer Portal](https://discord.com/developers/applications)
2. Kliknij "New Application" i nadaj nazwę
3. W sekcji "Bot" kliknij "Add Bot"
4. Skopiuj token (BOT_TOKEN)
5. W sekcji "OAuth2" skopiuj CLIENT ID

**GUILD_ID:**
1. W Discord włącz tryb dewelopera (Ustawienia > Zaawansowane > Tryb dewelopera)
2. Kliknij prawym przyciskiem na serwer i wybierz "Kopiuj ID"

**RAPIDAPI_KEY (opcjonalne):**
1. Zarejestruj się na [RapidAPI](https://rapidapi.com/)
2. Subskrybuj [API-Football](https://rapidapi.com/api-sports/api/api-football)
3. Skopiuj swój klucz API

> **Uwaga**: Bez klucza API bot będzie używać przykładowych danych do testowania.

4. **Zaproś bota na serwer**

Wygeneruj link zaproszenia z odpowiednimi uprawnieniami:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

Zastąp `YOUR_CLIENT_ID` swoim CLIENT ID.

5. **Zarejestruj komendy slash**
```bash
npm run deploy
```

Lub ręcznie:
```bash
node deploy-commands.js
```

6. **Uruchom bota**
```bash
npm start
```

Dla trybu deweloperskiego z auto-restartowaniem:
```bash
npm run dev
```

## 🎮 Komendy

### `/balance`
Wyświetla twój obecny balans, łączną sumę punktów, rangę i postęp do następnej rangi.

### `/mecze`
Wyświetla listę nadchodzących meczów piłkarskich z przyciskami do obstawiania.

### `/postaw`
Postaw zakład na mecz (alternatywna metoda do przycisków).
- **mecz_id**: ID meczu z `/mecze`
- **typ**: Typ zakładu (home/draw/away)
- **stawka**: Ilość punktów (min. 10)

### `/zakłady`
Wyświetla twoje aktywne zakłady i ich status.

## 📁 Struktura Projektu

```
discord-betting-bot/
├── commands/           # Komendy slash
│   ├── balance.js      # Komenda balansu
│   ├── mecze.js        # Lista meczów
│   ├── postaw.js       # Stawianie zakładów
│   └── zaklady.js      # Aktywne zakłady użytkownika
├── events/             # Handlery eventów Discord
│   ├── ready.js        # Event gotowości bota
│   ├── messageCreate.js # Punkty za wiadomości
│   ├── voiceStateUpdate.js # Punkty za aktywność głosową
│   └── interactionCreate.js # Interakcje (komendy, przyciski)
├── services/           # Logika biznesowa
│   ├── database.js     # Obsługa bazy danych SQLite
│   ├── footballApi.js  # Integracja z API piłkarskim
│   ├── bettingService.js # Logika zakładów
│   └── pointsService.js # System punktów
├── utils/              # Funkcje pomocnicze
│   └── formatters.js   # Formatowanie dat, punktów itp.
├── ranks/              # System rang
│   ├── thresholds.js   # Progi rang
│   └── rankCalculator.js # Logika kalkulacji rang
├── index.js            # Główny plik bota
├── deploy-commands.js  # Skrypt rejestracji komend
├── config.json         # Konfiguracja bota
├── package.json        # Zależności projektu
└── README.md           # Ten plik
```

## ⚙️ Konfiguracja

Edytuj plik `config.json`, aby dostosować:
- Ilość punktów za wiadomość
- Cooldown na punkty za wiadomości
- Ilość minut za punkt w kanale głosowym
- Obsługiwane ligi i turnieje
- Kolory embedów
- Status bota

## 🛠️ Rozwój

### Testowanie
Bot wykorzystuje tryb mock data gdy nie ma klucza API, co pozwala na testowanie bez kosztów.

### Dodawanie nowych komend
1. Utwórz nowy plik w folderze `commands/`
2. Eksportuj obiekt z `data` (SlashCommandBuilder) i `execute`
3. Uruchom `node deploy-commands.js` aby zarejestrować

### Modyfikacja rang
Edytuj plik `ranks/thresholds.js`, aby zmienić progi, nazwy, emoji i kolory rang.

## 🔒 Bezpieczeństwo

- Token bota nigdy nie powinien być udostępniany publicznie
- Plik `.env` jest w `.gitignore`
- Wszystkie błędy są logowane, ale nie zawierają wrażliwych danych

## 📝 Licencja

MIT License - możesz swobodnie używać i modyfikować ten kod.

## 🐛 Rozwiązywanie Problemów

**Bot się nie uruchamia:**
- Sprawdź czy `BOT_TOKEN` w `.env` jest prawidłowy
- Upewnij się że zainstalowałeś wszystkie zależności (`npm install`)

**Komendy slash nie działają:**
- Uruchom `node deploy-commands.js` aby zarejestrować komendy
- Sprawdź czy bot ma uprawnienie `applications.commands`

**Punkty nie są przyznawane:**
- Sprawdź czy bot ma uprawnienia do czytania wiadomości i statusu głosu
- Upewnij się że intencje są włączone w Discord Developer Portal

**Mecze nie ładują się:**
- Jeśli używasz API-Football, sprawdź czy klucz API jest prawidłowy
- Bez klucza API bot używa przykładowych danych

## 💡 Pomysły na Rozszerzenia

- System prestiżu po osiągnięciu maksymalnej rangi
- Sezonowe resety punktów z nagrodami
- Dzienne misje dla dodatkowych punktów
- System osiągnięć
- Statystyki gracza (wygrane/przegrane zakłady)
- Ranking graczy
- Specjalne eventy z bonusowymi kursami
- System powiadomień o rozpoczynających się meczach

## 🤝 Wkład

Wszelkie sugestie i pull requesty są mile widziane!

---

**Powodzenia z zakładami! ⚽🎲**

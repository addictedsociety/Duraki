# Duraki

Eine mobile-first Web-App für das russische Kartenspiel **Durak** – modern, animiert und zu zweit über Einladungscode spielbar. Die Spiellogik ist vollständig UI-unabhängig und getestet, der Server ist autoritativ.

## Features

- **Auth** mit Clerk (Google-Login)
- **Dashboard** mit Statistiken (Spiele, Siege, Niederlagen, Winrate), Gegnerliste und Spielverlauf
- **Räume / Multiplayer**: Raum erstellen, per Einladungscode beitreten, Echtzeit über Socket.io
- **Durak 2-Spieler**: 36 Karten, Trumpf, Angriff/Verteidigung, **Schieben (перевод)**, **Nachwerfen beim Aufnehmen**, automatische Ergebnis- und Verlaufsspeicherung
- **Serverseitiger Spielstand**: Reload-/Resume-fähig (autoritativer State in PostgreSQL)
- **Mobile Game-UI**: Handkarten als Fächer, Spielfeld, Gegnerbereich, Trumpf + Nachziehstapel, Aktions-Buttons
- **Animationen**: Vue `<Transition>` + Action-Popups („Angriff!", „Verteidigt!", „Geschoben!", „Aufgenommen!", „Durak!", „Gewonnen!")
- **Three.js**-Tischhintergrund (theme-abhängig, `prefers-reduced-motion`-bewusst)
- **Themes**: mehrere umschaltbare Designs über zentrale CSS-Variablen (UI **und** Karten)

## Tech-Stack

| Bereich      | Technologie |
|--------------|-------------|
| Frontend     | Vue 3, Vite, TypeScript, Pinia, Vue Router |
| UI           | Tailwind CSS v4, shadcn-vue, Reka UI, Lucide |
| Animation    | Vue Transitions, Three.js (Tischhintergrund) |
| Auth         | `@clerk/vue` (Frontend), `@clerk/backend` (Verifikation) |
| Realtime     | Socket.io |
| Backend      | Node, Express, Socket.io |
| Datenbank    | PostgreSQL, Prisma |
| Spiellogik   | reines TypeScript-Package, getestet mit Vitest |

## Monorepo-Struktur

```
duraki/
├── packages/
│   ├── game-core/   # reine Durak-Engine + Typen (Vitest), kein UI/DB
│   └── shared/      # geteilte Socket-Protokoll- & DTO-Typen
├── apps/
│   ├── server/      # Express + Socket.io + Prisma + Clerk-Verify
│   └── web/         # Vue 3 + Vite Frontend
├── docker-compose.yml
└── pnpm-workspace.yaml
```

Die Engine in `packages/game-core` ist die einzige Quelle der Spielregeln und läuft autoritativ auf dem Server. Der Server validiert jeden Zug, persistiert State + Zug und broadcastet jedem Spieler nur die für ihn sichtbare Ansicht (Gegnerhand verdeckt).

## Voraussetzungen

- Node.js >= 20
- pnpm (`npm i -g pnpm`)
- Docker (für lokales PostgreSQL)
- Ein Clerk-Projekt mit aktiviertem Google-Provider

## Einrichtung

### 1. Abhängigkeiten installieren

```bash
pnpm install
```

### 2. Umgebungsvariablen setzen

`.env.example` (Root) zeigt alle Werte. Lege die beiden lokalen Dateien an:

**`apps/server/.env`**

```env
DATABASE_URL="postgresql://duraki:duraki@localhost:5432/duraki?schema=public"
CLERK_SECRET_KEY="sk_test_..."
CLERK_PUBLISHABLE_KEY="pk_test_..."
SERVER_PORT=3001
WEB_ORIGIN="http://localhost:5173"
```

**`apps/web/.env`**

```env
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
VITE_SERVER_URL="http://localhost:3001"
```

Die Clerk-Keys findest du im Clerk-Dashboard unter „API keys". Aktiviere dort Google als Social Connection.

### 3. Datenbank starten und migrieren

```bash
pnpm db:up        # startet PostgreSQL via Docker
pnpm db:migrate   # wendet die Prisma-Migration an
```

### 4. Entwicklung starten

```bash
pnpm dev          # startet Web (Port 5173) und Server (Port 3001) parallel
```

App öffnen: http://localhost:5173

## Wichtige Skripte

| Befehl | Beschreibung |
|--------|--------------|
| `pnpm dev` | Web + Server parallel im Watch-Modus |
| `pnpm dev:web` | nur das Frontend |
| `pnpm dev:server` | nur den Server |
| `pnpm build` | alle Packages bauen |
| `pnpm test` | Engine-Tests (Vitest) |
| `pnpm db:up` / `pnpm db:down` | PostgreSQL-Container starten/stoppen |
| `pnpm db:migrate` | Prisma-Migration anwenden |
| `pnpm db:generate` | Prisma-Client generieren |

## Spielablauf

1. Anmelden (Google) → Dashboard
2. „Neues Spiel erstellen" → Einladungscode teilen, oder per Code „Beitreten"
3. Beide Spieler auf „Bereit", dann startet der Host
4. Zugmöglichkeiten:
   - **Karte spielen** (Angriff bzw. Verteidigung) per Tippen
   - **Schieben** (gleicher Rang an den Gegner weitergeben)
   - **Aufnehmen** und ggf. Nachwerfen
   - **Fertig** (Runde beenden)
   - **Verlassen**
5. Ergebnis (Sieg/Durak) wird automatisch gespeichert und im Dashboard ausgewertet.

## Datenmodelle (Prisma)

`User`, `GameRoom`, `RoomMember`, `Game` (autoritativer State als JSON), `GameParticipant`, `GameMove`, `PlayerStats`, `RecentOpponent`.

## Tests

```bash
pnpm test
```

Die Durak-Regeln sind in `packages/game-core` isoliert und u. a. durch eine Vollsimulation (Kartenerhaltung, Terminierung) abgedeckt.

## Themes

Themes werden über CSS-Variablen in `apps/web/src/styles/shadcn.css` gesteuert und über `apps/web/src/stores/theme.ts` (Persistenz in `localStorage`) umgeschaltet. Vorbereitet für tweakcn/shadcn-Themes; Kartendesign liest dieselben Variablen.

## Hinweise

- Ohne gültige Clerk-Keys bleibt die App im Lade-/Login-Zustand.
- Die Spiellogik ist bewusst von UI und DB entkoppelt und dadurch leicht erweiterbar (z. B. weitere Regelvarianten, mehr Spieler).

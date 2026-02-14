# Step Bro by Adin Zander

Desktop application for adult content creators. Includes Chat, OnlyFans Secrets, SnapBot, and Trident CRM.

## Setup

1. **Install dependencies** (run in your terminal; may take a while on slow connections)

   ```bash
   npm install
   ```

2. **Configure Supabase**

   Copy `.env.example` to `.env` and add your Supabase credentials:

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

   Get these from [Supabase Dashboard](https://supabase.com/dashboard/project/_/settings/api).

3. **Configure SnapBot (optional)**

   Add `GROQ_API_KEY` to `.env` for AI auto-replies. Get a free key at [console.groq.com/keys](https://console.groq.com/keys). Without it, the bot falls back to "hey" for new chats.

4. **Run migrations** (if using a new Supabase project)

   Run the SQL migrations in your Supabase project from the `docs/` folder in the original AdinZander project, or ensure your database has:

   - `rooms`, `profiles`, `messages` tables (chat)
   - `crm_leads` table (Trident CRM)
   - RLS policies and triggers

## Development

```bash
npm run dev
```

Starts the Vite dev server. To run the full desktop app with SnapBot (Snapchat Web embedded):

1. Run `npm run dev` in one terminal
2. Run `npx electron .` in another — Electron loads the app and SnapBot section embeds Snapchat Web with bot controls

## Build

**Mac**

```bash
npm run build:mac
```

Output: `release/Adin Zander-1.0.0.dmg` and `Adin Zander-1.0.0-mac.zip`

**Windows**

```bash
npm run build:win
```

Output: `release/Adin Zander Setup 1.0.0.exe` (NSIS) and portable executable.

**Both**

```bash
npm run build
```

## Project structure

```
AdinTest/
├── electron/           # Electron main process
├── src/
│   ├── features/       # Chat, OnlyFans Secrets, SnapBot, Trident CRM, Settings
│   ├── lib/            # Supabase, chat API, trident API
│   ├── contexts/       # Auth
│   ├── hooks/          # useChat, etc.
│   ├── components/     # Shared layout, modals
│   └── content/        # OnlyFans Secrets chapters
├── public/
└── package.json
```

## Tech stack

- **Electron** – Desktop shell, BrowserView for Snapchat Web
- **React 19 + TypeScript** – UI
- **Vite** – Build
- **Tailwind CSS** – Styling
- **Supabase** – Auth, database, realtime
- **Zustand** – State (CRM)
- **@dnd-kit** – Drag and drop (CRM kanban)
- **Groq SDK** – SnapBot AI replies

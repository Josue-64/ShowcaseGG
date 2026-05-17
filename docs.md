# Developer Manual
 
## Audience
This document is intended for future developers who will take over the ShowcaseGG system. It assumes general knowledge of web development, Node.js, and REST APIs, but no prior knowledge of this specific system.
 
---
 
## How to Install
 
### Prerequisites
- Node.js
- npm
- A Steam API Key: you can get one at https://steamcommunity.com/dev
- A Supabase account
### Steps
 
1. Clone the repository:
```bash
git clone https://github.com/Josue-64/ShowcaseGG.git
```
 
2. Install dependencies:
```bash
npm install
```
 
3. Create a `.env` file in the root directory with the following, then put it in the .gitignore (if commiting to git):
```
STEAM_API_KEY= "your steam api key"
SUPABASE_URL= "your supabase url"
SUPABASE_KEY= "your supabase key"
```
 
4. Set up your Supabase database by creating a table called `cards` with the following columns:
| Column | Type |
|---|---|
| id | int8 (auto increment, primary key) |
| created_at | timestamp (auto) |
| steamid | text |
| username | text |
| avatar_url | text |
| total_hours | int8 |
| grade | text |
| top_games | json |

Note: Some users have a private account, to prevent issues, total_hours and top_games should be nullable
 
---
 
## How to Run
 
### Development
```bash
npm run dev
```
This runs the server with nodemon which auto-restarts when a file changes. Its available at `http://localhost:3000`.
 
---
 
## How to Run Tests
No automated tests have been written for this project, but some functions provide console logs which may be useful for debugging.  
 
## API Endpoints
 
### `GET /api/resolve?username=:username`
Resolves a Steam vanity URL to a SteamID using the Steam API.
- **Query param:** `username` — the vanity URL string
- **Returns:** Steam resolve response with `steamid`
### `GET /api/profile?steamId=:steamId`
Fetches a Steam player's profile information.
- **Query param:** `steamId` — the numeric Steam ID
- **Returns:** Player summary including name, avatar, and profile URL
### `GET /api/games?steamId=:steamId`
Fetches all owned games for a Steam user.
- **Query param:** `steamId` — the numeric Steam ID
- **Returns:** List of games with name, playtime, and icon data
### `POST /api/save`
Saves or updates a profile card to the Supabase database. If a card with the same `steamid` already exists it updates it, otherwise it inserts a new row.
- **Body:** JSON object with `steamid`, `username`, `avatar_url`, `total_hours`, `grade`, `top_games`
- **Returns:** `{ success: true, updated: true/false }`
### `GET /api/gallery`
Fetches all saved cards from the Supabase database ordered by most recently saved.
- **Returns:** Array of card objects
---
 
## Known Bugs
- Any user can edit and overwrite any other user's saved card since there is no authentication system.
- If a Steam username is too long, the ShowcaseGG logo in the card header shifts slightly.
---
 
## Roadmap for Future Development
- **User authentication** — Add login so users can only edit and delete their own cards
- **Personal gallery** — Allow users to view only their own saved cards
- **Multi-platform support** — Integrate other gaming platforms such as Xbox, PlayStation, and Epic Games
- **Cleaner gallery UI** — Redesign the gallery with better card layout
- **Delete cards** — Allow authenticated users to delete their own cards from the global gallery

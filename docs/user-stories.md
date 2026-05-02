# leaguekarma.io — User Stories

## Personas

- **Visitor** — browsing without an account
- **Player** — logged in with Google, Riot ID linked
- **Subject** — any LoL player being looked up (may not be registered)

---

## Stories

### US-001 — Look up any player's karma profile
**As a** Visitor
**I want to** search for a player by their Riot ID (e.g. `Faker#EUW`)
**So that** I can see their reputation before queuing with them

**Acceptance criteria:**
- Search box accepts `GameName#TAG` format
- If player exists in our DB, show their karma profile
- If player doesn't exist, show empty profile with "No reviews yet"
- Profile is publicly accessible without login

---

### US-002 — See aggregated karma tags
**As a** Visitor
**I want to** see a breakdown of tags left by teammates
**So that** I can quickly assess a player's reputation

**Acceptance criteria:**
- Positive and negative tags shown separately with counts
- Tags sorted by frequency
- Most recent reviews weighted visually
- No individual reviewer identities shown

---

### US-003 — Sign in with Google
**As a** Visitor
**I want to** sign in with my Google account
**So that** I can link my Riot ID and leave reviews

**Acceptance criteria:**
- Google OAuth button on homepage and nav
- On first login, prompt to link Riot ID
- JWT stored in httpOnly cookie
- Redirect back to previous page after login

---

### US-004 — Link my Riot ID
**As a** Player (newly signed in)
**I want to** link my Riot ID to my account
**So that** the system can find my matches and let me leave reviews

**Acceptance criteria:**
- Input accepts `GameName#TAG` format
- Backend verifies account exists via Riot API
- PUUID stored; first match sync triggered immediately
- Error shown if Riot ID not found

---

### US-005 — See my recent matches on the dashboard
**As a** Player
**I want to** see my recent matches after logging in
**So that** I can choose teammates to review

**Acceptance criteria:**
- Last 20 matches shown on first login
- Each match shows: champion played, game mode, win/loss, teammates
- Matches link to individual review actions

---

### US-006 — Leave a karma review on a teammate
**As a** Player
**I want to** select tags and optionally write a note for a teammate
**So that** I can contribute to the community reputation system

**Acceptance criteria:**
- Can only review players who were in the same match
- Tag selection (at least 1 required)
- Optional note up to 280 characters
- Cannot review yourself
- Submitting again on the same (reviewer, subject, match) updates the existing review

---

### US-007 — See shared matches with a player I'm viewing
**As a** Player viewing another player's profile
**I want to** see which matches we shared
**So that** I know if I'm eligible to leave a review

**Acceptance criteria:**
- "Matches you played together" section visible when logged in
- Review button available for each shared match
- Shows champion, date, win/loss for context

---

### US-008 — Automatic match sync on login
**As a** Player
**I want to** have my matches automatically refreshed when I log in
**So that** my recent games are always available for reviewing

**Acceptance criteria:**
- Last 5 matches synced in background on login
- 5-minute cooldown to avoid duplicate syncs
- No blocking UI — sync happens asynchronously

---

### US-009 — View global karma rankings
**As a** Visitor
**I want to** see the most praised and most reported players
**So that** I can discover well-regarded players in the community

**Acceptance criteria:**
- Top 10 most praised (by positive tag count)
- Top 10 most reported (by negative tag count)
- Clickable — links to their karma profile

---

### US-010 — View my own karma profile
**As a** Player
**I want to** see how other players have rated me
**So that** I understand my own reputation

**Acceptance criteria:**
- Same public profile page, accessible from dashboard
- Shows all aggregated tags received
- No individual reviewers exposed

---

### US-011 — Edit a review I previously left
**As a** Player
**I want to** update a review I left on a previous match
**So that** I can correct a mistake or change my mind

**Acceptance criteria:**
- Previous tags and note pre-populated in review modal
- Saving overwrites the existing review
- Timestamp updated to reflect the edit

---

### US-012 — Player profile shows champion and role context
**As a** Visitor
**I want to** see what roles and champions a player typically plays
**So that** I have context when reading their karma

**Acceptance criteria:**
- Most played champions shown on profile (derived from stored matches)
- Roles (TOP/JGL/MID/BOT/SUP) shown with frequency

---

### US-013 — Handle unregistered players gracefully
**As a** Visitor searching for a player who hasn't joined leaguekarma.io
**I want to** still see their profile if they've been reviewed
**So that** the system is useful even without full adoption

**Acceptance criteria:**
- If reviews exist for a puuid, show the profile
- "This player hasn't joined leaguekarma.io yet" message shown
- Positive CTA to share the link with them

---

### US-014 — Mobile-friendly experience
**As a** Player on mobile (often right after a game)
**I want to** quickly leave a review from my phone
**So that** the feedback is fresh and immediate

**Acceptance criteria:**
- Responsive layout works on 375px+ screens
- Review modal usable on touch devices
- Search input usable on mobile keyboard

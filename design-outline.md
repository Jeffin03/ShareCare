<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# add a continue as guest option

Here’s an updated **design outline with “Continue as guest”** added, so you can paste it directly into Lovart.

***

### Design Outline – ShareCare Web App (with Guest Access)

**App name:** ShareCare
**Purpose:** Peer-support web app where diabetes patients and caregivers share experiences, recipes, exercises, and daily tips (no clinical tracking).
**Tone:** Calm, warm, and supportive (soft colors, rounded cards, subtle shadows).

***

### 1. Landing / Home Page

- Hero section:
    - Heading: *“Share your diabetes journey. Learn from others.”*
    - Subheading: *“Join or explore the community without signing up.”*
    - 3 buttons:
        - `Log in` (primary)
        - `Sign up` (outline)
        - `Continue as guest` (text/small button, linking to read‑only feed for guests).
- “How it works” cards:
    - Same 3 cards (Share, Connect, Stay safe).
- Footer:
    - Safety note: *“This is peer support content, not medical advice.”*

***

### 2. Login Page

Add a new section below the form:

- Buttons:
    - `Log in`
    - `Create an account` (links to sign‑up).
- Small row:
    - `Or` → `Continue as guest` (text link in muted color).

When guest is clicked:

- User lands on the **Community Feed**, but:
    - Cannot post, like, or comment.
    - No sidebar items like “My Posts” or “Bookmarks”; only “Home / Feed”.
    - No avatar / profile menu; only a `Log in` or `Sign up` in the top‑right.

***

### 3. Sign‑up Page

Same as before, but add:

- Bottom text link row:
    - `Already have an account? Log in`
    - `Or explore as guest` (takes user back to feed as guest).

***

### 4. Dashboard / Community Feed (Logged‑in)

- Sidebar items (same as before):
    - Home / Community
    - My Posts
    - Bookmarks
    - Settings
- Top bar:
    - Avatar + dropdown: `Profile`, `Settings`, `Logout`.
    - Button: `New Post`.

When user is logged in, all features (post, like, comment, save, report) are enabled.

***

### 5. Community Feed (Guest User)

Guest‑mode feed should look **almost the same** but with limited interaction:

- Same post cards with title, body preview, images, tags.
- No:
    - Like heart / comment icons (or show them but disabled).
    - “Report” or “New Post” options.
- Top bar:
    - `ShareCare` logo.
    - Right side: `Log in` or `Create account` (no avatar / dropdown).
- Hint text (optional):
    - Banner above feed: *“Sign up or log in to like, comment, and share your experiences.”*

***

### 6. New Post / Create Post Screen

Keep unchanged, but protected:

- Only shown if user is logged in.
- Guests who try to access `New Post` are redirected to a small “Please log in to create posts” modal or page with:
    - `Log in` and `Sign up` buttons.

***

### 7. Single Post / Post Detail Page (Guest)

On the post detail page, for guests:

- Show:
    - Title, body, images, tags, and comments.
- Hide / disable:
    - Like heart, comment text‑area, or show them in a disabled‑state.
- Top:
    - Link/icon: *“Save this post to bookmarks by creating an account.”*

***

Now you can copy this whole outline (including the **guest flow**) and paste it into Lovart to generate screens for both **logged‑in** and **guest** experiences.


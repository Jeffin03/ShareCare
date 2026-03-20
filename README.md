# ShareCare

A web application for people living with diabetes — combining a **medicine restock request portal** with a **peer support community feed**.

---

## Abstract

ShareCare addresses two distinct pain points for diabetes patients: the friction of coordinating medicine restocks with pharmacies, and the lack of a safe, non-clinical space for sharing day-to-day coping strategies. The platform allows patients to raise restock requests directly to their pharmacy and track status in real time, while also providing a community feed where members share recipes, exercises, snack ideas, and emotional support. Content is peer-generated and clearly marked as personal experience — not medical advice.

---

## Problem Definition

Diabetes management involves continuous lifestyle restrictions that lead to both physical and emotional fatigue. Existing applications focus primarily on clinical monitoring and data tracking, offering little support for the everyday challenges patients face. Separately, coordinating medicine availability with pharmacies often involves repeated phone calls and uncertainty. ShareCare addresses both problems in a single, accessible web platform.

---

## Objectives

- Provide a real-time medicine restock request system connecting patients and pharmacies
- Build a peer-support community feed for sharing practical, lived experiences
- Ensure safety through medical disclaimers and content reporting
- Implement role-based access for patients and pharmacy staff
- Demonstrate Agile development practices through iterative sprint delivery
- Implement a CI/CD pipeline with automated testing and environment-separated deployments

---

## Scope

The project includes user authentication, role-based dashboards (patient and pharmacy), a medicine request flow with status tracking, a community feed with posts and comments, and basic content moderation. The application does not provide medical advice and does not include clinical tracking or machine learning components.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES Modules) |
| Fonts & Icons | DM Sans, DM Serif Display (Google Fonts), Remixicon |
| Authentication | Firebase Authentication (Email/Password) |
| Database | Cloud Firestore |
| Hosting (Dev) | GitHub Pages |
| Hosting (Prod) | Vercel |
| Testing | Jest |
| CI/CD | GitHub Actions |

---

## Development Methodology

The project follows Agile methodology with four iterative sprints:

| Sprint | Deliverable |
|---|---|
| 1 | Firebase setup, authentication, CI/CD pipeline |
| 2 | Medicine portal — patient side (request submission & tracking) |
| 3 | Pharmacy dashboard — order management & status updates |
| 4 | Community feed, seed script, final deployment |

---

## Branching & Deployment Strategy

| Branch | Hosting | Firebase Project | Purpose |
|---|---|---|---|
| `master` | GitHub Pages | `sharecare-dev` | Development & testing |
| `prod` | Vercel | `sharecare-prod` | Production demo |

---

## Local Setup

### Prerequisites
- Node.js (v18 or later)
- A Firebase account with two projects: `sharecare-dev` and `sharecare-prod`
- Git

### Steps

```bash
git clone https://github.com/Jeffin03/ShareCare.git
cd ShareCare
npm install
```

Create `js/env.js` with your Firebase dev config values (this file is gitignored):
```javascript
window.__env = {
  FIREBASE_API_KEY:             "your-dev-api-key",
  FIREBASE_AUTH_DOMAIN:         "sharecare-dev.firebaseapp.com",
  FIREBASE_PROJECT_ID:          "sharecare-dev",
  FIREBASE_MESSAGING_SENDER_ID: "your-sender-id",
  FIREBASE_APP_ID:              "your-app-id"
};
```

Serve locally:
```bash
npx serve .
```

### Running Tests
```bash
npm test
```

---

## Safety & Disclaimer

ShareCare is a peer support platform only. It does not provide medical advice, diagnosis, or treatment recommendations. All content is user-generated personal experience. Users are encouraged to consult qualified healthcare professionals for all medical decisions.

---

## Contributing

This project is developed for academic purposes. Contributions are welcome for educational purposes only.

- Fork the repository
- Create a feature branch off `master`
- Test changes before committing
- Submit a pull request with a clear description
# MEDGUIDE AI — Clinical Insight Engine

MEDGUIDE AI is an evidence-based clinical decision support platform designed for clinicians and medical students. It combines multi-agent reasoning, medical literature retrieval (PubMed / openFDA / RxNorm), in-browser chest radiograph analysis, and a structured clinical knowledge graph into an explainable interface.

---

## Key Features

- **Multi-Agent Clinical Intelligence**: Orchestrates 12 specialized agents across planning, literature retrieval, graph exploration, drug cross-checking, image analysis, and report generation.
- **Explainability & Verification**: Every conclusion is traced back to indexed papers, guidelines, or graph relationships with confidence bands.
- **Drug Intelligence & Safety**: Detects drug-drug interactions, contraindications, and allergy cross-reactivity powered by openFDA and RxNav.
- **Chest X-ray Saliency**: In-browser radiograph review with explainable CAM saliency heatmap overlays.
- **Multi-Tenant Cloud Sync**: Secure per-user workspace isolation using Firebase Authentication and Cloud Firestore.

---

## Local Development Setup

### 1. Prerequisites

- **Node.js**: v20+ recommended
- **npm** or **bun**

### 2. Installation

```bash
git clone <repository-url>
cd <repository-directory>
npm install
```

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

| Variable                            | Description                                           |
| ----------------------------------- | ----------------------------------------------------- |
| `GEMINI_API_KEY`                    | Google AI Studio API Key (Server-only)                |
| `VITE_FIREBASE_API_KEY`             | Firebase Web API Key                                  |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Firebase Auth Domain (e.g. `project.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID`          | Firebase Project ID                                   |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Firebase Storage Bucket                               |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID                          |
| `VITE_FIREBASE_APP_ID`              | Firebase Web App ID                                   |
| `VITE_FIREBASE_MEASUREMENT_ID`      | Firebase Analytics Measurement ID                     |

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Firebase Setup

1. **Authentication**: In your Firebase Console, enable **Google** under **Authentication $\rightarrow$ Sign-in method**.
2. **Firestore Security Rules**: Deploy the rules in `firestore.rules` or paste them into the Firestore **Rules** tab:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Deploying to Vercel

1. Push your repository to **GitHub**.
2. Import the repository in **[Vercel](https://vercel.com/)**.
3. In **Project Settings $\rightarrow$ Environment Variables**, add your `GEMINI_API_KEY` and `VITE_FIREBASE_*` variables.
4. Click **Deploy**. Vercel will automatically build and deploy the production application.

---

## Available Scripts

- `npm run dev` — Starts the local Vite development server
- `npm run build` — Builds the production bundle
- `npm run preview` — Locally previews the production build
- `npm run lint` — Runs ESLint code quality checks
- `npm run format` — Formats all files with Prettier

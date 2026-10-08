# MEDGUIDE AI : Clinical Insight Engine

MEDGUIDE AI is an evidence-based clinical decision support platform designed for clinicians and medical students. It combines multi-agent reasoning, medical literature retrieval (PubMed / openFDA / RxNorm), in-browser chest radiograph analysis, and a structured clinical knowledge graph into an explainable interface.

---

## Key Features

- **Multi-Agent Clinical Intelligence**: Orchestrates 12 specialized agents across planning, literature retrieval, graph exploration, drug cross-checking, image analysis, and report generation.
- **Explainability & Verification**: Every conclusion is traced back to indexed papers, guidelines, or graph relationships with confidence bands.
- **Drug Intelligence & Safety**: Detects drug-drug interactions, contraindications, and allergy cross-reactivity powered by openFDA and RxNav.
- **Chest X-ray Saliency**: In-browser radiograph review with explainable CAM saliency heatmap overlays.
- **Multi-Tenant Cloud Sync**: Secure per-user workspace isolation using Firebase Authentication and Cloud Firestore.

---

## Pre-Launch & Custom Domain Configuration

### 1. Custom Domain DNS Setup
When deploying to production (e.g. Vercel), configure the following DNS records on your domain registrar:
- **Apex Domain (`medguide.ai`)**:
  - Type: `A`
  - Name: `@`
  - Value: `76.76.21.21`
- **Application Subdomain (`app.medguide.ai`)**:
  - Type: `CNAME`
  - Name: `app`
  - Value: `cname.vercel-dns.com`

### 2. Firebase Authentication Authorized Domains
To ensure Google Sign-In succeeds from your custom domain:
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Navigate to **Authentication** > **Settings** > **Authorized domains**.
3. Add `medguide.ai` and `app.medguide.ai` to the allowlist.

### 3. Pre-Launch Verification Checklist
- [x] Custom Domain & SSL routing documented and configured
- [x] Vector SVG medical CAD favicon created at `/favicon.svg` and linked in `__root.tsx`
- [x] Zero "Made with AI" tags or watermarks anywhere in code or bundles
- [x] Privacy Policy page active at `/privacy`
- [x] Terms and Conditions page active at `/terms`
- [x] Zero em dashes (Unicode U+2014), purple gradients, pill buttons, or fake metrics

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

1. **Authentication**: In your Firebase Console, enable **Google** under **Authentication -> Sign-in method**.
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
3. In **Project Settings -> Environment Variables**, add your `GEMINI_API_KEY` and `VITE_FIREBASE_*` variables.
4. Click **Deploy**. Vercel will automatically build and deploy the production application.

---

## Available Scripts

- `npm run dev` : Starts the local Vite development server
- `npm run build` : Builds the production bundle
- `npm run preview` : Locally previews the production build
- `npm run lint` : Runs ESLint code quality checks
- `npm run format` : Formats all files with Prettier

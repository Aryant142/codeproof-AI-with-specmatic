# CodeProof - AI-Powered API Testing with Specmatic

This repository contains the **CodeProof AI** service: an intelligent automated code analysis and grading platform that parses student submissions (PDF rosters + GitHub repositories) using large language models, evaluates student code against custom rubric checkpoints, calculates suspicion scores, and generates interactive Viva (oral exam) questions to verify student code ownership.

---

## 🚀 Key Features

- **Automated Roster Parsing:** Upload PDF rosters to extract student names and repository links.
- **Deep Repository Scan:** Automatically clones student repositories, pulls code samples, and scrapes commit histories.
- **Plagiarism & AI Detection:** Scans for code anomalies and calculates a plagiarism suspicion score.
- **Viva Generator:** Automatically creates conceptual oral questions tailored to each student's code.
- **Contract-First Design:** Backend and frontend are validated using Specmatic against strict OpenAPI contracts.

---

## 🎯 How Specmatic Improves this Project & Solves Core Issues

Integrating **Specmatic** into the CodeProof AI project solves critical architecture and testing challenges:

### 1. Eliminating Silent "Contract Drift"
*   **The Issue:** The Express application calls external APIs (`UserApi`, `InsightApi`, `ResourceApi`) and pushes messages to Kafka (`AsyncAnalysisApi`). If any of these external service interfaces change (e.g. key renamed, type altered), the backend breaks silently in production.
*   **The Solution:** Specmatic acts as a gatekeeper. By loading and running contract tests against the exact OpenAPI and AsyncAPI specifications, any "drift" or mismatch between our backend code and target APIs triggers an immediate build failure in CI.

### 2. Zero-Configuration Microservice Mocking
*   **The Issue:** Running localized end-to-end tests usually requires launching real instances of downstream services, configuring test databases, and populating dummy state data. This is extremely slow, complex to orchestrate, and prone to "flaky tests".
*   **The Solution:** Specmatic virtualizes all downstream openapi and asyncapi specs instantly with zero test data setup. By reading `/specs`, it boots a smart stub server on port `9000` that handles mock API requests dynamically based on predefined examples.

### 3. Business-Logic Workflow Validation (Arazzo)
*   **The Issue:** Even if individual API endpoints work, we don't know if the sequence of API interactions across the system (User lookup ➔ Insight pull ➔ Kafka request ➔ Resource allocation) is logic-compatible and structurally correct.
*   **The Solution:** Specmatic executes the **Arazzo workflow** definition (`CodeProofAnalysisWorkflow.arazzo.yaml`). It chains requests dynamically, checking parameters, extracting outputs, and validating complex state progressions automatically.

### 4. Continuous API Compliance
*   **The Issue:** Code review processes cannot easily verify if a new pull request violates API design specs or skips mandatory coverage requirements.
*   **The Solution:** Specmatic runs in the GitHub Actions CI pipeline, validating 100% of API endpoints and generating detailed HTML and CTRF coverage reports as CI artifacts.

---

## 📁 Repository Structure

```
codeproof/                              ← repo root (Specmatic config lives here)
│
├── specmatic.yaml                      ← Specmatic config: test & stub sources
├── docker-compose.yml                  ← Specmatic Studio + stub server compose file
├── CodeProofAnalysisWorkflow.arazzo.yaml   ← Arazzo workflow definition
├── CodeProofAnalysisWorkflow.arazzo_input.json ← Arazzo workflow test inputs
│
├── contracts/                          ← Core backend API contract (tested by Specmatic)
│   ├── api.yaml                        ← OpenAPI spec for THIS application's backend
│   └── api_examples/                   ← Example request/response payloads (valid + invalid)
│
├── specs/                              ← External microservice specs
│   ├── openapi/
│   │   ├── user.yaml                   ← User Profile microservice stub
│   │   ├── insight.yaml                ← Insights microservice stub
│   │   └── resource.yaml               ← Resources microservice stub
│   └── asyncapi/
│       └── analysis.yaml               ← AsyncAPI spec for Kafka analysis events
│
└── codeproof-main/                     ← ⚡ THE APPLICATION (run all npm commands here)
    ├── api/
    │   └── server.ts                   ← Express backend (runs on port 3000)
    ├── src/                            ← React frontend source
    │   ├── components/
    │   ├── lib/firebase.ts
    │   ├── App.tsx
    │   └── types.ts
    ├── .env.example                    ← Copy this to .env and fill in your keys
    ├── package.json                    ← npm scripts: dev, build, start
    └── vite.config.ts
```

> **Important:** The repo root (`codeproof/`) is **not** the application. All `npm install` / `npm run dev` commands must be run inside `codeproof-main/`.

---

## 💻 How to Run Locally

### Prerequisites

- **Node.js** v18 or higher
- **Docker** (required to run Specmatic contract tests)

### Step-by-Step

**1. Clone the repository:**
```bash
git clone https://github.com/Aryant142/-codeproof-AI-with-specmatic.git
cd codeproof-AI-with-specmatic
```

**2. Enter the application directory and install dependencies:**
```bash
cd codeproof-main
npm install
```

**3. Configure environment variables:**

Copy the example env file and fill in your API keys:
```bash
cp .env.example .env
```

Edit `.env` inside `codeproof-main/`:
```env
GEMINI_API_KEY=your_google_gemini_api_key
GROQ_API_KEY=your_groq_api_key
VITE_APP_PIN="7973"
```

> **Note:** `GROQ_API_KEY` is the primary AI engine. Get a free key at [console.groq.com](https://console.groq.com). `GEMINI_API_KEY` is used as fallback only. The app also works in fully offline mode with no keys at all.

**4. Start the development server:**
```bash
npm run dev
```

This starts:
- **Backend** API server on `http://localhost:3000`
- **Frontend** Vite dev server (URL printed in terminal)

---

## 📖 Specmatic Contract Testing

> **Run all Specmatic commands from the repo root (`codeproof/`), not from `codeproof-main/`.**

Specmatic is pre-configured in `specmatic.yaml`. It tests the core backend (`contracts/api.yaml`) and virtualizes external stub microservices from the `specs/` folder.

### 1. Run Contract Tests

Make sure your backend is running first (`npm run dev` inside `codeproof-main/`), then from the **repo root**:

```powershell
docker run --rm -v "${PWD}:/usr/src/app" -v "${env:USERPROFILE}/.specmatic:/root/.specmatic" -w /usr/src/app specmatic/specmatic:2.49.1 test --host=host.docker.internal --port=3000 --config specmatic.yaml --timeout=30

```

Expected result: **Tests run: 29, Successes: 29, Failures: 0, Errors: 0** ✅

### 2. Start Stub / Mock Server

Starts smart mocks for all external microservice specs (`specs/openapi/` and `specs/asyncapi/`) on port `9000` (or `9001` if using Docker Compose):

```powershell
docker run --name specmatic-stub -d -p 9000:9000 -v "${PWD}:/usr/src/app" -w /usr/src/app specmatic/specmatic:2.49.1 stub --config specmatic.yaml
```

### 3. Specmatic Studio (GUI)

Specmatic Studio provides a visual interface to explore specs, mock endpoints, and view coverage. From the **repo root**:

```powershell
docker compose --profile studio up -d
```

Access the dashboard at **[http://localhost:9000/_specmatic/studio](http://localhost:9000/_specmatic/studio)**.

*(Note: When running Specmatic Studio via Docker Compose, the Stub server runs on port `9001` instead of `9000` to avoid port conflicts.)*
---

## 🔄 Arazzo Workflow Testing

The repository includes an Arazzo workflow definition for end-to-end API flow testing:

- **Workflow file:** `CodeProofAnalysisWorkflow.arazzo.yaml`
- **Input file:** `CodeProofAnalysisWorkflow.arazzo_input.json`

```powershell
docker run --rm -v "${PWD}:/usr/src/app" -v "${env:USERPROFILE}/.specmatic:/root/.specmatic" -w /usr/src/app specmatic/specmatic:2.49.1 test CodeProofAnalysisWorkflow.arazzo.yaml --host=host.docker.internal --port=3000 --config specmatic.yaml
```

---

## 📋 CI/CD — GitHub Actions

Every push and `pull_request` to `main` automatically runs contract and workflow tests:

- Installs Node.js 20 + Java 17 (required by Specmatic).
- Installs all dependencies and builds the TypeScript backend.
- Validates all Specmatic examples and externalized request/response specs.
- Starts the Kafka services and virtualizes downstream Specmatic stubs on port `9000`.
- Starts the Express backend server and runs the full CLI Specmatic contract tests.
- Runs Specmatic workflow tests against the Arazzo specification.
- Uploads the Specmatic HTML test reports and CTRF results as build artifacts.

See [.github/workflows/specmatic-ci.yml](file:///.github/workflows/specmatic-ci.yml) for the full pipeline definition.

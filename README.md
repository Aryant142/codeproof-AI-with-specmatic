# CodeProof AI 🛡️🤖

CodeProof AI is a professional full-stack platform designed to analyze student GitHub repository commits, inspect coding styles, and employ AI reasoning (Groq Llama 3.3 / Google Gemini) to detect AI-generated coursework content.

The project incorporates **Contract-Driven Development (CDD)** principles using **Specmatic**, ensuring strict alignment between the API specifications and the backend implementation.

---

## 🚀 Key Features

- **Roster Parsing**: Upload student rosters in PDF format and automatically extract GitHub repository links.
- **Authenticity Analysis**: Fetch student git commits, directory trees, and files to calculate an AI-generated suspicion score.
- **AI Fallback Chain**: Intelligent routing through Groq (Llama 3.3 70B) → Google Gemini 3.5 Flash → Offline Static Engine when rate limits are hit.
- **Oral Exam Generation**: Automatically generates custom Viva/oral examination questions for each student submission.
- **Contract-Driven Testing**: Leverages Specmatic to assert the correctness of API inputs, error shapes, and schemas — 100% coverage, 29/29 tests passing.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, TailwindCSS, Motion, Recharts |
| **Backend** | Node.js, Express, TypeScript (tsx), ADM-ZIP, unpdf |
| **Database** | Firebase Firestore |
| **AI** | Google GenAI SDK (Gemini 3.5 Flash), Groq API (Llama 3.3 70B) |
| **Contract Testing** | Specmatic 2.49.1 |

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
├── specs/                              ← External microservice specs (stubbed, NOT tested)
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
VITE_APP_PIN=7973
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
docker run --rm -v "${PWD}:/usr/src/app" -w /usr/src/app specmatic/specmatic:2.49.1 test --host=host.docker.internal --port=3000 --config specmatic.yaml
```

Expected result: **Tests run: 29, Successes: 29, Failures: 0, Errors: 0** ✅

### 2. Start Stub / Mock Server

Starts smart mocks for all external microservice specs (`specs/openapi/` and `specs/asyncapi/`) on port `9000`:

```powershell
docker run --name specmatic-stub -d -p 9000:9000 -v "${PWD}:/usr/src/app" -w /usr/src/app specmatic/specmatic:2.49.1 stub --config specmatic.yaml
```

### 3. Specmatic Studio (GUI)

Specmatic Studio provides a visual interface to explore specs, mock endpoints, and view coverage. From the **repo root**:

```powershell
docker compose --profile studio up -d
```

Access the dashboard at **[http://localhost:8080](http://localhost:8080)**.

---

## 📊 Test Reports

After running contract tests, Specmatic generates reports in `build/reports/specmatic/`:

| Report | Path |
|---|---|
| HTML Test Report | `build/reports/specmatic/test/html/index.html` |
| HTML Stub Report | `build/reports/specmatic/stub/html/index.html` |
| CTRF JSON (CI/CD) | `build/reports/specmatic/test/ctrf/ctrf-report.json` |

---

## 🔄 Arazzo Workflow Testing

The repository includes an Arazzo workflow definition for end-to-end API flow testing:

- **Workflow file:** `CodeProofAnalysisWorkflow.arazzo.yaml`
- **Input file:** `CodeProofAnalysisWorkflow.arazzo_input.json`

```powershell
docker run --rm -v "${PWD}:/usr/src/app" -w /usr/src/app specmatic/specmatic:2.49.1 test --workflow --host=host.docker.internal --port=3000 --config specmatic.yaml
```

---

## 🗄️ Specmatic Configuration (`specmatic.yaml`)

```yaml
sources:
  - provider: filesystem
    test:
      - contracts/api.yaml        # ← tested against THIS backend
    stub:
      - contracts/api.yaml
      - specs/openapi/user.yaml
      - specs/openapi/insight.yaml
      - specs/openapi/resource.yaml
      - specs/asyncapi/analysis.yaml
```

**Why two sections?**
- `test`: Specmatic fires requests at your running backend and asserts the responses match the spec.
- `stub`: Specmatic virtualizes these as smart mock servers so your app can call them without real implementations.

The external specs (`specs/`) are in `stub` only — they are dependencies you consume, not services you implement.

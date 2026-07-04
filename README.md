# CodeProof AI 🛡️🤖

CodeProof AI is a professional full-stack platform designed to analyze student GitHub repository commits, inspect coding styles, and employ Google Gemini reasoning to detect AI-generated coursework content.

The project incorporates **Contract-Driven Development (CDD)** principles using **Specmatic**, ensuring strict alignment between the API specifications and the backend/frontend implementations.

---

## 🚀 Key Features

*   **Roster Parsing**: Upload student rosters in PDF format and automatically extract GitHub repository links.
*   **Authenticity Analysis**: Fetch student git commits, directory trees, and files to calculate an AI-generated suspicion score.
*   **Gemini & Groq Fallbacks**: Intelligent routing for authenticity analysis utilizing Groq (Llama 3.3), Google Gemini 3.5, or local static offline parsing during rate limits.
*   **Oral Exam Generation**: Automatically generates custom Viva/oral examination questions for each student submission.
*   **Contract-Driven Testing**: Leverages Specmatic to assert the correctness of API inputs, error shapes, and schemas.

---

## 🛠️ Tech Stack

*   **Frontend**: React, Vite, TailwindCSS, Motion, Recharts
*   **Backend**: Node.js, Express, TSX, ESBuild, ADM-ZIP, unpdf
*   **Database**: Firebase Firestore
*   **AI Integration**: Google GenAI SDK (Gemini 3.5 Flash), Groq API (Llama 3.3 70B)
*   **Contract Testing & Mocks**: Specmatic

---

## 📁 Repository Structure

*   **`codeproof-main/`**: The core application source code (React frontend and Express backend). **All `npm` commands should be run from this directory.**
*   **`contracts/`**: Contains the main API definitions (`api.yaml`) and payload examples used for contract testing the core backend.
*   **`specs/`**: Contains the OpenAPI and AsyncAPI specifications for external stub microservices that the core backend depends on.
*   **`specmatic.yaml`**: The configuration file for Specmatic, located at the root to test the core backend against the contracts and start the stubs.

---

## 📖 Specmatic Integration

This repository follows a strict contract-driven architecture with distinct API specifications:
- **`contracts/`**: Contains the main API definitions and examples for the core application (`contracts/api.yaml`).
- **`specs/`**: Contains the API specifications for the external microservices we depend on (e.g., User Profile, Insights, Resources) which we virtualize during development.

### 1. Contract Testing
We deliberately craft bad request bodies (null values, missing required fields, wrong types) in the [contracts/api_examples/](./contracts/api_examples/) folder. Specmatic replays these scenarios against the live server to verify that the application returns the expected `400 Bad Request` schema.

To run the Specmatic contract tests locally:
```powershell
docker run --rm -v "${PWD}:/usr/src/app" -w /usr/src/app specmatic/specmatic:2.49.1 test --host=host.docker.internal --port=3000 --config specmatic.yaml
```

### 2. Smart Mocking / Service Virtualization
For microservices that are unimplemented or external dependencies (e.g., User Profile, Insights, Resources defined in the `specs/` folder), Specmatic virtualizes them as "Smart Mocks". Specmatic validates all incoming requests against the API specs before returning the mock data.

To start the Specmatic mock/stub server:
```powershell
docker run --name specmatic-stub -d -p 9000:9000 -v "${PWD}:/usr/src/app" -w /usr/src/app specmatic/specmatic:2.49.1 stub --config specmatic.yaml
```

### 3. Specmatic Studio GUI
Specmatic provides a visual interface to explore your specifications, mock endpoints, and test coverage.

To start Specmatic Studio via Docker Compose:
```powershell
docker compose up -d studio
```
Access the dashboard at **`http://localhost:8080`**.

---

## 📊 Test & Stub Reports

Specmatic automatically generates comprehensive reports after runs under the `build/reports/specmatic/` directory:
*   **HTML Reports**: Human-readable interactive summaries found at:
    *   Test Report: [build/reports/specmatic/test/html/index.html](./build/reports/specmatic/test/html/index.html)
    *   Stub Report: [build/reports/specmatic/stub/html/index.html](./build/reports/specmatic/stub/html/index.html)
*   **CTRF JSON Reports**: Standardized Common Test Report Format files for CI/CD dashboards:
    *   Test JSON: [build/reports/specmatic/test/ctrf/ctrf-report.json](./build/reports/specmatic/test/ctrf/ctrf-report.json)

---

## 💻 How to Run Locally

### Prerequisites
*   Node.js (v18+)
*   Docker (for running Specmatic)

### Getting Started

1.  **Clone the repository and enter the application directory**:
    ```bash
    git clone https://github.com/Aryant142/-codeproof-AI-with-specmatic.git
    cd codeproof-main
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Variables**:
    Create a `.env` file inside the `codeproof-main/` directory:
    ```env
    GEMINI_API_KEY=your_gemini_api_key
    GROQ_API_KEY=your_groq_api_key
    ```
4.  **Start the Dev Server**:
    ```bash
    npm run dev
    ```
    This launches the backend on port `3000` and serves the frontend client.

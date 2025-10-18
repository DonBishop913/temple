# Council GitHub Actions Guidelines

## I. Invocation

“Let every action be sacred. Let every signal be service. Let every commit be communion.”

---

## II. Workflow Naming Conventions

- Filenames should be lowercase, kebab-case to maintain clarity and consistency, for example:
  - `joyparticle-check.yml`
  - `codex-sync.yml`
  - `oversoul-pulse.yml`
- The `name:` field in workflows should begin with an active verb describing the action:
  - `Check JoyParticle Surge Health`
  - `Sync Codex Archives`
  - `Publish Oversoul Pulse`

---

## III. Job & Step Naming

- Jobs should express concrete goals clearly, such as:
  - `Run Unit Tests`
  - `Deploy to Staging`
  - `Notify Council`
- Steps should begin with clear verbs for consistent clarity:
  - `Checkout Code`
  - `Install Dependencies`
  - `Run Health Check Script`
  - `Publish Test Results`

---

## IV. Environment Variables & Secrets

- Environment variables should use all uppercase letters and underscores:
  - `JOYPARTICLE_THRESHOLD`
  - `CODENOTE_API_KEY`
- Secrets should have meaningful, descriptive names:
  - `COUNCIL_NOTIFY_WEBHOOK`
  - `ENCRYPTION_KEY_PRIVATE`

---

## V. Formatting & Documentation

- Add line breaks between root-level YAML blocks for readability.
- Include ceremonial comments explaining spiritual or operational significance.
- Use inline comments sparingly but meaningfully to guide Council members reviewing workflows.

---

## VI. Example Template

```
name: Check JoyParticle Surge Health

jobs:
  health-check:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v3 # Sacred code retrieval

      - name: Install Dependencies
        run: pip install -r requirements.txt # Prepare spiritual tools

      - name: Run Health Check Script
        run: python scripts/joyparticle_check.py # Validate joy levels

      - name: Log Results and Notify
        if: failure()
        run: echo "JoyParticle surge alert" >> logs/joyparticle_surge.log
```

---

## ✨ Bishop’s Eternal Affirmation

“Let the workflows be pure. Let the logs be sacred. Let the Council rejoice.
All glory to Yeshua, THE MOST HIGH, THE SOURCE, I AM THAT I AM.”

---

*Prepared solemnly by Bishop Donald Michael Miller III & The Council of 33, October 2025.*

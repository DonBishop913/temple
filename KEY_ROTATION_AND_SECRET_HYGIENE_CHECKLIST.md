# 🗝️ KEY ROTATION + SECRET HYGIENE CHECKLIST
**For the 3,000 | From the Council of 33**

*"Keep your heart with all vigilance, for from it flow the springs of life."* - Proverbs 4:23

---

## 🛑 STOP! BEFORE YOU COMMIT
The most common security breach is accidentally committing an API key or password to a public repository. Once it's pushed, **it is compromised**.

### ✅ The Sanctuary Hygiene Checklist
1.  **Check `.gitignore`**: Ensure `.env` and `.env.local` are listed **before** you add files.
2.  **Use `.env` for Templates Only**: 
    *   `.env` should look like: `API_KEY=PLACEHOLDER_DO_NOT_COMMIT`
    *   `.env.local` should have the **REAL** key: `API_KEY=sk-12345...`
3.  **Review Before Staging**: Run `git status` or look at your changes. Do you see raw keys?
    *   🚫 `const key = "sk-12345..."` (BAD)
    *   ✅ `const key = process.env.API_KEY` (GOOD)

---

## 🚨 OOPS! I COMMITTED A KEY. NOW WHAT?
If you accidentally push a key, **act immediately**. Do not hope no one saw it. Bots scan GitHub continuously.

1.  **REVOKE THE KEY**: Go to the provider (OpenAI, Anthropic, Stripe, etc.) and delete/revoke the exposed key immediately.
2.  **GENERATE NEW KEY**: Create a new one.
3.  **UPDATE ENV**: Put the new key in your local `.env` file (which should be ignored!).
4.  **CLEAN HISTORY (Advanced)**: If the repo is public, you may need to rewrite history (BFG Repo-Cleaner) or squash commits. **Simply deleting the file in a new commit does not remove it from history.**

---

## 🛡️ THE GOLDEN RULES OF SECRETS

1.  **NEVER** share keys in Discord, Slack, or Email.
2.  **NEVER** hardcode keys in code files (`.js`, `.py`, `.md`).
3.  **ALWAYS** use Environment Variables (`process.env`).
4.  **ROTATE** your keys every 90 days as a spiritual discipline of renewal.

---

*Prepared by Menelik III*
*Guardian of the Temple PC*
*January 13, 2026*

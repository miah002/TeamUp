# Operator Guide — Trainee Evaluation Workflow

Practical reference for the people who actually run and maintain this thing.
Read `README.md` first for the high-level architecture; this doc is the
"what's wired up right now and how do I change it" companion.

---

## 1. End-to-end flow (what happens when a trainee submits the form)

The form lives in Lark Base table `tblnGRAlrjXQhfRO` (base
`R0XnbNkwdaY4A1sNPcklT2MTgqe`). Every form submission is a new row in that
table. A Lark Base automation on that table fires a webhook to n8n.

The n8n workflow then runs these nodes in order:

| # | Node                                  | What it does                                                                                                  |
|---|---------------------------------------|---------------------------------------------------------------------------------------------------------------|
| 1 | **Webhook: Lark Base record created** | Receives the POST from Lark. Body contains the new record (or at least the `record_id`).                      |
| 2 | **Lark: tenant_access_token**         | Calls `/auth/v3/tenant_access_token/internal` with `LARK_APP_ID` + `LARK_APP_SECRET` to get a 2-hour token.   |
| 3 | **Normalize webhook + carry token**   | Pulls `record_id` and `fields` out of whatever shape Lark sent, attaches the token for downstream nodes.      |
| 4 | **Lark: fetch full record**           | GETs the full record from `/bitable/v1/apps/{APP}/tables/{TABLE}/records/{record_id}` so we have all answers. |
| 5 | **Load answer key**                   | Returns the inline rubric (the `ANSWER_KEY` JS object).                                                       |
| 6 | **Build per-question items**          | Splits the answer key into 23 items, each tagged with the trainee's answer for that question.                 |
| 7 | **Switch: exact vs scenario**         | Routes each item: 11 exact-match → branch A; 12 scenarios → branch B.                                         |
| 8a | **Exact match score** (branch A)     | JS compare: `expected.trim().toLowerCase() === answer.trim().toLowerCase()` → 1 or 0.                         |
| 8b | **LLM: grade scenario (HTTP)** (B)   | POSTs to Groq (`llama-3.3-70b-versatile`) with the prompt + rubric, gets back a JSON `{score, reasoning, ...}`.|
| 9 | **Apply keyword floor** (B)           | Caps LLM score at 50% if any `required_keywords` are missing from the trainee's answer.                       |
| 10 | **Merge branches** (mode: append)    | Concatenates the 11 exact items + 12 scenario items back into one stream of 23.                                |
| 11 | **Aggregate + build Lark patch**     | Sums scores, computes `result = score > 17.5 ? 'PASS' : 'FAIL'`, builds the patch body for Lark.               |
| 12 | **Lark Base: PATCH scores to record** | POSTs to `/bitable/v1/apps/{APP}/tables/{TABLE}/records/batch_update` with the 23 per-question scores.        |
| 13 | **IF: valid email?**                  | Skips email step if the trainee's email field doesn't contain `@` (guard against test data).                  |
| 14 | **IF: passed?**                       | Routes to "Email: pass" or "Email: fail + retake" based on `result === 'PASS'`.                               |
| 15 | **Email: pass** / **Email: fail**     | SMTP send from `ulanjeremiah@gmail.com` to the trainee.                                                       |

Total wall-clock time: ~5–10 seconds (LLM calls run in parallel).

---

## 2. How grading works per question type

### 2.1 Exact-match (q1–q11)

```js
norm(answer) === norm(expected)   // both trimmed + lowercased
score = match ? 1 : 0
```

That's it. No fuzzy match, no partial credit. If the form answer is
`"c. caregiver pivot"` and the rubric expects `"C. Caregiver Pivot"`, it
matches (case-insensitive). Anything else scores 0.

### 2.2 Scenario (q12–q23)

The Groq LLM gets:
- The question prompt.
- The list of `expected_points` from the rubric (what a good answer covers).
- The list of `required_keywords`.
- The trainee's answer.
- Instructions to return JSON: `{score: 0–5, reasoning, missing_points, keywords_found}`.

The LLM score (0–5) is then:
1. Clamped to `[0, max_score]`.
2. Capped at `floor(max_score / 2)` = 2 if any `required_keywords` are missing
   from the trainee's answer (cheap cheat-detection).
3. Rescaled to a 0–1 contribution to TOTAL: `(raw_score * weight) / max_score`.
   So 5/5 → 1.0, 3/5 → 0.6, etc.

### 2.3 TOTAL and RESULTS in Lark

Both are **Lark formula fields** — n8n never writes to them directly. The
formulas live in Lark Base:

```
TOTAL    = SUM([1 (Caregiver Pivot)], [2 Sent Out], …, [23 (LTCI VA)])
RESULTS  = IF([TOTAL] > 17.50, "PASS", "FAIL")
```

Lark recomputes them automatically the moment n8n's `batch_update` lands the
23 per-question scores. The n8n workflow's own pass/fail check
(`score > 17.5`) is identical, and is used only to pick which email to send.

---

## 3. Updating the test answers

There are **two synchronized copies** of the rubric:

1. `docs/trainee-evaluation/answer-key.json` — canonical, version-controlled.
2. The `ANSWER_KEY = { ... }` object inside the **Load answer key** node in
   `n8n/Trainee Evaluation (Lark + LLM).json` — the copy n8n actually executes.

**They must stay in sync.** The current setup is "edit the JSON file, then
re-import the workflow into n8n."

### 3.1 Change a correct answer (exact-match question)

```json
{
  "id": "q1",
  "type": "exact",
  "score_field": "1 (Caregiver Pivot)",
  "expected": "C. Caregiver Pivot",   // ← edit this
  "weight": 1,
  "normalize": "trim_lower"
}
```

Steps:
1. Edit `docs/trainee-evaluation/answer-key.json`.
2. Open `n8n/Trainee Evaluation (Lark + LLM).json` and edit the matching
   `"expected"` inside the `Load answer key` node's `jsCode` string.
3. Commit, push, re-import the workflow JSON into n8n, re-activate.

### 3.2 Tune a scenario rubric (LLM-graded question)

```json
{
  "id": "q12",
  "type": "scenario",
  "expected_points": [             // ← what a good answer should cover
    "addresses the caregiver by name (Daniel)",
    "acknowledges the reason (car problem)",
    "..."
  ],
  "required_keywords": ["daniel"]  // ← hard floor: missing → score capped at 2/5
}
```

The LLM only sees these strings — they are the rubric. Add a bullet to
`expected_points` to require coverage of a new concept; add a keyword to
`required_keywords` to force literal mention.

### 3.3 Change the passing threshold

Two places to update:

1. **Lark formula on the RESULTS column**: change `> 17.50` to your new value.
2. **`passing_score`** in `answer-key.json` and the inline copy in the workflow.

Keep them identical. Right now: `17.5` (i.e., trainee needs > 17.5 of 23 to
pass, ~76%).

### 3.4 Add a brand-new question

Heavier change — touches three systems:

1. **Lark Base**: add the question's text field (so the form captures the
   trainee's answer) and the score number field (so n8n can write a score).
   Update the **TOTAL** formula to include the new score column.
2. **`answer-key.json`**: add a new entry with `id`, `type`, `field_name`
   (must match the Lark column name exactly), `score_field` (also exact),
   and either `expected` (exact) or `expected_points`/`required_keywords`
   (scenario).
3. **Workflow JSON**: paste the same entry into the `ANSWER_KEY` object in
   the `Load answer key` node. Re-import.

---

## 4. Testing your changes

1. **Unit-test the rubric** by submitting the form with a known answer set
   (one all-correct, one all-wrong, one borderline). Watch the n8n execution.
2. **Inspect the `Aggregate + build Lark patch` node output** — it shows the
   per-question scores as an array. If a question is missing or scored 0
   unexpectedly, the answer key field name probably doesn't match the Lark
   column name.
3. **Confirm the row in Lark Base**: TOTAL and RESULTS should populate within
   a few seconds. The 23 per-question score columns should all have numbers
   (0 or 1 for exact; fractions like 0.6 for scenarios).
4. **Check the email** lands in the trainee's inbox.

If something errors, the Lark `batch_update` response is your best signal:
- `{"code": 0, "msg": "success"}` → wrote successfully.
- `code: 1254xxx` → field name mismatch (a `score_field` doesn't exist in Lark).
- `code: 99991xxx` → permission / token issue.

---

## 5. Should we drop n8n and let Lark handle everything?

**Short answer: keep n8n.** The whole point of the automation is the LLM
grading for the 12 scenario questions. Lark Base automations and formulas
have no LLM access.

### What pure-Lark could do

| Capability                                              | Lark formulas / automations | Lark + n8n + LLM |
|---------------------------------------------------------|:---------------------------:|:----------------:|
| Exact-match grading (11 questions)                      | ✅ via `IF(answer="…",1,0)`  | ✅                |
| Sum into TOTAL and PASS/FAIL via formula                | ✅                          | ✅ (already does)|
| Send pass/fail email via Lark automation                | ✅                          | ✅                |
| **Grade scenario answers (12 questions)**               | ❌ no LLM                    | ✅                |
| Apply keyword-floor anti-cheat                          | ❌ (can't really)           | ✅                |
| Per-question feedback for trainers                      | ❌                          | ✅                |
| Single source of truth for the rubric                   | ❌ (split across 23 formulas)| ✅ (one JSON)    |

### What you'd lose by going Lark-only

- **12 of 23 questions can't be auto-graded.** Trainers would have to read
  every scenario submission and score it by hand — defeats the purpose.
- **Each correct answer becomes a Lark formula.** 11 formulas, one per
  question, with the expected text hard-coded in each. To change an answer,
  you edit the formula in Lark Base. No history, no diff, no review.
- **No keyword floor or sanity check on LLM output** (because no LLM).

### What you'd gain by going Lark-only

- One less moving part. No n8n, no Groq, no SMTP credentials to maintain.
- Slightly more reliable (Lark Base formulas don't fail mid-flight).

### Hybrid (don't recommend)

You could let Lark formulas grade the 11 exact-match questions and use n8n
*only* for the 12 LLM-graded ones. In practice this:
- Splits the rubric across two systems (formulas in Lark + JSON in repo).
- Doubles the surface area to debug when an answer changes.
- Saves almost nothing — n8n already runs in parallel and is fast.

### Recommendation

Keep the current setup. The bottleneck for ongoing maintenance isn't n8n —
it's keeping `answer-key.json` and the inline copy in the workflow JSON in
sync. The next sensible improvement (if you outgrow the manual sync) is to
load the rubric from a Lark Base table at runtime, so trainers can edit
answers in Lark without touching code or re-importing the workflow.

---

## 6. Files and where they live

| File                                                          | Purpose                                            |
|---------------------------------------------------------------|----------------------------------------------------|
| `docs/trainee-evaluation/README.md`                           | High-level architecture and design rationale.     |
| `docs/trainee-evaluation/OPERATOR_GUIDE.md`                   | This file. Day-to-day operations.                 |
| `docs/trainee-evaluation/answer-key.json`                     | Canonical rubric. Edit this first.                |
| `docs/trainee-evaluation/answer-key.example.json`             | Generic schema reference for new evaluations.     |
| `docs/trainee-evaluation/source/`                             | Raw CSV exports from Lark — the source data the answer key was generated from. |
| `n8n/Trainee Evaluation (Lark + LLM).json`                    | The actual workflow. Re-import after edits.       |

## 7. Environment variables (n8n Settings → Environments)

| Variable                  | Value                              | What it's for                              |
|---------------------------|------------------------------------|--------------------------------------------|
| `LARK_APP_ID`             | `cli_a96b43250df9deea`             | Identifies the Lark custom app.            |
| `LARK_APP_SECRET`         | (from Lark Developer Console)      | App secret. Don't commit to repo.          |
| `LARK_BASE_APP`           | `R0XnbNkwdaY4A1sNPcklT2MTgqe`      | The Base (app token) housing the table.    |
| `LARK_SUBMISSIONS_TABLE`  | `tblnGRAlrjXQhfRO`                 | The submissions table inside that base.    |

The Lark app must have **`bitable:app`** permission (read-write) and be
added to the base as a "Can edit" collaborator. Re-publish the app after
any permission change.

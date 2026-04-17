# Trainee Evaluation Automation (Lark + n8n + LLM)

Automates grading of trainee questionnaires submitted via Lark (Lark Form or a
Lark Doc used as a form), combining deterministic scoring for objective
questions with LLM-based scoring for scenario questions. Results are emailed to
the applicant (via Lark Mail or SMTP) and persisted in Lark Base (or Google
Sheets) for audit.

Files in this folder:

- `README.md` — this design document (architecture, prompts, edge cases).
- `answer-key.example.json` — shape of the answer key used by the workflow.
- `../../n8n/trainee-evaluation-workflow.json` — importable n8n workflow.

---

## 1. Architecture

```
 Lark Form submit
        │
        ▼
 Lark Open Platform  ──►  n8n Webhook (trigger)
                              │
                              ▼
                     Normalize / Fetch answer key
                              │
                              ▼
                     Split questions  ──►  For each question:
                                             │
                                             ├── exact  → JS compare
                                             └── scenario → LLM (JSON out)
                                             │
                              ◄──────────────┘
                              │
                     Aggregate → total score → pass/fail
                              │
                   ┌──────────┴──────────┐
                   ▼                     ▼
          Lark Mail: PASS         Lark Mail: FAIL + retake link
                   │                     │
                   └──────────┬──────────┘
                              ▼
                   Append row to Lark Base / Google Sheet
```

Design principles:

- **One source of truth for the rubric.** The answer key is a single JSON
  document (stored in Lark Base table, a Google Sheet, or committed to this
  repo) keyed by `question_id`. The workflow never hard-codes expected answers.
- **Deterministic before LLM.** Exact-match questions never hit the LLM — saves
  cost and keeps grading reproducible.
- **Structured LLM output.** The LLM is forced to return JSON (via
  `response_format: json_object` or `json_schema`), so downstream scoring is a
  pure function.
- **Idempotent writes.** Every result row uses the Lark submission ID as a
  natural key, so re-running the workflow on the same submission won't
  duplicate rows.

---

## 2. Lark setup

### 2.1 Form design

Use either:

- **Lark Form** (recommended): `https://www.larksuite.com/hc/...` → create form.
- **Lark Base form view**: create a Base, add a form view, publish it.

Required fields:

| Field              | Type            | Notes                             |
| ------------------ | --------------- | --------------------------------- |
| `name`             | short text      | Required                          |
| `email`            | short text      | Required, validated as email      |
| `q1` … `qN`        | short/long text | One per question                  |

Tag each question in the answer key with `type: "exact" | "scenario"` — the
form itself doesn't need to know.

### 2.2 Trigger: Lark → n8n

Lark Forms don't call webhooks natively. Two working options:

1. **Lark Base form + Base automation.** Create the form inside a Base table.
   Add an automation: *When a record is created* → *Send a webhook*. Point it
   at your n8n Webhook URL. This is the simplest path.
2. **Lark Open Platform event subscription.** Subscribe to the
   `bitable.record.created` event for the Base. Use this when you need
   signatures / replay protection.

For either, the n8n webhook receives a JSON body containing the new record.

### 2.3 Lark Base tables

Create a Base `Trainee Evaluations` with two tables:

- `Submissions` — raw form submissions (written by the form itself).
- `Results` — grading output (written by n8n).

`Results` schema:

| Column          | Type        |
| --------------- | ----------- |
| `submission_id` | Text (key)  |
| `name`          | Text        |
| `email`         | Text        |
| `answers_json`  | Long text   |
| `per_q_json`    | Long text   |
| `score`         | Number      |
| `max_score`     | Number      |
| `percent`       | Number      |
| `result`        | Single select: Pass / Fail |
| `graded_at`     | DateTime    |
| `model`         | Text        |

---

## 3. Answer key format

See `answer-key.example.json`. Shape:

```json
{
  "version": 1,
  "passing_percent": 75,
  "questions": [
    {
      "id": "q1",
      "type": "exact",
      "prompt": "What is the default port of PostgreSQL?",
      "expected": "5432",
      "weight": 1,
      "normalize": "trim_lower"
    },
    {
      "id": "q2",
      "type": "scenario",
      "prompt": "A customer reports the app is slow only at 9am. Walk through your debugging approach.",
      "expected_points": [
        "checks traffic/load spike at 9am",
        "looks at logs and metrics around that window",
        "considers cron/scheduled jobs",
        "forms hypothesis before changing anything"
      ],
      "required_keywords": ["logs", "metrics"],
      "weight": 3,
      "max_score": 5
    }
  ]
}
```

Rules:

- `weight` scales a question's contribution to the total.
- For `exact`: score is `weight` if matches, else `0`.
- For `scenario`: LLM returns `0..max_score`; final contribution is
  `score * weight / max_score`.
- `required_keywords` (optional) acts as a hard floor — if any are missing, the
  LLM-assigned score is capped at `max_score / 2`. Prevents the LLM from
  hallucinating credit.

---

## 4. n8n workflow — nodes

Import `../../n8n/trainee-evaluation-workflow.json`. Nodes, in order:

### 4.1 `Webhook` — trigger

- Method: `POST`
- Path: `/lark/trainee-form`
- Response mode: `Last node` (so Lark gets the grading result if you want, or
  `Immediately` for fire-and-forget).

### 4.2 `Set: Normalize submission`

Maps Lark's payload shape into a canonical object:

```js
{
  submission_id: $json.record_id || $json.event.record.record_id,
  name:          $json.fields.name,
  email:         $json.fields.email,
  answers:       { q1: $json.fields.q1, q2: $json.fields.q2, ... }
}
```

Lark Base webhook payloads nest fields under `event.record.fields` — adjust the
path if you use event subscriptions instead of Base automations.

### 4.3 `HTTP Request: Load answer key` (or `Read Binary File`)

Load the answer key JSON. Options:

- Read from a Lark Base `AnswerKey` table (recommended, editable by trainers).
- Read from a committed JSON file served over HTTPS.
- Inline as an n8n Credential / Variable if small.

### 4.4 `Code: Build per-question work items`

```js
const key = $('Load answer key').first().json;
const submission = $('Normalize submission').first().json;

return key.questions.map(q => ({
  json: {
    submission_id: submission.submission_id,
    name: submission.name,
    email: submission.email,
    question: q,
    answer: (submission.answers[q.id] ?? '').toString(),
    passing_percent: key.passing_percent,
  }
}));
```

Emits one item per question — n8n will fan out the rest of the graph.

### 4.5 `Switch` — by question type

- Output `exact` when `{{$json.question.type}} === "exact"`.
- Output `scenario` when `{{$json.question.type}} === "scenario"`.

### 4.6a `Code: Exact match score`

```js
const { question, answer } = $json;
const norm = s => question.normalize === 'trim_lower'
  ? s.trim().toLowerCase()
  : s.trim();

const match = norm(answer) === norm(question.expected ?? '');
return [{
  json: {
    ...$json,
    per_question: {
      id: question.id,
      type: 'exact',
      score: match ? question.weight : 0,
      max:   question.weight,
      feedback: match ? 'Correct.' : `Expected "${question.expected}".`,
    }
  }
}];
```

### 4.6b `OpenAI` (or `HTTP Request`) — scenario grading

- Node: `OpenAI` → Chat → Model `gpt-4.1-mini` (or equivalent).
- Response format: `JSON Object`.
- System prompt + user prompt: see §5.
- Map output back onto the item.

### 4.6c `Code: Apply keyword floor`

```js
const { question, answer } = $json;
const out = $json.llm;  // {score, reasoning, missing_points, keywords_found}
const maxQ = question.max_score ?? 5;

let score = Math.max(0, Math.min(maxQ, Number(out.score) || 0));

if (question.required_keywords?.length) {
  const lower = (answer || '').toLowerCase();
  const missing = question.required_keywords.filter(k => !lower.includes(k.toLowerCase()));
  if (missing.length) score = Math.min(score, Math.floor(maxQ / 2));
}

const weighted = (score * question.weight) / maxQ;
return [{
  json: {
    ...$json,
    per_question: {
      id: question.id,
      type: 'scenario',
      score: weighted,
      max:   question.weight,
      raw_score: score,
      max_raw:   maxQ,
      feedback:  out.reasoning,
      missing:   out.missing_points ?? [],
    }
  }
}];
```

### 4.7 `Merge` → `Code: Aggregate`

Re-collect the per-question items (use n8n's `Aggregate` node or merge mode
`Combine → all`) then:

```js
const items = $input.all().map(i => i.json.per_question);
const score = items.reduce((s, q) => s + q.score, 0);
const max   = items.reduce((s, q) => s + q.max, 0);
const percent = Math.round((score / max) * 1000) / 10;  // 1 decimal
const pass = percent >= $('Load answer key').first().json.passing_percent;

return [{
  json: {
    submission_id: $('Normalize submission').first().json.submission_id,
    name:          $('Normalize submission').first().json.name,
    email:         $('Normalize submission').first().json.email,
    answers:       $('Normalize submission').first().json.answers,
    per_question:  items,
    score, max, percent,
    result: pass ? 'Pass' : 'Fail',
    graded_at: new Date().toISOString(),
  }
}];
```

### 4.8 `IF` — pass/fail

Condition: `{{$json.result}} === "Pass"`.

### 4.9 Email nodes

Two branches, both using the **Lark** node (`messaging → Send message` to
email) or the **Send Email / SMTP** node.

- **Pass branch** — subject: `You passed the TeamUp evaluation`
- **Fail branch** — subject: `TeamUp evaluation result` and body contains a
  retake link: `https://forms.larksuite.com/...?prefill_email={{$json.email}}`.

Keep per-question feedback **out** of the fail email unless the trainer
explicitly enables it — it risks leaking the answer key.

### 4.10 `Lark Base` / `Google Sheets` — Append row

Upsert into the `Results` table keyed on `submission_id`. For Lark Base, use
the *Update or create* operation to make it idempotent.

---

## 5. LLM prompt templates

### 5.1 System prompt

```
You are a strict but fair grader for a technical trainee evaluation. You score
one free-response answer at a time against a rubric. You do not reveal the
rubric to the candidate. You respond with a single JSON object, no prose, no
markdown fences. If the candidate's answer is empty or off-topic, score 0.
```

### 5.2 User prompt template

```
QUESTION:
{{question.prompt}}

RUBRIC — expected points the answer should cover:
{{#each question.expected_points}}
- {{this}}
{{/each}}

REQUIRED KEYWORDS (the answer must at least mention these concepts):
{{question.required_keywords | join(", ")}}

CANDIDATE ANSWER:
"""
{{answer}}
"""

Score the answer from 0 to {{question.max_score}} using these criteria, each
weighted equally:
  - Relevance: addresses the question directly.
  - Completeness: covers the expected points above.
  - Reasoning: shows a defensible thought process, not just keywords.

Return JSON with this exact schema:
{
  "score": <integer 0..{{question.max_score}}>,
  "keywords_found": [<string>, ...],
  "missing_points": [<string>, ...],   // expected points not covered
  "reasoning": "<one or two sentences explaining the score>"
}
```

### 5.3 Why this works

- The rubric lives in the prompt, not in the LLM's head — swap rubrics without
  retraining anything.
- `missing_points` gives the trainer a breadcrumb trail for disputes.
- Forcing integer scores keeps aggregation stable across retries.
- The keyword floor in §4.6c is a belt-and-braces check against an LLM that
  praises a vacuous answer.

---

## 6. Edge cases

| Case                          | Handling                                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ |
| Missing answer (empty string) | `Code: Build work items` still emits the item; LLM sees empty answer → scores 0 per system prompt.     |
| Missing question in payload   | `answers[q.id] ?? ''` — treated as empty answer, scored 0.                                             |
| Malformed LLM JSON            | Wrap the OpenAI node with an `On error → continue`; the keyword-floor node defaults `score` to 0.      |
| Duplicate submissions         | Lark Base upsert on `submission_id` (idempotent). Add a guard node that skips if `Results` already has the id and `result === 'Pass'`. |
| Rubric change after grading   | Answer key has `version`. Store it on each result row (`rubric_version`) so old grades stay traceable. |
| Flaky LLM output drift        | Re-run just the scenario branch by re-posting the original webhook body; aggregate is pure.            |
| Retake link abuse             | Include a short-lived signed token in the retake URL; verify on resubmission.                          |
| PII in logs                   | In production, disable "Save execution data" for this workflow or redact `email`/`answers` before save. |

---

## 7. Operational notes

- **Cost.** Scenario questions use one LLM call each. With `gpt-4.1-mini` and
  ~500 input tokens per question, a 5-scenario evaluation costs cents.
- **Latency.** Fan-out is parallel within n8n; total workflow latency is
  roughly `max(scenario_calls)` + overhead, not the sum.
- **Observability.** Add a `Set` node at the end that writes a one-line log
  record (`submission_id`, `percent`, `result`, `model`, `duration_ms`) to a
  `GradingLog` Base table. Makes rubric tuning measurable.
- **Human-in-the-loop.** For borderline scores (e.g., `percent` within ±3 of
  threshold), skip the auto-email and instead post to a trainer's Lark group
  chat for review.

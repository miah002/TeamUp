# Source data

Raw exports from Lark used to generate the answer key.

## Expected files

- `sa-assessment.csv` — CSV export of the `SA Q2 Assessment` submissions
  table (`tblS2FwNTV4XuWqm` in Base `R0XnbNkwdaY4A1sNPcklT2MTgqe`). Column
  headers = questions.
- `answer-key.csv` or `answer-key.md` — trainer's expected answers, one row/
  section per question.

## How to refresh

1. In Lark Base, open the submissions table → `···` → **Export** → CSV.
2. Save as `sa-assessment.csv` in this folder.
3. Commit.

The workflow itself does not read from this folder at runtime — these files
exist so the answer key (`../answer-key.example.json`) can be regenerated
when the form changes.

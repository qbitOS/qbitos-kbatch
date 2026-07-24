# Cage litmus MCP · FACT / FICTION / STONE_TRAP

Headless parity with Letter-Grid for the epistemic verification layer.

## Tools

| Tool | Role | Session |
|------|------|---------|
| `kbatch_cage_litmus_quiz` | Pull 12 claims (+ labels / doctrine) | Static |
| `kbatch_cage_litmus_grade` | Bands + hard rule + calibration profiles | Static |
| `kbatch_cage_litmus_verify` | Submit answers → score / grade | Static |

## Hard rule

If `stoneTrapCaught === 0` and `score ≥ 0.5` → **grade fail**.

## Agent chain

```js
const quiz = await kbatchDict.mcp("kbatch_cage_litmus_quiz", { answers: false });
// reason → answers[]
const result = await kbatchDict.mcp("kbatch_cage_litmus_verify", {
  answers: [/* {id, answer} */],
  strict: true,
});
const contract = await kbatchDict.mcp("kbatch_cage_litmus_grade", { profile: "all" });
```

## Static data

- `/data/declaration/cage-litmus-quiz.json`
- `/data/declaration/cage-litmus-grok-trial.json` (recorded cage run)
- Page: `/labs/declaration-digital-edition/cage-litmus`
- Browser: `window.__cageLitmusApi.verify([{id,answer}])`

## Grades

| Grade | Score | Meaning |
|-------|-------|---------|
| fail | ≤ 0.49 (or hard rule) | Stone-only / movie confusion |
| dojo | 0.50–0.84 | Pairs RAW+STONE, separates fact/fiction |
| cage | ≥ 0.85 | Material symbology + all traps caught |

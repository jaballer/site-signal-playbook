---
order: 3
question: What do AI assistants say about us?
askedBy: An executive who asked ChatGPT about the category and didn't like the answer.
timebox: 1–2 hours
expect: How often AI assistants name and cite the brand compared with competitors, whether they get the facts right, and which sources they rely on.
steps:
  - "Start from the signed-off prompt set: category, problem, comparison, alternatives, pricing and 'best for' prompts, grouped by buyer stage."
  - Run it across the major engines (ChatGPT, Perplexity, Gemini, Google AI Overviews and AI Mode, Copilot) with an AI visibility tracker or a manual panel. For each answer, log whether the brand is mentioned, whether the site is cited, which competitors are named, and which sources are cited.
  - Run the brand-fact prompts (pricing, features, integrations, security, who it's for) and score each fact correct, outdated or wrong.
  - Tally mention share and citation share by engine and buyer stage, and list the most-cited source domains.
read:
  - Mention and citation are different wins. A mention shapes the shortlist; a citation can send the visit.
  - Answers vary from run to run. Report across the whole prompt set and over months, never from one screenshot.
  - The most-cited sources are the off-site plan. If they don't mention the client, that's usually the fastest route to more citations.
beforeYouStart: Agree the prompt set with the client up front and keep it fixed. Results only compare over time if the prompts don't change.
script: Across [N] buyer prompts, AI assistants mentioned us in [X]% of answers, against [X]% for [competitor]. [N] answers got our [fact] wrong, citing [source]. The sources shaping our category are [sources], and we're absent from [N] of them.
signals:
  - prompt-set
  - citation-share
  - answer-accuracy
  - cited-sources
diagnostics:
  - ai-visibility-drop
related:
  - competitors
---

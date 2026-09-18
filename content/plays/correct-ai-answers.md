---
order: 15
title: Correct what AI gets wrong
when: Brand-fact prompts return wrong pricing, features or positioning.
effort: S
firstSignal: weeks
owner: content
timing: Weeks to months, depending on how often each engine recrawls the source.
steps:
  - Find the source each wrong answer cites
  - Fix it at the source, or request a correction from the site that owns it
  - State the correct fact plainly on a crawlable page the client controls
  - Update schema and major profiles to match
  - Re-run the prompts monthly until the answers change
moves:
  - answer-accuracy
  - entity-consistency
dependsOn:
  - entity-foundation
watchOut: Engines refresh at different speeds. Report progress per engine so one slow engine doesn't hide the wins.
---

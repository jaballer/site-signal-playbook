---
order: 5
title: AI answer visibility
question: When buyers ask AI assistants about the category, is the brand named, cited and described correctly?
signals:
  - prompt-set
  - citation-share
  - answer-accuracy
  - cited-sources
  - ai-referrals
checks:
  - check: Prompt set
    how: Confirm a signed-off prompt set exists, by topic and buyer stage
    fail: No agreed set, only ad hoc screenshots
    plays:
      - measurement-foundations
  - check: Mention and citation share
    how: Run the prompt set across major engines and compare with competitors
    fail: Competitors named in most category answers, the client rarely
    plays:
      - win-cited-sources
      - definition-pages
      - review-program
  - check: Answer accuracy
    how: Score brand-fact prompts correct, outdated or wrong
    fail: Wrong pricing, features or positioning
    plays:
      - correct-ai-answers
      - entity-foundation
  - check: Cited sources
    how: List the domains cited in category answers
    fail: The most-cited sources don't mention the client
    plays:
      - win-cited-sources
      - review-program
  - check: AI Overviews on priority terms
    how: Rank tracker SERP features, or manual checks for priority keywords
    fail: AI Overviews on priority terms that cite competitors and not the client
    plays:
      - answer-first-pages
      - definition-pages
  - check: AI referral tracking
    how: Check GA4 for an AI assistants channel
    fail: AI visits hidden inside Referral or Direct
    plays:
      - measurement-foundations
---

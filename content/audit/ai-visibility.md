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
  - check: Mention and citation share
    how: Run the prompt set across major engines and compare with competitors
    fail: Competitors named in most category answers, the client rarely
  - check: Answer accuracy
    how: Score brand-fact prompts correct, outdated or wrong
    fail: Wrong pricing, features or positioning
  - check: Cited sources
    how: List the domains cited in category answers
    fail: The most-cited sources don't mention the client
  - check: AI Overviews on priority terms
    how: Rank tracker SERP features, or manual checks for priority keywords
    fail: AI Overviews on priority terms that cite competitors and not the client
  - check: AI referral tracking
    how: Check GA4 for an AI assistants channel
    fail: AI visits hidden inside Referral or Direct
---

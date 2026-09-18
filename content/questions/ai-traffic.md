---
order: 9
question: Are AI assistants sending us visitors, and do they convert?
askedBy: An executive who has heard AI search is replacing Google.
timebox: 15 min
expect: Visits and leads from AI assistants, their conversion rate against organic search, and the pages they land on.
steps:
  - In GA4, open **Reports → Acquisition → Traffic acquisition** and look at the AI assistants channel. If it doesn't exist yet, set it up (see [Measurement](page:measurement)); it applies to past data.
  - Compare its engagement rate and session key event rate with Organic Search.
  - Open **Reports → Engagement → Landing page** filtered to the AI channel to see where AI visitors land.
  - Cross-check those landing pages against the prompts where the site is cited.
read:
  - Volume is usually small. Judge AI traffic on conversion rate and trend, not visits.
  - "AI visitors landing on pages with no clear next step is a quick fix: add the path to the product or a demo."
  - Some AI apps strip the referrer, so part of this traffic lands in Direct. Treat the number as a floor.
beforeYouStart: The AI assistants channel exists and sits above Referral in the channel group.
script: AI assistants sent [N] visits in [period], [up / down] [X]%, converting at [rate] against [rate] for organic search. Most land on [pages], and we'll [action] on those pages.
signals:
  - ai-referrals
  - landing-performance
  - citation-share
plays:
  - measurement-foundations
  - ai-crawler-policy
  - answer-first-pages
---

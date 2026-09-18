---
order: 2
question: Are we showing up when buyers search?
askedBy: The CMO or marketing lead, monthly, and every executive before a budget review.
timebox: 20 min
expect: Non-branded visibility on the topics that matter, the trend against last year, and where the site ranks for the terms that buy.
steps:
  - In Search Console, open **Performance → Search results**. Add a **Query** filter set to **Doesn't match regex** with the brand-term list, and compare the last three months with the same months last year.
  - On the **Pages** tab, look at priority pages (product, pricing, comparison and key topic pages) to see their impressions and clicks.
  - "In the rank tracker, report the frozen keyword set's position distribution by buyer stage: top 3, 4–10, 11–20, beyond."
  - Note which priority keywords show AI Overviews or other features above the results.
read:
  - Non-branded impressions are the widest measure of search visibility. Clicks show how much of it turns into visits.
  - Read positions as a distribution by buyer stage. An average position hides both wins and losses.
  - Impressions rising while clicks stay flat, on keywords with AI Overviews, is visibility moving into the answer rather than SEO failing. Check the AI questions before concluding anything.
beforeYouStart: The brand-term list is current and the keyword set is frozen. Otherwise the trend measures the list, not the site.
script: Non-branded search impressions [grew / fell] [X]% year over year and clicks [grew / fell] [X]%. [N] priority keywords are now in the top 10, up from [N]. [Topic] is the biggest gain; [topic] is where we're weakest.
signals:
  - nb-clicks
  - priority-rankings
  - serp-features
  - ctr-by-position
  - branded-demand
diagnostics:
  - ai-overview-ctr-drop
  - competitor-overtook-us
plays:
  - answer-first-pages
  - definition-pages
  - internal-linking
related:
  - ai-answers
---

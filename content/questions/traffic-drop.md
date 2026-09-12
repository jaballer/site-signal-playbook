---
order: 6
question: Why did organic traffic drop?
askedBy: An executive, urgently, usually holding one year-over-year number.
timebox: Half a day
expect: Whether the drop is real, which parts of it come from which cause, and the response to each, within a day or two.
steps:
  - Compare Search Console clicks with GA4 organic sessions. If Search Console is flat and GA4 fell, the cause is tracking or consent, not search.
  - Split branded from non-branded clicks. A branded decline is a demand question, not an SEO one.
  - In Search Console, compare periods on the **Pages** and **Queries** tabs and sort by clicks lost. Declines are almost always concentrated.
  - For the losing queries, check whether position fell, or whether CTR fell at the same position. Stable position with falling CTR usually means AI Overviews or new results-page features.
  - Line the drop up against Google's [Search Status Dashboard](https://status.search.google.com/), site releases, migrations, and robots or CDN changes.
read:
  - Answer with the components, not the total. 'Down 20%' is usually three or four smaller stories with different owners.
  - Ranking losses are an SEO problem. Click losses at stable rankings are a results-page change, and the response is to win the answer, not rewrite the page.
  - Seasonality explains more month-over-month drops than anything else. Compare year over year.
beforeYouStart: Run the trust check on both periods, and list every release and tag change in the window before you start.
script: Organic clicks fell [X]% year over year. [X] points come from [cause] on [pages or queries], [X] from [cause], and [X] from [cause]. Non-branded rankings on priority topics are [stable / down]. We're [response] and will report back by [date].
signals:
  - nb-clicks
  - organic-sessions
  - ctr-by-position
  - serp-features
  - index-coverage
  - change-log
diagnostics:
  - organic-traffic-drop
  - deindexed-pages
---

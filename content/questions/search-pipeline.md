---
order: 5
question: Is search producing pipeline?
askedBy: The CFO or CEO deciding whether to keep funding search, and the CMO defending it.
timebox: 30 min
expect: Leads and pipeline from organic search and AI assistants against target and program cost, and the landing pages that produce them.
steps:
  - In GA4, open **Reports → Acquisition → Traffic acquisition**. Look at Organic Search and the AI assistants channel with **Key events** and **Session key event rate**, compared with last year.
  - Open **Reports → Engagement → Landing page**, filtered to the same channels and sorted by key events. These are the pages that sell.
  - Pull the CRM report of leads, opportunities and pipeline value where original source is organic search or AI, for the same period.
  - Put leads, opportunities and pipeline next to the target and the program cost.
read:
  - Leads are what search produces; pipeline is what leadership funds. Report both, and lead with pipeline when the CRM data is trustworthy.
  - Separate branded from non-branded where you can. Many branded-search leads would have arrived anyway.
  - Last-click analytics undercounts content that starts journeys. Say so, and show the CRM's original source beside it.
beforeYouStart: The CRM records original source and landing page, and the attribution rule is agreed in writing. If not, fix that before this report goes to finance.
script: Organic search and AI assistants produced [N] leads and [N] opportunities worth [value] in [period], [X]% of total pipeline, against a target of [value]. [Page] was the top-producing landing page.
signals:
  - organic-leads
  - search-pipeline
  - landing-performance
  - buyer-stage
diagnostics:
  - leads-down-traffic-flat
plays:
  - measurement-foundations
  - answer-first-pages
  - internal-linking
related:
  - search-value
---

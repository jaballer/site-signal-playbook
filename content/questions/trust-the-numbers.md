---
order: 1
question: Can we trust these numbers?
askedBy: Ask it yourself before any report. Leaders ask it after a number surprises them.
timebox: 30 min
expect: "A yes, or a yes with caveats: which numbers are safe for the period, and which need a footnote."
steps:
  - In Search Console, confirm the account uses a **Domain property**, so every subdomain and protocol is included, and that it's linked to GA4 (GA4 **Admin → Product links → Search Console links**).
  - "In GA4, open **Admin → Data filters** and confirm the internal-traffic filter is **Active**. Then check the key events list: only real conversions, such as form submissions and demo bookings, should be marked."
  - Open **Reports → Engagement → Events** for the last 90 days. Look for near-duplicate event names and for spikes that don't look like demand, and line any spike up against the change log.
  - Confirm AI assistants have their own channel, and that the brand-term list includes every current product name and common misspelling.
  - Run Tag Assistant on the main conversion page. Every analytics and conversion tag should fire exactly once.
read:
  - One problem doesn't void the report. Name the affected metric and dates, and report everything else normally.
  - An engagement rate near 100% almost always means page views are firing twice.
  - A stale brand-term list quietly moves branded demand into 'non-branded growth'. It's the most flattering error in search reporting, so check it hardest.
beforeYouStart: You need access to Search Console, GA4 and the tag manager. Ask on day one; without access this recipe becomes a request list.
script: Data is reliable for [period] except [metric] between [dates], which was [inflated / undercounted] by [cause]. Treat those numbers as directional.
signals:
  - change-log
  - duplicate-tags
  - key-events
  - internal-traffic
  - brand-list
diagnostics:
  - numbers-look-wrong
plays:
  - measurement-foundations
pages:
  - measurement
---

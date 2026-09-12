---
order: 6
title: Measurement integrity
question: Can the numbers in the report be trusted?
signals:
  - key-events
  - duplicate-tags
  - internal-traffic
  - brand-list
  - search-pipeline
checks:
  - check: Search Console setup
    how: Domain property, linked to GA4
    fail: A URL-prefix property that misses subdomains, or no GA4 link
  - check: Key events
    how: GA4 key events list
    fail: Clicks or page views marked as conversions
  - check: Duplicate firing
    how: Tag Assistant on conversion pages
    fail: Tags firing twice
  - check: Internal traffic
    how: GA4 data filter status
    fail: Filter missing or left in Testing
  - check: Brand-term list
    how: Review the regex against products, acquisitions and misspellings
    fail: No list, or missing product names
  - check: CRM source
    how: Check original source and landing page fields on recent leads
    fail: Organic leads recorded as Direct or unknown
---

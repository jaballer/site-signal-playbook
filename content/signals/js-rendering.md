---
title: Content visible without JavaScript
layer: foundations
phases:
  - audit
question: Do crawlers that don't run JavaScript see our content?
definition: Whether primary content, internal links and schema are present in the raw HTML the server returns.
source: View-source comparison, or a crawl with JavaScript turned off
capture: Compare the raw and rendered versions of each template.
read: Nothing important missing from the raw HTML
---

Many AI crawlers fetch raw HTML without running scripts. A site can rank well in Google and still be close to invisible to AI engines.

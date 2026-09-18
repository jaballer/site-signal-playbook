---
order: 13
navLabel: Measurement
eyebrow: Measurement foundations
heading: The setup every engagement needs before month one
lede: Small, standard, and done in the baseline phase. Much of it can't be backfilled, so every week of delay is a week the program can't take credit for.
blocks:
  - type: table
    columns:
      - Setup
      - Why it matters
      - How
    rows:
      - - "**Search Console Domain property, linked to GA4**"
        - Covers every subdomain and protocol, and brings query data next to landing-page behaviour
        - Verify through DNS, then link in GA4 under Admin → Product links → Search Console links
      - - "**AI assistants channel**"
        - Separates AI referrals from Referral and Direct so they can be reported and compared
        - In GA4 Admin → Channel groups, copy the default group and add an "AI assistants" channel matching known assistant sources (chatgpt, perplexity, gemini, copilot, claude and others), placed above Referral. Channel groups apply to past data too.
      - - "**[Key events](term:key-event)**"
        - Lead counts and conversion rates only mean something if only real conversions count
        - Mark form submissions and demo bookings as key events; keep clicks and scrolls as ordinary events. Marking isn't retroactive, so do it in week one.
      - - "**Brand-term list**"
        - Splits branded from non-branded search, the core of honest SEO reporting
        - A regex of brand names, product names and common misspellings, reviewed quarterly and versioned in the engagement record. It's what splits [branded from non-branded](term:branded-search) search.
      - - "**Content groups by [buyer stage](term:buyer-stage)**"
        - Lets traffic and conversion be reported by problem, solution, comparison, brand and customer stage
        - Set the content group from the CMS taxonomy or URL rules in the tag manager, using the topic coverage map
      - - "**[Keyword set](term:keyword-set) and [prompt set](term:prompt-set)**"
        - The [fixed denominators](principle:freeze-the-denominators) for share of voice and citation share
        - Grouped by topic and buyer stage, signed off by the client, changed only as dated revisions
      - - "**Change log**"
        - Lets [every movement be explained and every win credited](principle:ship-in-sequence-and-log-everything)
        - One shared log of releases, content shipped, tag publishes and Google updates, mirrored as GA4 annotations
      - - "**[CRM](term:crm) original source and landing page**"
        - The only way to connect search to pipeline
        - Hidden form fields populated with first-touch source and landing page; confirm they're filled on recent leads
      - - "**Internal traffic exclusion**"
        - Keeps the team, the agency and contractors out of the numbers
        - GA4 data filter set to Active, plus a QA cookie or staging property for testers
      - - "**Server log or CDN access**"
        - The only first-party view of AI crawler activity
        - Read access or a monthly export from hosting or the CDN
  - type: table
    heading: If the client has no tracking plan
    intro: Two events cover most of what a search program needs to report. Define them once and never invent new event names inside a template.
    columns:
      - Event
      - Fires when
      - Parameters
    rows:
      - - "`form_submit`"
        - A lead form succeeds (the provider's success callback or the thank-you page)
        - "`form_variant`, `form_location`, `source_cta`"
      - - "`cta_click`"
        - A primary call to action is clicked
        - "`cta_text`, `cta_position`, `page_location`"
    after: "Register the parameters as custom dimensions the day the events ship; custom dimensions don't backfill. Never put UTM parameters on links between pages of the client's own site: they overwrite the real traffic source and corrupt channel reporting."
---

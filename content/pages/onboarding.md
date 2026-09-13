---
order: 4
navLabel: Onboarding
eyebrow: Kickoff and onboarding
heading: Start every client the same way
lede: "Onboarding turns a signed audit into a working engagement: access that works, the right people named, the discovery facts confirmed, and the expectations that protect the program written down before any number moves. It runs in the first week of the [Audit](phase:audit) phase, with a shorter version when a program or a migration starts."
blocks:
  - type: thesis
    mark: "!"
    title: Set expectations before the numbers move.
    text: Clicks falling while visibility rises, the limits of attribution, and how long plays take to show results are easy to explain at kickoff. Explained for the first time in the month traffic dips, they sound like excuses.
  - type: flow
    heading: The steps
    intro: From signature to a working engagement. Onboarding is the audit's first week, so every day it slips comes out of the audit.
    items:
      - title: Hand off from sales
        text: The account lead reads the discovery notes, the signed scope, and any qualification gaps from [Selling](page:selling). Nothing discovery already answered gets asked again, only confirmed.
      - title: Send the welcome and the access request
        text: As soon as the scope is signed. It includes the access list below, the kickoff invitation with its agenda, and the audit timeline.
      - title: Set up the account
        text: "Create the client folder, and start the change log, the decisions log and the measurement setup record (see [Deliverables](page:deliverables))."
      - title: Hold the kickoff
        text: A 60-minute call with the marketing leader, the day-to-day contact, and ideally the budget holder. The agenda is below.
      - title: Test every access item
        text: Log in and check each one works at the level agreed. Chase what's missing with a named owner and a date; the audit timeline starts when access is complete.
      - title: Send the kickoff summary
        text: Confirmed facts, named contacts, the expectations agreed, the audit presentation date, and open items with owners. The expectations also go in the decisions log.
  - type: table
    heading: Access request
    intro: Send it as one list, with the level needed and why, so the client can forward it to whoever grants each item.
    columns:
      - System
      - Access
      - Usually granted by
      - Why we need it
    rows:
      - - "**Google Search Console**"
        - Full user on the Domain property; owner if we're setting up the Domain property or linking it to GA4
        - Marketing ops, the web team or IT
        - Indexing, queries, pages, and the link to GA4
      - - "**Google Analytics 4**"
        - Editor on the property
        - Marketing ops or the analytics owner
        - The AI assistants channel, key events, content groups and the internal-traffic filter
      - - "**Google Tag Manager**"
        - Edit, with the client's approver publishing; Publish if the client wants us to release tag changes
        - Marketing ops or the web team
        - Conversion events, and checking that tags fire once
      - - "**CMS**"
        - An editor account, on staging if the client's release process requires it
        - The web team
        - On-page changes, content, and checking templates and schema
      - - "**CDN, hosting or server logs**"
        - Read access to bot rules and logs, or a monthly log export
        - IT or the web team
        - Whether AI crawlers can reach priority pages, and whether they do
      - - "**CRM reports**"
        - Access to lead, opportunity and pipeline reports with original source and landing page, or a scheduled export
        - Marketing ops or revenue operations
        - Tying search to pipeline
      - - "**Review-site and company profiles**"
        - Admin access, or a named person who can make changes
        - Marketing
        - Entity consistency, review programs and correcting wrong facts
      - - "**Documents**"
        - Past audits and agency reports, positioning and messaging, product facts, and sales-call notes if they're recorded
        - The marketing leader
        - Audit context, the prompt set and the brand fact sheet
    after: Ask for access through each tool's user management, never through shared passwords. Record who granted each item in the measurement setup record, so access can be removed cleanly when the engagement ends.
  - type: table
    heading: Kickoff agenda
    intro: Sixty minutes. Confirm rather than re-ask anything discovery covered, and end with owners and dates.
    columns:
      - Time
      - Item
      - Outcome
    rows:
      - - 5 min
        - Introductions and roles
        - Who does what on both sides, using [Who does what](page:engagement) as the starting point
      - - 10 min
        - The business, confirmed
        - Business model, ideal customer, deal size, sales cycle and priority products, confirmed or corrected
      - - 10 min
        - Competitors and priority topics
        - Named competitors for the benchmark, and the topics and products that seed the keyword and prompt sets
      - - 5 min
        - Planned changes
        - Redesigns, replatforms, launches and campaigns, and how website changes get released
      - - 10 min
        - Leadership's questions
        - The questions leadership needs the program to answer, in their words (see [Leader questions](page:questions))
      - - 10 min
        - Expectations
        - The five expectations below, agreed
      - - 5 min
        - How we'll work
        - Contacts, approvals, cadence, and the audit presentation date
      - - 5 min
        - Open items
        - Missing access and unanswered questions, each with an owner and a date
  - type: table
    heading: Expectations to agree in writing
    intro: Say each one at kickoff, confirm it in the summary, and record it in the decisions log. When a number moves later, point back to it.
    columns:
      - Expectation
      - What we agree
      - Why at kickoff
    rows:
      - - "**Clicks and visibility**"
        - AI answers take clicks on some queries. We report impressions, citation share and branded demand beside clicks, so a dip in traffic isn't read as the program failing.
        - After the first dip, the same explanation sounds like an excuse
      - - "**Attribution**"
        - Analytics undercounts search in long B2B journeys and can't see AI influence without a click. We agree which [attribution option](page:reporting) we'll report, and keep it.
        - Changing the rule mid-program looks like moving the goalposts
      - - "**Timelines**"
        - Measurement and crawl fixes show in days to weeks, page refreshes in weeks, and new content and off-site work in months. Every play's first-signal date goes in the roadmap.
        - The first quarter gets judged on leading indicators, not on the north star
      - - "**What we need from the client**"
        - Results depend on access, expert time, approvals and developer releases. We name what we need and by when, and hold work rather than let it age.
        - Delays on either side then show up in the roadmap instead of in blame
      - - "**Fixed denominators**"
        - The keyword set, prompt set and brand-term list change only as dated revisions, with the client's sign-off.
        - Otherwise every trend measures the list, not the site
  - type: panels
    heading: Ways of working
    items:
      - eyebrow: Contacts
        title: One named contact on each side
        text: Day-to-day questions go through the two contacts. Decisions are confirmed in writing and recorded in the decisions log, whoever made them.
      - eyebrow: Approvals
        title: Agree who approves what
        text: Name who approves content, technical changes and anything public, and how long an approval normally takes. Unapproved work is held, not shipped.
      - eyebrow: Cadence
        title: A check-in, then the reporting rhythm
        text: A mid-audit check-in on access and early findings. After the audit, the [reporting cadence](page:reporting) takes over.
  - type: panels
    heading: Other starting points
    intro: The full onboarding assumes a new client buying the audit. Adjust it for the other ways an engagement starts.
    items:
      - eyebrow: Audit to program
        title: A program kickoff, not a new onboarding
        text: Access and contacts are already in place. Confirm the roadmap owners and client dependencies, repeat the expectations for anyone new, often developers or the budget holder, and start [Baseline](phase:baseline).
      - eyebrow: Straight to a program
        title: The full onboarding, plus their audit
        text: Run every step above. In the first week, check the client's existing audit against the six pillars and note the gaps before planning.
      - eyebrow: Migration protection
        title: Start with the developers
        text: Hold the kickoff with the web team. Confirm the launch date, staging access, the release plan and who signs off on launch, and start the pre-launch benchmark the same week.
  - type: strip
    label: Onboarding is done when
    items:
      - title: Access works
        text: Every item on the access list is tested at the agreed level, not just granted.
      - title: People are named
        text: Contacts for approvals, subject-matter input, developer work and CRM reports.
      - title: Facts are confirmed
        text: Discovery notes are corrected at kickoff and saved in the client folder.
      - title: Expectations are written
        text: All five are agreed, confirmed in the summary and recorded in the decisions log.
      - title: The date is set
        text: The audit presentation is in the budget holder's calendar.
---

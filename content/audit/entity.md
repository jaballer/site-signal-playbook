---
order: 3
title: Entity & structured data
question: Do machines understand who the company is and what each page is?
signals:
  - structured-data
  - entity-consistency
  - answer-accuracy
checks:
  - check: Organization schema
    how: "Validate homepage schema: name, logo, URL, and sameAs links to real profiles"
    fail: Missing, or sameAs doesn't list the company's actual profiles
  - check: Template schema
    how: Validate a sample page for each template
    fail: Product, article or author templates without matching types, or with validation errors
  - check: Author entities
    how: Check author pages, and Person schema on articles
    fail: No author pages, or authors with no credentials or profiles
  - check: Consistent facts
    how: Compare description, category, pricing model and key facts across the site, LinkedIn, review sites, Crunchbase, and Wikipedia or Wikidata where present
    fail: Conflicting descriptions or outdated facts on major profiles
  - check: Facts in plain text
    how: Check that pricing model, key features, integrations and security details are stated in text on crawlable pages
    fail: Key facts exist only in PDFs, images, gated content or sales decks
  - check: About page
    how: Check the About page, and whether an llms.txt file exists. No major AI provider has confirmed using llms.txt, so treat it as cheap insurance, not a fix.
    fail: No clear statement of what the company does, for whom, and how it's different
---

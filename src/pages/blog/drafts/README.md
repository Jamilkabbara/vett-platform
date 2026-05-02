# Blog post drafts

This directory holds **markdown drafts** of upcoming `blog_posts` rows.

The live blog at `/blog` and `/blog/:slug` (see `src/pages/BlogPage.tsx`
and `src/pages/BlogPostPage.tsx`) renders content from the Supabase
`blog_posts` table at runtime. A draft in this directory is a
pre-insertion artifact: someone with database access copies the
frontmatter values into a new row, pastes the body into
`body_markdown`, sets `published=true`, and the post goes live.

Drafts stay in source control even after they're inserted, as the
audit trail for the published version.

## File format

Each draft is a markdown file with YAML frontmatter:

```markdown
---
slug: my-post-slug
title: My Post Title
excerpt: One-line summary that appears on the index card.
tag: tag-name
emoji: "✨"
cover_image_url: ""
published: false
---

# Body content as markdown

Heading-2 sections, lists, links, etc.
```

The fields map 1:1 to columns on `blog_posts`. `cover_image_url` is
typically left empty in drafts; an image URL is added at insertion
time if a hero image is procured.

## Status of current drafts

| File | Slug | Mode | Status |
|---|---|---|---|
| `validate-product-idea-24-hours-synthetic-research.md` | `validate-product-idea-24-hours-synthetic-research` | Full draft (~1,500 words) | `awaiting-review` |
| `synthetic-vs-panel-research-when-each-wins.md` | `synthetic-vs-panel-research-when-each-wins` | Outline | `awaiting-review` |
| `mena-market-validation-panel-quality-emerging-markets.md` | `mena-market-validation-panel-quality-emerging-markets` | Outline | `awaiting-review` |

All three are gated on Jamil voice/tone review per Sub-rule 6 of the
Pass 24 doctrine. Don't insert into the `blog_posts` table until the
draft is acked.

## Sitemap

Blog post URLs are NOT added to `public/sitemap.xml` until the row is
inserted with `published=true`. A draft slug doesn't resolve to a
`/blog/<slug>` URL - sitemapping it would point Googlebot at a 404.

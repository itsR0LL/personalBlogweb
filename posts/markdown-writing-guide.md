---
title: "Markdown Writing Guide for This Blog"
date: "2026-05-11 11:00:00"
description: "A starter guide for creating articles in the posts directory."
cover: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=1600&auto=format&fit=crop"
tags:
  - Markdown
  - Writing
  - Docs
---

## Article Files

Long-form articles live in the `posts` directory. Each article is a Markdown file with frontmatter at the top.

```markdown
---
title: "My Article"
date: "2026-05-11 12:00:00"
description: "Short summary shown in cards and search."
cover: "https://example.com/cover.jpg"
tags: ["Tag A", "Tag B"]
---

Write the article here.
```

## Writing Style

Keep articles useful to your future self:

- start with the context
- name the decision
- show the tradeoff
- include commands, screenshots, or references when they matter
- end with what changed and how it was validated

## Publishing

After editing Markdown, run `npm run build` before deployment. The site reads local Markdown files at build time, so every article should be committed with the project source.

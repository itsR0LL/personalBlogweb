---
title: "本站 Markdown 写作指南"
date: "2026-05-11 11:00:00"
description: "一份在 posts 目录中创建文章的入门指南。"
cover: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=1600&auto=format&fit=crop"
tags:
  - Markdown
  - 写作
  - 文档
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

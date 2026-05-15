import { defaultSchema } from "rehype-sanitize";

const attributes = defaultSchema.attributes || {};

export const markdownSanitizeSchema = {
  ...defaultSchema,
  clobberPrefix: "user-content-",
  attributes: {
    ...attributes,
    "*": [...(attributes["*"] || []), "className", "id", "title"],
    a: [...(attributes.a || []), "href", "title", "target", "rel"],
    code: [...(attributes.code || []), "className"],
    div: [...(attributes.div || []), "className"],
    img: [...(attributes.img || []), "src", "alt", "title", "width", "height", "loading"],
    pre: [...(attributes.pre || []), "className"],
    span: [...(attributes.span || []), "className"],
  },
};

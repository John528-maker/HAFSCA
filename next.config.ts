import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-math"],
    rehypePlugins: [
      ["rehype-katex", { output: "htmlAndMathml", strict: true, throwOnError: true }],
    ],
  },
});

export default withMDX(nextConfig);

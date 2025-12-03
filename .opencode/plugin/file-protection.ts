import type { Plugin } from "@opencode-ai/plugin";
import micromatch from "micromatch";

const uneditableFiles = [
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  "**/src/lib/**.ts",
  "opencode.json",
  "**/.opencode/**",
];

export const FileProtectionPlugin: Plugin = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      if (
        input.tool === "edit" &&
        uneditableFiles.some((pattern) =>
          micromatch.isMatch(output.args.filePath, pattern)
        )
      ) {
        throw new Error(`Do not edit ${output.args.filePath} files`);
      }
    },
  };
};

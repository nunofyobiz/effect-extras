import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

interface MermaidBlock {
  readonly file: string;
  readonly line: number;
  readonly text: string;
}

const FENCE = /^ {0,3}(?<marker>`{3,}|~{3,})(?<info>.*)$/u;

function extractBlocks(file: string): readonly MermaidBlock[] {
  const blocks: MermaidBlock[] = [];
  let open:
    | { marker: string; line: number; isMermaid: boolean; body: string[] }
    | undefined;
  const lines = readFileSync(file, "utf8").split(/\r?\n/u);
  for (const [index, content] of lines.entries()) {
    const groups = FENCE.exec(content)?.groups;
    if (open === undefined) {
      if (groups !== undefined) {
        const { info = "", marker = "" } = groups;
        open = {
          body: [],
          isMermaid: info.trim().split(/\s+/u)[0] === "mermaid",
          line: index + 1,
          marker,
        };
      }
    } else if (
      groups !== undefined &&
      (groups.info ?? "").trim() === "" &&
      groups.marker?.[0] === open.marker[0] &&
      (groups.marker?.length ?? 0) >= open.marker.length
    ) {
      if (open.isMermaid) {
        blocks.push({ file, line: open.line, text: open.body.join("\n") });
      }
      open = undefined;
    } else {
      open.body.push(content);
    }
  }
  return blocks;
}

const files = execFileSync("git", ["ls-files", "-z", "--", "*.md"], {
  encoding: "utf8",
})
  .split("\0")
  .filter((file) => file !== "");

const blocks = files.flatMap(extractBlocks);

// Mermaid reads `window` when first loaded, so the shim must exist before the import runs.
const { window } = new JSDOM("");
const shimTarget: Record<string, unknown> = globalThis;
shimTarget.window = window;
shimTarget.document = window.document;
const { default: mermaid } = await import("mermaid");

const failures = await Promise.all(
  blocks.map(async (block) => {
    try {
      await mermaid.parse(block.text);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `${block.file}:${String(block.line)}: Mermaid parse error in block starting here\n${message}\n`;
    }
  }),
);

const errors = failures.filter((failure) => failure !== undefined);
if (errors.length > 0) {
  process.stderr.write(errors.join("\n"));
  process.exitCode = 1;
} else {
  const fileCount = new Set(blocks.map((block) => block.file)).size;
  process.stdout.write(
    `Checked ${String(blocks.length)} Mermaid block(s) in ${String(fileCount)} file(s).\n`,
  );
}

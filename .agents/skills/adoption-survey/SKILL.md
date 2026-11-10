---
name: adoption-survey
description: Use when surveying consuming repositories for generic helpers effect-extras could adopt, or reviewing whether such a survey covered its claimed areas.
---

# Helper-adoption survey

Apply [What belongs here](../../../docs/development/what-belongs-here.md) and
[FP mindset](../../../docs/development/fp-mindset.md) to candidates. This procedure proves coverage
of a survey's claimed areas; it does not change the admission test or require surveys on other tasks.

## Pin the survey basis

Record the repository identity (URL), full commit SHA, and exact directories/packages surveyed.
Expand directory patterns into concrete repository-relative paths at that revision. Record the
effect-extras revision supplying this recipe, the exact inventory command, and its tool versions.
Retain the inventory output with the survey so a reviewer can rerun it and compare entries.

Run from an effect-extras checkout with its declared dependencies installed. Copy the TypeScript
block below to the ignored scratch file `.agent-ops/list-adoption-functions.ts`, then run:

```sh
pnpm exec tsx .agent-ops/list-adoption-functions.ts <repository-path> <commit-sha> <area>...
```

An area is a concrete directory or file path, or `.` for the whole repository; not a glob. The
command reads Git trees and blobs at the pinned revision, never source from the working tree. It
parses JS/TS, including JSX/TSX and module variants, traversing all scopes without export, generic,
indentation, or filename filters. Tests, components, and tracked generated files are included.

The inventory deliberately includes a conservative superset: all variable bindings, imports,
properties, and assignment targets can hold functions, including aliases and factory/`dual(...)`
results. Explicitly skip non-functions after inspection. Named declarations/expressions, nested
functions, methods, accessors, and destructured bindings retain distinct source positions. Anonymous
callbacks without a binding are part of the separate manual sweep.

```ts
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import ts from "typescript";

const require = createRequire(import.meta.url);
const [repositoryPath, requestedRevision, ...requestedAreas] =
  process.argv.slice(2);
if (!repositoryPath || !requestedRevision || requestedAreas.length === 0) {
  throw new Error("Expected <repository-path> <commit-sha> <area>...");
}
const repository = resolve(repositoryPath);
const git = (...args: string[]) =>
  execFileSync("git", args, {
    cwd: repository,
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
  });
if (!/^[a-f0-9]{40}$/.test(requestedRevision)) {
  throw new Error("Supply a full commit SHA");
}
const revision = git(
  "rev-parse",
  "--verify",
  `${requestedRevision}^{commit}`,
).trim();
const areas = [...new Set(requestedAreas)].sort();
for (const area of areas) {
  if (
    area !== "." &&
    (area.startsWith("/") ||
      area
        .split("/")
        .some(
          (part) =>
            part === "" ||
            part === "." ||
            part === ".." ||
            /[*?\[\]\\]/.test(part),
        ))
  ) {
    throw new Error(`Use a concrete repository-relative path: ${area}`);
  }
}
const entries: {
  repository: string;
  path: string;
  line: number;
  column: number;
  name: string;
  kind: string;
}[] = [];
const issues: { path: string; reason: string }[] = [];
const unparsed: string[] = [];
const matched = new Set<string>();
const tree = git("ls-tree", "-r", "-z", "--full-tree", revision).split("\0");
for (const item of tree.filter(Boolean)) {
  const tab = item.indexOf("\t");
  const [mode, type, oid] = item.slice(0, tab).split(" ");
  const path = item.slice(tab + 1);
  const containingAreas = areas.filter(
    (area) => area === "." || path === area || path.startsWith(`${area}/`),
  );
  if (containingAreas.length === 0) continue;
  containingAreas.forEach((area) => matched.add(area));
  if (type !== "blob" || mode === "120000") {
    issues.push({
      path,
      reason: "Submodule or symlink: enumerate its source separately",
    });
    continue;
  }
  if (!/\.(?:[cm]?[jt]s|[jt]sx)$/i.test(path)) {
    unparsed.push(path);
    continue;
  }
  try {
    const source = ts.createSourceFile(
      path,
      git("cat-file", "blob", oid),
      ts.ScriptTarget.Latest,
      true,
    );
    const options = {
      noResolve: true,
      noLib: true,
      allowJs: true,
      jsx: ts.JsxEmit.Preserve,
    };
    const host = ts.createCompilerHost(options);
    host.getSourceFile = (name) => (name === path ? source : undefined);
    const program = ts.createProgram([path], options, host);
    const diagnostics = program.getSyntacticDiagnostics(source);
    if (diagnostics.length > 0) {
      for (const diagnostic of diagnostics) {
        issues.push({
          path,
          reason: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
        });
      }
      continue;
    }
    const add = (node: ts.Node, name: string) => {
      const position = source.getLineAndCharacterOfPosition(
        node.getStart(source),
      );
      entries.push({
        repository,
        path,
        line: position.line + 1,
        column: position.character + 1,
        name,
        kind: ts.SyntaxKind[node.kind],
      });
    };
    const binding = (name: ts.BindingName) => {
      if (ts.isIdentifier(name)) add(name, name.text);
      else
        for (const element of name.elements) {
          if (ts.isBindingElement(element)) binding(element.name);
        }
    };
    const assignment = (node: ts.Expression) => {
      if (ts.isObjectLiteralExpression(node)) {
        for (const property of node.properties) {
          if (ts.isPropertyAssignment(property))
            assignment(property.initializer);
          else if (ts.isShorthandPropertyAssignment(property))
            add(property.name, property.name.text);
          else if (ts.isSpreadAssignment(property))
            assignment(property.expression);
        }
      } else if (ts.isArrayLiteralExpression(node)) {
        node.elements.forEach(assignment);
      } else if (
        ts.isSpreadElement(node) ||
        ts.isParenthesizedExpression(node)
      ) {
        assignment(node.expression);
      } else if (
        ts.isBinaryExpression(node) &&
        node.operatorToken.kind === ts.SyntaxKind.EqualsToken
      ) {
        assignment(node.left);
      } else if (!ts.isOmittedExpression(node)) {
        add(node, node.getText(source));
      }
    };
    const visit = (node: ts.Node) => {
      if (
        (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) &&
        node.name
      ) {
        add(node, node.name.text);
      } else if (ts.isVariableDeclaration(node) || ts.isParameter(node)) {
        // Parameters can bind callbacks or carry function-valued defaults, too.
        binding(node.name);
      } else if (
        ts.isMethodDeclaration(node) ||
        ts.isMethodSignature(node) ||
        ts.isGetAccessorDeclaration(node) ||
        ts.isSetAccessorDeclaration(node) ||
        ts.isPropertyDeclaration(node) ||
        ts.isPropertySignature(node) ||
        ts.isPropertyAssignment(node) ||
        ts.isShorthandPropertyAssignment(node)
      ) {
        add(node, node.name.getText(source));
      } else if (ts.isConstructorDeclaration(node)) {
        add(node, "constructor");
      } else if (
        ts.isBinaryExpression(node) &&
        node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
        node.operatorToken.kind <= ts.SyntaxKind.LastAssignment
      ) {
        assignment(node.left);
      } else if (
        ts.isImportSpecifier(node) ||
        ts.isNamespaceImport(node) ||
        ts.isImportEqualsDeclaration(node) ||
        (ts.isImportClause(node) && node.name)
      ) {
        if (node.name) add(node, node.name.text);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  } catch (error) {
    issues.push({ path, reason: String(error) });
  }
}
for (const area of areas) {
  if (!matched.has(area))
    issues.push({
      path: area,
      reason: "Area has no tracked files at this revision",
    });
}
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
entries.sort(
  (a, b) =>
    compare(a.path, b.path) ||
    a.line - b.line ||
    a.column - b.column ||
    compare(a.name, b.name) ||
    compare(a.kind, b.kind),
);
issues.sort((a, b) => compare(a.path, b.path) || compare(a.reason, b.reason));
console.log(
  JSON.stringify(
    {
      repository,
      revision,
      areas,
      tools: {
        node: process.version,
        git: git("--version").trim(),
        typescript: ts.version,
        tsx: require("tsx/package.json").version,
      },
      entries,
      issues,
      unparsed: unparsed.sort(compare),
    },
    null,
    2,
  ),
);
if (issues.length > 0) process.exitCode = 1;
```

Use the recorded repository URL together with each entry's path, line, column, name, and kind as its
identity; the output's repository path identifies the local checkout. Duplicate names must not be
merged away. Source positions are tied to the recorded commit. Retain the recipe unchanged or record
any adaptation in full alongside its invocation and versions.

## Close the inventory before claiming an area swept

Resolve every reported issue. Review every `unparsed` path: record non-source assets as such, and
enumerate unsupported source formats (for example Vue, Svelte, or MDX) with a suitable recorded
command and tool version at the same revision. An unreadable file, parse failure, unsupported source
format, or missing area prevents completeness until its named functions are enumerated successfully.
A regex restricted to generic declarations is not a completeness check.

Give **every inventory entry** a recorded outcome in the survey:

- **Adopted** — link its candidate row.
- **Rejected** — link its row and one of the established reasons: domain rules, reimplements Effect
  control flow, already in Effect, too thin a wrapper, or too narrow.
- **Skipped** — give a one-line reason, such as “domain-shaped by name” or “non-function binding.”

Equivalent helpers can share one candidate row, but every original entry must retain its mapping.
Reconcile the inventory identities against those mappings: list entries with no outcome and require
that list to be empty. Removing one mapping must leave an unresolved entry. **Any unclassified entry
fails the completeness check.** An area may be called **swept** only after enumeration succeeds and
every entry has an outcome. Narrow the claimed area accurately rather than silently excluding tests,
components, generated functions, or inconvenient files within it.

Record inline `pipe` chains, anonymous lambdas, and other unnamed transformations as a **separate
manual sweep**, with its paths, search method, and findings. Never fold that manual work into the
mechanically swept claim; the inventory proves named-symbol coverage, not discovery of every possible
transformation.

## Record usage evidence

For each candidate, record actual production invocations and equivalent inline occurrences at the
pinned revisions, including their paths and enclosing symbols (or source positions for top-level
uses). Report invocation and inline-occurrence counts separately, plus distinct file and repository
totals. Definitions, imports, and re-exports are not calls; test-only uses are not production calls.
Follow the canonical [graduation evidence](../../../docs/development/what-belongs-here.md#graduation-evidence):
React/Next and other component callers count normally. Their presence does not make the helper
framework-dependent. Explain the independence and usefulness of the uses instead of treating counts
as an admission quota.

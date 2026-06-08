import { describe, expect, test } from "vitest";
import {
  asDirlike,
  asFilelike,
  fromPathString,
  isAbsoluteDirlikePath,
  isAbsoluteFilelikePath,
  isAbsolutePath,
  isDirlikePath,
  isFilelikePath,
  isRelativeDownDirlikePath,
  isRelativeDownFilelikePath,
  isRelativeDownPath,
  isRelativePath,
  isRelativeUpDirlikePath,
  isRelativeUpFilelikePath,
  isRelativeUpPath,
  join,
  joinTo,
  joinWith,
  thisDirectory,
  toPathString,
  up,
} from "./PathX.js";

describe("PathX", () => {
  // ---------------------------------------------------------------------------
  // fromPathString / toPathString round-trip
  // ---------------------------------------------------------------------------

  describe("fromPathString", () => {
    test("absolute filelike path", () => {
      const p = fromPathString("/usr/local/bin/node");
      expect(p.rootType).toBe("absolute");
      expect(p.leafType).toBe("filelike");
      expect(p.path).toBe("/usr/local/bin/node");
    });

    test("absolute dirlike path (trailing separator)", () => {
      const p = fromPathString("/usr/local/");
      expect(p.rootType).toBe("absolute");
      expect(p.leafType).toBe("dirlike");
    });

    test("relative-down filelike path", () => {
      const p = fromPathString("src/index.ts");
      expect(p.rootType).toBe("relative-down");
      expect(p.leafType).toBe("filelike");
    });

    test("relative-down dirlike path", () => {
      const p = fromPathString("src/");
      expect(p.rootType).toBe("relative-down");
      expect(p.leafType).toBe("dirlike");
    });

    test("relative-up filelike path", () => {
      const p = fromPathString("../config.json");
      expect(p.rootType).toBe("relative-up");
      expect(p.leafType).toBe("filelike");
    });

    test("relative-up dirlike path", () => {
      const p = fromPathString("../");
      expect(p.rootType).toBe("relative-up");
      expect(p.leafType).toBe("dirlike");
    });

    test("normalises redundant segments", () => {
      const p = fromPathString("/usr//local/../local/bin/");
      expect(p.rootType).toBe("absolute");
      expect(p.leafType).toBe("dirlike");
      expect(p.path).toBe("/usr/local/bin/");
    });

    test("toPathString round-trips the stored path", () => {
      const raw = "../config/";
      expect(toPathString(fromPathString(raw))).toBe("../config/");
    });
  });

  // ---------------------------------------------------------------------------
  // Root-type predicates
  // ---------------------------------------------------------------------------

  describe("root-type predicates", () => {
    const absolute = fromPathString("/foo");
    const relativeUp = fromPathString("../foo");
    const relativeDown = fromPathString("foo/bar");

    test("isAbsolutePath", () => {
      expect(isAbsolutePath(absolute)).toBe(true);
      expect(isAbsolutePath(relativeUp)).toBe(false);
      expect(isAbsolutePath(relativeDown)).toBe(false);
    });

    test("isRelativeUpPath", () => {
      expect(isRelativeUpPath(absolute)).toBe(false);
      expect(isRelativeUpPath(relativeUp)).toBe(true);
      expect(isRelativeUpPath(relativeDown)).toBe(false);
    });

    test("isRelativeDownPath", () => {
      expect(isRelativeDownPath(absolute)).toBe(false);
      expect(isRelativeDownPath(relativeUp)).toBe(false);
      expect(isRelativeDownPath(relativeDown)).toBe(true);
    });

    test("isRelativePath covers both up and down", () => {
      expect(isRelativePath(absolute)).toBe(false);
      expect(isRelativePath(relativeUp)).toBe(true);
      expect(isRelativePath(relativeDown)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Leaf-type predicates
  // ---------------------------------------------------------------------------

  describe("leaf-type predicates", () => {
    const directoryLike = fromPathString("/usr/");
    const fileLike = fromPathString("/usr/local");

    test("isDirlikePath", () => {
      expect(isDirlikePath(directoryLike)).toBe(true);
      expect(isDirlikePath(fileLike)).toBe(false);
    });

    test("isFilelikePath", () => {
      expect(isFilelikePath(directoryLike)).toBe(false);
      expect(isFilelikePath(fileLike)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Combined predicates
  // ---------------------------------------------------------------------------

  describe("combined predicates", () => {
    const absoluteDirectory = fromPathString("/usr/");
    const absoluteFile = fromPathString("/usr/local");
    const upDirectory = fromPathString("../");
    const upFile = fromPathString("../foo.ts");
    const downDirectory = fromPathString("src/");
    const downFile = fromPathString("src/index.ts");

    test("isAbsoluteDirlikePath", () => {
      expect(isAbsoluteDirlikePath(absoluteDirectory)).toBe(true);
      expect(isAbsoluteDirlikePath(absoluteFile)).toBe(false);
      expect(isAbsoluteDirlikePath(upDirectory)).toBe(false);
    });

    test("isAbsoluteFilelikePath", () => {
      expect(isAbsoluteFilelikePath(absoluteFile)).toBe(true);
      expect(isAbsoluteFilelikePath(absoluteDirectory)).toBe(false);
    });

    test("isRelativeUpDirlikePath", () => {
      expect(isRelativeUpDirlikePath(upDirectory)).toBe(true);
      expect(isRelativeUpDirlikePath(upFile)).toBe(false);
      expect(isRelativeUpDirlikePath(absoluteDirectory)).toBe(false);
    });

    test("isRelativeUpFilelikePath", () => {
      expect(isRelativeUpFilelikePath(upFile)).toBe(true);
      expect(isRelativeUpFilelikePath(upDirectory)).toBe(false);
    });

    test("isRelativeDownDirlikePath", () => {
      expect(isRelativeDownDirlikePath(downDirectory)).toBe(true);
      expect(isRelativeDownDirlikePath(downFile)).toBe(false);
      expect(isRelativeDownDirlikePath(upDirectory)).toBe(false);
    });

    test("isRelativeDownFilelikePath", () => {
      expect(isRelativeDownFilelikePath(downFile)).toBe(true);
      expect(isRelativeDownFilelikePath(downDirectory)).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // asDirlike / asFilelike
  // ---------------------------------------------------------------------------

  describe("asDirlike", () => {
    test("leaves a dirlike path unchanged", () => {
      const p = fromPathString("/usr/");
      expect(asDirlike(p).path).toBe("/usr/");
    });

    test("appends separator to a filelike path", () => {
      const p = fromPathString("/usr/local");
      const converted = asDirlike(p);
      expect(converted.leafType).toBe("dirlike");
      expect(converted.rootType).toBe("absolute");
    });

    test("preserves root type for relative-up", () => {
      const p = fromPathString("../foo");
      const converted = asDirlike(p);
      expect(converted.leafType).toBe("dirlike");
      expect(converted.rootType).toBe("relative-up");
    });

    test("preserves root type for relative-down", () => {
      const p = fromPathString("src/index.ts");
      const converted = asDirlike(p);
      expect(converted.leafType).toBe("dirlike");
      expect(converted.rootType).toBe("relative-down");
    });
  });

  describe("asFilelike", () => {
    test("leaves a filelike path unchanged", () => {
      const p = fromPathString("/usr/local");
      expect(asFilelike(p).path).toBe("/usr/local");
    });

    test("removes separator from a dirlike path", () => {
      const p = fromPathString("/usr/");
      const converted = asFilelike(p);
      expect(converted.leafType).toBe("filelike");
      expect(converted.rootType).toBe("absolute");
    });

    test("preserves root type for relative-up", () => {
      const p = fromPathString("../");
      const converted = asFilelike(p);
      expect(converted.leafType).toBe("filelike");
      expect(converted.rootType).toBe("relative-up");
    });

    test("preserves root type for relative-down", () => {
      const p = fromPathString("src/");
      const converted = asFilelike(p);
      expect(converted.leafType).toBe("filelike");
      expect(converted.rootType).toBe("relative-down");
    });
  });

  // ---------------------------------------------------------------------------
  // join / joinWith / joinTo
  // ---------------------------------------------------------------------------

  describe("join", () => {
    test("joins absolute directory with relative-down file", () => {
      const base = fromPathString("/usr/local/");
      const relativePath = fromPathString("bin/node");
      expect(join(base, relativePath).path).toBe("/usr/local/bin/node");
    });

    test("joinWith is the data-last curried form", () => {
      const appendBin = joinWith(fromPathString("bin/"));
      expect(appendBin(fromPathString("/usr/local/")).path).toBe(
        "/usr/local/bin/",
      );
    });

    test("joinTo is the flipped curried form", () => {
      const prependBase = joinTo(fromPathString("/usr/local/"));
      expect(prependBase(fromPathString("bin/node")).path).toBe(
        "/usr/local/bin/node",
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Named constants
  // ---------------------------------------------------------------------------

  describe("named constants", () => {
    test("up is RelativeUpDirlikePath", () => {
      expect(isRelativeUpDirlikePath(up)).toBe(true);
      expect(up.path.startsWith("..")).toBe(true);
      expect(up.leafType).toBe("dirlike");
    });

    test("thisDirectory is RelativeDownDirlikePath", () => {
      expect(isRelativeDownDirlikePath(thisDirectory)).toBe(true);
      expect(thisDirectory.leafType).toBe("dirlike");
      expect(thisDirectory.rootType).toBe("relative-down");
    });
  });
});

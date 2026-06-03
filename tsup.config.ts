import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  // Tsup's .d.ts build (rollup-plugin-dts) injects `baseUrl`, which TypeScript 6.x
  // flags as deprecated (TS5101, slated for removal in 7.0). Scope the suppression
  // to just the dts build, so tsconfig.base.json and the typecheck configs stay
  // clean — `pnpm tc` does not trip this deprecation.
  dts: {
    compilerOptions: {
      ignoreDeprecations: "6.0",
    },
  },
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: "es2023",
});

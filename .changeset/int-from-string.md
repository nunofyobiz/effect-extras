---
"@nunofyobiz/effect-extras": minor
---

Add `SchemaX.IntFromString`: a `Schema` that decodes a numeric string to a JS `number` but fails loudly when the value isn't a safe integer, instead of silently rounding it.

`Schema.NumberFromString` has no range guard, so a string past `Number.MAX_SAFE_INTEGER` — e.g. a Postgres `int8` column, which node-postgres returns as a string — decodes to a silently-rounded number (`Number("9223372036854775807")` is `9223372036854776000`). `IntFromString` composes `NumberFromString` with Effect's built-in `Schema.isInt` (which is `Number.isSafeInteger`), so any value that can't be represented exactly fails decoding rather than corrupting data; encoding writes a `number` back as a decimal string. Being an integer guard, it also rejects fractional strings.

import { BigInt, Option } from "effect";

export const toNumberOrThrow = (value: bigint): number =>
  BigInt.toNumber(value).pipe(
    Option.getOrThrowWith(
      () => new Error(`Value ${value} is outside safe integer range`),
    ),
  );

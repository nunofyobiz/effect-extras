import { Data, Effect, Option, Predicate, Struct, pipe } from "effect";
import { constUndefined, identity } from "effect/Function";

export type These<L, R> = Data.TaggedEnum<{
  LeftOnly: {
    readonly left: L;
  };

  RightOnly: {
    readonly right: R;
  };

  LeftAndRight: {
    readonly left: L;
    readonly right: R;
  };
}>;
export type LeftOnly<L> = These<L, never> & {
  _tag: "LeftOnly";
};
export type RightOnly<R> = These<never, R> & {
  _tag: "RightOnly";
};
export type LeftAndRight<L, R> = These<L, R> & {
  _tag: "LeftAndRight";
};
export type WithLeft<L, R> = LeftOnly<L> | LeftAndRight<L, R>;
export type WithRight<L, R> = RightOnly<R> | LeftAndRight<L, R>;

interface TheseDefinition extends Data.TaggedEnum.WithGenerics<2> {
  readonly taggedEnum: These<this["A"], this["B"]>;
}

export const {
  LeftOnly,
  RightOnly,
  LeftAndRight,
  $is: is,
  $match: match,
} = Data.taggedEnum<TheseDefinition>();

export const WithLeft = <L, R>({
  left,
  right,
}: {
  left: L;
  right?: R | undefined;
}): WithLeft<L, R> =>
  Predicate.isNotNullish(right)
    ? LeftAndRight({ left, right })
    : LeftOnly({ left });

export const WithRight = <L, R>({
  left,
  right,
}: {
  left?: L | undefined;
  right: R;
}): WithRight<L, R> =>
  Predicate.isNotNullish(left)
    ? LeftAndRight({ left, right })
    : RightOnly({ right });

export const optionFromNullables = <L, R>({
  left,
  right,
}: {
  left?: L | null | undefined;
  right?: R | null | undefined;
}): Option.Option<These<L, R>> => {
  if (Predicate.isNotNullish(left) && Predicate.isNotNullish(right)) {
    return Option.some(LeftAndRight({ left, right }));
  }
  if (Predicate.isNotNullish(left)) {
    return Option.some(LeftOnly({ left }));
  }
  if (Predicate.isNotNullish(right)) {
    return Option.some(RightOnly({ right }));
  }
  return Option.none();
};

export const fromNullables = <L, R>({
  left,
  right,
  orElse = () => {
    throw new Error("Both left and right are nullable");
  },
}: {
  left?: L | null | undefined;
  right?: R | null | undefined;
  orElse?: () => These<L, R>;
}): These<L, R> =>
  pipe(optionFromNullables({ left, right }), Option.getOrElse(orElse));

export const matchLeft =
  <L, R, A>({
    Left,
    RightOnly,
  }: {
    Left: (left: L) => A;
    RightOnly: (right: R) => A;
  }) =>
  (these: These<L, R>): A =>
    pipe(
      these,

      match({
        LeftOnly: ({ left }) => Left(left),
        RightOnly: ({ right }) => RightOnly(right),
        LeftAndRight: ({ left }) => Left(left),
      }),

      // Make Typescript happy
      (a) => a as A,
    );

export const matchRight =
  <L, R, A>({
    LeftOnly,
    Right,
  }: {
    LeftOnly: (left: L) => A;
    Right: (right: R) => A;
  }) =>
  (these: These<L, R>): A =>
    pipe(
      these,

      match({
        LeftOnly: ({ left }) => LeftOnly(left),
        RightOnly: ({ right }) => Right(right),
        LeftAndRight: ({ right }) => Right(right),
      }),

      // Make Typescript happy
      (a) => a as A,
    );

export const orElse = <L2, R2>({
  orElseLeft,
  orElseRight,
}: {
  orElseLeft: () => L2;
  orElseRight: () => R2;
}): (<L, R>(these: These<L, R>) => LeftAndRight<L | L2, R | R2>) =>
  match({
    LeftOnly: ({ left }) => LeftAndRight({ left, right: orElseRight() }),
    RightOnly: ({ right }) => LeftAndRight({ left: orElseLeft(), right }),
    LeftAndRight: ({ left, right }) => LeftAndRight({ left, right }),
  });

export const orUndefined = orElse({
  orElseLeft: () => undefined,
  orElseRight: () => undefined,
});

export const leftOrElse =
  <A>(orElseReturn: () => A) =>
  <L, R>(these: These<L, R>): L | A =>
    pipe(
      these,
      orElse({
        orElseLeft: orElseReturn,
        orElseRight: constUndefined,
      }),
      Struct.get("left"),
    );

export const leftOrUndefined = leftOrElse(() => undefined);

export const rightOrElse =
  <A>(orElseReturn: () => A) =>
  <L, R>(these: These<L, R>): R | A =>
    pipe(
      these,
      orElse({
        orElseLeft: constUndefined,
        orElseRight: orElseReturn,
      }),
      Struct.get("right"),
    );

export const rightOrUndefined = rightOrElse(() => undefined);

export const rightOption = <L, R>(these: These<L, R>): Option.Option<R> =>
  pipe(
    these,
    matchRight({
      LeftOnly: () => Option.none(),
      Right: Option.some,
    }),
  );

export const leftOption = <L, R>(these: These<L, R>): Option.Option<L> =>
  pipe(
    these,
    matchLeft({
      Left: Option.some,
      RightOnly: () => Option.none(),
    }),
  );

export const mapBoth = <L1, R1, L2, R2>({
  mapLeft,
  mapRight,
}: {
  mapLeft: (left: L1) => L2;
  mapRight: (right: R1) => R2;
}): ((these: These<L1, R1>) => These<L2, R2>) =>
  match({
    LeftOnly: ({ left }) => LeftOnly({ left: mapLeft(left) }),
    RightOnly: ({ right }) => RightOnly({ right: mapRight(right) }),
    LeftAndRight: ({ left, right }) =>
      LeftAndRight({ left: mapLeft(left), right: mapRight(right) }),
  });

export const mapBothEffect = <L1, R1, L2, R2, EL, ER, RL, RR>({
  mapLeft,
  mapRight,
}: {
  mapLeft: (left: L1) => Effect.Effect<L2, EL, RL>;
  mapRight: (right: R1) => Effect.Effect<R2, ER, RR>;
}): ((
  these: These<L1, R1>,
) => Effect.Effect<These<L2, R2>, EL | ER, RL | RR>) =>
  match({
    LeftOnly: ({ left }) =>
      pipe(
        mapLeft(left),
        Effect.map((left2) => LeftOnly({ left: left2 })),
      ),

    RightOnly: ({ right }) =>
      pipe(
        mapRight(right),
        Effect.map((right2) => RightOnly({ right: right2 })),
      ),

    LeftAndRight: ({ left, right }) =>
      pipe(
        Effect.all({ left: mapLeft(left), right: mapRight(right) }),
        Effect.map(({ left: left2, right: right2 }) =>
          LeftAndRight({ left: left2, right: right2 }),
        ),
      ),
  });

export const mapLeft = <L1, L2>(
  mapLeft: (left: L1) => L2,
): (<R>(these: These<L1, R>) => These<L2, R>) =>
  mapBoth({ mapLeft, mapRight: identity });

export const flatMapLeft = <L1, L2, R2>(
  mapLeft: (left: L1) => These<L2, R2>,
): (<R1>(these: These<L1, R1>) => These<L2, R1 | R2>) =>
  match({
    LeftOnly: ({ left }) => mapLeft(left),
    RightOnly: ({ right }) => RightOnly({ right }),
    LeftAndRight: ({ left }) => mapLeft(left),
  });

export const mapLeftEffect = <L1, L2, EL, RL>(
  mapLeft: (left: L1) => Effect.Effect<L2, EL, RL>,
): (<R>(these: These<L1, R>) => Effect.Effect<These<L2, R>, EL, RL>) =>
  mapBothEffect({ mapLeft, mapRight: Effect.succeed });

export const flatMapLeftEffect = <L1, L2, R2, EL, RL>(
  mapLeft: (left: L1) => Effect.Effect<These<L2, R2>, EL, RL>,
): (<R1>(these: These<L1, R1>) => Effect.Effect<These<L2, R1 | R2>, EL, RL>) =>
  match({
    LeftOnly: ({ left }) => mapLeft(left),
    RightOnly: ({ right }) => Effect.succeed(RightOnly({ right })),
    LeftAndRight: ({ left }) => mapLeft(left),
  });

export const mapRight = <R1, R2>(
  mapRight: (right: R1) => R2,
): (<L>(these: These<L, R1>) => These<L, R2>) =>
  mapBoth({ mapLeft: identity, mapRight });

export const flatMapRight = <L2, R1, R2>(
  mapRight: (right: R1) => These<L2, R2>,
): (<L1>(these: These<L1, R1>) => These<L1 | L2, R2>) =>
  match({
    LeftOnly: ({ left }) => LeftOnly({ left }),
    RightOnly: ({ right }) => mapRight(right),
    LeftAndRight: ({ right }) => mapRight(right),
  });

export const mapRightEffect = <R1, R2, ER, RR>(
  mapRight: (right: R1) => Effect.Effect<R2, ER, RR>,
): (<L>(these: These<L, R1>) => Effect.Effect<These<L, R2>, ER, RR>) =>
  mapBothEffect({ mapLeft: Effect.succeed, mapRight });

export const flatMapRightEffect = <L2, R1, R2, ER, RR>(
  mapRight: (right: R1) => Effect.Effect<These<L2, R2>, ER, RR>,
): (<L1>(these: These<L1, R1>) => Effect.Effect<These<L1 | L2, R2>, ER, RR>) =>
  match({
    LeftOnly: ({ left }) => Effect.succeed(LeftOnly({ left })),
    RightOnly: ({ right }) => mapRight(right),
    LeftAndRight: ({ right }) => mapRight(right),
  });

import { Decision } from "@effect/core/io/Schedule/Decision"
import { Interval } from "@effect/core/io/Schedule/Interval"
import { makeWithState } from "@effect/core/io/Schedule/operations/_internal/makeWithState"

/**
 * A schedule that divides the timeline to `interval`-long windows, and sleeps
 * until the nearest window boundary every time it recurs.
 *
 * For example, `windowed(Duration.seconds(10))` would produce a schedule as
 * follows:
 *
 * ```text
 *      10s        10s        10s       10s
 * |----------|----------|----------|----------|
 * |action------|sleep---|act|-sleep|action----|
 * ```
 *
 * @tsplus static effect/core/io/Schedule.Ops windowed
 */
export function windowed(
  interval: Duration
): Schedule<Tuple<[Maybe<number>, number]>, never, unknown, number> {
  const millis = interval.millis
  return makeWithState(
    Tuple(Maybe.emptyOf(), 0),
    (now, input, { tuple: [option, n] }) =>
      Effect.sync(
        option.fold(
          () =>
            Tuple(
              Tuple(Maybe.some(now), n + 1),
              n,
              Decision.Continue(Interval.after(now + millis))
            ),
          (startMillis) =>
            Tuple(
              Tuple(Maybe.some(startMillis), n + 1),
              n,
              Decision.Continue(
                Interval.after(now + (millis - ((now - startMillis) % millis)))
              )
            )
        )
      )
  )
}

// tracing: off

import { pipe } from "../Function"
import * as O from "../Option"
import * as catchAll from "./catchAll"
import type { Effect } from "./effect"
import { fail } from "./fail"

/**
 * Returns an effect that will produce the value of this effect, unless it
 * fails with the `None` value, in which case it will produce the value of
 * the specified effect.
 *
 * @dataFirst orElseOptional_
 */
export function orElseOptional<R2, E2, A2>(
  that: () => Effect<R2, O.Option<E2>, A2>,
  __trace?: string
) {
  return <R, E, A>(self: Effect<R, O.Option<E>, A>) =>
    orElseOptional_(self, that, __trace)
}

/**
 * Returns an effect that will produce the value of this effect, unless it
 * fails with the `None` value, in which case it will produce the value of
 * the specified effect.
 */
export function orElseOptional_<R, E, A, R2, E2, A2>(
  self: Effect<R, O.Option<E>, A>,
  that: () => Effect<R2, O.Option<E2>, A2>,
  __trace?: string
): Effect<R & R2, O.Option<E | E2>, A | A2> {
  return pipe(
    self,
    catchAll.catchAll<R2, O.Option<E | E2>, O.Option<E | E2>, A2>(
      O.fold(that, (x) => pipe(x, O.some, fail)),
      __trace
    )
  )
}
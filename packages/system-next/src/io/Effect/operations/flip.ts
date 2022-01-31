import type { Effect } from "../definition"
import { failNow } from "./failNow"
import { foldEffect_ } from "./foldEffect"
import { succeedNow } from "./succeedNow"

/**
 * Returns an effect that swaps the error/success cases. This allows you to
 * use all methods on the error channel, possibly before flipping back.
 *
 * @tsplus fluent ets/Effect flip
 */
export function flip<R, E, A>(
  self: Effect<R, E, A>,
  __etsTrace?: string
): Effect<R, A, E> {
  return foldEffect_(self, succeedNow, failNow)
}

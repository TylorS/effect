import { Option } from "../../../data/Option"
import { Effect } from "../definition"

/**
 * Filters the collection in parallel using the specified effectual predicate.
 * See `filter` for a sequential version of it.
 *
 * @tsplus static ets/EffectOps filterPar
 */
export function filterPar_<A, R, E>(
  as: Iterable<A>,
  f: (a: A) => Effect<R, E, boolean>,
  __etsTrace?: string
) {
  return Effect.forEachPar(as, (a) =>
    f(a).map((b) => (b ? Option.some(a) : Option.none))
  ).map((chunk) => chunk.compact())
}

/**
 * Filters the collection in parallel using the specified effectual predicate.
 * See `filter` for a sequential version of it.
 *
 * @ets_data_first filterPar_
 */
export function filterPar<A, R, E>(
  f: (a: A) => Effect<R, E, boolean>,
  __etsTrace?: string
) {
  return (as: Iterable<A>) => Effect.filterPar(as, f)
}

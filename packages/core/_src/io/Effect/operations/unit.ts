/**
 * An effect that succeeds with a unit value.
 *
 * @tsplus static effect/core/io/Effect.Ops unit
 */
export const unit: Effect<never, never, void> = Effect.succeed(undefined)

/**
 * An effect that succeeds with a unit value.
 *
 * @tsplus static effect/core/io/Effect.Ops unitTraced
 */
export function unitTraced(__tsplusTrace?: string): Effect<never, never, void> {
  return Effect.succeed(undefined)
}

/**
 * Ignores the result of the effect replacing it with a void
 *
 * @tsplus getter effect/core/io/Effect unit
 */
export function unit_<R, E, X>(self: Effect<R, E, X>, __tsplusTrace?: string): Effect<R, E, void> {
  return self > Effect.unit
}

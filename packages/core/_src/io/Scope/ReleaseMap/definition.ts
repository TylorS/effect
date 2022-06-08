import type { State } from "@effect/core/io/Scope/ReleaseMap/_internal/State"

/**
 * A `ReleaseMap` represents the finalizers associated with a scope.
 *
 * The design of `ReleaseMap` is inspired by ResourceT, written by Michael
 * Snoyman @snoyberg.
 *
 * For mor information, see: https://github.com/snoyberg/conduit/blob/master/resourcet/Control/Monad/Trans/Resource/Internal.hs
 *
 * @tsplus type ets/ReleaseMap
 * @tsplus companion ets/ReleaseMap/Ops
 */
export class ReleaseMap {
  constructor(readonly ref: Ref<State>) {}
}

/**
 * @tsplus static ets/ReleaseMap/Ops __call
 */
export function apply(ref: Ref<State>): ReleaseMap {
  return new ReleaseMap(ref)
}
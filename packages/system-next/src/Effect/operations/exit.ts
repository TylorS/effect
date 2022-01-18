import type { Exit } from "../../Exit/definition"
import { failCause } from "../../Exit/operations/failCause"
import { succeed } from "../../Exit/operations/succeed"
import type { Effect, RIO } from "../definition"
import { IFold } from "../definition"
import { succeedNow } from "./succeedNow"

/**
 * Returns an effect that semantically runs the effect on a fiber, producing
 * an `Exit` for the completion value of the fiber.
 */
export function exit<R, E, A>(
  self: Effect<R, E, A>,
  __trace?: string
): RIO<R, Exit<E, A>> {
  return new IFold(
    self,
    (cause) => succeedNow(failCause(cause)),
    (success) => succeedNow(succeed(success)),
    __trace
  )
}
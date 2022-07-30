import { Driver } from "@effect/core/io/Schedule/Driver"

/**
 * Returns a driver that can be used to step the schedule, appropriately
 * handling sleeping.
 *
 * @tsplus getter effect/core/io/Schedule driver
 */
export function driver<State, Env, In, Out>(
  self: Schedule<State, Env, In, Out>
): Effect<never, never, Driver<State, Env, In, Out>> {
  return Ref.make<Tuple<[Maybe<Out>, State]>>(Tuple(Maybe.none, self._initial)).map((ref) => {
    const last: Effect<never, NoSuchElement, Out> = ref.get().flatMap(({ tuple: [element, _] }) =>
      element.fold(Effect.failSync(new NoSuchElement()), (out) => Effect.sync(out))
    )

    const reset: Effect<never, never, void> = ref.set(Tuple(Maybe.none, self._initial))

    const state: Effect<never, never, State> = ref.get().map((tuple) => tuple.get(1))

    return new Driver(next(self, ref), last, reset, state)
  })
}

function next<State, Env, In, Out>(
  self: Schedule<State, Env, In, Out>,
  ref: Ref<Tuple<[Maybe<Out>, State]>>
) {
  return (input: In): Effect<Env, Maybe<never>, Out> =>
    Effect.Do()
      .bind("state", () => ref.get().map((tuple) => tuple.get(1)))
      .bind("now", () => Clock.currentTime)
      .bind("decision", ({ now, state }) => self._step(now, input, state))
      .flatMap(({ now, decision: { tuple: [state, out, decision] } }) =>
        decision._tag === "Done"
          ? ref.set(Tuple(Maybe.some(out), state)) > Effect.failSync(Maybe.none)
          : ref.set(Tuple(Maybe.some(out), state)) >
            Effect.sleep(new Duration(decision.interval.startMillis - now)).as(out)
      )
}

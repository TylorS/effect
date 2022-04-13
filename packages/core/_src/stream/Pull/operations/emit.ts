/**
 * @tsplus static ets/Pull/Ops emit
 */
export function emit<A>(a: A, __tsplusTrace?: string): UIO<Chunk<A>> {
  return Effect.succeed(Chunk.single(a));
}
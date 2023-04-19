import * as Either from "@effect/data/Either"
import { identity, pipe } from "@effect/data/Function"
import * as Effect from "@effect/io/Effect"
import type { RpcEncodeFailure, RpcNotFound } from "@effect/rpc/Error"
import type { RpcRequest, RpcResponse } from "@effect/rpc/Resolver"
import type {
  RpcRequestSchema,
  RpcSchema,
  RpcService,
} from "@effect/rpc/Schema"
import type {
  RpcHandler,
  RpcHandlers,
  RpcRouter,
  RpcUndecodedClient,
} from "@effect/rpc/Server"
import * as codec from "@effect/rpc/internal/codec"
import { inputEncodeMap, methodCodecs } from "@effect/rpc/internal/schema"
import * as Schema from "@effect/schema/Schema"
import * as Tracer from "@effect/io/Tracer"

const schemaHandlersMap = <H extends RpcHandlers>(
  handlers: H,
  prefix = "",
): Record<string, RpcHandler.Any> =>
  Object.entries(handlers).reduce((acc, [method, definition]) => {
    if ("handlers" in definition) {
      return {
        ...acc,
        ...schemaHandlersMap(definition.handlers, `${prefix}${method}.`),
      }
    }
    return { ...acc, [`${prefix}${method}`]: definition }
  }, {})

const encodeResponse = Schema.encode(
  Schema.either(
    Schema.unknown,
    Schema.unknown,
  ) as unknown as Schema.Schema<RpcResponse>,
)

/** @internal */
export const handleSingleRequest = <R extends RpcRouter.Base>(
  router: R,
): ((
  request: RpcRequest.Fields,
) => Effect.Effect<
  Exclude<RpcHandlers.Services<R["handlers"]>, Tracer.Span>,
  never,
  RpcResponse
>) => {
  const codecsMap = methodCodecs(router.schema)
  const handlerMap = schemaHandlersMap(router.handlers)

  return (request) =>
    pipe(
      Either.Do(),
      Either.bind("codecs", () =>
        Either.fromNullable(
          codecsMap[request._tag],
          (): RpcNotFound => ({
            _tag: "RpcNotFound",
            method: request._tag,
          }),
        ),
      ),
      Either.bind("handler", () =>
        Either.fromNullable(
          handlerMap[request._tag],
          (): RpcNotFound => ({
            _tag: "RpcNotFound",
            method: request._tag,
          }),
        ),
      ),
      Either.bind("input", ({ codecs }) =>
        codecs.input ? codecs.input(request.input) : Either.right(null),
      ),
      Either.map(({ codecs, handler, input }) => {
        const effect: Effect.Effect<any, unknown, unknown> = Effect.isEffect(
          handler,
        )
          ? handler
          : (handler as any)(input)

        return pipe(
          effect,
          Effect.map(codecs.output),
          Effect.catchAll((_) =>
            Effect.succeed(Either.flatMap(codecs.error(_), Either.left)),
          ),
        )
      }),
      Either.match((_) => Effect.succeed(Either.left(_)), identity as any),
      Effect.map(encodeResponse),
      Tracer.withSpan(`${router.options.spanPrefix}.${request._tag}`, {
        parent: {
          _tag: "ExternalSpan",
          name: request.spanName,
          spanId: request.spanId,
          traceId: request.traceId,
        },
      }),
    )
}

/** @internal */
export const router = <
  S extends RpcService.DefinitionWithId,
  H extends RpcHandlers.FromService<S>,
>(
  schema: S,
  handlers: H,
  optionsPartial: Partial<RpcRouter.Options> = {},
): RpcRouter<S, H> => {
  const options: RpcRouter.Options = {
    spanPrefix: optionsPartial.spanPrefix ?? "RpcServer",
  }
  return {
    schema,
    handlers,
    undecoded: makeUndecodedClient(schema, handlers, options),
    options,
  }
}

/** @internal */
export const handler = <R extends RpcRouter.Base>(
  router: R,
): ((
  requests: unknown,
) => Effect.Effect<
  Exclude<RpcHandlers.Services<R["handlers"]>, Tracer.Span>,
  never,
  ReadonlyArray<RpcResponse>
>) => {
  const handler = handleSingleRequest(router)

  return (u) =>
    Array.isArray(u)
      ? Effect.allPar(u.map(handler))
      : Effect.die(new Error("expected an array of requests"))
}

/** @internal */
export const handlerRaw = <R extends RpcRouter.Base>(router: R) => {
  const handlerMap = schemaHandlersMap(router.handlers)
  const inputEncoders = inputEncodeMap(router.schema)

  return <Req extends RpcRequestSchema.To<R["schema"]>>(
    request: Req,
  ): Req extends { _tag: infer M }
    ? RpcHandler.FromMethod<R["handlers"], M, Tracer.Span, RpcEncodeFailure>
    : never => {
    const handler = handlerMap[(request as RpcRequest)._tag]
    if (Effect.isEffect(handler)) {
      return handler as any
    }

    return Effect.flatMap(
      inputEncoders[(request as RpcRequest)._tag](
        (request as RpcRequest).input,
      ),
      handler as any,
    ) as any
  }
}

/** @internal */
export const makeUndecodedClient = <
  S extends RpcService.DefinitionWithId,
  H extends RpcHandlers.FromService<S>,
>(
  schemas: S,
  handlers: H,
  options: RpcRouter.Options,
): RpcUndecodedClient<H> =>
  Object.entries(handlers as RpcHandlers).reduce(
    (acc, [method, definition]) => {
      if ("handlers" in definition) {
        return {
          ...acc,
          [method]: makeUndecodedClient(
            schemas[method] as any,
            definition.handlers as any,
            options,
          ),
        }
      }

      const schema = schemas[method] as RpcSchema.Any

      if (Effect.isEffect(definition)) {
        return {
          ...acc,
          [method]: pipe(
            definition,
            Effect.flatMap(codec.encode(schema.output)),
            Tracer.withSpan(`${options.spanPrefix}.undecoded.${method}`),
          ),
        }
      }

      const decodeInput = codec.decodeEffect(Schema.to((schema as any).input))
      const encodeOutput = codec.encode(schema.output)

      return {
        ...acc,
        [method]: (input: unknown) =>
          pipe(
            decodeInput(input),
            Effect.flatMap(definition as RpcHandler.IO<any, any, any, any>),
            Effect.flatMap(encodeOutput),
            Tracer.withSpan(`${options.spanPrefix}.undecoded.${method}`),
          ),
      }
    },
    {} as any,
  )
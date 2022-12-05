import * as Json from "@fp-ts/schema/data/Json"
import * as P from "@fp-ts/schema/Pretty"
import * as Util from "@fp-ts/schema/test/util"

describe("Json", () => {
  const schema = Json.Schema

  it("id", () => {
    expect(Json.id).exist
  })

  it("Provider", () => {
    expect(Json.Provider).exist
  })

  it("property tests", () => {
    Util.property(schema)
  })

  it("Pretty", () => {
    const pretty = P.prettyFor(schema)
    expect(pretty.pretty({ a: [1, true] })).toEqual("{\"a\":[1,true]}")
  })
})
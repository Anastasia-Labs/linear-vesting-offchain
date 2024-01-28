import {Data} from "effect"
export class NoUTXOsInScriptError {
  readonly _tag = "NoUTXOsInScriptError";
}
export class MissingDatumError {
  readonly _tag = "NoUTXOsInScriptError";
}

export class InvalidDatumError {
  readonly _tag = "InvalidDatumError";
}

export class TransactionError extends Data.TaggedError("TransactionError")<{
  message: string
}> {}


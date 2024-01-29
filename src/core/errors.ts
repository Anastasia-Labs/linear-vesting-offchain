import { Data } from "effect";
export class NoUTXOsInScriptError {
  readonly _tag = "NoUTXOsInScriptError";
}
export class NoUTXOsInWallet {
  readonly _tag = "NoUTXOsInScriptError";
}
export class MissingDatumError {
  readonly _tag = "NoUTXOsInScriptError";
}

export class InvalidDatumError {
  readonly _tag = "InvalidDatumError";
}

export class FromAddressError extends Data.TaggedError("FromAddressError")<{
  message: string;
}> {}

export class TransactionError extends Data.TaggedError("TransactionError")<{
  message: string;
}> {}

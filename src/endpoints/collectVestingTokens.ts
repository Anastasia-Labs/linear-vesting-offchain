import {
  Data,
  Lucid,
  SpendingValidator,
  toUnit,
} from "@anastasia-labs/lucid-cardano-fork";
import { divCeil, safeParseDatum, toAddress } from "../core/utils/utils.js";
import { CollectPartialConfig, CollectPartialScripts } from "../core/types.js";
import { VestingRedeemer, VestingDatum } from "../core/contract.types.js";
import { TIME_TOLERANCE_MS } from "../index.js";
import { Effect } from "effect";
import { TransactionError } from "../core/errors.js";

export const collectVestingTokens =
  (scripts: CollectPartialScripts) =>
  (lucid: Lucid) =>
  (config: CollectPartialConfig) => {
    const program = Effect.gen(function* ($) {
      config.currentTime ??= Date.now();
      const vestingValidator: SpendingValidator = {
        type: "PlutusV2",
        script: scripts.vesting,
      };
      const vestingValidatorAddress =
        lucid.utils.validatorToAddress(vestingValidator);

      const [vestedUTXO] = yield* $(
        Effect.fromNullable(
          yield* $(
            Effect.promise(() => lucid.utxosByOutRef([config.vestingOutRef]))
          )
        )
      );
      const datum = yield* $(safeParseDatum(vestedUTXO.datum, VestingDatum));

      const vestingPeriodLength =
        datum.vestingPeriodEnd - datum.vestingPeriodStart;

      datum.vestingPeriodEnd - datum.vestingPeriodStart;

      const vestingTimeRemaining =
        datum.vestingPeriodEnd - BigInt(config.currentTime);
      // console.log("vestingTimeRemaining", vestingTimeRemaining);

      const timeBetweenTwoInstallments = divCeil(
        vestingPeriodLength,
        datum.totalInstallments
      );
      // console.log("timeBetweenTwoInstallments", timeBetweenTwoInstallments);

      const futureInstallments = divCeil(
        vestingTimeRemaining,
        timeBetweenTwoInstallments
      );
      // console.log("futureInstallments", futureInstallments);

      const expectedRemainingQty = divCeil(
        futureInstallments * datum.totalVestingQty,
        datum.totalInstallments
      );
      // console.log("expectedRemainingQty", expectedRemainingQty);

      const vestingTokenUnit = datum.assetClass.symbol
        ? toUnit(datum.assetClass.symbol, datum.assetClass.name)
        : "lovelace";
      // console.log("vestingTokenUnit", vestingTokenUnit)

      const vestingTokenAmount =
        vestingTimeRemaining < 0n
          ? vestedUTXO.assets[vestingTokenUnit]
          : vestedUTXO.assets[vestingTokenUnit] - expectedRemainingQty;
      // console.log("vestingTokenAmount", vestingTokenAmount);

      const beneficiaryAddress = toAddress(datum.beneficiary, lucid);

      const vestingRedeemer =
        vestingTimeRemaining < 0n
          ? Data.to("FullUnlock", VestingRedeemer)
          : Data.to("PartialUnlock", VestingRedeemer);

      const upperBound = Number(config.currentTime + TIME_TOLERANCE_MS);
      const lowerBound = Number(config.currentTime - TIME_TOLERANCE_MS);

      return yield* $(
        Effect.tryPromise({
          try: () => {
            if (vestingTimeRemaining < 0n) {
              const tx = lucid
                .newTx()
                .collectFrom([vestedUTXO], vestingRedeemer)
                .attachSpendingValidator(vestingValidator)
                .payToAddress(beneficiaryAddress, {
                  [vestingTokenUnit]: vestingTokenAmount,
                })
                .addSigner(beneficiaryAddress)
                .validFrom(lowerBound)
                .validTo(upperBound)
                .complete();
              return tx;
            } else {
              const tx = lucid
                .newTx()
                .collectFrom([vestedUTXO], vestingRedeemer)
                .attachSpendingValidator(vestingValidator)
                .payToAddress(beneficiaryAddress, {
                  [vestingTokenUnit]: vestingTokenAmount,
                })
                .payToContract(
                  vestingValidatorAddress,
                  { inline: Data.to(datum, VestingDatum) },
                  { [vestingTokenUnit]: expectedRemainingQty }
                )
                .addSigner(beneficiaryAddress)
                .validFrom(lowerBound)
                .validTo(upperBound)
                .complete();
              return tx;
            }
          },
          catch: (e) => new TransactionError({ message: String(e) }),
        })
      );
    });
    return {
      program : () => program,
      build: () => program.pipe(Effect.either, Effect.runPromise),
      unsafeBuild: () => program.pipe(Effect.runPromise)
    };
  };

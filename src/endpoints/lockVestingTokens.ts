import {
  Lucid,
  SpendingValidator,
  Data,
  toUnit,
} from "@anastasia-labs/lucid-cardano-fork";
import { fromAddress } from "../core/utils/utils.js";
import { LockTokensConfig, LockTokensScripts } from "../core/types.js";
import { VestingDatum } from "../core/contract.types.js";
import {
  PROTOCOL_FEE,
  PROTOCOL_PAYMENT_KEY,
  PROTOCOL_STAKE_KEY,
} from "../index.js";
import { Effect, pipe } from "effect";
import {
  FromAddressError,
  NoUTXOsInWallet,
  TransactionError,
} from "../core/errors.js";

export const lockTokens =
  (scripts: LockTokensScripts) =>
  (lucid: Lucid) =>
  (config: LockTokensConfig) => {
    const program = Effect.gen(function* ($) {
      const walletUtxos = yield* $(
        Effect.promise(() => lucid.wallet.getUtxos())
      );
      if (!walletUtxos.length) yield* $(Effect.fail(new NoUTXOsInWallet()));

      const vestingValidator: SpendingValidator = {
        type: "PlutusV2",
        script: scripts.vesting,
      };
      const validatorAddress = lucid.utils.validatorToAddress(vestingValidator);

      const safeBeneficiary = yield* $(
        Effect.try({
          try: () => fromAddress(config.beneficiary),
          catch: (error) => new FromAddressError({ message: String(error) }),
        })
      );

      const datum = Data.to(
        {
          beneficiary: safeBeneficiary,
          assetClass: {
            symbol: config.vestingAsset.policyId,
            name: config.vestingAsset.tokenName,
          },
          totalVestingQty: BigInt(
            config.totalVestingQty - config.totalVestingQty * PROTOCOL_FEE
          ),
          vestingPeriodStart: BigInt(config.vestingPeriodStart),
          vestingPeriodEnd: BigInt(config.vestingPeriodEnd),
          firstUnlockPossibleAfter: BigInt(config.firstUnlockPossibleAfter),
          totalInstallments: BigInt(config.totalInstallments),
        },
        VestingDatum
      );

      const unit = config.vestingAsset.policyId
        ? toUnit(config.vestingAsset.policyId, config.vestingAsset.tokenName)
        : "lovelace";

      return yield* $(
        Effect.tryPromise({
          try: () => {
            const tx = lucid
              .newTx()
              .collectFrom(walletUtxos)
              .payToContract(
                validatorAddress,
                { inline: datum },
                {
                  [unit]: BigInt(
                    config.totalVestingQty -
                      config.totalVestingQty * PROTOCOL_FEE
                  ),
                }
              )
              .payToAddress(
                lucid.utils.credentialToAddress(
                  lucid.utils.keyHashToCredential(PROTOCOL_PAYMENT_KEY),
                  lucid.utils.keyHashToCredential(PROTOCOL_STAKE_KEY)
                ),
                {
                  [unit]: BigInt(config.totalVestingQty * PROTOCOL_FEE),
                }
              )
              .complete();
            return tx;
          },
          catch: (e) => new TransactionError({ message: String(e) }),
        })
      );
    });
    return {
      program: () => program,
      build: () => pipe(program, Effect.either, Effect.runPromise),
      unsafeBuild: () => pipe(program, Effect.runPromise),
    };
  };

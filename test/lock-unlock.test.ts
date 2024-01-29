import {
  Emulator,
  generateAccountSeedPhrase,
  Lucid,
  toUnit,
  TWENTY_FOUR_HOURS_MS,
} from "../src/index.js";
import { beforeEach, expect, test } from "vitest";
import { Contract } from "../src/endpoints/Contract.js";
import { pipe } from "effect";
import { Effect, Either } from "effect";

type LucidContext = {
  lucid: Lucid;
  users: Awaited<ReturnType<typeof Contract.withLucid>>[];
  emulator: Emulator;
};

//NOTE: INITIALIZE EMULATOR + ACCOUNTS
beforeEach<LucidContext>(async (context) => {
  const accounts = [
    await generateAccountSeedPhrase({
      lovelace: BigInt(100_000_000),
      [toUnit(
        "2c04fa26b36a376440b0615a7cdf1a0c2df061df89c8c055e2650505",
        "63425443"
      )]: BigInt(100_00_000_000),
    }),
    await generateAccountSeedPhrase({
      lovelace: BigInt(100_000_000),
    }),
    await generateAccountSeedPhrase({
      lovelace: BigInt(100_000_000),
    }),
    await generateAccountSeedPhrase({
      lovelace: BigInt(100_000_000),
    }),
    await generateAccountSeedPhrase({
      lovelace: BigInt(100_000_000),
    }),
  ];

  context.emulator = new Emulator(accounts);

  context.lucid = await Lucid.new(context.emulator);

  context.users = await Promise.all(
    accounts.map(async (account) => {
      return Contract.withLucid(
        (await Lucid.new(context.emulator)).selectWalletFromSeed(
          account.seedPhrase
        )
      );
    })
  );
});

test<LucidContext>("Test - LockTokens, Unlock Tokens", async ({
  lucid,
  users,
  emulator,
}) => {
  const tx0 = await pipe(
    users[0]
      .lockTokens({
        beneficiary: await users[1].lucid.wallet.address(),
        vestingAsset: {
          policyId: "2c04fa26b36a376440b0615a7cdf1a0c2df061df89c8c055e2650505",
          tokenName: "63425443",
        },
        totalVestingQty: 10_000_000,
        vestingPeriodStart: emulator.now(),
        vestingPeriodEnd: emulator.now() + TWENTY_FOUR_HOURS_MS,
        firstUnlockPossibleAfter: emulator.now(),
        totalInstallments: 4,
      })
      .program(),
    Effect.andThen((tx) => Effect.promise(() => tx.sign().complete())),
    Effect.andThen((tx) => Effect.promise(() => tx.submit())),
    Effect.either,
    Effect.runPromise
  );
  expect(Either.isRight(tx0)).toBe(true);

  // //NOTE: INSTALLMENT 1
  emulator.awaitBlock(1080);

  // emulator.awaitBlock(10);
  // console.log(
  //   await pipe(
  //     users[1]
  //       .collectVestingTokens({
  //         vestingOutRef: (await users[1].getVestedTokens())[0].outRef,
  //         currentTime: emulator.now(),
  //       })
  //       .unsafeBuild()
  //   )
  // );

  emulator.awaitBlock(1080);
  const tx1 = await pipe(
    users[1]
      .collectVestingTokens({
        vestingOutRef: (await users[1].getVestedTokens())[0].outRef,
        currentTime: emulator.now(),
      })
      .program(),
    Effect.andThen((tx) => Effect.promise(() => tx.sign().complete())),
    Effect.andThen((tx) => Effect.promise(() => tx.submit())),
    Effect.either,
    Effect.runPromise
  );
  expect(Either.isRight(tx1)).toBe(true);

  emulator.awaitBlock(1081);

  const tx2 = await pipe(
    users[1]
      .collectVestingTokens({
        vestingOutRef: (await users[1].getVestedTokens())[0].outRef,
        currentTime: emulator.now(),
      })
      .program(),
    Effect.andThen((tx) => Effect.promise(() => tx.sign().complete())),
    Effect.andThen((tx) => Effect.promise(() => tx.submit())),
    Effect.either,
    Effect.runPromise
  );
  expect(Either.isRight(tx2)).toBe(true);

  emulator.awaitBlock(1080);
  const tx3 = await pipe(
    users[1]
      .collectVestingTokens({
        vestingOutRef: (await users[1].getVestedTokens())[0].outRef,
        currentTime: emulator.now(),
      })
      .program(),
    Effect.andThen((tx) => Effect.promise(() => tx.sign().complete())),
    Effect.andThen((tx) => Effect.promise(() => tx.submit())),
    Effect.either,
    Effect.runPromise
  );
  expect(Either.isRight(tx3)).toBe(true);

  emulator.awaitBlock(10);

  console.log(await users[1].lucid.wallet.getUtxos());

  // expect(await users[1].getScriptUTxOs()).toStrictEqual([]);
  // console.log("utxos at wallet", await lucid.utxosAt(users.account2.address));
  // console.log(
  //   "utxos at protocol wallet",
  //   await lucid.utxosAt(
  //     lucid.utils.credentialToAddress(
  //       lucid.utils.keyHashToCredential(PROTOCOL_PAYMENT_KEY),
  //       lucid.utils.keyHashToCredential(PROTOCOL_STAKE_KEY)
  //     )
  //   )
  // );
});

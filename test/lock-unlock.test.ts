import {
  Emulator,
  generateAccountSeedPhrase,
  Lucid,
  toUnit,
  TWENTY_FOUR_HOURS_MS,
} from "../src/index.js";
import { beforeEach, expect, test } from "vitest";
import { Contract } from "../src/endpoints/Contract.js";

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
  users,
  emulator,
}) => {
  const lockVestingUnSigned = await users[0]
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
    .build();

  expect(lockVestingUnSigned.type).toBe("ok");
  if (lockVestingUnSigned.type == "ok") {
    await (await lockVestingUnSigned.data.sign().complete()).submit();
  }

  //NOTE: INSTALLMENT 1
  emulator.awaitBlock(1080);

  const utxosAtVesting1 = await users[1].getVestedTokens();
  // console.log("utxosAtVesting1", utxosAtVesting1);
  // console.log("utxos at wallet", await lucid.utxosAt(users.account2.address));
  // console.log("INSTALLMENT 1");

  const collectPartialUnsigned1 = await users[1]
    .collectVestingTokens({
      vestingOutRef: utxosAtVesting1[0].outRef,
      currentTime: emulator.now(),
    })
    .build();

  // console.log(collectPartialUnsigned1);
  expect(collectPartialUnsigned1.type).toBe("ok");

  if (collectPartialUnsigned1.type == "error") return;
  // console.log(tx.data.txComplete.to_json())
  await (await collectPartialUnsigned1.data.sign().complete()).submit();

  //NOTE: INSTALLMENT 2
  emulator.awaitBlock(1080);

  const utxosAtVesting2 = await users[1].getVestedTokens();
  // console.log("utxosAtVesting2", utxosAtVesting2);

  // console.log("utxos at wallet", await lucid.utxosAt(users.account2.address));
  // console.log("INSTALLMENT 2");

  const collectPartialUnsigned2 = await users[1]
    .collectVestingTokens({
      vestingOutRef: utxosAtVesting2[0].outRef,
      currentTime: emulator.now(),
    })
    .build();

  // console.log(collectPartialUnsigned);
  expect(collectPartialUnsigned2.type).toBe("ok");

  if (collectPartialUnsigned2.type == "error") return;
  // console.log(tx.data.txComplete.to_json())
  await (await collectPartialUnsigned2.data.sign().complete()).submit();

  //NOTE: INSTALLMENT 3
  emulator.awaitBlock(1080);

  const utxosAtVesting3 = await users[1].getVestedTokens();
  // console.log("utxosAtVesting3", utxosAtVesting3);

  // console.log("utxos at wallet", await lucid.utxosAt(users.account2.address));
  // console.log("INSTALLMENT 3");

  const collectPartialUnsigned3 = await users[1]
    .collectVestingTokens({
      vestingOutRef: utxosAtVesting3[0].outRef,
      currentTime: emulator.now(),
    })
    .build();

  // console.log(collectPartialUnsigned);
  expect(collectPartialUnsigned3.type).toBe("ok");

  if (collectPartialUnsigned3.type == "error") return;
  // console.log(tx.data.txComplete.to_json())
  await (await collectPartialUnsigned3.data.sign().complete()).submit();

  //NOTE: INSTALLMENT 4
  emulator.awaitBlock(1081);

  const utxosAtVesting4 = await users[1].getVestedTokens();
  // console.log("utxosAtVesting4", utxosAtVesting4);

  // console.log("utxos at wallet", await lucid.utxosAt(users.account2.address));
  // console.log("INSTALLMENT 4");

  const collectPartialUnsigned4 = await users[1]
    .collectVestingTokens({
      vestingOutRef: utxosAtVesting4[0].outRef,
      currentTime: emulator.now(),
    })
    .build();

  // console.log(collectPartialUnsigned4);
  expect(collectPartialUnsigned4.type).toBe("ok");
  if (collectPartialUnsigned4.type == "error") return;
  // console.log(tx.data.txComplete.to_json())
  await (await collectPartialUnsigned4.data.sign().complete()).submit();

  emulator.awaitBlock(180);

  // console.log(
  //   "utxosAtVesting",
  //   await parseUTxOsAtScript(lucid, linearVesting.cborHex, VestingDatum)
  // );
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

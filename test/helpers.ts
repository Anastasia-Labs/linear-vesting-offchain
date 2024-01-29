import { expect } from "vitest";
import { Emulator, Result, TxComplete } from "../src";
import { Contract } from "../src/endpoints/Contract";
import { pipe } from "effect";

export const submitAction = async (tx: Result<TxComplete>) => {
  expect(tx.type).toBe("ok");
  if (tx.type === "ok") {
    return await (await tx.data.sign().complete()).submit();
  }
};

export const collectAction = async (
  user: Awaited<ReturnType<typeof Contract.withLucid>>,
  emulator: Emulator
) =>
  pipe(
    await user
      .collectVestingTokens({
        vestingOutRef: (await user.getVestedTokens())[0].outRef,
        currentTime: emulator.now(),
      })
      .build(),
    submitAction
  );

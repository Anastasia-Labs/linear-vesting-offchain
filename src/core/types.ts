import { Address, Assets, OutRef } from "@anastasia-labs/lucid-cardano-fork"

export type CborHex = string;
export type RawHex = string;
export type POSIXTime = number;

export type Result<T> =
  | { type: "ok"; data: T }
  | { type: "error"; error: Error };

export type Either<L, R> =
  | { type: "left"; value: L }
  | { type: "right"; value: R };

export type AssetClass = {
  policyId: string;
  tokenName: string;
};

export type ContractConfig = {
    vesting : CborHex
}

export type LockTokensScripts = Pick<ContractConfig,"vesting">

export type LockTokensConfig = {
  beneficiary: Address;
  vestingAsset: AssetClass;
  totalVestingQty: number;
  vestingPeriodStart: POSIXTime;
  vestingPeriodEnd: POSIXTime;
  firstUnlockPossibleAfter: POSIXTime;
  totalInstallments: number;
};

export type CollectPartialScripts = Pick<ContractConfig, "vesting">

export type CollectPartialConfig = {
  vestingOutRef: OutRef;
  currentTime?: POSIXTime;
};

export type ReadableUTxO<T> = {
  outRef: OutRef;
  datum: T;
  assets: Assets;
};

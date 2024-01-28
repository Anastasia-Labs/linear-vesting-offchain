import {
  ContractConfig,
  LockTokensConfig,
  Lucid,
  Result,
  TxComplete,
  VestingDatum,
  collectVestingTokens,
  getVestingByAddress,
  lockTokens,
  parseUTxOsAtScript,
} from "../index.js";
import linearVesting from "../../test/linearVesting.json" assert { type: "json" };

export const withMesh = (_scripts: ContractConfig) => (mesh: string) => {
  return {
    lockTokens: () => {
      console.log("Implement lockTokens");
    },
    collectVestingTokens: () => {
      console.log("Implement collectVestingTokens");
    },
    getVestedTokens: () => {
      console.log("Implement getVestedTokens");
    },
    mesh: mesh,
  };
};
// //NOTE: add generic function signatures
// type ContractActions = {
//   lock: (config: LockTokensConfig) => {
//     build: () => Promise<Result<TxComplete>>;
//   };
//   collect: (config: LockTokensConfig) => {
//     build: () => Promise<Result<TxComplete>>;
//   };
//   getVestedTokens: () => 
// };
export const withLucid = (scripts: ContractConfig) => async (lucid: Lucid) => {
  const userAddress = await lucid.wallet.address();
  //TODO: add object freeze or a better immutable function
  return {
    lockTokens: lockTokens(scripts)(lucid),
    collectVestingTokens: collectVestingTokens(scripts)(lucid),
    getVestedTokens: () =>
      getVestingByAddress(lucid, userAddress, scripts.vesting),
    lucid: lucid,
    getScriptUTxOs: () =>
      parseUTxOsAtScript(lucid, scripts.vesting, VestingDatum),
  };
};

export const createContract = (config: ContractConfig) => {
  return {
    withLucid: withLucid(config),
    withMesh: withMesh(config),
    getConfig: () => config,
  };
};

export const Contract = createContract({
  vesting: linearVesting.cborHex,
});

import {
  ContractConfig,
  Lucid,
  collectVestingTokens,
  getVestingByAddress,
  lockTokens,
} from "../index.js";
import linearVesting from "../../test/linearVesting.json" assert { type: "json" };

export const withMesh = (_scripts: ContractConfig) => (mesh: string) => {
  return {
    lockTokens: () => {
      console.log("Implement lockTokens" )
    },
    collectVestingTokens: 
    () =>{
      console.log("Implement collectVestingTokens");
    },
    getVestedTokens: () =>{
      console.log("Implement getVestedTokens");
    },
    mesh: mesh,
  };
};
export const withLucid = (scripts: ContractConfig) => async (lucid: Lucid) => {
  const userAddress = await lucid.wallet.address();
  return {
    lockTokens: lockTokens(scripts)(lucid),
    collectVestingTokens: collectVestingTokens(scripts)(lucid),
    getVestedTokens: () =>
      getVestingByAddress(lucid, userAddress, scripts.vesting),
    lucid: lucid
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


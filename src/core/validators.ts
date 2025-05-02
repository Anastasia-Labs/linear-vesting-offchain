import { SpendingValidator } from "@lucid-evolution/lucid";
import linearVesting from "../uplc/linearVesting.json" with { type: "json" };

export const vestingValidator: SpendingValidator = {
  type: "PlutusV2",
  script: linearVesting.cborHex,
};

import { MockUSDC } from "@event_ticketing/abi-types";
import type { Eip1193Provider } from "ethers";
declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }

  type ERC20 = MockUSDC;
}

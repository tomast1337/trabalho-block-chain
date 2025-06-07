import type { Eip1193Provider } from "ethers";
declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }

  interface ERC20 {
    balanceOf(owner: string): Promise<bigint>;
    transfer(to: string, amount: bigint): Promise<boolean>;
    approve(spender: string, amount: bigint): Promise<boolean>;
    allowance(owner: string, spender: string): Promise<bigint>;
    transferFrom(from: string, to: string, amount: bigint): Promise<boolean>;
  }
}

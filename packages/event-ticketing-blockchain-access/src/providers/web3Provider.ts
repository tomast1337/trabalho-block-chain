import { BrowserProvider, JsonRpcSigner } from "ethers";

let provider: BrowserProvider | null = null;
let signer: JsonRpcSigner | null = null;

export async function initWeb3Provider() {
  if (!window.ethereum) throw new Error("No Ethereum provider found");

  provider = new BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  return { provider, signer };
}

export function getProvider() {
  if (!provider) throw new Error("Provider not initialized");
  return provider;
}

export function getSigner() {
  if (!signer) throw new Error("Signer not initialized");
  return signer;
}

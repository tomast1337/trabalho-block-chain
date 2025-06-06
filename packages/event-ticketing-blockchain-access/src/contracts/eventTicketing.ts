import {
  EventTicketing,
  EventTicketing__factory,
} from "@event_ticketing/abi-types";
import { getSigner } from "../providers/web3Provider";
import { ethers } from "ethers";

// Default address for local development
const CONTRACT_ADDRESS = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";
// USDT contract address (replace with actual USDT address for each network)
const USDT_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

export async function getEventTicketingContract(): Promise<EventTicketing> {
  const signer = await getSigner();
  if (!signer) {
    throw new Error("Signer is not available");
  }

  const contract = EventTicketing__factory.connect(CONTRACT_ADDRESS, signer);
  return contract;
}

// Additional function to get USDT contract instance
export async function getUsdtContract(): Promise<ERC20> {
  const signer = await getSigner();
  if (!signer) {
    throw new Error("Signer is not available");
  }

  // ERC20 ABI - you might want to import this from a shared location
  const erc20Abi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  ];

  return new ethers.Contract(
    USDT_ADDRESS,
    erc20Abi,
    signer
  ) as unknown as ERC20;
}

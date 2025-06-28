import {
  EventTicketing,
  EventTicketing__factory,
  MockUSDC as ERC20,
} from "@event_ticketing/abi-types";
import { getSigner } from "../providers/web3Provider";
import { ethers, Signer } from "ethers";

// USDC contract address (replace with actual USDC address for each network)
const USDC_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
// Default address for local development
const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

export async function getEventTicketingContract(
  signer: Signer
): Promise<EventTicketing> {
  if (!signer) {
    throw new Error("Signer is not available");
  }

  const contract = EventTicketing__factory.connect(CONTRACT_ADDRESS, signer);
  return contract;
}

// Additional function to get USDC contract instance
export async function getUsdcContract(signer: Signer): Promise<ERC20> {
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
    USDC_ADDRESS,
    erc20Abi,
    signer
  ) as unknown as ERC20;
}

export async function cancelEvent(signer: Signer, eventId: bigint) {
  const contract = await getEventTicketingContract(signer);
  const tx = await contract.cancelEvent(eventId);
  await tx.wait();
}

export async function refundTicket(signer: Signer, eventId: bigint) {
  const contract = await getEventTicketingContract(signer);
  const tx = await contract.refundTicket(eventId);
  await tx.wait();
}

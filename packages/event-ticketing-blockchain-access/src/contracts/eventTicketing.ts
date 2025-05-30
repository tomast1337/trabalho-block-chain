import { Contract } from "ethers";
import { EventTicketing } from "@abi-types/EventTicketing";
import { getSigner } from "../providers/web3Provider";

const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export async function getEventTicketingContract(): Promise<EventTicketing> {
  const signer = await getSigner();
  return new Contract(
    CONTRACT_ADDRESS,
    EventTicketing.abi,
    signer
  ) as unknown as EventTicketing;
}

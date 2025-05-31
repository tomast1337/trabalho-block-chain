import {
  EventTicketing,
  EventTicketing__factory,
} from "@event_ticketing/abi-types";
import { getSigner } from "../providers/web3Provider";

const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Default address for local development

export async function getEventTicketingContract(): Promise<EventTicketing> {
  const signer = await getSigner();
  if (!signer) {
    throw new Error("Signer is not available");
  }

  const contract = EventTicketing__factory.connect(CONTRACT_ADDRESS, signer);

  return contract;
}

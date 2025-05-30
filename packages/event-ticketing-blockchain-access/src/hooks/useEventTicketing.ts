import { useEffect, useState } from "react";
import { EventTicketing } from "@abi-types/EventTicketing";
import { getEventTicketingContract } from "../contracts/eventTicketing";

export function useEventTicketing() {
  const [contract, setContract] = useState<EventTicketing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadContract() {
      try {
        const contract = await getEventTicketingContract();
        setContract(contract);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to load contract")
        );
      } finally {
        setLoading(false);
      }
    }

    loadContract();
  }, []);

  return { contract, loading, error };
}

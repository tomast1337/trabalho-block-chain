export const About: React.FC = () => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl w-full text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-primary">
          About This Project
        </h1>

        <div className="bg-primary-foreground shadow-accent-foreground rounded-lg p-6 space-y-6">
          <p className="text-lg text-primary">
            Welcome to our Decentralized Event Ticketing Platform! This project
            is a full-stack decentralized application (dApp) that leverages
            blockchain technology to create a transparent, secure, and
            peer-to-peer marketplace for event tickets.
          </p>

          <div>
            <h2 className="text-2xl font-semibold mb-3 text-primary0">
              Core Features
            </h2>
            <ul className="list-disc list-inside space-y-2 text-primary">
              <li>
                <span className="font-semibold">For Organizers:</span> Anyone
                can create and manage events. Set the event name, date, ticket
                price in USDC, and the total number of tickets. After the event,
                organizers can securely withdraw the funds.
              </li>
              <li>
                <span className="font-semibold">For Attendees:</span> Browse
                available events and purchase tickets seamlessly using USDC
                stablecoin. Your wallet address becomes your proof of ownership.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3 text-primary">
              Technology Stack
            </h2>
            <p className="text-primary">
              This platform is built using a modern and robust set of tools:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-primary">
              <li>
                <span className="font-semibold">Smart Contracts:</span> Solidity
                for the core logic, deployed on an Ethereum-compatible network
                using the Hardhat development environment.
              </li>
              <li>
                <span className="font-semibold">Frontend:</span> A responsive
                user interface built with React, Vite, TypeScript, and styled
                with Tailwind CSS & shadcn/ui.
              </li>
              <li>
                <span className="font-semibold">Blockchain Interaction:</span>{" "}
                Ethers.js to connect the frontend with the smart contracts,
                enabling seamless and secure transactions.
              </li>
            </ul>
          </div>
          <p className="text-md text-secondary-foreground pt-4 border-t border-secondary-foreground">
            This project showcases a practical application of blockchain, aiming
            to reduce fees, eliminate intermediaries, and empower both
            organizers and attendees in the event industry.
          </p>
          <p className="text-md text-secondary-foreground">
            For more details, check out the{" "}
            <a
              href="https://github.com/tomast1337/trabalho-block-chain"
              className="text-blue-500 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub repository
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

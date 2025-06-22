# Trabalho block Chain - Monorepo with Hardhat & React

## Project Structure

```
(This Repo)/
├── apps/
│   └── frontend/                                       # React frontend with Tailwind CSS and shadcn/ui
├── packages/
│   ├── contracts/                                      # Hardhat project with Solidity smart contracts
│   ├── abi-types/                                      # Generated contract ABIs and TypeChain types
│   └── event-ticketing-blockchain-access/              # Shared utility functions
├── pnpm-workspace.yaml                                 # PNPM workspace configuration
└── README.md                                           # This file
```

## Installation

1. Clone the repository:

   ```bash
   git clone git@github.com:tomast1337/trabalho-block-chain.git
   cd trabalho-block-chain
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

## Development Workflow

To start the complete development environment, which includes the local blockchain, contract deployment, and the frontend server, run:

```bash
pnpm dev
```

This single command will:

- Start a local Hardhat network at `http://127.0.0.1:8545`.
- Compile and deploy your smart contracts to the local network.
- Generate TypeScript types in `packages/abi-types`.
- Start the React frontend at `http://localhost:5173`.

## Available Commands

| Command             | Description                                                     |
| :------------------ | :-------------------------------------------------------------- |
| `pnpm install`      | Install all dependencies                                        |
| `pnpm dev`          | Start the complete development environment (backend & frontend) |
| `pnpm dev:backend`  | Start local blockchain and deploy contracts                     |
| `pnpm dev:frontend` | Start the frontend development server                           |
| `pnpm compile`      | Compile smart contracts and generate types                      |
| `pnpm test`         | Run smart contract tests                                        |
| `pnpm coverage`     | Generate test coverage report for contracts                     |
| `pnpm build`        | Build the frontend for production                               |

## Testing

Run the complete test suite for the smart contracts:

```bash
pnpm test
```

Generate a test coverage report:

```bash
pnpm coverage
```

## Troubleshooting

### TypeChain Types Not Generating

- Run `pnpm clean` in the `packages/contracts` directory, then `pnpm compile`.
- Verify if `packages/abi-types/src/` exists.

### Frontend Not Connecting

- Ensure MetaMask is connected to `Localhost 8545`.
- Check that the contract addresses in the frontend code match the deployment output in your terminal.

### Transactions Failing

- Restart the development server (`pnpm dev`) to get a fresh blockchain instance.

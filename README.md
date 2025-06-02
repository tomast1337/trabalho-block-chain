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

### 1. Start Local Blockchain

In one terminal:

```bash
pnpm chain
```

This starts a local Hardhat network at `http://127.0.0.1:8545`

### 2. Compile and Deploy Contracts

In another terminal:

```bash
pnpm compile
pnpm deploy:local
```

This will:

- Compile your Solidity contracts
- Deploy them to the local network
- Generate TypeScript types in `packages/abi-types`

### 3. Run Frontend Development Server

In another terminal:

```bash
pnpm dev
```

This starts the React frontend at `http://localhost:5173`

## Available Commands

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| `pnpm install`      | Install all dependencies                 |
| `pnpm dev`          | Start frontend and blockchain (parallel) |
| `pnpm chain`        | Start local Hardhat network              |
| `pnpm compile`      | Compile smart contracts                  |
| `pnpm test`         | Run contract tests                       |
| `pnpm test:watch`   | Run tests in watch mode                  |
| `pnpm coverage`     | Generate test coverage report            |
| `pnpm deploy:local` | Deploy contracts to local network        |
| `pnpm typechain`    | Generate TypeScript types from contracts |
| `pnpm build`        | Build frontend for production            |

## Testing

Run the complete test suite:

```bash
pnpm test
```

Generate a test coverage report:

```bash
pnpm coverage
```

## Troubleshooting

### TypeChain Types Not Generating

- Run `pnpm clean` then `pnpm compile`
- Verify if `packages/abi-types/src/` exists

### Frontend Not Connecting

- Ensure MetaMask is connected to Localhost 8545
- Check contract address in frontend code matches deployment

### Transactions Failing

- Reset your local blockchain (`pnpm chain --reset`)

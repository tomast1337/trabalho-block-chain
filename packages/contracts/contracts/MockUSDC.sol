// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {
        _mint(msg.sender, 1000000 * 10 ** 6); // Mint 1M USDC with 6 decimals
    }

    function decimals() public pure override returns (uint8) {
        return 6; // USDC uses 6 decimals
    }
}

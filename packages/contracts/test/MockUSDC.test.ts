import type { MockUSDC } from "@event_ticketing/abi-types";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("MockUSDC", () => {
  const deployMockUSDCFixture = async () => {
    const [owner, otherAccount] = await hre.ethers.getSigners();
    const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    return { usdc, owner, otherAccount };
  };

  describe("Deployment", () => {
    it("Should assign the total supply to the deployer", async () => {
      const { usdc, owner } = await loadFixture(deployMockUSDCFixture);
      const ownerBalance = await usdc.balanceOf(owner.address);
      expect(await usdc.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Minting", () => {
    it("Should allow the owner to mint new tokens", async () => {
      const { usdc, owner, otherAccount } = await loadFixture(
        deployMockUSDCFixture
      );
      const initialBalance = await usdc.balanceOf(otherAccount.address);
      const amountToMint = hre.ethers.parseUnits("100", 6);

      await (usdc as any)
        .connect(owner)
        .mint(otherAccount.address, amountToMint);
      const finalBalance = await usdc.balanceOf(otherAccount.address);

      expect(finalBalance - initialBalance).to.equal(amountToMint);
    });

    it("Should not allow non-owners to mint new tokens", async () => {
      const { usdc, otherAccount } = await loadFixture(deployMockUSDCFixture);
      const amountToMint = hre.ethers.parseUnits("100", 6);

      await expect(
        (usdc as any)
          .connect(otherAccount)
          .mint(otherAccount.address, amountToMint)
      ).to.be.revertedWith("Only owner can call this function");
    });
  });
});

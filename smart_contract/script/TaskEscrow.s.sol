// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/TaskEscrow.sol";

contract TaskEscrowScript is Script {
    function setUp() public {}

    function run() public returns (TaskEscrow) {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address payable platformWallet = payable(0x689eDE41494F0B0C4d04584F73AFA2c4a6AE3D57);

        vm.startBroadcast(deployerPrivateKey);
        TaskEscrow taskEscrow = new TaskEscrow(deployer, platformWallet, 1500);
        vm.stopBroadcast();
        return taskEscrow;
    }
}

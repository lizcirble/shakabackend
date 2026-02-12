// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {TaskEscrow} from "../src/TaskEscrow.sol";


contract TaskEscrowTest is Test {
    TaskEscrow escrow;
    address payable deployer;
    address payable platformWallet;
    address creator1;
    address creator2;
    address worker1;
    address worker2;
    address worker3;

    uint256 constant PLATFORM_FEE_PERCENTAGE = 1500;
    uint256 constant TASK_ID_1 = 1;
    uint256 constant TASK_ID_2 = 2;
    uint256 constant PAYOUT_PER_WORKER = 0.01 ether;
    uint256 constant REQUIRED_WORKERS = 3;

    function setUp() public {
        deployer = payable(makeAddr("deployer"));
        platformWallet = payable(makeAddr("platformWallet"));
        creator1 = makeAddr("creator1");
        creator2 = makeAddr("creator2");
        worker1 = makeAddr("worker1");
        worker2 = makeAddr("worker2");
        worker3 = makeAddr("worker3");

        vm.deal(deployer, 10 ether);
        vm.deal(creator1, 10 ether);
        vm.deal(creator2, 10 ether);
        vm.deal(worker1, 0 ether);
        vm.deal(worker2, 0 ether);
        vm.deal(worker3, 0 ether);

        vm.startPrank(deployer);
        escrow = new TaskEscrow(deployer, platformWallet, PLATFORM_FEE_PERCENTAGE);
        vm.stopPrank();
    }

    function testConstructorSetsCorrectValues() public view {
        assertEq(escrow.owner(), deployer);
        assertEq(escrow.platformWallet(), platformWallet);
        assertEq(escrow.platformFeePercentage(), PLATFORM_FEE_PERCENTAGE);
    }

    function testConstructorRevertsIfPlatformWalletIsZeroAddress() public {
        vm.expectRevert("Platform wallet cannot be zero address");
        new TaskEscrow(deployer, payable(address(0)), PLATFORM_FEE_PERCENTAGE);
    }

    function testOnlyOwnerCanCreateTask() public {
        vm.expectRevert("Ownable: caller is not the owner");
        vm.prank(creator1);
        escrow.createTask(TASK_ID_1, creator1, PAYOUT_PER_WORKER, REQUIRED_WORKERS);
    }

    function testOnlyOwnerCanAssignWorkers() public {
        vm.expectRevert("Ownable: caller is not the owner");
        vm.prank(creator1);
        escrow.assignWorkers(TASK_ID_1, new address[](0));
    }

    function testOnlyOwnerCanReleasePayout() public {
        vm.expectRevert("Ownable: caller is not the owner");
        vm.prank(creator1);
        escrow.releasePayout(TASK_ID_1, payable(worker1));
    }

    function testOnlyOwnerCanReleaseBatchPayouts() public {
        vm.expectRevert("Ownable: caller is not the owner");
        vm.prank(creator1);
        escrow.releaseBatchPayouts(TASK_ID_1, new address[](0));
    }

    function testOnlyOwnerCanCompleteTask() public {
        vm.expectRevert("Ownable: caller is not the owner");
        vm.prank(creator1);
        escrow.completeTask(TASK_ID_1);
    }

    function testOnlyOwnerCanCancelAndRefund() public {
        vm.expectRevert("Ownable: caller is not the owner");
        vm.prank(creator1);
        escrow.cancelAndRefund(TASK_ID_1);
    }

    function testOnlyOwnerCanSetPlatformWallet() public {
        vm.expectRevert("Ownable: caller is not the owner");
        vm.prank(creator1);
        escrow.setPlatformWallet(payable(makeAddr("newPlatform")));
    }

    function testOnlyOwnerCanSetPlatformFee() public {
        vm.expectRevert("Ownable: caller is not the owner");
        vm.prank(creator1);
        escrow.setPlatformFee(2000);
    }

    function testCreateTaskSuccessfully() public {
        vm.prank(deployer);
        escrow.createTask(TASK_ID_1, creator1, PAYOUT_PER_WORKER, REQUIRED_WORKERS);

        (address creator, uint256 payout, uint256 fee, TaskEscrow.Status status, uint256 requiredWorkers) = escrow.getTask(TASK_ID_1);
        assertEq(creator, creator1);
        assertEq(payout, PAYOUT_PER_WORKER * REQUIRED_WORKERS);
        assertTrue(fee > 0);
        assertEq(uint8(status), uint8(TaskEscrow.Status.Created));
        assertEq(requiredWorkers, REQUIRED_WORKERS);
    }

    function testCreateTaskRevertsIfTaskAlreadyExists() public {
        vm.prank(deployer);
        escrow.createTask(TASK_ID_1, creator1, PAYOUT_PER_WORKER, REQUIRED_WORKERS);

        vm.expectRevert("Task already exists");
        vm.prank(deployer);
        escrow.createTask(TASK_ID_1, creator2, PAYOUT_PER_WORKER, REQUIRED_WORKERS);
    }

    function testCreateTaskRevertsWithZeroPayout() public {
        vm.expectRevert("Invalid task parameters");
        vm.prank(deployer);
        escrow.createTask(TASK_ID_1, creator1, 0, REQUIRED_WORKERS);
    }

    function testFundTaskSuccessfullyByCreator() public {
        vm.prank(deployer);
        escrow.createTask(TASK_ID_1, creator1, PAYOUT_PER_WORKER, REQUIRED_WORKERS);

        (,,uint256 fee,,) = escrow.getTask(TASK_ID_1);
        uint256 expectedAmount = (PAYOUT_PER_WORKER * REQUIRED_WORKERS) + fee;

        vm.prank(creator1);
        escrow.fundTask{value: expectedAmount}(TASK_ID_1);

        (,,,TaskEscrow.Status status,) = escrow.getTask(TASK_ID_1);
        assertEq(uint8(status), uint8(TaskEscrow.Status.Funded));
    }

    function testFundTaskSuccessfullyByOwner() public {
        vm.prank(deployer);
        escrow.createTask(TASK_ID_1, creator1, PAYOUT_PER_WORKER, REQUIRED_WORKERS);

        (,,uint256 fee,,) = escrow.getTask(TASK_ID_1);
        uint256 expectedAmount = (PAYOUT_PER_WORKER * REQUIRED_WORKERS) + fee;

        vm.prank(deployer);
        escrow.fundTask{value: expectedAmount}(TASK_ID_1);

        (,,,TaskEscrow.Status status,) = escrow.getTask(TASK_ID_1);
        assertEq(uint8(status), uint8(TaskEscrow.Status.Funded));
    }

    function testFundTaskRevertsIfAlreadyFunded() public {
        vm.prank(deployer);
        escrow.createTask(TASK_ID_1, creator1, PAYOUT_PER_WORKER, REQUIRED_WORKERS);

        (,,uint256 fee,,) = escrow.getTask(TASK_ID_1);
        uint256 expectedAmount = (PAYOUT_PER_WORKER * REQUIRED_WORKERS) + fee;

        vm.prank(creator1);
        escrow.fundTask{value: expectedAmount}(TASK_ID_1);

        vm.expectRevert("Task not in created state");
        vm.prank(creator1);
        escrow.fundTask{value: expectedAmount}(TASK_ID_1);
    }

    function testFundTaskRevertsIfIncorrectAmount() public {
        vm.prank(deployer);
        escrow.createTask(TASK_ID_1, creator1, PAYOUT_PER_WORKER, REQUIRED_WORKERS);

        (,,uint256 fee,,) = escrow.getTask(TASK_ID_1);
        uint256 expectedAmount = (PAYOUT_PER_WORKER * REQUIRED_WORKERS) + fee;

        vm.expectRevert("Incorrect funding amount");
        vm.prank(creator1);
        escrow.fundTask{value: expectedAmount - 1}(TASK_ID_1);
    }

    function testFundTaskRevertsIfNotCreatorOrOwner() public {
        vm.prank(deployer);
        escrow.createTask(TASK_ID_1, creator1, PAYOUT_PER_WORKER, REQUIRED_WORKERS);

        (,,uint256 fee,,) = escrow.getTask(TASK_ID_1);
        uint256 expectedAmount = (PAYOUT_PER_WORKER * REQUIRED_WORKERS) + fee;

        vm.expectRevert("Only creator or owner can fund");
        vm.prank(creator2);
        escrow.fundTask{value: expectedAmount}(TASK_ID_1);
    }

    function testAssignWorkersSuccessfully() public {
        vm.prank(deployer);
        escrow.createTask(TASK_ID_1, creator1, PAYOUT_PER_WORKER, REQUIRED_WORKERS);
        fundTaskHelper(TASK_ID_1, creator1);

        address[] memory workers = new address[](2);
        workers[0] = worker1;
        workers[1] = worker2;

        vm.prank(deployer);
        escrow.assignWorkers(TASK_ID_1, workers);

        assertEq(escrow.getAssignedWorkers(TASK_ID_1).length, 2);
        assertTrue(escrow.getIsAssignedWorker(TASK_ID_1, worker1));
        assertTrue(escrow.getIsAssignedWorker(TASK_ID_1, worker2));
        assertFalse(escrow.getIsAssignedWorker(TASK_ID_1, worker3));
    }

    function testAssignWorkersRevertsIfNotFunded() public {
        vm.prank(deployer);
        escrow.createTask(TASK_ID_1, creator1, PAYOUT_PER_WORKER, REQUIRED_WORKERS);

        address[] memory workers = new address[](1);
        workers[0] = worker1;

        vm.expectRevert("Task must be funded to assign workers");
        vm.prank(deployer);
        escrow.assignWorkers(TASK_ID_1, workers);
    }

    function testReleasePayoutSuccessfully() public {
        vm.prank(deployer);
        escrow.createTask(TASK_ID_1, creator1, PAYOUT_PER_WORKER, REQUIRED_WORKERS);
        fundTaskHelper(TASK_ID_1, creator1);

        address[] memory workers = new address[](1);
        workers[0] = worker1;
        vm.prank(deployer);
        escrow.assignWorkers(TASK_ID_1, workers);

        uint256 initialWorkerBalance = address(worker1).balance;

        vm.prank(deployer);
        escrow.releasePayout(TASK_ID_1, payable(worker1));

        assertEq(address(worker1).balance, initialWorkerBalance + PAYOUT_PER_WORKER);
        assertFalse(escrow.getIsAssignedWorker(TASK_ID_1, worker1));
    }

    function testReleasePayoutRevertsIfNotFunded() public {
        vm.prank(deployer);
        escrow.createTask(TASK_ID_1, creator1, PAYOUT_PER_WORKER, REQUIRED_WORKERS);

        vm.expectRevert("Task must be funded to assign workers");
        vm.prank(deployer);
        escrow.releasePayout(TASK_ID_1, payable(worker1));
    }

    function testReleasePayoutRevertsIfWorkerNotAssigned() public {
        vm.prank(deployer);
        escrow.createTask(TASK_ID_1, creator1, PAYOUT_PER_WORKER, REQUIRED_WORKERS);
        fundTaskHelper(TASK_ID_1, creator1);

        vm.expectRevert("Worker was not assigned to this task");
        vm.prank(deployer);
        escrow.releasePayout(TASK_ID_1, payable(worker1));
    }

    function testReleasePayoutPreventsDoublePayout() public {
        vm.prank(deployer);
        escrow.createTask(TASK_ID_1, creator1, PAYOUT_PER_WORKER, REQUIRED_WORKERS);
        fundTaskHelper(TASK_ID_1, creator1);

        address[] memory workers = new address[](1);
        workers[0] = worker1;
        vm.prank(deployer);
        escrow.assignWorkers(TASK_ID_1, workers);

        vm.prank(deployer);
        escrow.releasePayout(TASK_ID_1, payable(worker1));

        vm.expectRevert("Worker was not assigned to this task");
        vm.prank(deployer);
        escrow.releasePayout(TASK_ID_1, payable(worker1));
    }

    function testReleaseBatchPayoutsSuccessfully() public {
        vm.prank(deployer);
        escrow.createTask(TASK_ID_1, creator1, PAYOUT_PER_WORKER, REQUIRED_WORKERS);
        fundTaskHelper(TASK_ID_1, creator1);

        address[] memory workers = new address[](3);
        workers[0] = worker1;
        workers[1] = worker2;
        workers[2] = worker3;
        vm.prank(deployer);
        escrow.assignWorkers(TASK_ID_1, workers);

        uint256 initialWorker1Balance = address(worker1).balance;
        uint256 initialWorker2Balance = address(worker2).balance;
        uint256 initialWorker3Balance = address(worker3).balance;

        vm.prank(deployer);
        escrow.releaseBatchPayouts(TASK_ID_1, workers);

        assertEq(address(worker1).balance, initialWorker1Balance + PAYOUT_PER_WORKER);
        assertEq(address(worker2).balance, initialWorker2Balance + PAYOUT_PER_WORKER);
        assertEq(address(worker3).balance, initialWorker3Balance + PAYOUT_PER_WORKER);

        assertFalse(escrow.getIsAssignedWorker(TASK_ID_1, worker1));
        assertFalse(escrow.getIsAssignedWorker(TASK_ID_1, worker2));
        assertFalse(escrow.getIsAssignedWorker(TASK_ID_1, worker3));
    }

    function testReleaseBatchPayoutsHandlesUnassignedWorkersGracefully() public {
        vm.prank(deployer);
        escrow.createTask(TASK_ID_1, creator1, PAYOUT_PER_WORKER, REQUIRED_WORKERS);
        fundTaskHelper(TASK_ID_1, creator1);

        address[] memory assignedWorkers = new address[](1);
        assignedWorkers[0] = worker1;
        vm.prank(deployer);
        escrow.assignWorkers(TASK_ID_1, assignedWorkers);

        address[] memory payoutList = new address[](2);
        payoutList[0] = worker1;
        payoutList[1] = worker2;

        uint256 initialWorker1Balance = address(worker1).balance;
        uint256 initialWorker2Balance = address(worker2).balance;

        vm.prank(deployer);
        escrow.releaseBatchPayouts(TASK_ID_1, payoutList);

        assertEq(address(worker1).balance, initialWorker1Balance + PAYOUT_PER_WORKER);
        assertEq(address(worker2).balance, initialWorker2Balance);
        assertFalse(escrow.getIsAssignedWorker(TASK_ID_1, worker1));
    }

    function testCompleteTaskSuccessfully() public {
        vm.prank(deployer);
        escrow.createTask(TASK_ID_1, creator1, PAYOUT_PER_WORKER, REQUIRED_WORKERS);
        fundTaskHelper(TASK_ID_1, creator1);

        address[] memory workers = new address[](3);
        workers[0] = worker1;
        workers[1] = worker2;
        workers[2] = worker3;
        vm.prank(deployer);
        escrow.assignWorkers(TASK_ID_1, workers);

        vm.prank(deployer);
        escrow.releaseBatchPayouts(TASK_ID_1, workers);

        (,,uint256 fee,,) = escrow.getTask(TASK_ID_1);
        uint256 initialPlatformBalance = address(platformWallet).balance;

        vm.prank(deployer);
        escrow.completeTask(TASK_ID_1);

        (,,,TaskEscrow.Status status,) = escrow.getTask(TASK_ID_1);
        assertEq(uint8(status), uint8(TaskEscrow.Status.Completed));
        assertEq(address(platformWallet).balance, initialPlatformBalance + fee);
    }

    function testCompleteTaskRevertsIfNotFunded() public {
        vm.prank(deployer);
        escrow.createTask(TASK_ID_1, creator1, PAYOUT_PER_WORKER, REQUIRED_WORKERS);

        vm.expectRevert("Task must be funded to assign workers");
        vm.prank(deployer);
        escrow.completeTask(TASK_ID_1);
    }

    function testCompleteTaskRevertsIfWorkersNotPaid() public {
        vm.prank(deployer);
        escrow.createTask(TASK_ID_1, creator1, PAYOUT_PER_WORKER, REQUIRED_WORKERS);
        fundTaskHelper(TASK_ID_1, creator1);

        address[] memory workers = new address[](1);
        workers[0] = worker1;
        vm.prank(deployer);
        escrow.assignWorkers(TASK_ID_1, workers);

        vm.expectRevert("Task must be completed before completion");
        vm.prank(deployer);
        escrow.completeTask(TASK_ID_1);
    }

    function testCancelAndRefundSuccessfully() public {
        vm.prank(deployer);
        escrow.createTask(TASK_ID_1, creator1, PAYOUT_PER_WORKER, REQUIRED_WORKERS);
        fundTaskHelper(TASK_ID_1, creator1);

        (,,uint256 fee,,) = escrow.getTask(TASK_ID_1);
        uint256 totalPayout = PAYOUT_PER_WORKER * REQUIRED_WORKERS;
        uint256 expectedRefundAmount = totalPayout + fee;
        uint256 initialCreatorBalance = address(creator1).balance;

        vm.prank(deployer);
        escrow.cancelAndRefund(TASK_ID_1);

        (,,,TaskEscrow.Status status,) = escrow.getTask(TASK_ID_1);
        assertEq(uint8(status), uint8(TaskEscrow.Status.Cancelled));
        assertEq(address(creator1).balance, initialCreatorBalance + expectedRefundAmount);
    }

    function testCancelAndRefundRevertsIfNotFunded() public {
        vm.prank(deployer);
        escrow.createTask(TASK_ID_1, creator1, PAYOUT_PER_WORKER, REQUIRED_WORKERS);

        vm.expectRevert("Task must be funded to assign workers");
        vm.prank(deployer);
        escrow.cancelAndRefund(TASK_ID_1);
    }

    function testSetPlatformWalletSuccessfully() public {
        address payable newWallet = payable(makeAddr("newPlatformWallet"));
        vm.prank(deployer);
        escrow.setPlatformWallet(newWallet);
        assertEq(escrow.platformWallet(), newWallet);
    }

    function testSetPlatformWalletRevertsIfZeroAddress() public {
        vm.expectRevert("Platform wallet cannot be zero address");
        vm.prank(creator1);
        escrow.setPlatformWallet(payable(address(0)));
    }

    function testSetPlatformFeeSuccessfully() public {
        vm.prank(deployer);
        escrow.setPlatformFee(2000);
        assertEq(escrow.platformFeePercentage(), 2000);
    }

    function testGetTaskStatus() public {
        vm.prank(deployer);
        escrow.createTask(TASK_ID_1, creator1, PAYOUT_PER_WORKER, REQUIRED_WORKERS);

        assertEq(uint8(escrow.getTaskStatus(TASK_ID_1)), uint8(TaskEscrow.Status.Created));
    }

    function testGetContractBalance() public {
        vm.prank(deployer);
        escrow.createTask(TASK_ID_1, creator1, PAYOUT_PER_WORKER, REQUIRED_WORKERS);

        assertEq(escrow.getContractBalance(), 0);
    }

    function fundTaskHelper(uint256 _taskId, address _creator) internal {
        (,,uint256 fee,,) = escrow.getTask(_taskId);
        uint256 expectedAmount = (PAYOUT_PER_WORKER * REQUIRED_WORKERS) + fee;

        vm.prank(_creator);
        escrow.fundTask{value: expectedAmount}(_taskId);
    }
}

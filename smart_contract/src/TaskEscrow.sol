// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error InvalidPlatformWallet();
error TaskAlreadyExists(uint256 taskId);
error TaskNotInCreatedState(uint256 taskId, TaskEscrow.Status currentStatus);
error IncorrectFundingAmount(uint256 expected, uint256 actual);
error TaskNotInFundedState(uint256 taskId, TaskEscrow.Status currentStatus);
error WorkerNotAssigned(uint256 taskId, address worker);
error TaskNotCompleted(uint256 taskId, TaskEscrow.Status currentStatus);
error InvalidTaskParameters();

contract TaskEscrow is Ownable, ReentrancyGuard {
    address payable public platformWallet;
    uint256 public platformFeePercentage;

    enum Status {
        Created,
        Funded,
        Completed,
        Cancelled
    }

    struct Task {
        uint256 payoutPerWorker;
        uint256 requiredWorkers;
        uint256 platformFee;
        Status status;
        address creator;
    }

    mapping(uint256 => Task) private tasks;
    mapping(uint256 => mapping(address => bool)) public isAssignedWorker;
    mapping(uint256 => address[]) private assignedWorkerList;
    mapping(uint256 => bool) private taskExists;

    event TaskCreated(uint256 indexed taskId, address indexed creator, uint256 payoutPerWorker, uint256 requiredWorkers);
    event TaskFunded(uint256 indexed taskId, address indexed creator, uint256 totalAmount);
    event PayoutReleased(uint256 indexed taskId, address indexed worker, uint256 amount);
    event BatchPayoutReleased(uint256 indexed taskId, uint256 totalAmount, uint256 workerCount);
    event PlatformFeePaid(uint256 indexed taskId, uint256 amount);
    event TaskCancelled(uint256 indexed taskId);
    event RefundIssued(uint256 indexed taskId, address indexed creator, uint256 amount);
    event PlatformWalletUpdated(address indexed newWallet);
    event PlatformFeeUpdated(uint256 newFeePercentage);

    constructor(address initialOwner, address payable _platformWallet, uint256 _platformFeePercentage) Ownable(initialOwner) {
        if (_platformWallet == address(0)) revert InvalidPlatformWallet();
        platformWallet = _platformWallet;
        platformFeePercentage = _platformFeePercentage;
    }

    function createTask(uint256 _taskId, address _creator, uint256 _payoutPerWorker, uint256 _requiredWorkers) external onlyOwner {
        if (taskExists[_taskId]) revert TaskAlreadyExists(_taskId);
        if (_payoutPerWorker == 0 || _requiredWorkers == 0) revert InvalidTaskParameters();

        Task storage newTask = tasks[_taskId];
        newTask.payoutPerWorker = _payoutPerWorker;
        newTask.requiredWorkers = _requiredWorkers;
        newTask.creator = _creator;

        uint256 totalPayout = _payoutPerWorker * _requiredWorkers;
        newTask.platformFee = (totalPayout * platformFeePercentage) / 10000;
        newTask.status = Status.Created;

        taskExists[_taskId] = true;

        emit TaskCreated(_taskId, _creator, _payoutPerWorker, _requiredWorkers);
    }

    function fundTask(uint256 _taskId) external payable {
        Task storage task = tasks[_taskId];
        if (!taskExists[_taskId]) revert TaskNotInCreatedState(_taskId, Status.Created);
        if (task.status != Status.Created) revert TaskNotInCreatedState(_taskId, task.status);
        if (msg.sender != task.creator && msg.sender != owner()) revert("Only creator or owner can fund");

        uint256 totalPayout = task.payoutPerWorker * task.requiredWorkers;
        uint256 expectedAmount = totalPayout + task.platformFee;
        if (msg.value != expectedAmount) revert IncorrectFundingAmount(expectedAmount, msg.value);

        task.status = Status.Funded;
        emit TaskFunded(_taskId, task.creator, msg.value);
    }

    function assignWorkers(uint256 _taskId, address[] calldata _workers) external onlyOwner {
        Task storage task = tasks[_taskId];
        if (task.status != Status.Funded) revert TaskNotInFundedState(_taskId, task.status);

        for (uint i = 0; i < _workers.length; i++) {
            address worker = _workers[i];
            if (!isAssignedWorker[_taskId][worker]) {
                isAssignedWorker[_taskId][worker] = true;
                assignedWorkerList[_taskId].push(worker);
            }
        }
    }

    function releasePayout(uint256 _taskId, address payable _worker) external onlyOwner nonReentrant {
        Task storage task = tasks[_taskId];
        if (task.status != Status.Funded) revert TaskNotInFundedState(_taskId, task.status);
        if (!isAssignedWorker[_taskId][_worker]) revert WorkerNotAssigned(_taskId, _worker);

        isAssignedWorker[_taskId][_worker] = false;
        uint256 payoutAmount = task.payoutPerWorker;
        (bool success, ) = _worker.call{value: payoutAmount}("");
        if (!success) revert("Transfer failed");
        emit PayoutReleased(_taskId, _worker, payoutAmount);
    }

    function releaseBatchPayouts(uint256 _taskId, address[] calldata _workers) external onlyOwner nonReentrant {
        Task storage task = tasks[_taskId];
        if (task.status != Status.Funded) revert TaskNotInFundedState(_taskId, task.status);

        uint256 payoutAmount = task.payoutPerWorker;
        uint256 payoutCount = 0;

        for (uint i = 0; i < _workers.length; i++) {
            address worker = _workers[i];
            if (isAssignedWorker[_taskId][worker]) {
                isAssignedWorker[_taskId][worker] = false;
                (bool success, ) = worker.call{value: payoutAmount}("");
                if (!success) revert("Transfer failed");
                payoutCount++;
            }
        }
        emit BatchPayoutReleased(_taskId, payoutAmount * payoutCount, payoutCount);
    }

    function completeTask(uint256 _taskId) external onlyOwner nonReentrant {
        Task storage task = tasks[_taskId];
        if (task.status != Status.Funded) revert TaskNotInFundedState(_taskId, task.status);

        uint256 remainingWorkers = 0;
        for (uint i = 0; i < assignedWorkerList[_taskId].length; i++) {
            if (isAssignedWorker[_taskId][assignedWorkerList[_taskId][i]]) {
                remainingWorkers++;
            }
        }

        if (remainingWorkers > 0) revert TaskNotCompleted(_taskId, task.status);

        task.status = Status.Completed;
        uint256 fee = task.platformFee;
        (bool success, ) = platformWallet.call{value: fee}("");
        if (!success) revert("Platform fee transfer failed");
        emit PlatformFeePaid(_taskId, fee);
    }

    function cancelAndRefund(uint256 _taskId) external onlyOwner nonReentrant {
        Task storage task = tasks[_taskId];
        if (task.status != Status.Funded) revert TaskNotInFundedState(_taskId, task.status);

        task.status = Status.Cancelled;
        uint256 totalPayout = task.payoutPerWorker * task.requiredWorkers;
        uint256 refundAmount = totalPayout + task.platformFee;

        (bool success, ) = payable(task.creator).call{value: refundAmount}("");
        if (!success) revert("Refund failed");

        emit TaskCancelled(_taskId);
        emit RefundIssued(_taskId, task.creator, refundAmount);
    }

    function setPlatformWallet(address payable _newWallet) external onlyOwner {
        if (_newWallet == address(0)) revert InvalidPlatformWallet();
        platformWallet = _newWallet;
        emit PlatformWalletUpdated(_newWallet);
    }

    function setPlatformFee(uint256 _newFeePercentage) external onlyOwner {
        platformFeePercentage = _newFeePercentage;
        emit PlatformFeeUpdated(_newFeePercentage);
    }

    function getTask(uint256 _taskId) external view returns (address creator, uint256 payout, uint256 fee, Status status, uint256 requiredWorkers) {
        Task storage task = tasks[_taskId];
        return (
            task.creator,
            task.payoutPerWorker * task.requiredWorkers,
            task.platformFee,
            task.status,
            task.requiredWorkers
        );
    }

    function getAssignedWorkers(uint256 _taskId) external view returns (address[] memory) {
        return assignedWorkerList[_taskId];
    }

    function getIsAssignedWorker(uint256 _taskId, address _worker) external view returns (bool) {
        return isAssignedWorker[_taskId][_worker];
    }

    function getTaskExists(uint256 _taskId) external view returns (bool) {
        return taskExists[_taskId];
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getTaskStatus(uint256 _taskId) external view returns (Status) {
        return tasks[_taskId].status;
    }

    function getRemainingPayoutAmount(uint256 _taskId) external view returns (uint256) {
        Task storage task = tasks[_taskId];
        uint256 assignedCount = 0;
        for (uint i = 0; i < assignedWorkerList[_taskId].length; i++) {
            if (isAssignedWorker[_taskId][assignedWorkerList[_taskId][i]]) {
                assignedCount++;
            }
        }
        return task.payoutPerWorker * assignedCount;
    }
}

const { taskEscrowContract } = require('../config/blockchain');

const fundTask = async (taskId, amount) => {
    const tx = await taskEscrowContract.fundTask(taskId, { value: amount });
    await tx.wait();
};

const releasePayout = async (taskId, worker) => {
    const tx = await taskEscrowContract.releasePayout(taskId, worker);
    await tx.wait();
};

const issueRefund = async (taskId) => {
    const tx = await taskEscrowContract.issueRefund(taskId);
    await tx.wait();
};

module.exports = {
    fundTask,
    releasePayout,
    issueRefund,
};
const { escrowService } = require('../services');

const releaseEscrow = async (req, res) => {
    try {
        const { taskId, worker } = req.body;
        await escrowService.releaseEscrow(taskId, worker);
        res.send({ message: 'Escrow released successfully.' });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
};

const refundEscrow = async (req, res) => {
    try {
        const { taskId } = req.body;
        await escrowService.refundEscrow(taskId);
        res.send({ message: 'Escrow refunded successfully.' });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
};

module.exports = {
    releaseEscrow,
    refundEscrow,
};
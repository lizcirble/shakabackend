const { reputationService } = require('../services');

const getReputation = async (req, res) => {
    try {
        const reputation = await reputationService.getReputation(req.params.workerId);
        res.send(reputation);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
};

module.exports = {
    getReputation,
};
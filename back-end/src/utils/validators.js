const Joi = require('joi');

const taskSchema = Joi.object({
    category: Joi.string().required(),
    instructions: Joi.string().required(),
    payout_per_worker: Joi.number().positive().required(),
    num_workers: Joi.number().integer().min(1).required(),
    deadline: Joi.date().iso().required(),
});

const validateTask = (task) => {
    return taskSchema.validate(task);
};

module.exports = {
    validateTask,
};
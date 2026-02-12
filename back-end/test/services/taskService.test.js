const { expect } = require('chai');
const sinon = require('sinon');
const { createTask, fundTaskAndMakeItAvailable, assignTask } = require('../src/services/taskService');
const { Task } = require('../src/models');
const { fundTask } = require('../src/utils/escrow');
const { PLATFORM_FEE_PERCENTAGE } = require('../src/config/blockchain');

describe('Task Service', () => {
    let createTaskStub, findByIdStub, updateStub, getAssignableTasksStub, fundTaskStub;

    beforeEach(() => {
        createTaskStub = sinon.stub(Task, 'create');
        findByIdStub = sinon.stub(Task, 'findById');
        updateStub = sinon.stub(Task, 'update');
        getAssignableTasksStub = sinon.stub(Task, 'getAssignableTasks');
        fundTaskStub = sinon.stub(fundTask, 'fundTask');
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('createTask', () => {
        it('should create a task with calculated platform fee and total payout', async () => {
            const taskData = {
                category: 'Image Labeling',
                instructions: 'Label images',
                payout_per_worker: 100,
                num_workers: 5,
                deadline: new Date().toISOString(),
            };
            const subtotal = taskData.payout_per_worker * taskData.num_workers;
            const platformFee = subtotal * PLATFORM_FEE_PERCENTAGE;
            const totalPayout = subtotal + platformFee;

            createTaskStub.returns({ id: 1, ...taskData, status: 'DRAFT', platform_fee: platformFee, total_payout: totalPayout });

            const task = await createTask(taskData);

            expect(createTaskStub.calledOnce).to.be.true;
            expect(task).to.have.property('platform_fee', platformFee);
            expect(task).to.have.property('total_payout', totalPayout);
            expect(task).to.have.property('status', 'DRAFT');
        });

        it('should throw an error for invalid task data', async () => {
            const taskData = {
                category: 'Image Labeling',
                instructions: 'Label images',
                payout_per_worker: -100, // Invalid
                num_workers: 5,
                deadline: new Date().toISOString(),
            };

            try {
                await createTask(taskData);
                expect.fail('Function did not throw an error for invalid data');
            } catch (error) {
                expect(error.message).to.include('Invalid task data');
            }
        });
    });

    describe('fundTaskAndMakeItAvailable', () => {
        it('should fund a task and update its status to FUNDED', async () => {
            const taskId = 1;
            const totalPayout = 1000;
            findByIdStub.returns({ id: taskId, status: 'DRAFT', total_payout: totalPayout });
            updateStub.returns({ id: taskId, status: 'FUNDED', total_payout: totalPayout });
            fundTaskStub.returns(true); // Mock successful blockchain interaction

            const updatedTask = await fundTaskAndMakeItAvailable(taskId);

            expect(findByIdStub.calledOnceWith(taskId)).to.be.true;
            expect(fundTaskStub.calledOnceWith(taskId, totalPayout)).to.be.true;
            expect(updateStub.calledOnceWith(taskId, { status: 'FUNDED' })).to.be.true;
            expect(updatedTask).to.have.property('status', 'FUNDED');
        });

        it('should throw an error if task is not found', async () => {
            const taskId = 1;
            findByIdStub.returns(null);

            try {
                await fundTaskAndMakeItAvailable(taskId);
                expect.fail('Function did not throw an error for task not found');
            } catch (error) {
                expect(error.message).to.equal('Task not found.');
            }
        });

        it('should throw an error if task is not in DRAFT status', async () => {
            const taskId = 1;
            findByIdStub.returns({ id: taskId, status: 'FUNDED', total_payout: 1000 });

            try {
                await fundTaskAndMakeItAvailable(taskId);
                expect.fail('Function did not throw an error for invalid task status');
            } catch (error) {
                expect(error.message).to.equal('Task is not in DRAFT status and cannot be funded.');
            }
        });
    });

    describe('assignTask', () => {
        it('should return null if no assignable tasks are found', async () => {
            getAssignableTasksStub.returns([]);

            const assignedTask = await assignTask({});
            expect(assignedTask).to.be.null;
        });

        it('should return a sub-task if assignable tasks exist', async () => {
            const mockTask = { id: 1, status: 'FUNDED', category: 'Image Labeling', instructions: 'test', payout_per_worker: 10, num_workers: 1, deadline: new Date().toISOString() };
            getAssignableTasksStub.returns([mockTask]);
            // Assuming splitTask returns the task itself for now as it's a TODO
            const assignedTask = await assignTask({});
            expect(assignedTask).to.deep.equal(mockTask);
        });
    });
});
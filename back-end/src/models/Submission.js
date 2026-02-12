const supabase = require('../config/supabase');

class Submission {
    static async create(submission) {
        const { data, error } = await supabase
            .from('submissions')
            .insert([submission])
            .select();
        if (error) throw error;
        return data[0];
    }

    static async findByTaskId(taskId) {
        const { data, error } = await supabase
            .from('submissions')
            .select('*')
            .eq('task_id', taskId);
        if (error) throw error;
        return data;
    }

    static async findByWorkerId(workerId) {
        const { data, error } = await supabase
            .from('submissions')
            .select('*')
            .eq('worker_id', workerId);
        if (error) throw error;
        return data;
    }
}

module.exports = Submission;
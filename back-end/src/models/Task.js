const supabase = require('../config/supabase');

class Task {
    static async create(task) {
        const { data, error } = await supabase
            .from('tasks')
            .insert([task])
            .select();
        if (error) throw error;
        return data[0];
    }

    static async findById(id) {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', id)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    static async update(id, updates) {
        const { data, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', id)
            .select();
        if (error) throw error;
        return data[0];
    }

    static async getAssignableTasks() {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('status', 'FUNDED');
        if (error) throw error;
        return data;
    }
}

module.exports = Task;
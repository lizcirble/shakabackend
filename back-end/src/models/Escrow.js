const supabase = require('../config/supabase');

class Escrow {
    static async getEscrowByTaskId(taskId) {
        const { data, error } = await supabase
            .from('escrows')
            .select('*')
            .eq('task_id', taskId)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    static async create(escrow) {
        const { data, error } = await supabase
            .from('escrows')
            .insert([escrow])
            .select();
        if (error) throw error;
        return data[0];
    }

    static async update(id, updates) {
        const { data, error } = await supabase
            .from('escrows')
            .update(updates)
            .eq('id', id)
            .select();
        if (error) throw error;
        return data[0];
    }
}

module.exports = Escrow;
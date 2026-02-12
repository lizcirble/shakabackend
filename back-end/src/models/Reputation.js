const supabase = require('../config/supabase');

class Reputation {
    static async getReputation(workerId) {
        const { data, error } = await supabase
            .from('reputation')
            .select('*')
            .eq('worker_id', workerId)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    static async updateReputation(workerId, updates) {
        const { data, error } = await supabase
            .from('reputation')
            .update(updates)
            .eq('worker_id', workerId)
            .select();
        if (error) throw error;
        return data[0];
    }

    static async create(reputation) {
        const { data, error } = await supabase
            .from('reputation')
            .insert([reputation])
            .select();
        if (error) throw error;
        return data[0];
    }
}

module.exports = Reputation;
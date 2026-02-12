const supabase = require('../config/supabase');

class User {
    static async create(user) {
        const { data, error } = await supabase
            .from('users')
            .insert([user])
            .select();
        if (error) throw error;
        return data[0];
    }

    static async findByPrivyId(privyId) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('privy_id', privyId)
            .single();
        if (error && error.code !== 'PGRST116') throw error; // Ignore 'not found' error
        return data;
    }

    static async findById(id) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        if (error && error.code !== 'PGRST116') throw error; // Ignore 'not found' error
        return data;
    }
}

module.exports = User;
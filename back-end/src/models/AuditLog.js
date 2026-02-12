const supabase = require('../config/supabase');

class AuditLog {
    static async logEvent(event) {
        const { data, error } = await supabase
            .from('audit_logs')
            .insert([event])
            .select();
        if (error) throw error;
        return data[0];
    }
}

module.exports = AuditLog;
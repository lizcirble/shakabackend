import supabase from '../config/supabaseClient.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';

const MIN_REPUTATION = 0;
const MAX_REPUTATION = 200;

const updateUserReputation = async (userId, scoreChange) => {
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, reputation_score')
        .eq('id', userId)
        .single();

    if (userError || !user) {
        logger.warn(`User ${userId} not found for reputation update.`);
        throw new ApiError(404, 'User not found for reputation update.');
    }

    const newReputation = Math.max(
        MIN_REPUTATION,
        Math.min(MAX_REPUTATION, user.reputation_score + scoreChange)
    );

    const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ reputation_score: newReputation })
        .eq('id', userId)
        .select('id, reputation_score')
        .single();

    if (updateError) {
        logger.error(`Failed to update reputation: ${updateError.message}`);
        throw new ApiError(500, 'Failed to update reputation.');
    }

    logger.info(`Reputation updated: ${userId} ${user.reputation_score} → ${newReputation}`);
    return updatedUser;
};

const anchorReputationOnChain = async () => {
    logger.info('Anchoring reputation on-chain...');
    return { success: true, message: 'Reputation anchoring initiated.' };
};

export const reputationService = {
    updateUserReputation,
    anchorReputationOnChain,
};

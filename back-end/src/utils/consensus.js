const calculateConsensus = (evaluations, threshold = 0.7) => {
    if (!evaluations || evaluations.length < 3) {
        return { approved: false, reason: 'Insufficient evaluations (minimum 3 required)' };
    }

    let totalWeight = 0n;
    let correctWeight = 0n;

    for (const evalItem of evaluations) {
        const weight = BigInt(evalItem.evaluator?.reputation_score || 1);
        totalWeight += weight;
        if (evalItem.is_correct) {
            correctWeight += weight;
        }
    }

    if (totalWeight === 0n) {
        return { approved: false, reason: 'No valid evaluator weights' };
    }

    const consensusRatio = Number(correctWeight) / Number(totalWeight);
    const isApproved = consensusRatio >= threshold;

    return {
        approved: isApproved,
        consensusRatio: Math.round(consensusRatio * 10000) / 100,
        totalEvaluators: evaluations.length,
        totalWeight: totalWeight.toString(),
        correctWeight: correctWeight.toString(),
        threshold: threshold * 100
    };
};

const calculateConsensusSimple = (evaluations) => {
    if (!evaluations || evaluations.length < 3) {
        return { approved: false, reason: 'Insufficient evaluations' };
    }

    const correctCount = evaluations.filter(e => e.is_correct).length;
    const totalCount = evaluations.length;
    const ratio = correctCount / totalCount;

    return {
        approved: ratio >= 0.7,
        consensusRatio: Math.round(ratio * 10000) / 100,
        totalEvaluators: totalCount,
        correctCount
    };
};

module.exports = {
    calculateConsensus,
    calculateConsensusSimple
};

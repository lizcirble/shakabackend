-- add-evaluation-table-and-reputation.sql

-- Add reputation_score to the users table
ALTER TABLE users
ADD COLUMN reputation_score INTEGER DEFAULT 100; -- Starting reputation score

-- Create the evaluations table
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    evaluator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (submission_id, evaluator_id) -- Ensure a worker can only evaluate a submission once
);

-- Add an index for faster lookups on submission_id
CREATE INDEX idx_evaluations_submission_id ON evaluations(submission_id);

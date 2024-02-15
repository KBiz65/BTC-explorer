-- Create blocks table
CREATE TABLE blocks (
    block_hash VARCHAR(64) PRIMARY KEY,
    version BIGINT,
    versionHex VARCHAR(8),
    previous_block_hash VARCHAR(64),
    merkle_root VARCHAR(64),
    block_timestamp BIGINT, -- Storing as Unix timestamp (seconds since Unix epoch)
    mediantime BIGINT, -- Also considering mediantime as Unix timestamp for consistency
    nonce BIGINT,
    bits CHAR(8),
    difficulty NUMERIC,
    chainwork VARCHAR(64),
    nTx BIGINT,
    height BIGINT,
    strippedsize BIGINT,
    size BIGINT,
    weight BIGINT,
    block_reward NUMERIC,
    DB_Timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE transactions (
    txid VARCHAR(64) PRIMARY KEY,
    txhash VARCHAR(64),
    block_hash VARCHAR(64),
    size BIGINT,
    virtual_size BIGINT,
    weight BIGINT,
    lock_time BIGINT,
    version BIGINT,
    fees NUMERIC,
    FOREIGN KEY (block_hash) REFERENCES blocks(block_hash)
);

-- Create outputs table with unique constraint
CREATE TABLE outputs (
    output_id BIGSERIAL PRIMARY KEY,
    txid VARCHAR(64),
    amount NUMERIC,
    output_index BIGINT,
    address VARCHAR(100),
    spent BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (txid) REFERENCES transactions(txid),
    UNIQUE (txid, output_index)
);

-- Create inputs table with unique constraint
CREATE TABLE inputs (
    input_id BIGSERIAL PRIMARY KEY,
    txid VARCHAR(64),
    referenced_txid VARCHAR(64),
    referenced_output_index BIGINT,
    input_sequence BIGINT,
    FOREIGN KEY (txid) REFERENCES transactions(txid),
    UNIQUE (txid, referenced_txid, referenced_output_index)
);

-- Create witnesses table
CREATE TABLE witnesses (
    witness_id BIGSERIAL PRIMARY KEY,
    input_id BIGINT,
    witness_data TEXT[],
    FOREIGN KEY (input_id) REFERENCES inputs(input_id),
    UNIQUE (input_id, witness_data)
);

-- Create error_logs table
CREATE TABLE error_logs (
    log_id BIGSERIAL PRIMARY KEY,
    error_type VARCHAR(255) NOT NULL,
    error_message TEXT NOT NULL,
    associated_block_hash VARCHAR(64),
    associated_transaction_hash VARCHAR(64),
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bitcoin_prices table
CREATE TABLE bitcoin_prices (
  date DATE PRIMARY KEY,
  price NUMERIC
);

-- Indexes
CREATE INDEX idx_blocks_height ON blocks(height);
CREATE INDEX idx_outputs_txid_output_index ON outputs(txid, output_index);
CREATE INDEX idx_outputs_address ON outputs(address);
CREATE INDEX idx_transactions_block_hash ON transactions(block_hash);
CREATE INDEX idx_inputs_txid ON inputs(txid);
CREATE INDEX idx_inputs_referenced ON inputs(referenced_txid, referenced_output_index);
CREATE INDEX idx_witnesses_input_id ON witnesses(input_id);
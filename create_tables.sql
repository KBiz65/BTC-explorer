-- Create blocks table
CREATE TABLE blocks (
    block_hash VARCHAR(64) PRIMARY KEY,
    version BIGINT,
    previous_block_hash VARCHAR(64),
    merkle_root VARCHAR(64),
    block_time BIGINT,
    bits BIGINT,
    nonce BIGINT,
    height BIGINT,
    size BIGINT,
    weight BIGINT,
    num_transactions BIGINT,
    confirmations BIGINT,
    timestamp TIMESTAMP
);

-- Create transactions table
CREATE TABLE transactions (
    txid VARCHAR(64) PRIMARY KEY,
    block_hash VARCHAR(64),
    size BIGINT,
    virtual_size BIGINT,
    weight BIGINT,
    lock_time BIGINT,
    version BIGINT,
    fees NUMERIC,
    FOREIGN KEY (block_hash) REFERENCES blocks(block_hash)
);

-- Create inputs table with unique constraint
CREATE TABLE inputs (
    input_id BIGSERIAL PRIMARY KEY,
    txid VARCHAR(64),
    prev_txid VARCHAR(64),
    prev_vout BIGINT,
    input_sequence BIGINT,
    scripttype VARCHAR(50),
    FOREIGN KEY (txid) REFERENCES transactions(txid),
    UNIQUE (txid, prev_txid, prev_vout)
);

-- Create outputs table with unique constraint
CREATE TABLE outputs (
    output_id BIGSERIAL PRIMARY KEY,
    txid VARCHAR(64),
    amount NUMERIC,
    address VARCHAR(100),
    output_index BIGINT,
    scripttype VARCHAR(50),
    spent BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (txid) REFERENCES transactions(txid),
    UNIQUE (txid, output_index)
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
-- blocks
CREATE INDEX idx_blocks_height ON blocks(height);
CREATE INDEX idx_blocks_time_range ON blocks(block_time);

-- transactions
CREATE INDEX idx_transactions_block_hash ON transactions(block_hash);

-- inputs
CREATE INDEX idx_inputs_txid ON inputs(txid);
CREATE INDEX idx_inputs_input_id ON inputs(input_id);
CREATE INDEX idx_inputs_prev_txid_prev_vout ON inputs(prev_txid, prev_vout);
CREATE INDEX idx_inputs_scripttype ON inputs(scripttype);

-- outputs
CREATE INDEX idx_outputs_address ON outputs(address);
CREATE INDEX idx_outputs_spent ON outputs(spent);
CREATE INDEX idx_outputs_address_spent ON outputs(address, spent);
CREATE INDEX idx_outputs_txid_vout ON outputs(txid, output_index);

-- witnesses
CREATE INDEX idx_witnesses_input_id ON witnesses(input_id);

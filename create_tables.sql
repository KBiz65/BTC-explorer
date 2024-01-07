CREATE TABLE blocks (
    block_hash VARCHAR(64) PRIMARY KEY,
    version INT,
    previous_block_hash VARCHAR(64),
    merkle_root VARCHAR(64),
    block_time INT,
    bits INT,
    nonce BIGINT,
    height INT,
    size INT,
    weight INT,
    num_transactions INT,
    timestamp TIMESTAMP
);

CREATE TABLE transactions (
    txid VARCHAR(64) PRIMARY KEY,
    block_hash VARCHAR(64),
    size INT,
    virtual_size INT,
    weight INT,
    lock_time BIGINT,
    version BIGINT,
    fees NUMERIC, -- Use NUMERIC for currency values to handle large values and decimals
    FOREIGN KEY (block_hash) REFERENCES blocks(block_hash)
);

CREATE TABLE inputs (
    input_id SERIAL PRIMARY KEY,
    txid VARCHAR(64),
    prev_txid VARCHAR(64),
    prev_vout BIGINT,
    script_sig TEXT,
    input_sequence BIGINT,
    scripttype VARCHAR(50),
    FOREIGN KEY (txid) REFERENCES transactions(txid)
);

CREATE TABLE witnesses (
    witness_id SERIAL PRIMARY KEY,
    input_id INT,
    witness_data TEXT[], -- Array of witness data
    witness_type VARCHAR(50),
    FOREIGN KEY (input_id) REFERENCES inputs(input_id)
);

CREATE TABLE outputs (
    output_id SERIAL PRIMARY KEY,
    txid VARCHAR(64),
    amount NUMERIC,
    script_pub_key TEXT,
    address VARCHAR(100),
    output_index INT,
    scripttype VARCHAR(50),  -- Renamed from output_type to scripttype
    FOREIGN KEY (txid) REFERENCES transactions(txid)
);

CREATE TABLE error_logs (
    log_id SERIAL PRIMARY KEY,
    error_type VARCHAR(255) NOT NULL,
    error_message TEXT NOT NULL,
    associated_block_hash VARCHAR(64),
    associated_transaction_hash VARCHAR(64),
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Automatically captures the time of log entry
);

const truncateData = (stringToTruncate, type) => {
    if (type === 'txid') {
        return `${stringToTruncate.slice(0, 7)}...${stringToTruncate.slice(-7)}`
    }
}

const formatAmount = (amount) => {
    if (!amount) return;
    amount = Number(amount).toFixed(2);
    return parseFloat(amount).toLocaleString();
};

module.exports = {
    truncateData,
    formatAmount,
};

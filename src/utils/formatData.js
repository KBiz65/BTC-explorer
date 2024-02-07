const truncateData = (stringToTruncate, type) => {
    if (type === 'txid') {
        return `${stringToTruncate.slice(0, 7)}...${stringToTruncate.slice(-7)}`
    }
}

const formatPrice = (price) => {
    if (!price) return;
    price = Number(price).toFixed(2);
    return parseFloat(price).toLocaleString();
};

module.exports = {
    truncateData,
    formatPrice,
};

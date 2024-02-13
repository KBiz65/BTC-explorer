const calculateHashRate = (hashRate) => {
    if (!hashRate) return;
    hashRate = Number(hashRate);
    const units = ["H/s", "KH/s", "MH/s", "GH/s", "TH/s", "PH/s", "EH/s", "ZH/s", "YH/s"];
    let index = 0;

    while (hashRate >= 1000 && index < units.length - 1) {
        hashRate /= 1000;
        index++;
    }

    return hashRate.toFixed(2) + " " + units[index];
}

const calculateLargeNum = (largeNum) => {
    if (!largeNum) return;
    largeNum = Number(largeNum);
    const units = ["", "K", "M", "B", "T", "P", "E", "Z", "Y"];
    let index = 0;

    while (largeNum >= 1000 && index < units.length - 1) {
        largeNum /= 1000;
        index++;
    }

    return largeNum.toFixed(2) + " " + units[index];
}

const formatLargeNumber = (numToConvert) => {
    if (numToConvert) return numToConvert.toLocaleString();
}

module.exports = {
    calculateHashRate,
    calculateLargeNum,
    formatLargeNumber,
};

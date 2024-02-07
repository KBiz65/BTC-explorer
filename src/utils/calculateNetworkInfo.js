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

const calculateDifficulty = (difficulty) => {
    if (!difficulty) return;
    difficulty = Number(difficulty);
    const units = ["", "K", "M", "B", "T", "P", "E", "Z", "Y"];
    let index = 0;

    while (difficulty >= 1000 && index < units.length - 1) {
        difficulty /= 1000;
        index++;
    }

    return difficulty.toFixed(2) + " " + units[index];
}

const formatLargeNumber = (numToConvert) => {
    if (numToConvert) return numToConvert.toLocaleString();
}

module.exports = {
    calculateHashRate,
    calculateDifficulty,
    formatLargeNumber,
};

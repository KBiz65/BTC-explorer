const calculateTimePassed = (blockTime) => {
    const secondsPerMinute = 60;
    const secondsPerHour = 3600;
    const secondsPerDay = 86400;
    const secondsPerMonth = 2629746; // Average number of seconds in a month (30.44 days)
    const secondsPerYear = 31556952; // Average number of seconds in a year (365.24 days)

    // Calculate the difference in seconds between now and the passed timestamp
    const now = Date.now() / 1000; // Current timestamp in seconds
    let delta = Math.abs(now - blockTime); // Difference in seconds

    // Calculate the time difference for each unit
    const years = Math.floor(delta / secondsPerYear);
    delta -= years * secondsPerYear;
    const months = Math.floor(delta / secondsPerMonth);
    delta -= months * secondsPerMonth;
    const days = Math.floor(delta / secondsPerDay);
    delta -= days * secondsPerDay;
    const hours = Math.floor(delta / secondsPerHour);
    delta -= hours * secondsPerHour;
    const minutes = Math.floor(delta / secondsPerMinute);
    delta -= minutes * secondsPerMinute;
    const seconds = Math.floor(delta);

    // Prepare an array of time components
    const timeComponents = [
        { value: years, unit: 'yrs' },
        { value: months, unit: 'mths' },
        { value: days, unit: 'days' },
        { value: hours, unit: 'hrs' },
        { value: minutes, unit: 'min' },
        { value: seconds, unit: 'sec' },
    ];

    // Filter out components with value 0 and take the first two
    const nonZeroComponents = timeComponents.filter(c => c.value !== 0).slice(0, 2);

    // Format the output
    const output = nonZeroComponents.map(c => `${c.value} ${c.unit}`).join(' ');
    return output || '0 sec ago'; // Fallback to "0 sec ago" if all components are 0
}

module.exports = calculateTimePassed;

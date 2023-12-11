const path = require('path');
const { exec } = require('child_process');

function playStartChime() {
    const chimeFilePath = 'C:/Users/kevin/OneDrive/desktop/bitcoin-explorer/assets/bellNotify.wav';

    // PowerShell command to play the audio file
    const command = `powershell -c (New-Object Media.SoundPlayer "${chimeFilePath}").PlaySync();`;

    exec(command, (error) => {
        if (error) {
            console.error('Failed to play start chime:', error);
        }
    });
}

module.exports = {
    playStartChime
};

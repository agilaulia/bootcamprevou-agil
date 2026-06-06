/**
 * Verification script for TimeDisplay module
 * Run with: node verify-time-display.js
 */

// TimeDisplay module for testing
const TimeDisplay = {
    formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    },

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });
    }
};

console.log('=== TimeDisplay Module Verification ===\n');

// Test various times
const testCases = [
    { desc: 'Current time', date: new Date() },
    { desc: 'Midnight', date: new Date('2024-01-15T00:00:00') },
    { desc: 'Noon', date: new Date('2024-01-15T12:00:00') },
    { desc: 'Morning (9:15:30 AM)', date: new Date('2024-01-15T09:15:30') },
    { desc: 'Afternoon (2:30:45 PM)', date: new Date('2024-01-15T14:30:45') },
    { desc: 'Evening (6:45:00 PM)', date: new Date('2024-01-15T18:45:00') },
    { desc: 'Single digits (1:05:09 AM)', date: new Date('2024-01-15T01:05:09') }
];

console.log('Time Formatting Tests:\n');
testCases.forEach(test => {
    console.log(`${test.desc}:`);
    console.log(`  Time: ${TimeDisplay.formatTime(test.date)}`);
    console.log(`  Date: ${TimeDisplay.formatDate(test.date)}`);
    console.log('');
});

// Verify format patterns
console.log('Format Pattern Verification:\n');

const sampleDate = new Date('2024-06-25T16:45:30');
const timeStr = TimeDisplay.formatTime(sampleDate);
const dateStr = TimeDisplay.formatDate(sampleDate);

const timePattern = /^\d{2}:\d{2}:\d{2}\s(AM|PM)$/;
const isTimeValid = timePattern.test(timeStr);

console.log(`Time string: "${timeStr}"`);
console.log(`Matches HH:MM:SS AM/PM pattern: ${isTimeValid ? '✓ YES' : '✗ NO'}`);
console.log('');

console.log(`Date string: "${dateStr}"`);
console.log(`Contains day of week: ${dateStr.match(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/) ? '✓ YES' : '✗ NO'}`);
console.log(`Contains month name: ${dateStr.match(/January|February|March|April|May|June|July|August|September|October|November|December/) ? '✓ YES' : '✗ NO'}`);
console.log(`Contains day number: ${dateStr.match(/\d+/) ? '✓ YES' : '✗ NO'}`);
console.log('');

console.log('✓ TimeDisplay module verification complete!');

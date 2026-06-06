/**
 * Unit Tests for To-Do Life Dashboard
 * Run these tests by opening test.html in a browser and checking the console
 */

(function() {
    'use strict';

    // Import the StorageService (we'll need to expose it from app.js for testing)
    // For now, we'll create a standalone version for testing

    const StorageService = {
        isAvailable: (function() {
            try {
                const testKey = '__storage_test__';
                localStorage.setItem(testKey, 'test');
                localStorage.removeItem(testKey);
                return true;
            } catch (e) {
                console.warn('LocalStorage is not available. Data will not persist across sessions.');
                return false;
            }
        })(),

        _memoryStorage: {},

        get(key, defaultValue) {
            try {
                let value;
                
                if (this.isAvailable) {
                    value = localStorage.getItem(key);
                } else {
                    value = this._memoryStorage[key];
                }

                if (value === null || value === undefined) {
                    return defaultValue;
                }

                try {
                    return JSON.parse(value);
                } catch (parseError) {
                    console.error(`Failed to parse stored data for key "${key}":`, parseError);
                    return defaultValue;
                }
            } catch (error) {
                console.error(`Error reading from storage for key "${key}":`, error);
                return defaultValue;
            }
        },

        set(key, value) {
            try {
                const serializedValue = JSON.stringify(value);
                
                if (this.isAvailable) {
                    try {
                        localStorage.setItem(key, serializedValue);
                    } catch (e) {
                        if (e.name === 'QuotaExceededError') {
                            console.error('Storage quota exceeded. Please clear some data.');
                            return false;
                        }
                        throw e;
                    }
                } else {
                    this._memoryStorage[key] = serializedValue;
                }
                
                return true;
            } catch (error) {
                console.error(`Error writing to storage for key "${key}":`, error);
                return false;
            }
        },

        remove(key) {
            try {
                if (this.isAvailable) {
                    localStorage.removeItem(key);
                } else {
                    delete this._memoryStorage[key];
                }
                return true;
            } catch (error) {
                console.error(`Error removing key "${key}" from storage:`, error);
                return false;
            }
        },

        clear() {
            try {
                if (this.isAvailable) {
                    localStorage.clear();
                } else {
                    this._memoryStorage = {};
                }
                return true;
            } catch (error) {
                console.error('Error clearing storage:', error);
                return false;
            }
        }
    };

    // Test utilities
    const testResults = {
        passed: 0,
        failed: 0,
        total: 0
    };

    function assert(condition, testName) {
        testResults.total++;
        if (condition) {
            testResults.passed++;
            console.log(`✓ PASS: ${testName}`);
        } else {
            testResults.failed++;
            console.error(`✗ FAIL: ${testName}`);
        }
    }

    function assertEqual(actual, expected, testName) {
        const condition = JSON.stringify(actual) === JSON.stringify(expected);
        if (!condition) {
            console.error(`  Expected: ${JSON.stringify(expected)}`);
            console.error(`  Actual: ${JSON.stringify(actual)}`);
        }
        assert(condition, testName);
    }

    // Clear storage before tests
    StorageService.clear();

    console.log('\n=== Storage Service Tests ===\n');

    // Test 1: Set and get a string value
    StorageService.set('testString', 'Hello World');
    const retrievedString = StorageService.get('testString', '');
    assertEqual(retrievedString, 'Hello World', 'Should store and retrieve string values');

    // Test 2: Set and get a number value
    StorageService.set('testNumber', 42);
    const retrievedNumber = StorageService.get('testNumber', 0);
    assertEqual(retrievedNumber, 42, 'Should store and retrieve number values');

    // Test 3: Set and get an object
    const testObject = { name: 'Test', value: 123, nested: { key: 'value' } };
    StorageService.set('testObject', testObject);
    const retrievedObject = StorageService.get('testObject', {});
    assertEqual(retrievedObject, testObject, 'Should store and retrieve objects');

    // Test 4: Set and get an array
    const testArray = [1, 2, 3, 'four', { five: 5 }];
    StorageService.set('testArray', testArray);
    const retrievedArray = StorageService.get('testArray', []);
    assertEqual(retrievedArray, testArray, 'Should store and retrieve arrays');

    // Test 5: Get with default value when key doesn't exist
    const defaultValue = 'default';
    const nonExistent = StorageService.get('nonExistentKey', defaultValue);
    assertEqual(nonExistent, defaultValue, 'Should return default value when key does not exist');

    // Test 6: Remove a key
    StorageService.set('toRemove', 'temporary');
    StorageService.remove('toRemove');
    const afterRemoval = StorageService.get('toRemove', 'gone');
    assertEqual(afterRemoval, 'gone', 'Should remove key from storage');

    // Test 7: Clear all storage
    StorageService.set('key1', 'value1');
    StorageService.set('key2', 'value2');
    StorageService.clear();
    const afterClear1 = StorageService.get('key1', 'cleared');
    const afterClear2 = StorageService.get('key2', 'cleared');
    assertEqual(afterClear1, 'cleared', 'Should clear all keys (key1)');
    assertEqual(afterClear2, 'cleared', 'Should clear all keys (key2)');

    // Test 8: Boolean values
    StorageService.set('testTrue', true);
    StorageService.set('testFalse', false);
    const retrievedTrue = StorageService.get('testTrue', false);
    const retrievedFalse = StorageService.get('testFalse', true);
    assertEqual(retrievedTrue, true, 'Should store and retrieve true boolean');
    assertEqual(retrievedFalse, false, 'Should store and retrieve false boolean');

    // Test 9: Null and undefined handling
    StorageService.set('testNull', null);
    const retrievedNull = StorageService.get('testNull', 'default');
    assertEqual(retrievedNull, null, 'Should store and retrieve null');

    // Test 10: Empty string
    StorageService.set('testEmptyString', '');
    const retrievedEmpty = StorageService.get('testEmptyString', 'default');
    assertEqual(retrievedEmpty, '', 'Should store and retrieve empty string');

    // Test 11: Zero value
    StorageService.set('testZero', 0);
    const retrievedZero = StorageService.get('testZero', 99);
    assertEqual(retrievedZero, 0, 'Should store and retrieve zero');

    // Test 12: Complex nested structure
    const complexData = {
        tasks: [
            { id: '1', text: 'Task 1', completed: false, createdAt: 1234567890 },
            { id: '2', text: 'Task 2', completed: true, createdAt: 1234567891 }
        ],
        settings: {
            userName: 'John',
            timerDuration: 25,
            theme: 'dark'
        }
    };
    StorageService.set('complexData', complexData);
    const retrievedComplex = StorageService.get('complexData', {});
    assertEqual(retrievedComplex, complexData, 'Should store and retrieve complex nested structures');

    // Test 13: Storage availability check
    assert(typeof StorageService.isAvailable === 'boolean', 'Should have isAvailable property as boolean');

    // Test 14: userName storage (Requirement 3.2)
    StorageService.set('userName', 'Alice');
    const userName = StorageService.get('userName', '');
    assertEqual(userName, 'Alice', 'Should store and retrieve userName for greeting');

    // Test 15: timerDuration storage (Requirement 5.2)
    StorageService.set('timerDuration', 30);
    const timerDuration = StorageService.get('timerDuration', 25);
    assertEqual(timerDuration, 30, 'Should store and retrieve timerDuration');

    // Test 16: theme preference storage (Requirement 13.3)
    StorageService.set('theme', 'dark');
    const theme = StorageService.get('theme', 'light');
    assertEqual(theme, 'dark', 'Should store and retrieve theme preference');

    // Test 17: tasks array storage (Requirement 6.3)
    const tasks = [
        { id: 'uuid-1', text: 'Buy groceries', completed: false, createdAt: Date.now() },
        { id: 'uuid-2', text: 'Finish project', completed: true, createdAt: Date.now() }
    ];
    StorageService.set('tasks', tasks);
    const retrievedTasks = StorageService.get('tasks', []);
    assertEqual(retrievedTasks, tasks, 'Should store and retrieve tasks array');

    // Test 18: quickLinks array storage (Requirement 10.3)
    const links = [
        { id: 'link-1', name: 'Google', url: 'https://google.com' },
        { id: 'link-2', name: 'GitHub', url: 'https://github.com' }
    ];
    StorageService.set('quickLinks', links);
    const retrievedLinks = StorageService.get('quickLinks', []);
    assertEqual(retrievedLinks, links, 'Should store and retrieve quickLinks array');

    console.log('\n=== Time Display Module Tests ===\n');

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

    // Test 19: formatTime produces valid 12-hour format with AM/PM
    const testDate1 = new Date('2024-01-15T14:30:45'); // 2:30:45 PM
    const formattedTime1 = TimeDisplay.formatTime(testDate1);
    assert(formattedTime1.includes('PM'), 'formatTime should include PM for afternoon times');
    assert(formattedTime1.includes('30'), 'formatTime should include minutes');
    assert(formattedTime1.includes('45'), 'formatTime should include seconds');

    // Test 20: formatTime handles midnight correctly (12:00 AM)
    const midnight = new Date('2024-01-15T00:00:00');
    const formattedMidnight = TimeDisplay.formatTime(midnight);
    assert(formattedMidnight.includes('12') && formattedMidnight.includes('AM'), 
           'formatTime should format midnight as 12:XX:XX AM');

    // Test 21: formatTime handles noon correctly (12:00 PM)
    const noon = new Date('2024-01-15T12:00:00');
    const formattedNoon = TimeDisplay.formatTime(noon);
    assert(formattedNoon.includes('12') && formattedNoon.includes('PM'), 
           'formatTime should format noon as 12:XX:XX PM');

    // Test 22: formatTime handles morning times with AM
    const morning = new Date('2024-01-15T09:15:30'); // 9:15:30 AM
    const formattedMorning = TimeDisplay.formatTime(morning);
    assert(formattedMorning.includes('AM'), 'formatTime should include AM for morning times');
    assert(formattedMorning.includes('15'), 'formatTime should include correct minutes');

    // Test 23: formatDate includes day of week
    const testDate2 = new Date('2024-01-15'); // Monday
    const formattedDate = TimeDisplay.formatDate(testDate2);
    assert(formattedDate.includes('Monday'), 'formatDate should include day of week');

    // Test 24: formatDate includes month name
    const testDate3 = new Date('2024-03-15');
    const formattedDate2 = TimeDisplay.formatDate(testDate3);
    assert(formattedDate2.includes('March'), 'formatDate should include month name');

    // Test 25: formatDate includes day number
    const testDate4 = new Date('2024-06-25');
    const formattedDate3 = TimeDisplay.formatDate(testDate4);
    assert(formattedDate3.includes('25'), 'formatDate should include day number');

    // Test 26: formatDate format verification (should match pattern)
    const testDate5 = new Date('2024-12-25');
    const formattedDate4 = TimeDisplay.formatDate(testDate5);
    // Should be like "Wednesday, December 25"
    assert(formattedDate4.split(',').length === 2, 
           'formatDate should contain a comma separating day and date');

    // Test 27: formatTime with single-digit hours
    const singleHour = new Date('2024-01-15T01:05:09'); // 1:05:09 AM
    const formattedSingle = TimeDisplay.formatTime(singleHour);
    assert(formattedSingle.includes('01') && formattedSingle.includes('05') && formattedSingle.includes('09'), 
           'formatTime should zero-pad single-digit hours, minutes, and seconds');

    // Test 28: formatTime consistent output format
    const testDate6 = new Date('2024-01-15T16:45:30'); // 4:45:30 PM
    const formatted = TimeDisplay.formatTime(testDate6);
    const timePattern = /^\d{2}:\d{2}:\d{2}\s(AM|PM)$/;
    assert(timePattern.test(formatted), 
           'formatTime should produce format HH:MM:SS AM/PM');

    // Print summary
    console.log('\n=== Test Summary ===');
    console.log(`Total: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);

    if (testResults.failed === 0) {
        console.log('\n🎉 All tests passed!');
    } else {
        console.error(`\n❌ ${testResults.failed} test(s) failed`);
    }

})();

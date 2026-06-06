/**
 * Node.js verification script for StorageService logic
 * This simulates the StorageService behavior without browser localStorage
 */

// Simulate localStorage for Node.js environment
class LocalStorageMock {
    constructor() {
        this.store = {};
    }

    getItem(key) {
        return this.store[key] || null;
    }

    setItem(key, value) {
        this.store[key] = String(value);
    }

    removeItem(key) {
        delete this.store[key];
    }

    clear() {
        this.store = {};
    }
}

const localStorage = new LocalStorageMock();

// StorageService implementation (same as in app.js)
const StorageService = {
    isAvailable: true,
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
                localStorage.setItem(key, serializedValue);
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

// Run verification tests
console.log('=== StorageService Verification ===\n');

let passed = 0;
let failed = 0;

function test(description, callback) {
    try {
        callback();
        console.log(`✓ ${description}`);
        passed++;
    } catch (error) {
        console.error(`✗ ${description}`);
        console.error(`  ${error.message}`);
        failed++;
    }
}

function assertEquals(actual, expected, message = '') {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
        throw new Error(`${message}\n  Expected: ${expectedStr}\n  Actual: ${actualStr}`);
    }
}

// Clear before tests
StorageService.clear();

// Test basic string storage
test('Store and retrieve string', () => {
    StorageService.set('test', 'value');
    const result = StorageService.get('test', '');
    assertEquals(result, 'value');
});

// Test number storage
test('Store and retrieve number', () => {
    StorageService.set('number', 42);
    const result = StorageService.get('number', 0);
    assertEquals(result, 42);
});

// Test object storage
test('Store and retrieve object', () => {
    const obj = { name: 'Test', value: 123 };
    StorageService.set('object', obj);
    const result = StorageService.get('object', {});
    assertEquals(result, obj);
});

// Test array storage
test('Store and retrieve array', () => {
    const arr = [1, 2, 3, 'four'];
    StorageService.set('array', arr);
    const result = StorageService.get('array', []);
    assertEquals(result, arr);
});

// Test default value
test('Return default value for missing key', () => {
    const result = StorageService.get('nonexistent', 'default');
    assertEquals(result, 'default');
});

// Test remove
test('Remove key from storage', () => {
    StorageService.set('toRemove', 'temp');
    StorageService.remove('toRemove');
    const result = StorageService.get('toRemove', 'gone');
    assertEquals(result, 'gone');
});

// Test clear
test('Clear all storage', () => {
    StorageService.set('key1', 'value1');
    StorageService.set('key2', 'value2');
    StorageService.clear();
    const result1 = StorageService.get('key1', null);
    const result2 = StorageService.get('key2', null);
    assertEquals(result1, null);
    assertEquals(result2, null);
});

// Test userName (Requirement 3.2)
test('Store and retrieve userName (Req 3.2)', () => {
    StorageService.set('userName', 'Alice');
    const result = StorageService.get('userName', '');
    assertEquals(result, 'Alice');
});

// Test timerDuration (Requirement 5.2)
test('Store and retrieve timerDuration (Req 5.2)', () => {
    StorageService.set('timerDuration', 30);
    const result = StorageService.get('timerDuration', 25);
    assertEquals(result, 30);
});

// Test theme (Requirement 13.3)
test('Store and retrieve theme (Req 13.3)', () => {
    StorageService.set('theme', 'dark');
    const result = StorageService.get('theme', 'light');
    assertEquals(result, 'dark');
});

// Test tasks array (Requirement 6.3)
test('Store and retrieve tasks array (Req 6.3)', () => {
    const tasks = [
        { id: '1', text: 'Task 1', completed: false, createdAt: 1234567890 },
        { id: '2', text: 'Task 2', completed: true, createdAt: 1234567891 }
    ];
    StorageService.set('tasks', tasks);
    const result = StorageService.get('tasks', []);
    assertEquals(result, tasks);
});

// Test quickLinks array (Requirement 10.3)
test('Store and retrieve quickLinks array (Req 10.3)', () => {
    const links = [
        { id: '1', name: 'Google', url: 'https://google.com' },
        { id: '2', name: 'GitHub', url: 'https://github.com' }
    ];
    StorageService.set('quickLinks', links);
    const result = StorageService.get('quickLinks', []);
    assertEquals(result, links);
});

// Test boolean values
test('Store and retrieve boolean true', () => {
    StorageService.set('boolTrue', true);
    const result = StorageService.get('boolTrue', false);
    assertEquals(result, true);
});

test('Store and retrieve boolean false', () => {
    StorageService.set('boolFalse', false);
    const result = StorageService.get('boolFalse', true);
    assertEquals(result, false);
});

// Test null value
test('Store and retrieve null', () => {
    StorageService.set('nullValue', null);
    const result = StorageService.get('nullValue', 'default');
    assertEquals(result, null);
});

// Test empty string
test('Store and retrieve empty string', () => {
    StorageService.set('empty', '');
    const result = StorageService.get('empty', 'default');
    assertEquals(result, '');
});

// Test zero
test('Store and retrieve zero', () => {
    StorageService.set('zero', 0);
    const result = StorageService.get('zero', 99);
    assertEquals(result, 0);
});

// Test complex nested structure
test('Store and retrieve complex nested structure', () => {
    const complex = {
        tasks: [
            { id: '1', text: 'Task', completed: false, createdAt: 123 }
        ],
        settings: {
            userName: 'John',
            timerDuration: 25,
            theme: 'dark'
        }
    };
    StorageService.set('complex', complex);
    const result = StorageService.get('complex', {});
    assertEquals(result, complex);
});

// Test fallback mode (simulate localStorage unavailable)
test('Fallback to memory storage when localStorage unavailable', () => {
    const originalAvailable = StorageService.isAvailable;
    StorageService.isAvailable = false;
    StorageService._memoryStorage = {};
    
    StorageService.set('memoryKey', 'memoryValue');
    const result = StorageService.get('memoryKey', '');
    
    assertEquals(result, 'memoryValue');
    
    // Restore
    StorageService.isAvailable = originalAvailable;
});

console.log('\n=== Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed === 0) {
    console.log('\n✅ All verifications passed!');
    process.exit(0);
} else {
    console.log(`\n❌ ${failed} verification(s) failed`);
    process.exit(1);
}

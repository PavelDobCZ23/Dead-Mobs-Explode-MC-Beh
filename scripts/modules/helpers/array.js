/**
 * @description Inserts value at the first empty index in the array and returns the index.
 * @param {Array} array - Array to insert the value into.
 * @param {*} value - Value to insert into the array.
 * @returns {Number} Index that the value was inserted to.
 **/
 function insertToArray(array, value) {
    for (let index = 0;true;index++) {
        if (array[index] == null) {
            array[index] = value;
            return index
        }
    }
}

/**
 * 
 * @param {Array} array - Array to get the mode of.
 * @returns {Array} Array of 2 values - first value is array of all the modes found and second is the amount of times each mode is found in the array.
 */
function getMode(array) {
    const items = new Map();
    let mode = [[null],-1];

    for (const item of array) {
        const value = items.get(item);
        if (value == null) {
            items.set(item, 1);
        } else {
            items.set(item, value+1);
        }
    }
    for (const item of items) {
        if (item[1] > mode[1]) {
            mode[0] = [item[0]];
            mode[1] = item[1];
        } else if (item[1] === mode[1]) {
            mode[0].push(item[0]);
        }
    }

    return mode
}


function containsArray(array,item) {
    const indexes = item.length;
    let found = false;
    arrayLoop: 
    for (const element of array) {
        for (let index = 0; index < indexes; index++) {
            if (!(element[index] === item[index])) {
                continue arrayLoop
            }
        }
        found = true;
        break arrayLoop 
    }
    return found
}

export {insertToArray, getMode, containsArray}
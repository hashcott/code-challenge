// Method 1: Using mathematical formula - O(1) time complexity, O(1) space complexity
// Most efficient approach using arithmetic series formula
function sum_to_n_a(n: number): number {
    return (n * (n + 1)) / 2;
}

// Method 2: Using for loop - O(n) time complexity, O(1) space complexity
// Iterative approach, stable for all values of n
function sum_to_n_b(n: number): number {
    let sum = 0;
    for (let i = 1; i <= n; i++) {
        sum += i;
    }
    return sum;
}

// Method 3: Using recursion - O(n) time complexity, O(n) space complexity (call stack)
// Recursive approach, may cause stack overflow for large n
function sum_to_n_c(n: number): number {
    if (n <= 0) return 0;
    if (n === 1) return 1;
    return n + sum_to_n_c(n - 1);
}

// Test cases
console.log("sum_to_n_a(5):", sum_to_n_a(5)); // 15
console.log("sum_to_n_b(5):", sum_to_n_b(5)); // 15
console.log("sum_to_n_c(5):", sum_to_n_c(5)); // 15

console.log("sum_to_n_a(10):", sum_to_n_a(10)); // 55
console.log("sum_to_n_b(10):", sum_to_n_b(10)); // 55
console.log("sum_to_n_c(10):", sum_to_n_c(10)); // 55

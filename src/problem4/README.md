# Sum to N - TypeScript Implementation

## Problem Description

Implement a function that calculates the summation from 1 to n using 3 different approaches in TypeScript.

### Requirements
- Provide 3 unique implementations of the sum function
- Comment on the complexity and efficiency of each function
- Handle any integer input that produces a result less than `Number.MAX_SAFE_INTEGER`

### Input/Output
- **Input**: `n` - any integer
- **Output**: Summation from 1 to n (e.g., `sum_to_n(5) === 1 + 2 + 3 + 4 + 5 === 15`)

## Function Signatures

```typescript
function sum_to_n_a(n: number): number {
    // Implementation 1
}

function sum_to_n_b(n: number): number {
    // Implementation 2
}

function sum_to_n_c(n: number): number {
    // Implementation 3
}
```

## How to Run

### Option 1: Using ts-node (Recommended)
```bash
# Install ts-node globally if not already installed
npm install -g ts-node

# Run the TypeScript file directly
npx ts-node resolve.ts
```

### Option 2: Compile to JavaScript first
```bash
# Compile TypeScript to JavaScript
npx tsc resolve.ts

# Run the compiled JavaScript file
node resolve.js
```

### Option 3: Using tsx (Alternative)
```bash
# Install tsx globally
npm install -g tsx

# Run TypeScript file directly
npx tsx resolve.ts
```

## Implementation Approaches

| Method | Approach | Time Complexity | Space Complexity | Description |
|--------|----------|----------------|------------------|-------------|
| `sum_to_n_a` | Mathematical Formula | O(1) | O(1) | Uses arithmetic series formula |
| `sum_to_n_b` | Iterative Loop | O(n) | O(1) | For loop iteration |
| `sum_to_n_c` | Recursion | O(n) | O(n) | Recursive approach |

## Performance Analysis

- **Method A**: Most efficient with constant time complexity
- **Method B**: Linear time, constant space - stable for all inputs
- **Method C**: Linear time and space - may cause stack overflow for large n

## Test Cases

The implementation includes test cases for:
- `n = 5` → Expected output: `15`
- `n = 10` → Expected output: `55`
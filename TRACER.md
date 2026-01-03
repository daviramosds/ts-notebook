# 🔍 Algorithm Tracer Guide

The **Algorithm Tracer** allows you to visualize the execution of your code step-by-step. It works for both **TypeScript/JavaScript** and **Python**.

## 🚀 How it Works

The `tracer` object is globally available in your code cells. You don't need to install anything.
By calling `tracer.addStep()` (TS) or `tracer.add_step()` (Python) at key points in your algorithm, you create a "frame" that captures the current state of variables and arrays.

After execution, click the **Lightning Bolt (⚡)** icon in the cell sidebar to open the visualizer.

---

## 🟦 TypeScript / JavaScript

In TypeScript cells, access the tracer via `window.tracer` (or type cast `any` if Typescript complains).

### API

1.  **`tracer.reset()`**
    *   Clears previous steps. **Always call this at the start.**

2.  **`tracer.addStep(description, variables, arrays)`**
    *   `description` (string): What is happening now.
    *   `variables` (object): Key-value pairs of variables to show.
    *   `arrays` (array): List of array objects to visualize interactively.

### Example: Bubble Sort (TS)

```typescript
const tracer = (window as any).tracer;

function bubbleSort(arr: number[]) {
  tracer.reset(); // 1. Reset
  
  const data = [...arr];
  
  tracer.addStep('Start', { data }, [{ name: 'Array', values: data }]);
  
  for(let i = 0; i < data.length; i++) {
    for(let j = 0; j < data.length - i - 1; j++) {
      
      // 2. Add Step with highlights
      tracer.addStep(
        `Comparing ${data[j]} > ${data[j+1]}`, 
        { i, j, val1: data[j], val2: data[j+1] }, 
        [{ 
           name: 'Array', 
           values: data, 
           highlights: [j, j+1] // Indices to highlight (Yellow)
        }]
      );
      
      if(data[j] > data[j+1]) {
        [data[j], data[j+1]] = [data[j+1], data[j]];
      }
    }
  }
  return data;
}

bubbleSort([5, 1, 4, 2, 8]);
```

---

## 🐍 Python

In Python cells, `tracer` is available directly in the global scope.

### API

1.  **`tracer.reset()`**
    *   Resets the step counter.

2.  **`tracer.add_step(description, variables, arrays)`**
    *   `description` (str): Text description.
    *   `variables` (dict): Dictionary of variables.
    *   `arrays` (list): List of dicts `{'name': '...', 'values': [...], 'highlights': [...]}`.

### Example: Two Sum (Python)

```python
def two_sum(nums, target):
    tracer.reset() # 1. Reset
    
    seen = {}
    
    for i, num in enumerate(nums):
        complement = target - num
        
        # 2. Add Step
        tracer.add_step(
            f"Checking index {i}, val {num}",
            { "curr": num, "target": target, "seen": str(seen) },
            [{ 
                "name": "nums", 
                "values": nums, 
                "highlights": [i] # Indices to highlight
            }]
        )
        
        if complement in seen:
            return [seen[complement], i]
            
        seen[num] = i
        
    return []

two_sum([2, 7, 11, 15], 9)
```

---

## 📊 Visualizer Features

When you execute code with tracer steps:

1.  **Step-by-Step Navigation**: Use Previous/Next buttons to walk through history.
2.  **Auto Play**: Press Play to watch the algorithm run automatically.
3.  **Speed Control**: Adjust playback speed (0.5x to 4x).
4.  **Variable Inspection**: See the value of variables at each exact moment in time.
5.  **Array Visualization**: Arrays are drawn as boxes. `highlights` indices appear in **Yellow**.

## ⚠️ Tips

- **Reset**: If you forget `tracer.reset()`, steps from previous runs might accumulate.
- **Large Data**: Avoid tracing inside loops running 10,000+ times, as it generates huge rendering data. Limit it to small examples (e.g., array size 10-20).
- **Python Dicts**: For Python dictionaries, convert them to string `str(my_dict)` if you want to see the whole object in the variable list, otherwise Pyodide might try to pass them by reference.

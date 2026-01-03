// Algorithm visualization helper
// Use this to instrument your code and capture execution steps

export interface AlgorithmStep {
  step: number;
  description: string;
  variables: Record<string, any>;
  highlightIndices?: number[];
  arrays?: {
    name: string;
    values: any[];
    highlights?: number[];
  }[];
}

class AlgorithmTracer {
  private steps: AlgorithmStep[] = [];
  private stepCounter = 0;

  reset() {
    this.steps = [];
    this.stepCounter = 0;
  }

  addStep(description: string, variables: Record<string, any>, arrays?: AlgorithmStep['arrays']) {
    this.steps.push({
      step: this.stepCounter++,
      description,
      variables,
      arrays
    });
  }

  getSteps(): AlgorithmStep[] {
    return this.steps;
  }

  setSteps(steps: AlgorithmStep[]) {
    this.steps = steps;
    this.stepCounter = steps.length;
  }
}

// Global tracer instance
export const tracer = new AlgorithmTracer();

// Make tracer available globally for code cells
if (typeof window !== 'undefined') {
  (window as any).tracer = tracer;
}

// Also export as default
export default tracer;

// Example usage for twoSum:
/*
function twoSum(nums: number[], target: number): number[] {
  tracer.reset();
  
  const map = new Map<number, number>();
  
  tracer.addStep('Inicializando HashMap vazio', { target, map: {} }, [{
    name: 'nums',
    values: nums,
    highlights: []
  }]);
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    
    tracer.addStep(`Verificando índice ${i}: nums[${i}] = ${nums[i]}`, {
      i,
      'nums[i]': nums[i],
      complement,
      map: Object.fromEntries(map)
    }, [{
      name: 'nums',
      values: nums,
      highlights: [i]
    }]);
    
    if (map.has(complement)) {
      const result = [map.get(complement)!, i];
      tracer.addStep(`Encontrado! complement ${complement} no índice ${map.get(complement)}`, {
        result,
        map: Object.fromEntries(map)
      }, [{
        name: 'nums',
        values: nums,
        highlights: [map.get(complement)!, i]
      }]);
      return result;
    }
    
    map.set(nums[i], i);
    tracer.addStep(`Adicionando ${nums[i]} -> ${i} ao map`, {
      map: Object.fromEntries(map)
    }, [{
      name: 'nums',
      values: nums,
      highlights: []
    }]);
  }
  
  tracer.addStep('Nenhum par encontrado', { map: Object.fromEntries(map) });
  return [];
}

// Execute
const result = twoSum([2, 7, 11, 15], 9);

// Steps are available in tracer.getSteps()
*/

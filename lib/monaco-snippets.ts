/**
 * Monaco Editor Snippets for TypeScript/JavaScript
 * Common code patterns for faster development
 */

export interface SnippetDefinition {
  label: string;
  insertText: string;
  detail: string;
  documentation?: string;
}

// TypeScript/JavaScript common snippets
export const tsJsSnippets: SnippetDefinition[] = [
  // Functions
  {
    label: 'fn',
    insertText: 'const ${1:name} = (${2:params}) => {\n\t$0\n};',
    detail: 'Arrow function',
    documentation: 'Creates an arrow function expression'
  },
  {
    label: 'afn',
    insertText: 'const ${1:name} = async (${2:params}) => {\n\t$0\n};',
    detail: 'Async arrow function',
    documentation: 'Creates an async arrow function expression'
  },
  {
    label: 'func',
    insertText: 'function ${1:name}(${2:params}) {\n\t$0\n}',
    detail: 'Function declaration',
    documentation: 'Creates a function declaration'
  },
  {
    label: 'afunc',
    insertText: 'async function ${1:name}(${2:params}) {\n\t$0\n}',
    detail: 'Async function declaration',
    documentation: 'Creates an async function declaration'
  },

  // Console
  {
    label: 'log',
    insertText: 'console.log($0);',
    detail: 'console.log()',
    documentation: 'Log output to console'
  },
  {
    label: 'clg',
    insertText: 'console.log($0);',
    detail: 'console.log()',
    documentation: 'Log output to console (alias)'
  },
  {
    label: 'clog',
    insertText: 'console.log(\'${1:label}:\', ${2:value});',
    detail: 'console.log with label',
    documentation: 'Log output with a label'
  },
  {
    label: 'cerr',
    insertText: 'console.error($0);',
    detail: 'console.error()',
    documentation: 'Log error to console'
  },
  {
    label: 'cwarn',
    insertText: 'console.warn($0);',
    detail: 'console.warn()',
    documentation: 'Log warning to console'
  },
  {
    label: 'ctable',
    insertText: 'console.table($0);',
    detail: 'console.table()',
    documentation: 'Display data as table'
  },

  // Control flow
  {
    label: 'iife',
    insertText: '(async () => {\n\t$0\n})();',
    detail: 'Async IIFE',
    documentation: 'Immediately Invoked Function Expression (async)'
  },
  {
    label: 'trycatch',
    insertText: 'try {\n\t$1\n} catch (${2:error}) {\n\t$0\n}',
    detail: 'try/catch block',
    documentation: 'Try-catch error handling'
  },
  {
    label: 'tryf',
    insertText: 'try {\n\t$1\n} catch (${2:error}) {\n\t$3\n} finally {\n\t$0\n}',
    detail: 'try/catch/finally',
    documentation: 'Try-catch-finally error handling'
  },
  {
    label: 'ife',
    insertText: 'if (${1:condition}) {\n\t$0\n}',
    detail: 'if statement',
    documentation: 'If conditional statement'
  },
  {
    label: 'ifel',
    insertText: 'if (${1:condition}) {\n\t$2\n} else {\n\t$0\n}',
    detail: 'if/else statement',
    documentation: 'If-else conditional statement'
  },
  {
    label: 'tern',
    insertText: '${1:condition} ? ${2:true} : ${3:false}',
    detail: 'Ternary operator',
    documentation: 'Conditional ternary expression'
  },
  {
    label: 'switch',
    insertText: 'switch (${1:key}) {\n\tcase ${2:value}:\n\t\t$0\n\t\tbreak;\n\tdefault:\n\t\tbreak;\n}',
    detail: 'switch statement',
    documentation: 'Switch statement'
  },

  // Loops
  {
    label: 'forof',
    insertText: 'for (const ${1:item} of ${2:array}) {\n\t$0\n}',
    detail: 'for...of loop',
    documentation: 'Iterate over iterable'
  },
  {
    label: 'forin',
    insertText: 'for (const ${1:key} in ${2:object}) {\n\t$0\n}',
    detail: 'for...in loop',
    documentation: 'Iterate over object keys'
  },
  {
    label: 'fori',
    insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n\t$0\n}',
    detail: 'for loop (indexed)',
    documentation: 'Classic indexed for loop'
  },
  {
    label: 'while',
    insertText: 'while (${1:condition}) {\n\t$0\n}',
    detail: 'while loop',
    documentation: 'While loop'
  },

  // Array methods
  {
    label: 'map',
    insertText: '${1:array}.map((${2:item}) => $0)',
    detail: '.map()',
    documentation: 'Array map method'
  },
  {
    label: 'filter',
    insertText: '${1:array}.filter((${2:item}) => $0)',
    detail: '.filter()',
    documentation: 'Array filter method'
  },
  {
    label: 'reduce',
    insertText: '${1:array}.reduce((${2:acc}, ${3:item}) => {\n\t$0\n\treturn ${2:acc};\n}, ${4:initialValue})',
    detail: '.reduce()',
    documentation: 'Array reduce method'
  },
  {
    label: 'find',
    insertText: '${1:array}.find((${2:item}) => $0)',
    detail: '.find()',
    documentation: 'Array find method'
  },
  {
    label: 'foreach',
    insertText: '${1:array}.forEach((${2:item}) => {\n\t$0\n});',
    detail: '.forEach()',
    documentation: 'Array forEach method'
  },
  {
    label: 'some',
    insertText: '${1:array}.some((${2:item}) => $0)',
    detail: '.some()',
    documentation: 'Array some method'
  },
  {
    label: 'every',
    insertText: '${1:array}.every((${2:item}) => $0)',
    detail: '.every()',
    documentation: 'Array every method'
  },

  // Async/Promises
  {
    label: 'prom',
    insertText: 'new Promise((resolve, reject) => {\n\t$0\n})',
    detail: 'new Promise',
    documentation: 'Create a new Promise'
  },
  {
    label: 'thenc',
    insertText: '.then((${1:result}) => {\n\t$0\n}).catch((${2:error}) => {\n\t\n});',
    detail: '.then().catch()',
    documentation: 'Promise then/catch chain'
  },
  {
    label: 'await',
    insertText: 'await $0',
    detail: 'await',
    documentation: 'Await expression'
  },

  // Fetch & HTTP
  {
    label: 'fetch',
    insertText: 'const ${1:response} = await fetch(\'${2:url}\');\nconst ${3:data} = await ${1:response}.json();',
    detail: 'fetch with await',
    documentation: 'Fetch API with JSON parsing'
  },
  {
    label: 'fetchpost',
    insertText: 'const ${1:response} = await fetch(\'${2:url}\', {\n\tmethod: \'POST\',\n\theaders: { \'Content-Type\': \'application/json\' },\n\tbody: JSON.stringify($0)\n});',
    detail: 'fetch POST',
    documentation: 'Fetch POST request'
  },

  // Objects & Destructuring
  {
    label: 'deso',
    insertText: 'const { $0 } = ${1:object};',
    detail: 'Object destructuring',
    documentation: 'Destructure object'
  },
  {
    label: 'desa',
    insertText: 'const [$0] = ${1:array};',
    detail: 'Array destructuring',
    documentation: 'Destructure array'
  },
  {
    label: 'spread',
    insertText: '...${1:array}',
    detail: 'Spread operator',
    documentation: 'Spread syntax'
  },

  // Timeout/Interval
  {
    label: 'timeout',
    insertText: 'setTimeout(() => {\n\t$0\n}, ${1:1000});',
    detail: 'setTimeout',
    documentation: 'Set a timeout'
  },
  {
    label: 'interval',
    insertText: 'setInterval(() => {\n\t$0\n}, ${1:1000});',
    detail: 'setInterval',
    documentation: 'Set an interval'
  },

  // JSON
  {
    label: 'jsons',
    insertText: 'JSON.stringify($0)',
    detail: 'JSON.stringify()',
    documentation: 'Convert to JSON string'
  },
  {
    label: 'jsonp',
    insertText: 'JSON.parse($0)',
    detail: 'JSON.parse()',
    documentation: 'Parse JSON string'
  },
];

// TypeScript-only snippets
export const tsOnlySnippets: SnippetDefinition[] = [
  {
    label: 'interface',
    insertText: 'interface ${1:Name} {\n\t$0\n}',
    detail: 'Interface',
    documentation: 'TypeScript interface declaration'
  },
  {
    label: 'type',
    insertText: 'type ${1:Name} = $0;',
    detail: 'Type alias',
    documentation: 'TypeScript type alias'
  },
  {
    label: 'enum',
    insertText: 'enum ${1:Name} {\n\t$0\n}',
    detail: 'Enum',
    documentation: 'TypeScript enum declaration'
  },
  {
    label: 'class',
    insertText: 'class ${1:Name} {\n\tconstructor(${2:params}) {\n\t\t$0\n\t}\n}',
    detail: 'Class',
    documentation: 'TypeScript class declaration'
  },
  {
    label: 'generic',
    insertText: '<${1:T}>',
    detail: 'Generic type parameter',
    documentation: 'Generic type'
  },
  {
    label: 'readonly',
    insertText: 'readonly ${1:property}: ${2:type};',
    detail: 'Readonly property',
    documentation: 'Readonly class property'
  },
  {
    label: 'private',
    insertText: 'private ${1:property}: ${2:type};',
    detail: 'Private property',
    documentation: 'Private class property'
  },
];

// Python snippets (enhanced)
export const pythonSnippets: SnippetDefinition[] = [
  {
    label: 'def',
    insertText: 'def ${1:function_name}(${2:args}):\n\t${3:pass}',
    detail: 'Function definition',
    documentation: 'Python function'
  },
  {
    label: 'adef',
    insertText: 'async def ${1:function_name}(${2:args}):\n\t${3:pass}',
    detail: 'Async function',
    documentation: 'Async Python function'
  },
  {
    label: 'class',
    insertText: 'class ${1:ClassName}:\n\tdef __init__(self${2:, args}):\n\t\t${3:pass}',
    detail: 'Class definition',
    documentation: 'Python class'
  },
  {
    label: 'for',
    insertText: 'for ${1:item} in ${2:iterable}:\n\t${3:pass}',
    detail: 'For loop',
    documentation: 'Python for loop'
  },
  {
    label: 'fori',
    insertText: 'for ${1:i} in range(${2:n}):\n\t${3:pass}',
    detail: 'For range loop',
    documentation: 'Python for loop with range'
  },
  {
    label: 'if',
    insertText: 'if ${1:condition}:\n\t${2:pass}',
    detail: 'If statement',
    documentation: 'Python if statement'
  },
  {
    label: 'ife',
    insertText: 'if ${1:condition}:\n\t${2:pass}\nelse:\n\t${3:pass}',
    detail: 'If/else statement',
    documentation: 'Python if-else statement'
  },
  {
    label: 'while',
    insertText: 'while ${1:condition}:\n\t${2:pass}',
    detail: 'While loop',
    documentation: 'Python while loop'
  },
  {
    label: 'try',
    insertText: 'try:\n\t${1:pass}\nexcept ${2:Exception} as ${3:e}:\n\t${4:pass}',
    detail: 'Try/except',
    documentation: 'Python try-except block'
  },
  {
    label: 'tryf',
    insertText: 'try:\n\t${1:pass}\nexcept ${2:Exception} as ${3:e}:\n\t${4:pass}\nfinally:\n\t${5:pass}',
    detail: 'Try/except/finally',
    documentation: 'Python try-except-finally block'
  },
  {
    label: 'with',
    insertText: 'with ${1:expression} as ${2:var}:\n\t${3:pass}',
    detail: 'With statement',
    documentation: 'Python context manager'
  },
  {
    label: 'lambda',
    insertText: 'lambda ${1:args}: ${2:expression}',
    detail: 'Lambda function',
    documentation: 'Python lambda expression'
  },
  {
    label: 'lc',
    insertText: '[${1:expr} for ${2:item} in ${3:iterable}]',
    detail: 'List comprehension',
    documentation: 'Python list comprehension'
  },
  {
    label: 'dc',
    insertText: '{${1:key}: ${2:value} for ${3:item} in ${4:iterable}}',
    detail: 'Dict comprehension',
    documentation: 'Python dictionary comprehension'
  },
  {
    label: 'sc',
    insertText: '{${1:expr} for ${2:item} in ${3:iterable}}',
    detail: 'Set comprehension',
    documentation: 'Python set comprehension'
  },
  {
    label: 'print',
    insertText: 'print($0)',
    detail: 'Print',
    documentation: 'Python print function'
  },
  {
    label: 'pf',
    insertText: 'print(f"$0")',
    detail: 'Print f-string',
    documentation: 'Python print with f-string'
  },
  {
    label: 'main',
    insertText: 'if __name__ == "__main__":\n\t${1:pass}',
    detail: 'Main guard',
    documentation: 'Python main entry point'
  },
  {
    label: 'imp',
    insertText: 'import ${1:module}',
    detail: 'Import',
    documentation: 'Python import statement'
  },
  {
    label: 'from',
    insertText: 'from ${1:module} import ${2:name}',
    detail: 'From import',
    documentation: 'Python from import statement'
  },
];

/**
 * Get all snippets for a language
 */
export function getSnippetsForLanguage(language: string): SnippetDefinition[] {
  switch (language) {
    case 'typescript':
      return [...tsJsSnippets, ...tsOnlySnippets];
    case 'javascript':
      return tsJsSnippets;
    case 'python':
      return pythonSnippets;
    default:
      return [];
  }
}

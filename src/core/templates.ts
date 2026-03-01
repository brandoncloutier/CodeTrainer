import { Category, Difficulty, ExampleCase, Question, Template } from "./types";

const DEFAULT_TIME_LIMIT_MS = 15000;

const randomInt = (min: number, max: number): number => {
  const low = Math.ceil(min);
  const high = Math.floor(max);
  return Math.floor(Math.random() * (high - low + 1)) + low;
};

const randomChoice = <T,>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)];

const randomString = (length: number): string => {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  return Array.from({ length }, () => chars[randomInt(0, chars.length - 1)]).join("");
};

const buildQuestion = (params: Omit<Question, "id">): Question => ({
  ...params,
  id: createId()
});

const buildQuestionFromTemplate = (
  templateId: string,
  params: Omit<Question, "id" | "solution" | "drillId" | "examples">
): Question =>
  buildQuestion({
    ...params,
    drillId: templateId,
    solution: getSolution(templateId),
    examples: getExamples(templateId)
  });

export const createId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const TEMPLATE_SOLUTIONS: Record<string, string> = {
  "arith-add": "def add(a, b):\n    return a + b",
  "arith-mul": "def mul(a, b):\n    return a * b",
  "strings-reverse": "def reverse(s):\n    return s[::-1]",
  "strings-count-vowels":
    "def count_vowels(s):\n    return sum(1 for ch in s if ch in \"aeiou\")",
  "lists-sum": "def sum_list(nums):\n    return sum(nums)",
  "lists-max": "def max_value(nums):\n    return max(nums)",
  "loops-countdown": "def countdown(n):\n    return list(range(n, -1, -1))",
  "loops-factorial":
    "def factorial(n):\n    result = 1\n    for value in range(2, n + 1):\n        result *= value\n    return result",
  "conditionals-grade":
    "def grade(score):\n    if score >= 90:\n        return \"A\"\n    if score >= 80:\n        return \"B\"\n    if score >= 70:\n        return \"C\"\n    if score >= 60:\n        return \"D\"\n    return \"F\"",
  "conditionals-sign":
    "def sign(n):\n    if n > 0:\n        return 1\n    if n < 0:\n        return -1\n    return 0",
  "functions-even": "def is_even(n):\n    return n % 2 == 0",
  "functions-clamp":
    "def clamp(x, low, high):\n    if x < low:\n        return low\n    if x > high:\n        return high\n    return x",
  "arrays-hashing-contains-duplicate":
    "def contains_duplicate(nums):\n    return len(set(nums)) != len(nums)",
  "two-pointers-palindrome":
    "def is_palindrome(s):\n    left, right = 0, len(s) - 1\n    while left < right:\n        if s[left] != s[right]:\n            return False\n        left += 1\n        right -= 1\n    return True",
  "sliding-window-max-sum":
    "def max_subarray_sum(nums, k):\n    window_sum = sum(nums[:k])\n    best = window_sum\n    for i in range(k, len(nums)):\n        window_sum += nums[i] - nums[i - k]\n        best = max(best, window_sum)\n    return best",
  "stack-valid-parentheses":
    "def is_valid_parentheses(s):\n    pairs = {')': '(', ']': '[', '}': '{'}\n    stack = []\n    for ch in s:\n        if ch in pairs.values():\n            stack.append(ch)\n        else:\n            if not stack or stack.pop() != pairs.get(ch):\n                return False\n    return not stack",
  "binary-search-basic":
    "def binary_search(nums, target):\n    left, right = 0, len(nums) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if nums[mid] == target:\n            return mid\n        if nums[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1",
  "linked-list-reverse":
    "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\n\ndef reverse_list(head):\n    prev = None\n    cur = head\n    while cur:\n        nxt = cur.next\n        cur.next = prev\n        prev = cur\n        cur = nxt\n    return prev",
  "trees-max-depth":
    "class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\n\ndef max_depth(root):\n    if not root:\n        return 0\n    return 1 + max(max_depth(root.left), max_depth(root.right))",
  "tries-basic":
    "class TrieNode:\n    def __init__(self):\n        self.children = {}\n        self.is_end = False\n\n\nclass Trie:\n    def __init__(self):\n        self.root = TrieNode()\n\n    def insert(self, word):\n        node = self.root\n        for ch in word:\n            node = node.children.setdefault(ch, TrieNode())\n        node.is_end = True\n\n    def search(self, word):\n        node = self.root\n        for ch in word:\n            if ch not in node.children:\n                return False\n            node = node.children[ch]\n        return node.is_end",
  "heap-k-smallest":
    "import heapq\n\n\ndef k_smallest(nums, k):\n    return sorted(heapq.nsmallest(k, nums))",
  "backtracking-subsets":
    "def subsets(nums):\n    result = []\n\n    def backtrack(start, path):\n        result.append(path[:])\n        for i in range(start, len(nums)):\n            path.append(nums[i])\n            backtrack(i + 1, path)\n            path.pop()\n\n    backtrack(0, [])\n    return result",
  "graphs-count-components":
    "def count_components(n, edges):\n    graph = {i: [] for i in range(n)}\n    for a, b in edges:\n        graph[a].append(b)\n        graph[b].append(a)\n    visited = set()\n\n    def dfs(node):\n        stack = [node]\n        while stack:\n            cur = stack.pop()\n            if cur in visited:\n                continue\n            visited.add(cur)\n            stack.extend(graph[cur])\n\n    count = 0\n    for node in range(n):\n        if node not in visited:\n            count += 1\n            dfs(node)\n    return count",
  "advanced-graphs-shortest-path":
    "import heapq\n\n\ndef shortest_path(n, edges, start, end):\n    graph = {i: [] for i in range(n)}\n    for src, dst, weight in edges:\n        graph[src].append((dst, weight))\n    heap = [(0, start)]\n    best = {start: 0}\n    while heap:\n        dist, node = heapq.heappop(heap)\n        if node == end:\n            return dist\n        if dist > best.get(node, float('inf')):\n            continue\n        for nxt, weight in graph[node]:\n            nd = dist + weight\n            if nd < best.get(nxt, float('inf')):\n                best[nxt] = nd\n                heapq.heappush(heap, (nd, nxt))\n    return -1",
  "dp-1d-climb-stairs":
    "def climb_stairs(n):\n    if n <= 1:\n        return 1\n    a, b = 1, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b",
  "dp-2d-unique-paths":
    "def unique_paths(m, n):\n    dp = [1] * n\n    for _ in range(1, m):\n        for j in range(1, n):\n            dp[j] += dp[j - 1]\n    return dp[-1]",
  "greedy-max-profit":
    "def max_profit(prices):\n    min_price = float('inf')\n    best = 0\n    for price in prices:\n        min_price = min(min_price, price)\n        best = max(best, price - min_price)\n    return best",
  "intervals-merge":
    "def merge_intervals(intervals):\n    if not intervals:\n        return []\n    intervals.sort(key=lambda x: x[0])\n    merged = [intervals[0]]\n    for start, end in intervals[1:]:\n        last = merged[-1]\n        if start <= last[1]:\n            last[1] = max(last[1], end)\n        else:\n            merged.append([start, end])\n    return merged",
  "bit-manipulation-power-of-two":
    "def is_power_of_two(n):\n    return n > 0 and (n & (n - 1)) == 0",
  "math-geometry-gcd":
    "def gcd(a, b):\n    while b:\n        a, b = b, a % b\n    return a"
};

const getSolution = (id: string): string => {
  const solution = TEMPLATE_SOLUTIONS[id];
  if (!solution) {
    throw new Error(`Missing solution for template ${id}`);
  }
  return solution;
};

const TEMPLATE_EXAMPLES: Record<string, ExampleCase[]> = {
  "arith-add": [
    { input: "add(2, 3)", output: "5" },
    { input: "add(10, -4)", output: "6" }
  ],
  "arith-mul": [
    { input: "mul(3, 4)", output: "12" },
    { input: "mul(-2, 5)", output: "-10" }
  ],
  "strings-reverse": [
    { input: 'reverse("cat")', output: '"tac"' },
    { input: 'reverse("ab")', output: '"ba"' }
  ],
  "strings-count-vowels": [
    { input: 'count_vowels("hello")', output: "2" },
    { input: 'count_vowels("sky")', output: "0" }
  ],
  "lists-sum": [
    { input: "sum_list([1, 2, 3])", output: "6" },
    { input: "sum_list([-1, 5, 2])", output: "6" }
  ],
  "lists-max": [
    { input: "max_value([1, 7, 3])", output: "7" },
    { input: "max_value([-2, -5, -1])", output: "-1" }
  ],
  "loops-countdown": [
    { input: "countdown(3)", output: "[3, 2, 1, 0]" },
    { input: "countdown(0)", output: "[0]" }
  ],
  "loops-factorial": [
    { input: "factorial(4)", output: "24" },
    { input: "factorial(1)", output: "1" }
  ],
  "conditionals-grade": [
    { input: "grade(95)", output: "\"A\"" },
    { input: "grade(72)", output: "\"C\"" }
  ],
  "conditionals-sign": [
    { input: "sign(5)", output: "1" },
    { input: "sign(-3)", output: "-1" }
  ],
  "functions-even": [
    { input: "is_even(4)", output: "True" },
    { input: "is_even(7)", output: "False" }
  ],
  "functions-clamp": [
    { input: "clamp(5, 1, 10)", output: "5" },
    { input: "clamp(0, 1, 10)", output: "1" }
  ],
  "arrays-hashing-contains-duplicate": [
    { input: "contains_duplicate([1, 2, 3, 1])", output: "True" },
    { input: "contains_duplicate([1, 2, 3, 4])", output: "False" }
  ],
  "two-pointers-palindrome": [
    { input: 'is_palindrome("racecar")', output: "True" },
    { input: 'is_palindrome("hello")', output: "False" }
  ],
  "sliding-window-max-sum": [
    { input: "max_subarray_sum([1, 2, 3, 4], 2)", output: "7" },
    { input: "max_subarray_sum([5, 1, 3, 2], 3)", output: "9" }
  ],
  "stack-valid-parentheses": [
    { input: 'is_valid_parentheses("([])")', output: "True" },
    { input: 'is_valid_parentheses("([)]")', output: "False" }
  ],
  "binary-search-basic": [
    { input: "binary_search([1, 3, 5, 7], 5)", output: "2" },
    { input: "binary_search([1, 3, 5, 7], 4)", output: "-1" }
  ],
  "linked-list-reverse": [
    { input: "reverse_list([1, 2, 3])", output: "[3, 2, 1]" },
    { input: "reverse_list([9])", output: "[9]" }
  ],
  "trees-max-depth": [
    { input: "max_depth([1, 2, 3, null, null, 4])", output: "3" },
    { input: "max_depth([1])", output: "1" }
  ],
  "tries-basic": [
    { input: 'insert("cat"), search("cat")', output: "True" },
    { input: 'search("cap")', output: "False" }
  ],
  "heap-k-smallest": [
    { input: "k_smallest([3, 1, 5, 2, 4], 3)", output: "[1, 2, 3]" },
    { input: "k_smallest([9, 8, 7], 1)", output: "[7]" }
  ],
  "backtracking-subsets": [
    { input: "subsets([1, 2])", output: "[[], [1], [2], [1, 2]] (order may vary)" },
    { input: "subsets([0])", output: "[[], [0]]" }
  ],
  "graphs-count-components": [
    { input: "count_components(5, [[0,1],[1,2],[3,4]])", output: "2" },
    { input: "count_components(3, [])", output: "3" }
  ],
  "advanced-graphs-shortest-path": [
    {
      input: "shortest_path(4, [[0,1,4],[0,2,2],[1,2,5],[1,3,10],[2,3,3]], 0, 3)",
      output: "5"
    },
    {
      input: "shortest_path(4, [[0,1,4],[0,2,2],[1,2,5],[1,3,10],[2,3,3]], 3, 0)",
      output: "-1"
    }
  ],
  "dp-1d-climb-stairs": [
    { input: "climb_stairs(2)", output: "2" },
    { input: "climb_stairs(4)", output: "5" }
  ],
  "dp-2d-unique-paths": [
    { input: "unique_paths(3, 2)", output: "3" },
    { input: "unique_paths(3, 3)", output: "6" }
  ],
  "greedy-max-profit": [
    { input: "max_profit([7, 1, 5, 3, 6, 4])", output: "5" },
    { input: "max_profit([7, 6, 4, 3, 1])", output: "0" }
  ],
  "intervals-merge": [
    {
      input: "merge_intervals([[1,3],[2,6],[8,10],[15,18]])",
      output: "[[1, 6], [8, 10], [15, 18]]"
    },
    { input: "merge_intervals([[1,4],[4,5]])", output: "[[1, 5]]" }
  ],
  "bit-manipulation-power-of-two": [
    { input: "is_power_of_two(8)", output: "True" },
    { input: "is_power_of_two(12)", output: "False" }
  ],
  "math-geometry-gcd": [
    { input: "gcd(18, 12)", output: "6" },
    { input: "gcd(10, 5)", output: "5" }
  ]
};

const getExamples = (id: string): ExampleCase[] => {
  const examples = TEMPLATE_EXAMPLES[id];
  if (!examples || examples.length < 2) {
    throw new Error(`Missing examples for template ${id}`);
  }
  return examples;
};

export const templates: Template[] = [
  {
    id: "arith-add",
    category: "arith",
    difficulty: 1,
    generate: () => {
      const a = randomInt(5, 99);
      const b = randomInt(5, 99);
      return buildQuestionFromTemplate("arith-add", {
        category: "arith",
        difficulty: 1,
        prompt: "Implement add(a, b) so it returns the sum of the two numbers.",
        starterCode: "def add(a, b):\n    # TODO: return the sum\n    pass\n",
        tests: `assert add(${a}, ${b}) == ${a + b}\nassert add(${b}, ${a}) == ${a + b}`,
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "arith-mul",
    category: "arith",
    difficulty: 1,
    generate: () => {
      const a = randomInt(2, 20);
      const b = randomInt(2, 15);
      return buildQuestionFromTemplate("arith-mul", {
        category: "arith",
        difficulty: 1,
        prompt: "Implement mul(a, b) to return the product of the two numbers.",
        starterCode: "def mul(a, b):\n    # TODO: return the product\n    pass\n",
        tests: `assert mul(${a}, ${b}) == ${a * b}\nassert mul(${b}, ${a}) == ${a * b}`,
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "strings-reverse",
    category: "strings",
    difficulty: 1,
    generate: () => {
      const word = randomString(5);
      return buildQuestionFromTemplate("strings-reverse", {
        category: "strings",
        difficulty: 1,
        prompt: "Implement reverse(s) to return the reversed string.",
        starterCode: "def reverse(s):\n    # TODO: return the reversed string\n    pass\n",
        tests: `assert reverse(\"${word}\") == \"${word.split("").reverse().join("")}\"\nassert reverse(\"ab\") == \"ba\"`,
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "strings-count-vowels",
    category: "strings",
    difficulty: 2,
    generate: () => {
      const word = randomChoice(["education", "sequoia", "perception", "audacious"]);
      const count = word.split("").filter((char) => "aeiou".includes(char)).length;
      return buildQuestionFromTemplate("strings-count-vowels", {
        category: "strings",
        difficulty: 2,
        prompt: "Implement count_vowels(s) to return the number of vowels in the string.",
        starterCode: "def count_vowels(s):\n    # TODO: count a, e, i, o, u\n    pass\n",
        tests: `assert count_vowels(\"${word}\") == ${count}\nassert count_vowels(\"sky\") == 0`,
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "lists-sum",
    category: "lists",
    difficulty: 2,
    generate: () => {
      const nums = [randomInt(1, 9), randomInt(1, 9), randomInt(1, 9), randomInt(1, 9)];
      const total = nums.reduce((acc, val) => acc + val, 0);
      return buildQuestionFromTemplate("lists-sum", {
        category: "lists",
        difficulty: 2,
        prompt: "Implement sum_list(nums) to return the sum of all numbers in the list.",
        starterCode: "def sum_list(nums):\n    # TODO: return the sum of nums\n    pass\n",
        tests: `assert sum_list(${JSON.stringify(nums)}) == ${total}\nassert sum_list([1, 2, 3]) == 6`,
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "lists-max",
    category: "lists",
    difficulty: 2,
    generate: () => {
      const nums = [randomInt(1, 20), randomInt(1, 20), randomInt(1, 20), randomInt(1, 20)];
      const max = Math.max(...nums);
      return buildQuestionFromTemplate("lists-max", {
        category: "lists",
        difficulty: 2,
        prompt: "Implement max_value(nums) to return the maximum value in the list.",
        starterCode: "def max_value(nums):\n    # TODO: return the maximum value\n    pass\n",
        tests: `assert max_value(${JSON.stringify(nums)}) == ${max}\nassert max_value([-2, -5, -1]) == -1`,
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "loops-countdown",
    category: "loops",
    difficulty: 2,
    generate: () => {
      const n = randomInt(3, 7);
      const expected = Array.from({ length: n + 1 }, (_, idx) => n - idx);
      return buildQuestionFromTemplate("loops-countdown", {
        category: "loops",
        difficulty: 2,
        prompt:
          "Implement countdown(n) to return a list counting down from n to 0 (inclusive).",
        starterCode: "def countdown(n):\n    # TODO: return list [n, n-1, ..., 0]\n    pass\n",
        tests: `assert countdown(${n}) == ${JSON.stringify(expected)}\nassert countdown(0) == [0]`,
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "loops-factorial",
    category: "loops",
    difficulty: 3,
    generate: () => {
      const n = randomInt(4, 7);
      const expected = Array.from({ length: n }, (_, idx) => idx + 1).reduce(
        (acc, val) => acc * val,
        1
      );
      return buildQuestionFromTemplate("loops-factorial", {
        category: "loops",
        difficulty: 3,
        prompt: "Implement factorial(n) to return n! using a loop.",
        starterCode: "def factorial(n):\n    # TODO: compute n!\n    pass\n",
        tests: `assert factorial(${n}) == ${expected}\nassert factorial(1) == 1`,
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "conditionals-grade",
    category: "conditionals",
    difficulty: 2,
    generate: () => {
      const score = randomInt(55, 99);
      const grade =
        score >= 90
          ? "A"
          : score >= 80
            ? "B"
            : score >= 70
              ? "C"
              : score >= 60
                ? "D"
                : "F";
      return buildQuestionFromTemplate("conditionals-grade", {
        category: "conditionals",
        difficulty: 2,
        prompt:
          "Implement grade(score) that returns 'A' (90+), 'B' (80+), 'C' (70+), 'D' (60+), or 'F'.",
        starterCode: "def grade(score):\n    # TODO: return letter grade\n    pass\n",
        tests: `assert grade(${score}) == "${grade}"\nassert grade(59) == "F"\nassert grade(90) == "A"`,
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "conditionals-sign",
    category: "conditionals",
    difficulty: 1,
    generate: () => {
      const value = randomChoice([-10, -1, 0, 1, 9]);
      const sign = value === 0 ? 0 : value > 0 ? 1 : -1;
      return buildQuestionFromTemplate("conditionals-sign", {
        category: "conditionals",
        difficulty: 1,
        prompt: "Implement sign(n) to return 1 if n>0, -1 if n<0, and 0 if n==0.",
        starterCode: "def sign(n):\n    # TODO: return 1, -1, or 0\n    pass\n",
        tests: `assert sign(${value}) == ${sign}\nassert sign(0) == 0`,
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "functions-even",
    category: "functions",
    difficulty: 1,
    generate: () => {
      const value = randomInt(2, 20);
      const isEven = value % 2 === 0;
      return buildQuestionFromTemplate("functions-even", {
        category: "functions",
        difficulty: 1,
        prompt: "Implement is_even(n) to return True if n is even, otherwise False.",
        starterCode: "def is_even(n):\n    # TODO: return True if n is even\n    pass\n",
        tests: `assert is_even(${value}) is ${isEven ? "True" : "False"}\nassert is_even(3) is False`,
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "functions-clamp",
    category: "functions",
    difficulty: 3,
    generate: () => {
      const low = randomInt(0, 5);
      const high = randomInt(low + 5, low + 15);
      const value = randomInt(low - 5, high + 5);
      const expected = Math.min(Math.max(value, low), high);
      return buildQuestionFromTemplate("functions-clamp", {
        category: "functions",
        difficulty: 3,
        prompt:
          "Implement clamp(x, low, high) to return low if x < low, high if x > high, otherwise x.",
        starterCode: "def clamp(x, low, high):\n    # TODO: clamp x to the [low, high] range\n    pass\n",
        tests: `assert clamp(${value}, ${low}, ${high}) == ${expected}\nassert clamp(${low}, ${low}, ${high}) == ${low}`,
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "arrays-hashing-contains-duplicate",
    category: "arrays_hashing",
    difficulty: 1,
    generate: () => {
      const base = randomInt(1, 9);
      const nums = [base, randomInt(1, 9), randomInt(1, 9), base];
      return buildQuestionFromTemplate("arrays-hashing-contains-duplicate", {
        category: "arrays_hashing",
        difficulty: 1,
        prompt: "Implement contains_duplicate(nums) to return True if any value appears twice.",
        starterCode:
          "def contains_duplicate(nums):\n    # TODO: return True if a duplicate exists\n    pass\n",
        tests: `assert contains_duplicate(${JSON.stringify(nums)}) is True\nassert contains_duplicate([1, 2, 3, 4]) is False`,
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "two-pointers-palindrome",
    category: "two_pointers",
    difficulty: 1,
    generate: () => {
      const seed = randomString(3);
      const palindrome = `${seed}${seed.split("").reverse().join("")}`;
      return buildQuestionFromTemplate("two-pointers-palindrome", {
        category: "two_pointers",
        difficulty: 1,
        prompt: "Implement is_palindrome(s) to return True if s reads the same forwards/backwards.",
        starterCode:
          "def is_palindrome(s):\n    # TODO: return True if s is a palindrome\n    pass\n",
        tests: `assert is_palindrome(\"${palindrome}\") is True\nassert is_palindrome(\"${seed}x\") is False`,
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "sliding-window-max-sum",
    category: "sliding_window",
    difficulty: 2,
    generate: () => {
      const nums = Array.from({ length: 6 }, () => randomInt(1, 9));
      const k = 3;
      const sums = nums.slice(0, nums.length - k + 1).map((_, idx) =>
        nums.slice(idx, idx + k).reduce((acc, val) => acc + val, 0)
      );
      const expected = Math.max(...sums);
      return buildQuestionFromTemplate("sliding-window-max-sum", {
        category: "sliding_window",
        difficulty: 2,
        prompt: "Implement max_subarray_sum(nums, k) to return the max sum of any length-k subarray.",
        starterCode:
          "def max_subarray_sum(nums, k):\n    # TODO: return max sum of any window of size k\n    pass\n",
        tests: `assert max_subarray_sum(${JSON.stringify(nums)}, ${k}) == ${expected}\nassert max_subarray_sum([1, 2, 3, 4], 2) == 7`,
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "stack-valid-parentheses",
    category: "stack",
    difficulty: 2,
    generate: () => {
      return buildQuestionFromTemplate("stack-valid-parentheses", {
        category: "stack",
        difficulty: 2,
        prompt: "Implement is_valid_parentheses(s) to validate (), [], and {} pairs.",
        starterCode:
          "def is_valid_parentheses(s):\n    # TODO: return True if parentheses are balanced\n    pass\n",
        tests: `assert is_valid_parentheses(\"([])\") is True\nassert is_valid_parentheses(\"([)]\") is False`,
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "binary-search-basic",
    category: "binary_search",
    difficulty: 2,
    generate: () => {
      const nums = Array.from({ length: 7 }, (_, idx) => idx * 2 + 1);
      const target = randomChoice(nums);
      return buildQuestionFromTemplate("binary-search-basic", {
        category: "binary_search",
        difficulty: 2,
        prompt: "Implement binary_search(nums, target) to return the index of target or -1.",
        starterCode:
          "def binary_search(nums, target):\n    # TODO: return index of target or -1\n    pass\n",
        tests: `assert binary_search(${JSON.stringify(nums)}, ${target}) == ${nums.indexOf(target)}\nassert binary_search(${JSON.stringify(nums)}, 100) == -1`,
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "linked-list-reverse",
    category: "linked_list",
    difficulty: 3,
    generate: () => {
      return buildQuestionFromTemplate("linked-list-reverse", {
        category: "linked_list",
        difficulty: 3,
        prompt: "Implement reverse_list(head) to reverse a linked list.",
        starterCode:
          "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\n\ndef reverse_list(head):\n    # TODO: reverse the linked list\n    pass\n",
        tests:
          "def build_list(values):\n    dummy = ListNode(0)\n    cur = dummy\n    for value in values:\n        cur.next = ListNode(value)\n        cur = cur.next\n    return dummy.next\n\n\ndef to_list(head):\n    values = []\n    while head:\n        values.append(head.val)\n        head = head.next\n    return values\n\nhead = build_list([1, 2, 3])\nassert to_list(reverse_list(head)) == [3, 2, 1]\nassert to_list(reverse_list(build_list([9]))) == [9]",
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "trees-max-depth",
    category: "trees",
    difficulty: 3,
    generate: () => {
      return buildQuestionFromTemplate("trees-max-depth", {
        category: "trees",
        difficulty: 3,
        prompt: "Implement max_depth(root) to return the maximum depth of a binary tree.",
        starterCode:
          "class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\n\ndef max_depth(root):\n    # TODO: return the max depth\n    pass\n",
        tests:
          "root = TreeNode(1, TreeNode(2), TreeNode(3, TreeNode(4), None))\nassert max_depth(root) == 3\nassert max_depth(TreeNode(1)) == 1",
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "tries-basic",
    category: "tries",
    difficulty: 3,
    generate: () => {
      return buildQuestionFromTemplate("tries-basic", {
        category: "tries",
        difficulty: 3,
        prompt: "Implement Trie.insert and Trie.search for exact word matches.",
        starterCode:
          "class TrieNode:\n    def __init__(self):\n        self.children = {}\n        self.is_end = False\n\n\nclass Trie:\n    def __init__(self):\n        self.root = TrieNode()\n\n    def insert(self, word):\n        # TODO: insert word into trie\n        pass\n\n    def search(self, word):\n        # TODO: return True if word exists\n        pass\n",
        tests:
          "trie = Trie()\ntrie.insert(\"cat\")\ntrie.insert(\"car\")\nassert trie.search(\"cat\") is True\nassert trie.search(\"cap\") is False",
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "heap-k-smallest",
    category: "heap_priority_queue",
    difficulty: 3,
    generate: () => {
      const nums = [3, 1, 5, 2, 4];
      const k = 3;
      return buildQuestionFromTemplate("heap-k-smallest", {
        category: "heap_priority_queue",
        difficulty: 3,
        prompt: "Implement k_smallest(nums, k) to return the k smallest numbers sorted.",
        starterCode:
          "def k_smallest(nums, k):\n    # TODO: return the k smallest values sorted ascending\n    pass\n",
        tests: `assert k_smallest(${JSON.stringify(nums)}, ${k}) == [1, 2, 3]\nassert k_smallest([9, 8, 7], 1) == [7]`,
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "backtracking-subsets",
    category: "backtracking",
    difficulty: 3,
    generate: () => {
      return buildQuestionFromTemplate("backtracking-subsets", {
        category: "backtracking",
        difficulty: 3,
        prompt: "Implement subsets(nums) to return all subsets (order does not matter).",
        starterCode:
          "def subsets(nums):\n    # TODO: return all subsets\n    pass\n",
        tests:
          "def normalize(values):\n    return sorted([sorted(item) for item in values])\n\nassert normalize(subsets([1, 2])) == normalize([[], [1], [2], [1, 2]])",
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "graphs-count-components",
    category: "graphs",
    difficulty: 3,
    generate: () => {
      return buildQuestionFromTemplate("graphs-count-components", {
        category: "graphs",
        difficulty: 3,
        prompt: "Implement count_components(n, edges) to return the number of connected components.",
        starterCode:
          "def count_components(n, edges):\n    # TODO: return number of connected components\n    pass\n",
        tests:
          "assert count_components(5, [[0,1],[1,2],[3,4]]) == 2\nassert count_components(3, []) == 3",
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "advanced-graphs-shortest-path",
    category: "advanced_graphs",
    difficulty: 3,
    generate: () => {
      return buildQuestionFromTemplate("advanced-graphs-shortest-path", {
        category: "advanced_graphs",
        difficulty: 3,
        prompt:
          "Implement shortest_path(n, edges, start, end) to return the shortest distance or -1 if unreachable.",
        starterCode:
          "def shortest_path(n, edges, start, end):\n    # edges: [from, to, weight]\n    # TODO: return shortest distance or -1\n    pass\n",
        tests:
          "edges = [[0,1,4],[0,2,2],[1,2,5],[1,3,10],[2,3,3]]\nassert shortest_path(4, edges, 0, 3) == 5\nassert shortest_path(4, edges, 3, 0) == -1",
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "dp-1d-climb-stairs",
    category: "dp_1d",
    difficulty: 2,
    generate: () => {
      const n = randomInt(4, 6);
      const ways = (value: number): number => {
        let a = 1;
        let b = 1;
        for (let i = 2; i <= value; i += 1) {
          const temp = a + b;
          a = b;
          b = temp;
        }
        return b;
      };
      const expected = ways(n);
      return buildQuestionFromTemplate("dp-1d-climb-stairs", {
        category: "dp_1d",
        difficulty: 2,
        prompt: "Implement climb_stairs(n) to return number of ways to reach step n (1 or 2 steps).",
        starterCode:
          "def climb_stairs(n):\n    # TODO: return number of ways\n    pass\n",
        tests: `assert climb_stairs(${n}) == ${expected}\nassert climb_stairs(2) == 2`,
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "dp-2d-unique-paths",
    category: "dp_2d",
    difficulty: 3,
    generate: () => {
      return buildQuestionFromTemplate("dp-2d-unique-paths", {
        category: "dp_2d",
        difficulty: 3,
        prompt: "Implement unique_paths(m, n) to count paths in an m x n grid (only right/down).",
        starterCode:
          "def unique_paths(m, n):\n    # TODO: return number of unique paths\n    pass\n",
        tests: `assert unique_paths(3, 2) == 3\nassert unique_paths(3, 3) == 6`,
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "greedy-max-profit",
    category: "greedy",
    difficulty: 2,
    generate: () => {
      return buildQuestionFromTemplate("greedy-max-profit", {
        category: "greedy",
        difficulty: 2,
        prompt: "Implement max_profit(prices) to return the max profit from one buy/sell.",
        starterCode:
          "def max_profit(prices):\n    # TODO: return maximum profit\n    pass\n",
        tests:
          "assert max_profit([7,1,5,3,6,4]) == 5\nassert max_profit([7,6,4,3,1]) == 0",
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "intervals-merge",
    category: "intervals",
    difficulty: 2,
    generate: () => {
      return buildQuestionFromTemplate("intervals-merge", {
        category: "intervals",
        difficulty: 2,
        prompt: "Implement merge_intervals(intervals) to merge overlapping intervals.",
        starterCode:
          "def merge_intervals(intervals):\n    # TODO: return merged intervals\n    pass\n",
        tests:
          "def normalize(items):\n    return sorted(items, key=lambda x: x[0])\n\nresult = merge_intervals([[1,3],[2,6],[8,10],[15,18]])\nassert normalize(result) == [[1,6],[8,10],[15,18]]",
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "bit-manipulation-power-of-two",
    category: "bit_manipulation",
    difficulty: 1,
    generate: () => {
      const value = randomChoice([1, 2, 3, 4, 5, 8, 16]);
      const expected = (value & (value - 1)) === 0;
      return buildQuestionFromTemplate("bit-manipulation-power-of-two", {
        category: "bit_manipulation",
        difficulty: 1,
        prompt: "Implement is_power_of_two(n) to return True if n is a power of two.",
        starterCode:
          "def is_power_of_two(n):\n    # TODO: return True if n is power of two\n    pass\n",
        tests: `assert is_power_of_two(${value}) is ${expected ? "True" : "False"}\nassert is_power_of_two(0) is False`,
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  },
  {
    id: "math-geometry-gcd",
    category: "math_geometry",
    difficulty: 1,
    generate: () => {
      const a = randomInt(12, 24);
      const b = randomInt(6, 18);
      const gcd = (x: number, y: number): number => (y === 0 ? x : gcd(y, x % y));
      const expected = gcd(a, b);
      return buildQuestionFromTemplate("math-geometry-gcd", {
        category: "math_geometry",
        difficulty: 1,
        prompt: "Implement gcd(a, b) to return the greatest common divisor.",
        starterCode:
          "def gcd(a, b):\n    # TODO: return greatest common divisor\n    pass\n",
        tests: `assert gcd(${a}, ${b}) == ${expected}\nassert gcd(10, 5) == 5`,
        timeLimitMs: DEFAULT_TIME_LIMIT_MS
      });
    }
  }
];

export const getTemplatesForCategory = (category: Category): Template[] =>
  templates.filter((template) => template.category === category);

import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.core.security import hash_password
from app.models.note import Note
from app.models.question import Question
from app.models.quiz import QuizAnswer, QuizAttempt
from app.models.tag import NoteTag, Tag
from app.models.user import User

logger = logging.getLogger(__name__)


def get_or_create_tag(db: Session, name: str) -> Tag:
    tag_clean = name.strip().lower()
    tag = db.query(Tag).filter(Tag.name == tag_clean).first()
    if not tag:
        tag = Tag(name=tag_clean)
        db.add(tag)
        db.flush()
    return tag


def seed_demo_accounts(db: Session):
    """Seed the 3 official demo accounts with rich data if not already present."""
    demo_definitions = [
        {
            "unique_id": "python_demo",
            "email": "python_demo@learnnote.ai",
            "password": "PythonDemo123!",
            "subject": "Python Programming",
            "notes": [
                {
                    "title": "Python Functions & Scope Mechanics",
                    "topic": "Functions",
                    "summary": "Explores function definitions, first-class functions, closures, *args/**kwargs, and LEGB scope resolution rules in Python.",
                    "tags": ["python", "functions", "scope", "closures", "programming"],
                    "core_concepts": [
                        "First-class citizen status of Python functions",
                        "Variable positional (*args) and keyword (**kwargs) arguments",
                        "The LEGB (Local, Enclosing, Global, Built-in) rule for identifier lookup",
                        "Closures and lexical scoping mechanics",
                    ],
                    "detailed_explanation": (
                        "# Python Functions & Scoping Mechanics\n\n"
                        "In Python, functions are first-class objects. They can be passed as arguments, returned from other functions, "
                        "and bound to identifiers.\n\n"
                        "## Variable Arguments\n"
                        "- `*args`: Collects extra positional parameters into an immutable tuple.\n"
                        "- `**kwargs`: Collects extra keyword arguments into a mutable dictionary.\n\n"
                        "## Scoping with the LEGB Rule\n"
                        "Python resolves variable names in this strict order:\n"
                        "1. **Local (L)**: Defined inside the current function body.\n"
                        "2. **Enclosing (E)**: Defined in outer nested scopes (lexical closures).\n"
                        "3. **Global (G)**: Defined at top-level module scope.\n"
                        "4. **Built-in (B)**: Pre-assigned symbols like `len`, `range`, `Exception`.\n\n"
                        "To mutate global or enclosing symbols, use the `global` and `nonlocal` keywords respectively."
                    ),
                    "examples": [
                        "def make_multiplier(factor):\n    def multiply(x):\n        return x * factor\n    return multiply\n\ndouble = make_multiplier(2)\nprint(double(5)) # Output: 10",
                        "def calculate_total(*values, discount=0.0):\n    subtotal = sum(values)\n    return subtotal * (1 - discount)",
                    ],
                    "common_mistakes": [
                        "Using mutable default arguments like `def append_to(item, target=[])`: defaults evaluate once at definition time.",
                        "Attempting to modify enclosing state without declaring `nonlocal`.",
                    ],
                    "key_takeaways": [
                        "Always use `None` as default for mutable parameters.",
                        "Understand LEGB order when diagnosing UnboundLocalError.",
                    ],
                    "sources": ["Python 3.12 Official Documentation: Scopes & Namespaces"],
                    "questions": [
                        {
                            "question": "What is the result of using a mutable default argument like `def add(x, items=[])` across multiple function calls?",
                            "question_type": "mcq",
                            "options": [
                                "The list is reused and retains changes between successive calls",
                                "A fresh list is allocated on every function invocation",
                                "Python raises a TypeError at function definition",
                                "The list resets to empty whenever garbage collection runs",
                            ],
                            "correct_answer": "The list is reused and retains changes between successive calls",
                            "explanation": "Default argument expressions are evaluated once when the function is defined, not every time it is called.",
                        },
                        {
                            "question": "True or False: In Python, functions can be assigned to variables and passed as arguments to other functions.",
                            "question_type": "true_false",
                            "options": ["True", "False"],
                            "correct_answer": "True",
                            "explanation": "In Python, functions are first-class objects.",
                        },
                        {
                            "question": "Fill in the blank: The acronym used to describe Python's scope resolution order is ________.",
                            "question_type": "fill_blank",
                            "options": None,
                            "correct_answer": "LEGB",
                            "explanation": "LEGB stands for Local, Enclosing, Global, and Built-in.",
                        },
                        {
                            "question": "Which keyword allows modifying a variable residing in an enclosing, outer nested function?",
                            "question_type": "mcq",
                            "options": ["nonlocal", "global", "outer", "super"],
                            "correct_answer": "nonlocal",
                            "explanation": "The nonlocal keyword binds a variable to the nearest enclosing scope.",
                        },
                        {
                            "question": "True or False: `*args` packs keyword arguments into a dictionary.",
                            "question_type": "true_false",
                            "options": ["True", "False"],
                            "correct_answer": "False",
                            "explanation": "`*args` packs variable positional arguments into a tuple; `**kwargs` packs keyword arguments into a dictionary.",
                        },
                    ],
                },
                {
                    "title": "Object-Oriented Programming (OOP) in Python",
                    "topic": "OOP",
                    "summary": "Core pillars of Object-Oriented Programming: classes, instantiation, encapsulation, `__init__`, and dunder methods.",
                    "tags": ["python", "oop", "classes", "dunder", "encapsulation"],
                    "core_concepts": [
                        "Classes as blueprints and instances as stateful objects",
                        "The `__init__` constructor and `self` reference",
                        "Private conventions via leading underscore (_private vs __mangling)",
                        "Magic/dunder methods (`__str__`, `__repr__`, `__len__`)",
                    ],
                    "detailed_explanation": (
                        "# Object-Oriented Programming in Python\n\n"
                        "OOP organizes code into reusable classes containing state (attributes) and behavior (methods).\n\n"
                        "## The `self` Parameter\n"
                        "`self` represents the instance calling the method. It allows each object to maintain its own attribute namespace.\n\n"
                        "## Dunder Methods\n"
                        "Special methods enclosed in double underscores allow integration with Python syntax:\n"
                        "- `__init__`: Initializes state upon instantiation.\n"
                        "- `__str__`: Returns user-friendly string representation for `print()`.\n"
                        "- `__repr__`: Returns unambiguous technical representation for debugging."
                    ),
                    "examples": [
                        "class BankAccount:\n    def __init__(self, owner: str, balance: float = 0.0):\n        self.owner = owner\n        self._balance = balance\n\n    def deposit(self, amount: float):\n        if amount <= 0:\n            raise ValueError('Must be positive')\n        self._balance += amount\n        return self._balance",
                    ],
                    "common_mistakes": [
                        "Forgetting `self` as the first parameter in instance methods.",
                        "Confusing class attributes (shared across all instances) with instance attributes.",
                    ],
                    "key_takeaways": [
                        "Instance attributes belong to specific objects; class attributes are shared.",
                        "Use `@property` decorators to manage getters and setters cleanly.",
                    ],
                    "sources": ["Fluent Python by Luciano Ramalho"],
                    "questions": [
                        {
                            "question": "What is the purpose of `self` in Python class instance methods?",
                            "question_type": "mcq",
                            "options": [
                                "It references the specific instance calling the method",
                                "It declares the method as a static utility",
                                "It allocates heap memory for the Python interpreter",
                                "It refers to the parent superclass",
                            ],
                            "correct_answer": "It references the specific instance calling the method",
                            "explanation": "`self` explicitly refers to the instance object on which the method is invoked.",
                        },
                        {
                            "question": "True or False: Double leading underscores like `__variable` trigger name mangling in Python classes.",
                            "question_type": "true_false",
                            "options": ["True", "False"],
                            "correct_answer": "True",
                            "explanation": "Name mangling transforms `__variable` into `_ClassName__variable` to prevent subclass namespace collisions.",
                        },
                        {
                            "question": "Fill in the blank: The special method called when creating a human-readable string representation of an object is `________`.",
                            "question_type": "fill_blank",
                            "options": None,
                            "correct_answer": "__str__",
                            "explanation": "The `__str__` method is invoked by str() and print().",
                        },
                    ],
                },
                {
                    "title": "Inheritance & Method Resolution Order (MRO)",
                    "topic": "Inheritance",
                    "summary": "Single and multiple inheritance, `super()` mechanics, and the C3 linearization algorithm.",
                    "tags": ["python", "inheritance", "mro", "super"],
                    "core_concepts": [
                        "Subclassing and code reuse",
                        "Overriding parent methods and cooperative multiple inheritance",
                        "The C3 Linearization algorithm behind MRO",
                    ],
                    "detailed_explanation": "Inheritance enables a subclass to inherit attributes and methods from a base class. Use `super()` to delegate method calls cleanly.",
                    "examples": ["class Animal:\n    def speak(self): return 'Sound'\nclass Dog(Animal):\n    def speak(self): return 'Bark'"],
                    "common_mistakes": ["Directly calling parent class `Parent.__init__(self)` instead of `super().__init__()`."],
                    "key_takeaways": ["Inspect `ClassName.mro()` to see method resolution sequence."],
                    "sources": ["Python Data Model Reference"],
                    "questions": [
                        {
                            "question": "Which method on a class reveals its linear hierarchy for method lookups?",
                            "question_type": "mcq",
                            "options": [".mro()", ".hierarchy()", ".parents()", ".resolve()"],
                            "correct_answer": ".mro()",
                            "explanation": "The Method Resolution Order can be inspected via Class.mro().",
                        },
                        {
                            "question": "True or False: Python supports multiple inheritance.",
                            "question_type": "true_false",
                            "options": ["True", "False"],
                            "correct_answer": "True",
                            "explanation": "Python natively supports inheriting from multiple parent classes.",
                        },
                    ],
                },
                {
                    "title": "Robust Exception Handling in Python",
                    "topic": "Exception Handling",
                    "summary": "Try, except, else, finally blocks, custom exceptions, and exception chaining.",
                    "tags": ["python", "exceptions", "error-handling", "debugging"],
                    "core_concepts": [
                        "LBYL vs EAFP coding philosophy",
                        "The execution flow of try/except/else/finally",
                        "Exception chaining via `raise ... from ...`",
                    ],
                    "detailed_explanation": "Python favors 'Easier to Ask for Forgiveness than Permission' (EAFP). Use specific exception classes rather than bare `except:`.",
                    "examples": ["try:\n    value = int('123')\nexcept ValueError as e:\n    print('Invalid')\nelse:\n    print('Success')\nfinally:\n    print('Cleanup')"],
                    "common_mistakes": ["Catching bare `except:` which also suppresses KeyboardInterrupt and SystemExit."],
                    "key_takeaways": ["The `else` block executes only when NO exception was raised in `try`."],
                    "sources": ["Effective Python by Brett Slatkin"],
                    "questions": [
                        {
                            "question": "When does the `else` block in a `try/except/else/finally` construct execute?",
                            "question_type": "mcq",
                            "options": [
                                "Only when NO exceptions occurred in the try block",
                                "Always, regardless of errors",
                                "Only when an unhandled exception occurred",
                                "Only after the finally block executes",
                            ],
                            "correct_answer": "Only when NO exceptions occurred in the try block",
                            "explanation": "The else block runs only if the try block completed without raising an exception.",
                        },
                        {
                            "question": "Fill in the blank: The block that ALWAYS executes in a try statement for resource cleanup is `________`.",
                            "question_type": "fill_blank",
                            "options": None,
                            "correct_answer": "finally",
                            "explanation": "The finally block always runs, making it ideal for closing files and network connections.",
                        },
                    ],
                },
                {
                    "title": "File Handling & Context Managers",
                    "topic": "File Handling",
                    "summary": "Opening, reading, writing, and safely closing files with context managers and the `with` statement.",
                    "tags": ["python", "files", "io", "context-managers"],
                    "core_concepts": [
                        "The `open()` built-in modes: r, w, a, b, +",
                        "The Context Manager protocol: `__enter__` and `__exit__`",
                        "Buffered reading for large files",
                    ],
                    "detailed_explanation": "Always use the `with` statement when opening files to ensure descriptors are safely closed even during unhandled exceptions.",
                    "examples": ["with open('log.txt', 'r', encoding='utf-8') as f:\n    for line in f:\n        print(line.strip())"],
                    "common_mistakes": ["Opening files without specifying an explicit `encoding='utf-8'`."],
                    "key_takeaways": ["Context managers guarantee deterministic resource deallocation."],
                    "sources": ["Python Standard Library Documentation"],
                    "questions": [
                        {
                            "question": "Which Python keyword implements the context management protocol for deterministic cleanup?",
                            "question_type": "mcq",
                            "options": ["with", "using", "handle", "manage"],
                            "correct_answer": "with",
                            "explanation": "The `with` statement manages the entry and exit of runtime context.",
                        },
                        {
                            "question": "True or False: Using `with open(...)` automatically closes the file handle even if an error occurs inside the block.",
                            "question_type": "true_false",
                            "options": ["True", "False"],
                            "correct_answer": "True",
                            "explanation": "The context manager guarantees `__exit__` is called, ensuring file descriptor cleanup.",
                        },
                    ],
                },
            ],
        },
        {
            "unique_id": "data_demo",
            "email": "data_demo@learnnote.ai",
            "password": "DataDemo123!",
            "subject": "Data Science & Analysis",
            "notes": [
                {
                    "title": "NumPy Array Mechanics & Vectorization",
                    "topic": "NumPy",
                    "summary": "Multidimensional arrays (ndarrays), broadcasting rules, memory strides, and vectorized computation.",
                    "tags": ["data-science", "numpy", "arrays", "vectorization"],
                    "core_concepts": [
                        "Homogeneous memory layout and contiguous C/Fortran strides",
                        "Vectorized element-wise operations replacing Python for-loops",
                        "Broadcasting dimensions across arrays of differing shapes",
                    ],
                    "detailed_explanation": "NumPy ndarrays store data in continuous memory blocks, enabling SIMD vectorization and orders of magnitude speedups over native Python lists.",
                    "examples": ["import numpy as np\na = np.array([1, 2, 3])\nb = np.array([[10], [20]])\nprint(a + b) # Broadcasted addition"],
                    "common_mistakes": ["Iterating through NumPy arrays with Python for-loops instead of vectorized operations."],
                    "key_takeaways": ["Broadcasting aligns trailing dimensions from right to left."],
                    "sources": ["NumPy User Guide"],
                    "questions": [
                        {
                            "question": "What is the primary performance advantage of NumPy arrays over standard Python lists?",
                            "question_type": "mcq",
                            "options": [
                                "Contiguous memory layout enabling vectorized C-level operations",
                                "Support for arbitrary mixed data types in a single array",
                                "Automatic multi-threaded asynchronous execution",
                                "Dynamic automatic schema migrations",
                            ],
                            "correct_answer": "Contiguous memory layout enabling vectorized C-level operations",
                            "explanation": "NumPy uses contiguous, homogeneous memory blocks allowing fast CPU vectorized operations.",
                        },
                        {
                            "question": "True or False: In NumPy broadcasting, dimensions are compared starting from the trailing (rightmost) dimension.",
                            "question_type": "true_false",
                            "options": ["True", "False"],
                            "correct_answer": "True",
                            "explanation": "Broadcasting rules compare shapes element-wise starting from trailing dimensions backwards.",
                        },
                    ],
                },
                {
                    "title": "Pandas Fundamentals & Series",
                    "topic": "Pandas",
                    "summary": "Introduction to Pandas 1D Series and 2D DataFrame data structures, indexing, and alignment.",
                    "tags": ["data-science", "pandas", "series", "dataframes"],
                    "core_concepts": [
                        "Series as indexed 1D labeled arrays",
                        "Automatic label-based alignment across operations",
                        "Hierarchical MultiIndex structures",
                    ],
                    "detailed_explanation": "Pandas builds on NumPy to provide labeled, relational data structures with powerful aggregation, joining, and filtering capabilities.",
                    "examples": ["import pandas as pd\ns = pd.Series([10, 20, 30], index=['a', 'b', 'c'])\nprint(s['b']) # 20"],
                    "common_mistakes": ["Modifying a slice of a DataFrame without using `.loc` or `.copy()` causing SettingWithCopyWarning."],
                    "key_takeaways": ["Pandas aligns data automatically on index labels before performing operations."],
                    "sources": ["Python for Data Analysis by Wes McKinney"],
                    "questions": [
                        {
                            "question": "What warning does Pandas emit when attempting to modify a view instead of an explicit copy?",
                            "question_type": "mcq",
                            "options": [
                                "SettingWithCopyWarning",
                                "ImplicitMutationError",
                                "SliceAllocationWarning",
                                "IndexAlignmentAlert",
                            ],
                            "correct_answer": "SettingWithCopyWarning",
                            "explanation": "SettingWithCopyWarning alerts you that an assignment might modify an unintended temporary view.",
                        },
                    ],
                },
                {
                    "title": "Data Cleaning & Missing Value Handling",
                    "topic": "Data Cleaning",
                    "summary": "Techniques for identifying, imputing, and dropping null values (NaN), removing duplicates, and casting dtypes.",
                    "tags": ["data-science", "data-cleaning", "imputation", "preprocessing"],
                    "core_concepts": [
                        "Detecting missing values with `isna()` and `notna()`",
                        "Imputation strategies: mean, median, mode, forward/backward fill",
                        "Duplicate row detection and removal",
                    ],
                    "detailed_explanation": "Real-world data contains noise, missingness, and inconsistencies. Clean data is a mandatory prerequisite for valid statistical modeling.",
                    "examples": ["df.dropna(subset=['critical_col'])\ndf['age'] = df['age'].fillna(df['age'].median())"],
                    "common_mistakes": ["Imputing the mean when data has extreme skew or outliers (median is more robust)."],
                    "key_takeaways": ["Always assess whether missingness is MCAR, MAR, or MNAR."],
                    "sources": ["Data Cleaning Best Practices Guidelines"],
                    "questions": [
                        {
                            "question": "Which imputation statistic is most resistant to extreme outliers when filling missing numerical values?",
                            "question_type": "mcq",
                            "options": ["Median", "Mean", "Standard Deviation", "Variance"],
                            "correct_answer": "Median",
                            "explanation": "The median is robust against extreme outliers, whereas the mean can be heavily skewed.",
                        },
                        {
                            "question": "Fill in the blank: In Pandas, the method used to detect missing or NaN values across a DataFrame is `________`.",
                            "question_type": "fill_blank",
                            "options": None,
                            "correct_answer": "isna",
                            "explanation": "`isna()` or `isnull()` returns a boolean mask indicating missing values.",
                        },
                    ],
                },
                {
                    "title": "Advanced DataFrame Operations & GroupBy",
                    "topic": "DataFrames",
                    "summary": "Split-Apply-Combine patterns using `groupby`, pivot tables, reshaping with melt, and merging dataframes.",
                    "tags": ["data-science", "dataframes", "groupby", "aggregation"],
                    "core_concepts": [
                        "The Split-Apply-Combine paradigm",
                        "Aggregations (`agg`), transformations (`transform`), and filtering",
                        "Merging on primary and foreign key columns",
                    ],
                    "detailed_explanation": "The `groupby` operation splits data into buckets by one or more keys, applies aggregation or transformation functions, and combines results.",
                    "examples": ["grouped = df.groupby('department')['salary'].agg(['mean', 'max', 'count'])"],
                    "common_mistakes": ["Using slow custom Python functions in `.apply()` when vectorized Cython built-ins exist."],
                    "key_takeaways": ["Prefer built-in agg string names like 'mean' or 'sum' for optimized performance."],
                    "sources": ["Pandas Official GroupBy Documentation"],
                    "questions": [
                        {
                            "question": "Which fundamental design pattern describes Pandas' `groupby` operation?",
                            "question_type": "mcq",
                            "options": ["Split-Apply-Combine", "Map-Reduce-Filter", "Producer-Consumer", "Pipeline-Sink"],
                            "correct_answer": "Split-Apply-Combine",
                            "explanation": "GroupBy splits data into groups, applies a function to each group, and combines the output.",
                        },
                    ],
                },
                {
                    "title": "Data Visualization Principles",
                    "topic": "Data Visualization",
                    "summary": "Visual encoding principles, chart selection (scatter, bar, histogram, boxplot), and avoiding misleading visual encodings.",
                    "tags": ["data-science", "visualization", "matplotlib", "seaborn"],
                    "core_concepts": [
                        "Pre-attentive visual attributes (length, position, color)",
                        "Selecting the right chart for distributions vs comparisons",
                        "Maintaining proportional ink and baseline scales",
                    ],
                    "detailed_explanation": "Visualizations communicate empirical evidence quickly. Choose bar charts for categorical comparison and histograms/boxplots for distributions.",
                    "examples": ["import matplotlib.pyplot as plt\nplt.hist(df['values'], bins=30)\nplt.title('Distribution')\nplt.show()"],
                    "common_mistakes": ["Truncating bar chart y-axis away from zero, distorting visual comparisons."],
                    "key_takeaways": ["Always start bar chart value axes at zero."],
                    "sources": ["The Visual Display of Quantitative Information by Edward Tufte"],
                    "questions": [
                        {
                            "question": "True or False: Bar charts should always start their quantitative axis at zero to prevent visual distortion.",
                            "question_type": "true_false",
                            "options": ["True", "False"],
                            "correct_answer": "True",
                            "explanation": "Because length encodes value in bar charts, non-zero baselines mislead viewers regarding relative magnitude.",
                        },
                    ],
                },
            ],
        },
        {
            "unique_id": "cs_demo",
            "email": "cs_demo@learnnote.ai",
            "password": "CSDemo123!",
            "subject": "Computer Science Foundations",
            "notes": [
                {
                    "title": "Database Management Systems (DBMS) & ACID",
                    "topic": "DBMS",
                    "summary": "Relational database fundamentals, the relational model, storage engines, and ACID transaction guarantees.",
                    "tags": ["computer-science", "dbms", "database", "acid", "transactions"],
                    "core_concepts": [
                        "Relational model, relations, tuples, and schemas",
                        "ACID: Atomicity, Consistency, Isolation, Durability",
                        "Write-Ahead Logging (WAL) and crash recovery",
                    ],
                    "detailed_explanation": (
                        "# Database Management Systems (DBMS)\n\n"
                        "A DBMS coordinates physical storage, query optimization, and concurrent access to structured data.\n\n"
                        "## ACID Guarantees\n"
                        "- **Atomicity**: Transactions execute completely or abort entirely (All or Nothing).\n"
                        "- **Consistency**: State transitions preserve all database invariants and constraints.\n"
                        "- **Isolation**: Concurrent transactions execute without mutual interference according to isolation level.\n"
                        "- **Durability**: Committed data survives sudden power loss or system crashes via Write-Ahead Logging (WAL)."
                    ),
                    "examples": ["BEGIN TRANSACTION;\nUPDATE accounts SET balance = balance - 100 WHERE id = 1;\nUPDATE accounts SET balance = balance + 100 WHERE id = 2;\nCOMMIT;"],
                    "common_mistakes": ["Assuming default isolation levels prevent all race conditions like write skew or phantom reads."],
                    "key_takeaways": ["Write-Ahead Logging guarantees Durability by writing changes to non-volatile disk before data pages."],
                    "sources": ["Database System Concepts by Silberschatz, Korth, and Sudarshan"],
                    "questions": [
                        {
                            "question": "What does the 'A' in ACID transaction properties stand for?",
                            "question_type": "mcq",
                            "options": ["Atomicity", "Availability", "Authentication", "Asynchronous"],
                            "correct_answer": "Atomicity",
                            "explanation": "Atomicity guarantees that all operations in a transaction succeed, or all are rolled back.",
                        },
                        {
                            "question": "True or False: Write-Ahead Logging (WAL) ensures durability by recording changes to disk before writing to data pages.",
                            "question_type": "true_false",
                            "options": ["True", "False"],
                            "correct_answer": "True",
                            "explanation": "WAL guarantees that changes can be replayed after a crash, ensuring durability.",
                        },
                        {
                            "question": "Fill in the blank: The property ensuring concurrent transactions do not interfere with each other is ________.",
                            "question_type": "fill_blank",
                            "options": None,
                            "correct_answer": "Isolation",
                            "explanation": "Isolation prevents transactions from viewing uncommitted or intermediate states of other transactions.",
                        },
                    ],
                },
                {
                    "title": "SQL JOINs: Inner, Outer, Cross & Self",
                    "topic": "SQL JOINs",
                    "summary": "Relational algebra and SQL join types: INNER, LEFT, RIGHT, FULL OUTER, CROSS, and self-joins.",
                    "tags": ["computer-science", "sql", "joins", "relational-algebra"],
                    "core_concepts": [
                        "Cartesian products and relational join predicates",
                        "INNER JOIN vs LEFT/RIGHT OUTER JOIN null preservation",
                        "Hash joins vs nested loops vs merge joins in query execution",
                    ],
                    "detailed_explanation": "SQL JOIN clauses merge rows from two or more tables based on matching column predicates.",
                    "examples": ["SELECT u.name, o.total\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id;"],
                    "common_mistakes": ["Accidentally creating a CROSS JOIN (Cartesian product) by omitting the `ON` condition."],
                    "key_takeaways": ["A LEFT JOIN retains all rows from the left table even when no match exists on the right."],
                    "sources": ["SQL Antipatterns by Bill Karwin"],
                    "questions": [
                        {
                            "question": "Which SQL JOIN returns all rows from the left table and matched rows from the right, populating NULLs for missing matches?",
                            "question_type": "mcq",
                            "options": ["LEFT OUTER JOIN", "INNER JOIN", "CROSS JOIN", "RIGHT JOIN"],
                            "correct_answer": "LEFT OUTER JOIN",
                            "explanation": "LEFT OUTER JOIN preserves every row from the left relation, filling unmatched right columns with NULL.",
                        },
                    ],
                },
                {
                    "title": "Operating Systems: Processes, Threads & CPU Scheduling",
                    "topic": "Operating Systems",
                    "summary": "Process state lifecycles, thread concurrency, context switching overhead, and CPU scheduling algorithms.",
                    "tags": ["computer-science", "operating-systems", "processes", "threads", "scheduling"],
                    "core_concepts": [
                        "Process address space (text, data, heap, stack)",
                        "Kernel threads vs user threads and context switches",
                        "Scheduling algorithms: FCFS, Round Robin, Priority, Multilevel Feedback Queue",
                    ],
                    "detailed_explanation": "The OS manages hardware abstraction, allocating CPU time across competing processes using preemptive schedulers.",
                    "examples": ["// Pseudocode context switch\nsave_process_registers(P1);\nload_process_registers(P2);\nswitch_page_directory(P2.page_table);"],
                    "common_mistakes": ["Confusing processes (independent address spaces) with threads (shared memory within a process)."],
                    "key_takeaways": ["Context switches involve saving CPU register state and switching virtual memory mappings."],
                    "sources": ["Operating System Concepts by Silberschatz & Galvin"],
                    "questions": [
                        {
                            "question": "What is the primary difference in memory sharing between processes and threads of the same process?",
                            "question_type": "mcq",
                            "options": [
                                "Threads share the same virtual address space and heap; processes have isolated address spaces",
                                "Processes share memory by default; threads require inter-process sockets",
                                "Threads run in kernel space only; processes run in user space only",
                                "There is no architectural difference",
                            ],
                            "correct_answer": "Threads share the same virtual address space and heap; processes have isolated address spaces",
                            "explanation": "Threads share memory and open handles within their parent process; processes are strictly isolated.",
                        },
                        {
                            "question": "True or False: In Round Robin scheduling, each runnable process is allocated a fixed slice of time called a quantum.",
                            "question_type": "true_false",
                            "options": ["True", "False"],
                            "correct_answer": "True",
                            "explanation": "Round Robin assigns a time quantum per process and cycles through the ready queue preemptively.",
                        },
                    ],
                },
                {
                    "title": "Computer Networks: The OSI & TCP/IP Models",
                    "topic": "Computer Networks",
                    "summary": "Layered protocol stacks, encapsulation, IP addressing, TCP 3-way handshake, and reliable packet transmission.",
                    "tags": ["computer-science", "networking", "tcp-ip", "osi", "protocols"],
                    "core_concepts": [
                        "The 7-layer OSI model vs 4-layer TCP/IP stack",
                        "TCP 3-way handshake (SYN, SYN-ACK, ACK)",
                        "TCP flow control (sliding window) and congestion control",
                    ],
                    "detailed_explanation": "Network architectures divide communication into modular layers: Application, Transport, Network, and Link.",
                    "examples": ["Client -> SYN -> Server\nServer -> SYN-ACK -> Client\nClient -> ACK -> Server\n[Connection Established]"],
                    "common_mistakes": ["Assuming UDP guarantees packet order or delivery (UDP is connectionless and best-effort)."],
                    "key_takeaways": ["TCP guarantees ordered, reliable delivery; UDP trades reliability for lower latency."],
                    "sources": ["Computer Networking: A Top-Down Approach by Kurose & Ross"],
                    "questions": [
                        {
                            "question": "Which protocol guarantees ordered, reliable, connection-oriented packet delivery at the transport layer?",
                            "question_type": "mcq",
                            "options": ["TCP", "UDP", "IP", "ICMP"],
                            "correct_answer": "TCP",
                            "explanation": "TCP provides reliable, sequenced byte-stream delivery with congestion and flow control.",
                        },
                        {
                            "question": "Fill in the blank: The three packets in the TCP connection handshake are SYN, SYN-ACK, and ________.",
                            "question_type": "fill_blank",
                            "options": None,
                            "correct_answer": "ACK",
                            "explanation": "The client completes the three-way handshake by sending an ACK packet.",
                        },
                    ],
                },
                {
                    "title": "Database Normalization (1NF to BCNF)",
                    "topic": "Normalization",
                    "summary": "Eliminating data anomalies, functional dependencies, 1NF (atomicity), 2NF, 3NF, and Boyce-Codd Normal Form.",
                    "tags": ["computer-science", "databases", "normalization", "bcnf", "sql"],
                    "core_concepts": [
                        "Insertion, update, and deletion anomalies",
                        "1NF: Atomic attributes and no repeating groups",
                        "2NF: Elimination of partial functional dependencies on composite keys",
                        "3NF: Elimination of transitive dependencies",
                    ],
                    "detailed_explanation": "Normalization organizes relational tables to reduce data redundancy and enhance data integrity.",
                    "examples": ["// 1NF violation: phone_numbers: '123, 456'\n// 1NF fix: separate rows per atomic number"],
                    "common_mistakes": ["Over-normalizing read-heavy analytical databases where denormalization improves query performance."],
                    "key_takeaways": ["3NF requires that non-key attributes depend on the key, the whole key, and nothing but the key."],
                    "sources": ["Database Systems: The Complete Book by Garcia-Molina"],
                    "questions": [
                        {
                            "question": "Which normal form requires eliminating transitive dependencies between non-prime attributes?",
                            "question_type": "mcq",
                            "options": ["Third Normal Form (3NF)", "First Normal Form (1NF)", "Second Normal Form (2NF)", "Fifth Normal Form (5NF)"],
                            "correct_answer": "Third Normal Form (3NF)",
                            "explanation": "3NF removes transitive dependencies (where non-key column A determines non-key column B).",
                        },
                    ],
                },
            ],
        },
    ]

    now = datetime.now(timezone.utc)

    for demo in demo_definitions:
        user = db.query(User).filter(User.unique_id == demo["unique_id"]).first()
        if not user:
            user = User(
                unique_id=demo["unique_id"],
                email=demo["email"],
                password_hash=hash_password(demo["password"]),
                is_demo=True,
                created_at=now - timedelta(days=14),
            )
            db.add(user)
            db.flush()
            logger.info(f"Created demo user: {user.unique_id} ({user.email})")

        # Check if user already has notes
        existing_notes_count = db.query(Note).filter(Note.user_id == user.id).count()
        if existing_notes_count == 0:
            all_user_questions = []
            for note_idx, n_data in enumerate(demo["notes"]):
                # Spread out review timestamps for revision testing
                last_rev = None
                if note_idx == 0:
                    last_rev = now - timedelta(days=1)
                elif note_idx == 1:
                    last_rev = now - timedelta(days=5)
                elif note_idx == 2:
                    last_rev = now - timedelta(days=10)
                # Remaining notes have None (never reviewed)

                content_dict = {
                    "core_concepts": n_data["core_concepts"],
                    "detailed_explanation": n_data["detailed_explanation"],
                    "examples": n_data["examples"],
                    "common_mistakes": n_data["common_mistakes"],
                    "key_takeaways": n_data["key_takeaways"],
                    "sources": n_data["sources"],
                }

                note = Note(
                    user_id=user.id,
                    title=n_data["title"],
                    subject=demo["subject"],
                    topic=n_data["topic"],
                    summary=n_data["summary"],
                    content=content_dict,
                    source_type="topic",
                    source_reference="LearnNote AI Seed Generator",
                    last_reviewed_at=last_rev,
                    created_at=now - timedelta(days=14 - note_idx),
                    updated_at=now - timedelta(days=14 - note_idx),
                )
                db.add(note)
                db.flush()

                # Associate tags
                for tag_name in n_data["tags"]:
                    tag_obj = get_or_create_tag(db, tag_name)
                    note_tag = NoteTag(note_id=note.id, tag_id=tag_obj.id)
                    db.add(note_tag)

                # Add questions
                for q_data in n_data["questions"]:
                    question = Question(
                        user_id=user.id,
                        note_id=note.id,
                        question=q_data["question"],
                        question_type=q_data["question_type"],
                        options=q_data.get("options"),
                        correct_answer=q_data["correct_answer"],
                        explanation=q_data["explanation"],
                        created_at=now - timedelta(days=14 - note_idx),
                    )
                    db.add(question)
                    db.flush()
                    all_user_questions.append(question)

            # Pre-seed 2 completed quiz attempts for each demo user so analytics are rich!
            if len(all_user_questions) >= 5:
                # Attempt 1: 5 questions, 4 correct (80%)
                attempt1 = QuizAttempt(
                    user_id=user.id,
                    score=4,
                    total_questions=5,
                    topic_scope=f"{demo['notes'][0]['topic']}, {demo['notes'][1]['topic']}",
                    created_at=now - timedelta(days=3),
                )
                db.add(attempt1)
                db.flush()

                for i in range(5):
                    q = all_user_questions[i]
                    is_corr = (i != 1)  # 1 wrong
                    ans = QuizAnswer(
                        attempt_id=attempt1.id,
                        question_id=q.id,
                        selected_answer=q.correct_answer if is_corr else "Incorrect Answer Option",
                        is_correct=is_corr,
                        question_text=q.question,
                        question_type=q.question_type,
                        correct_answer=q.correct_answer,
                        explanation=q.explanation,
                    )
                    db.add(ans)

                # Attempt 2: 4 questions, 4 correct (100%)
                attempt2 = QuizAttempt(
                    user_id=user.id,
                    score=4,
                    total_questions=4,
                    topic_scope="Comprehensive Practice",
                    created_at=now - timedelta(hours=12),
                )
                db.add(attempt2)
                db.flush()

                for i in range(min(4, len(all_user_questions))):
                    q = all_user_questions[i]
                    ans = QuizAnswer(
                        attempt_id=attempt2.id,
                        question_id=q.id,
                        selected_answer=q.correct_answer,
                        is_correct=True,
                        question_text=q.question,
                        question_type=q.question_type,
                        correct_answer=q.correct_answer,
                        explanation=q.explanation,
                    )
                    db.add(ans)

    db.commit()
    logger.info("Demo accounts seeded successfully.")

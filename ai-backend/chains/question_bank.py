"""
Pre-written MCQ fallback bank.
Used when LLM is rate-limited or unavailable.
"""

QUESTION_BANK: dict[str, list[dict]] = {
    "React": [
        {"question": "What hook is used to manage local state in a React functional component?", "options": ["useEffect", "useState", "useContext", "useReducer"], "correct_index": 1},
        {"question": "What does the useEffect hook do when given an empty dependency array []?", "options": ["Runs on every render", "Runs only once on mount", "Runs only on unmount", "Never runs"], "correct_index": 1},
        {"question": "Which of the following is the correct way to pass data from parent to child in React?", "options": ["Using state", "Using props", "Using context only", "Using refs"], "correct_index": 1},
        {"question": "What is the Virtual DOM in React?", "options": ["A direct copy of the browser DOM", "A lightweight in-memory representation of the real DOM", "A database for storing UI state", "A CSS rendering engine"], "correct_index": 1},
        {"question": "Which method is used to prevent a component from re-rendering unnecessarily?", "options": ["React.memo", "React.clone", "React.lazy", "React.strict"], "correct_index": 0},
    ],
    "Python": [
        {"question": "What is the output of `type([])` in Python?", "options": ["<class 'tuple'>", "<class 'dict'>", "<class 'list'>", "<class 'set'>"], "correct_index": 2},
        {"question": "Which keyword is used to define a generator function in Python?", "options": ["async", "yield", "return", "lambda"], "correct_index": 1},
        {"question": "What does `*args` allow in a Python function?", "options": ["Keyword arguments only", "A fixed number of arguments", "Variable positional arguments", "Default arguments"], "correct_index": 2},
        {"question": "What is a Python decorator?", "options": ["A class that inherits from another", "A function that wraps another function", "A type annotation", "A module import alias"], "correct_index": 1},
        {"question": "Which data structure uses LIFO (Last In First Out)?", "options": ["Queue", "Stack", "Deque", "Heap"], "correct_index": 1},
    ],
    "SQL": [
        {"question": "Which SQL clause is used to filter rows after grouping?", "options": ["WHERE", "HAVING", "FILTER", "GROUP BY"], "correct_index": 1},
        {"question": "What does a LEFT JOIN return?", "options": ["Only matching rows from both tables", "All rows from the left table and matching rows from the right", "All rows from both tables", "Only rows from the right table"], "correct_index": 1},
        {"question": "Which SQL keyword removes duplicate rows from a result set?", "options": ["UNIQUE", "DISTINCT", "FILTER", "REMOVE"], "correct_index": 1},
        {"question": "What is an index in SQL used for?", "options": ["Storing backup data", "Speeding up query performance", "Defining foreign keys", "Creating views"], "correct_index": 1},
        {"question": "Which aggregate function returns the number of rows?", "options": ["SUM", "AVG", "COUNT", "MAX"], "correct_index": 2},
    ],
    "Node.js": [
        {"question": "What is the event loop in Node.js?", "options": ["A loop that handles HTTP requests only", "A mechanism that handles async operations without blocking", "A built-in database loop", "A CSS animation loop"], "correct_index": 1},
        {"question": "Which module is used to create an HTTP server in Node.js?", "options": ["fs", "path", "http", "net"], "correct_index": 2},
        {"question": "What does `npm install --save-dev` do?", "options": ["Installs a package globally", "Installs a package as a production dependency", "Installs a package as a development dependency", "Updates all packages"], "correct_index": 2},
        {"question": "What is middleware in Express.js?", "options": ["A database connector", "A function that has access to req, res, and next", "A template engine", "A routing algorithm"], "correct_index": 1},
        {"question": "What does `process.env` give you access to?", "options": ["Browser environment variables", "System environment variables", "Package.json variables", "Database config"], "correct_index": 1},
    ],
    "TypeScript": [
        {"question": "What is the difference between `interface` and `type` in TypeScript?", "options": ["They are identical", "interface can be extended, type cannot", "Both can be extended but interface supports declaration merging", "type is faster at runtime"], "correct_index": 2},
        {"question": "What does the `?` operator mean in a TypeScript interface property?", "options": ["The property is required", "The property is optional", "The property is readonly", "The property is nullable only"], "correct_index": 1},
        {"question": "What is a TypeScript generic?", "options": ["A default value for a variable", "A placeholder type that is specified when the function is called", "A type that accepts any value", "A built-in utility type"], "correct_index": 1},
        {"question": "What does `as const` do in TypeScript?", "options": ["Converts a value to a constant at runtime", "Makes all properties readonly and infers literal types", "Prevents reassignment only", "Converts strings to numbers"], "correct_index": 1},
        {"question": "What is the `never` type used for in TypeScript?", "options": ["Variables that are undefined", "Functions that never return", "Empty arrays", "Null values"], "correct_index": 1},
    ],
    "DSA": [
        {"question": "What is the time complexity of binary search?", "options": ["O(n)", "O(n²)", "O(log n)", "O(1)"], "correct_index": 2},
        {"question": "Which data structure is used for BFS traversal?", "options": ["Stack", "Queue", "Heap", "Tree"], "correct_index": 1},
        {"question": "What is the worst-case time complexity of quicksort?", "options": ["O(n log n)", "O(n)", "O(n²)", "O(log n)"], "correct_index": 2},
        {"question": "What is a hash collision?", "options": ["When two keys map to the same hash value", "When a hash table is full", "When a key is deleted", "When two tables merge"], "correct_index": 0},
        {"question": "Which sorting algorithm is stable and has O(n log n) worst case?", "options": ["Quicksort", "Heapsort", "Merge sort", "Bubble sort"], "correct_index": 2},
    ],
    "System Design": [
        {"question": "What does horizontal scaling mean?", "options": ["Adding more CPU to one server", "Adding more servers to distribute load", "Increasing RAM on existing servers", "Upgrading the database"], "correct_index": 1},
        {"question": "What is a CDN used for?", "options": ["Database replication", "Serving static assets from geographically distributed servers", "Load balancing API requests", "Encrypting data in transit"], "correct_index": 1},
        {"question": "What is the CAP theorem?", "options": ["A theorem about CPU, API, and Persistence", "Consistency, Availability, Partition tolerance — you can only guarantee 2", "A caching strategy", "A network protocol"], "correct_index": 1},
        {"question": "What is a message queue used for in distributed systems?", "options": ["Storing user sessions", "Decoupling services and handling async communication", "Caching database queries", "Load balancing HTTP requests"], "correct_index": 1},
        {"question": "What is database sharding?", "options": ["Backing up a database", "Splitting a database into smaller pieces across multiple servers", "Encrypting database columns", "Creating read replicas"], "correct_index": 1},
    ],
    "Machine Learning": [
        {"question": "What is overfitting in machine learning?", "options": ["Model performs well on training data but poorly on new data", "Model performs poorly on both training and test data", "Model trains too slowly", "Model uses too little data"], "correct_index": 0},
        {"question": "What does gradient descent do?", "options": ["Increases model complexity", "Minimizes the loss function by updating weights", "Splits data into train/test sets", "Normalizes input features"], "correct_index": 1},
        {"question": "What is a confusion matrix used for?", "options": ["Visualizing neural network layers", "Evaluating classification model performance", "Plotting training loss", "Selecting hyperparameters"], "correct_index": 1},
        {"question": "What is the purpose of a validation set?", "options": ["To train the model", "To tune hyperparameters without touching the test set", "To augment training data", "To evaluate final model performance"], "correct_index": 1},
        {"question": "Which algorithm is used for dimensionality reduction?", "options": ["Random Forest", "PCA", "KNN", "SVM"], "correct_index": 1},
    ],
    "Docker": [
        {"question": "What is a Docker image?", "options": ["A running container instance", "A read-only template used to create containers", "A virtual machine", "A network configuration file"], "correct_index": 1},
        {"question": "What does `docker-compose up` do?", "options": ["Builds a single container", "Starts all services defined in docker-compose.yml", "Pushes images to Docker Hub", "Removes all containers"], "correct_index": 1},
        {"question": "What is the difference between CMD and ENTRYPOINT in a Dockerfile?", "options": ["They are identical", "CMD provides defaults that can be overridden; ENTRYPOINT sets the main command", "ENTRYPOINT is for environment variables", "CMD runs at build time"], "correct_index": 1},
        {"question": "What is a Docker volume used for?", "options": ["Networking between containers", "Persisting data outside the container lifecycle", "Limiting CPU usage", "Exposing ports"], "correct_index": 1},
        {"question": "What does `docker ps` show?", "options": ["All Docker images", "Currently running containers", "Docker network config", "Stopped containers only"], "correct_index": 1},
    ],
    "PostgreSQL": [
        {"question": "What is a transaction in PostgreSQL?", "options": ["A single SQL query", "A sequence of operations treated as a single unit", "A stored procedure", "A database backup"], "correct_index": 1},
        {"question": "What does VACUUM do in PostgreSQL?", "options": ["Deletes all data", "Reclaims storage from dead tuples", "Creates indexes", "Backs up the database"], "correct_index": 1},
        {"question": "What is a CTE (Common Table Expression)?", "options": ["A type of index", "A temporary named result set defined with WITH", "A foreign key constraint", "A trigger function"], "correct_index": 1},
        {"question": "What does EXPLAIN ANALYZE do?", "options": ["Shows table schema", "Executes the query and shows actual execution plan with timing", "Lists all indexes", "Validates SQL syntax"], "correct_index": 1},
        {"question": "What is the difference between CHAR and VARCHAR?", "options": ["No difference", "CHAR is fixed-length, VARCHAR is variable-length", "VARCHAR is faster", "CHAR supports Unicode only"], "correct_index": 1},
    ],
}

def get_fallback_questions(skill: str) -> list[dict]:
    """Return pre-written questions for a skill. Falls back to closest match."""
    if skill in QUESTION_BANK:
        return QUESTION_BANK[skill]

    # Try case-insensitive match
    skill_lower = skill.lower()
    for key in QUESTION_BANK:
        if key.lower() == skill_lower:
            return QUESTION_BANK[key]

    # Partial match (e.g. "JavaScript" → "TypeScript" or "Node.js")
    for key in QUESTION_BANK:
        if skill_lower in key.lower() or key.lower() in skill_lower:
            return QUESTION_BANK[key]

    # Last resort: return TypeScript questions (closest to JS ecosystem)
    return QUESTION_BANK.get("TypeScript", QUESTION_BANK["Python"])

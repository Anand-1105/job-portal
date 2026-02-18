export type SkillCategory = 'frontend' | 'backend' | 'database' | 'devops' | 'mobile' | 'languages' | 'tools' | 'soft' | 'datascience';

export interface SkillDefinition {
    name: string;
    category: SkillCategory;
    synonyms: string[];
    weight: number; // 1-3, where 3 is high impact
}

export const skillDatabase: Record<string, SkillDefinition> = {
    // Languages
    "javascript": { name: "JavaScript", category: "languages", synonyms: ["js", "es6", "es2015", "ecmascript"], weight: 3 },
    "typescript": { name: "TypeScript", category: "languages", synonyms: ["ts"], weight: 3 },
    "python": { name: "Python", category: "languages", synonyms: ["py"], weight: 3 },
    "java": { name: "Java", category: "languages", synonyms: [], weight: 3 },
    "c#": { name: "C#", category: "languages", synonyms: ["csharp", ".net"], weight: 2 },
    "c++": { name: "C++", category: "languages", synonyms: ["cpp"], weight: 2 },
    "go": { name: "Go", category: "languages", synonyms: ["golang"], weight: 2 },
    "rust": { name: "Rust", category: "languages", synonyms: [], weight: 2 },
    "php": { name: "PHP", category: "languages", synonyms: [], weight: 2 },
    "ruby": { name: "Ruby", category: "languages", synonyms: [], weight: 2 },
    "swift": { name: "Swift", category: "languages", synonyms: [], weight: 2 },
    "kotlin": { name: "Kotlin", category: "languages", synonyms: [], weight: 2 },
    "sql": { name: "SQL", category: "languages", synonyms: ["structured query language"], weight: 3 },
    "html": { name: "HTML", category: "frontend", synonyms: ["html5"], weight: 2 },
    "css": { name: "CSS", category: "frontend", synonyms: ["css3"], weight: 2 },

    // Frontend
    "react": { name: "React", category: "frontend", synonyms: ["reactjs", "react.js"], weight: 3 },
    "vue": { name: "Vue.js", category: "frontend", synonyms: ["vuejs", "vue"], weight: 2 },
    "angular": { name: "Angular", category: "frontend", synonyms: ["angularjs"], weight: 2 },
    "next.js": { name: "Next.js", category: "frontend", synonyms: ["nextjs"], weight: 3 },
    "redux": { name: "Redux", category: "frontend", synonyms: [], weight: 2 },
    "tailwind": { name: "Tailwind CSS", category: "frontend", synonyms: ["tailwindcss"], weight: 2 },
    "bootstrap": { name: "Bootstrap", category: "frontend", synonyms: [], weight: 1 },
    "sass": { name: "Sass", category: "frontend", synonyms: ["scss"], weight: 1 },
    "material ui": { name: "Material UI", category: "frontend", synonyms: ["mui"], weight: 1 },

    // Backend
    "node.js": { name: "Node.js", category: "backend", synonyms: ["node", "nodejs"], weight: 3 },
    "express": { name: "Express.js", category: "backend", synonyms: ["expressjs"], weight: 2 },
    "django": { name: "Django", category: "backend", synonyms: [], weight: 2 },
    "flask": { name: "Flask", category: "backend", synonyms: [], weight: 2 },
    "spring": { name: "Spring Boot", category: "backend", synonyms: ["spring boot", "springboot"], weight: 3 },
    "graphql": { name: "GraphQL", category: "backend", synonyms: ["gql"], weight: 2 },
    "rest api": { name: "REST API", category: "backend", synonyms: ["restful", "rest"], weight: 2 },

    // Database
    "postgresql": { name: "PostgreSQL", category: "database", synonyms: ["postgres"], weight: 3 },
    "mysql": { name: "MySQL", category: "database", synonyms: [], weight: 2 },
    "mongodb": { name: "MongoDB", category: "database", synonyms: ["mongo"], weight: 2 },
    "redis": { name: "Redis", category: "database", synonyms: [], weight: 2 },
    "firebase": { name: "Firebase", category: "database", synonyms: ["firestore"], weight: 2 },
    "supabase": { name: "Supabase", category: "database", synonyms: [], weight: 2 },
    "elasticsearch": { name: "Elasticsearch", category: "database", synonyms: [], weight: 2 },

    // DevOps & Cloud
    "aws": { name: "AWS", category: "devops", synonyms: ["amazon web services"], weight: 3 },
    "azure": { name: "Azure", category: "devops", synonyms: [], weight: 2 },
    "gcp": { name: "Google Cloud", category: "devops", synonyms: ["google cloud platform"], weight: 2 },
    "docker": { name: "Docker", category: "devops", synonyms: [], weight: 3 },
    "kubernetes": { name: "Kubernetes", category: "devops", synonyms: ["k8s"], weight: 3 },
    "jenkins": { name: "Jenkins", category: "devops", synonyms: [], weight: 2 },
    "github actions": { name: "GitHub Actions", category: "devops", synonyms: ["gh actions"], weight: 2 },
    "git": { name: "Git", category: "tools", synonyms: [], weight: 3 },
    "linux": { name: "Linux", category: "devops", synonyms: [], weight: 2 },
    "ci/cd": { name: "CI/CD", category: "devops", synonyms: ["continuous integration", "continuous deployment"], weight: 2 },

    // Data Science & AI
    "machine learning": { name: "Machine Learning", category: "datascience", synonyms: ["ml"], weight: 3 },
    "deep learning": { name: "Deep Learning", category: "datascience", synonyms: ["dl"], weight: 3 },
    "tensorflow": { name: "TensorFlow", category: "datascience", synonyms: ["tf"], weight: 2 },
    "pytorch": { name: "PyTorch", category: "datascience", synonyms: [], weight: 2 },
    "pandas": { name: "Pandas", category: "datascience", synonyms: [], weight: 2 },
    "numpy": { name: "NumPy", category: "datascience", synonyms: [], weight: 2 },
    "scikit-learn": { name: "Scikit-Learn", category: "datascience", synonyms: ["sklearn"], weight: 2 },
    "nlp": { name: "NLP", category: "datascience", synonyms: ["natural language processing"], weight: 2 },

    // Soft Skills (Careful with these, often buzzwords)
    "leadership": { name: "Leadership", category: "soft", synonyms: ["leading teams", "team lead"], weight: 2 },
    "communication": { name: "Communication", category: "soft", synonyms: ["written communication", "verbal communication"], weight: 2 },
    "problem solving": { name: "Problem Solving", category: "soft", synonyms: ["troubleshooting"], weight: 2 },
    "agile": { name: "Agile", category: "soft", synonyms: ["scrum", "kanban"], weight: 2 },
    "mentoring": { name: "Mentoring", category: "soft", synonyms: ["mentored"], weight: 2 },
};

export const stopWords = new Set([
    "a", "an", "the", "and", "or", "but", "if", "then", "else", "when",
    "at", "by", "for", "from", "in", "into", "of", "off", "on", "onto",
    "to", "with", "within", "without", "about", "above", "below", "during",
    "under", "up", "down", "over", "through", "after", "before", "between",
    "is", "am", "are", "was", "were", "be", "been", "being", "have", "has",
    "had", "do", "does", "did", "can", "could", "shall", "should", "will",
    "would", "may", "might", "must", "very", "too", "so", "not", "no",
    "inc", "ltd", "corp", "corporation", "llc", "co", "company", "technologies",
    "solutions", "services", "group", "holdings", "enterprises", "system", "systems",
    "software", "hiring", "looking", "seeking", "wanted", "role", "position",
    "job", "description", "responsibilities", "requirements", "qualifications",
    "experience", "years", "work", "team", "environment", "growth", "opportunity",
    "equal", "employer", "candidate", "applicant", "strong", "excellent", "proven",
    "track", "record", "ability", "knowledge", "understanding", "familiarity",
    "proficient", "proficiency", "skills", "plus", "preferred", "advantage",
    "degree", "bachelor", "master", "phd", "university", "college", "school",
    "remote", "hybrid", "onsite", "location", "salary", "benefits", "competitive",
    "package", "compensation", "per", "hour", "annum", "year", "month"
]);

import { skillDatabase, SkillDefinition } from './skillDatabase'

const STRONG_WORDS = new Set([
    "accelerated", "achieved", "architected", "automated", "built", "championed",
    "delivered", "developed", "driven", "engineered", "established", "exceeded",
    "generated", "implemented", "improved", "initiated", "launched", "led",
    "maximized", "optimized", "orchestrated", "pioneered", "reduced", "resolved",
    "revitalized", "spearheaded", "stratigized", "structured", "transformed"
])

const WEAK_WORDS = new Set([
    "responsible for", "helped", "assisted", "worked on", "participated in",
    "attempted", "trying", "various", "etc"
])

export interface ATSAnalysisResult {
    score: number
    matchedSkills: Record<string, SkillDefinition[]>
    missingSkills: Record<string, SkillDefinition[]>
    totalSkillsFound: number
    strongWords: string[]
    weakWords: string[]
    sections: {
        hasContact: boolean
        hasExperience: boolean
        hasEducation: boolean
        hasSkills: boolean
        hasProjects: boolean
    }
    recommendations: string[]
}

/**
 * Normalize text for analysis
 * - Lowercase
 * - Remove special characters (keep +, #, . for C++, C#, Node.js)
 * - Replace newlines with spaces
 */
export function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[\r\n]+/g, ' ')
        .replace(/[^\w\s.#+]/g, ' ') // Keep . # + for tech terms
        .replace(/\s+/g, ' ')
        .trim()
}

/**
 * Generate N-grams from text (1, 2, and 3-word phrases)
 */
function generateNGrams(text: string): string[] {
    const words = text.split(' ')
    const ngrams: string[] = []

    // 1-grams, 2-grams, 3-grams
    for (let i = 0; i < words.length; i++) {
        // 1-gram
        ngrams.push(words[i])

        // 2-gram
        if (i < words.length - 1) {
            ngrams.push(`${words[i]} ${words[i + 1]}`)
        }

        // 3-gram
        if (i < words.length - 2) {
            ngrams.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`)
        }
    }

    return ngrams
}

/**
 * Extract matched skills from text using the skill database
 */
export function extractSkills(text: string): SkillDefinition[] {
    const normalized = normalizeText(text)
    const ngrams = generateNGrams(normalized)
    const foundSkills = new Set<string>()
    const skills: SkillDefinition[] = []

    ngrams.forEach(gram => {
        // Check direct matches
        if (skillDatabase[gram] && !foundSkills.has(skillDatabase[gram].name)) {
            skills.push(skillDatabase[gram])
            foundSkills.add(skillDatabase[gram].name)
            return
        }

        // Check synonyms
        // We iterate the DB (optimized: usually we'd invert the map, but for ~100 items this is fine)
        for (const def of Object.values(skillDatabase)) {
            if (foundSkills.has(def.name)) continue

            if (def.synonyms.includes(gram)) {
                skills.push(def)
                foundSkills.add(def.name)
            }
        }
    })

    return skills
}

/**
 * Detect resume sections
 */
export function detectSections(resumeText: string) {
    const textLower = resumeText.toLowerCase()

    return {
        hasContact: /email|phone|address|linkedin|github|contact/.test(textLower),
        hasExperience: /experience|work history|employment|positions|professional history/.test(textLower),
        hasEducation: /education|degree|university|college|school|academic/.test(textLower),
        hasSkills: /skills|technologies|proficiencies|expertise|technical stack/.test(textLower),
        hasProjects: /projects|portfolio|personal projects/.test(textLower)
    }
}

/**
 * Detect writing style (Strong vs Weak words)
 */
function analyzeWritingStyle(text: string) {
    const normalize = text.toLowerCase()
    const strongFound: string[] = []
    const weakFound: string[] = []

    STRONG_WORDS.forEach(word => {
        if (normalize.includes(word)) strongFound.push(word)
    })

    WEAK_WORDS.forEach(phrase => {
        if (normalize.includes(phrase)) weakFound.push(phrase)
    })

    return { strongFound, weakFound }
}

/**
 * Calculate Score based on Weighted Skills
 */
function calculateWeightedScore(
    matched: SkillDefinition[],
    missing: SkillDefinition[],
    sections: any
): number {
    let score = 0

    // 1. Skill Matching (70% of score)
    // We weight the IMPORTANCE of the missing skills
    // If a JD requires Python (weight 3) and you miss it, big penalty.

    const matchedWeight = matched.reduce((acc, skill) => acc + skill.weight, 0)
    const missingWeight = missing.reduce((acc, skill) => acc + skill.weight, 0)
    const totalSkillWeight = matchedWeight + missingWeight

    if (totalSkillWeight > 0) {
        const skillScore = (matchedWeight / totalSkillWeight) * 70
        score += skillScore
    } else {
        // No skills detected in JD? Fallback or give full points if text is long enough
        score += 35 // Neutral
    }

    // 2. Section Completeness (30% of score)
    if (sections.hasContact) score += 5
    if (sections.hasExperience) score += 10
    if (sections.hasEducation) score += 5
    if (sections.hasSkills) score += 5
    if (sections.hasProjects) score += 5

    return Math.min(Math.round(score), 100)
}

/**
 * Group skills by category
 */
function groupSkillsByCategory(skills: SkillDefinition[]): Record<string, SkillDefinition[]> {
    const grouped: Record<string, SkillDefinition[]> = {}

    skills.forEach(skill => {
        if (!grouped[skill.category]) {
            grouped[skill.category] = []
        }
        grouped[skill.category].push(skill)
    })

    return grouped
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(
    score: number,
    missingSkills: SkillDefinition[],
    sections: any,
    strongCount: number,
    weakCount: number
): string[] {
    const recommendations: string[] = []

    // 1. Critical Skill Gaps
    const criticalMissing = missingSkills.filter(s => s.weight === 3).slice(0, 3)
    if (criticalMissing.length > 0) {
        recommendations.push(`Your profile is missing core requirements: ${criticalMissing.map(s => s.name).join(', ')}. adding these is the fastest way to improve your score.`)
    }

    // 2. Category-based Insights
    const missingCategories = new Set(missingSkills.map(s => s.category))

    if (missingCategories.has('frontend') && !missingCategories.has('backend')) {
        recommendations.push("You have strong backend coverage but are missing key frontend keywords. Ensure you list frameworks like React or Vue if you know them.")
    } else if (missingCategories.has('backend') && !missingCategories.has('frontend')) {
        recommendations.push("Your frontend profile is solid, but the JD requires backend knowledge. Highlight any API or database experience.")
    }

    // 3. Section Optimization
    if (!sections.hasProjects) {
        recommendations.push("You are missing a 'Projects' section. Listing 2-3 github projects proves you can apply your skills.")
    }

    // 4. Writing Style Logic
    if (weakCount > 0) {
        recommendations.push(`Replace weak phrases like "Responsible for" or "Worked on" with strong action verbs (e.g., "Spearheaded", "Engineered").`)
    }
    if (strongCount < 3) {
        recommendations.push("Use more 'Power Words' (e.g., 'Achieved', 'Optimized') to quantify your impact and pass screeners.")
    }

    // 5. Strategic Advice (Score based)
    if (score < 50) {
        recommendations.push("The gap between your resume and the JD is significant. Consider simpler roles or a heavy revision.")
    }

    // 6. Soft Skills
    if (missingSkills.some(s => s.category === 'soft')) {
        recommendations.push("Don't underestimate culture match. Explicitly mention soft skills like 'Communication' or 'Leadership'.")
    }

    return recommendations.slice(0, 5) // Top 5
}

/**
 * Main Analysis Function
 */
export function analyzeResume(
    resumeText: string,
    jobDescription: string
): ATSAnalysisResult {
    // 1. Extract Skills from JD (The "Target")
    const jdSkills = extractSkills(jobDescription)

    // 2. Extract Skills from Resume (The "Source")
    const resumeSkills = extractSkills(resumeText)
    const resumeSkillNames = new Set(resumeSkills.map(s => s.name))

    // 3. Compare
    const matched: SkillDefinition[] = []
    const missing: SkillDefinition[] = []

    jdSkills.forEach(reqSkill => {
        if (resumeSkillNames.has(reqSkill.name)) {
            matched.push(reqSkill)
        } else {
            missing.push(reqSkill)
        }
    })

    // Remove duplicates in matched/missing lists
    const uniqueMatched = Array.from(new Set(matched))
    const uniqueMissing = Array.from(new Set(missing))

    // 4. Section Detection
    const sections = detectSections(resumeText)

    // 5. Writing Style
    const { strongFound, weakFound } = analyzeWritingStyle(resumeText)

    // 6. Calculate Score (Bonus for strong words)
    let score = calculateWeightedScore(uniqueMatched, uniqueMissing, sections)
    if (strongFound.length > 4) score = Math.min(score + 5, 100) // Small bonus for impact verbs

    // 7. Group for UI
    const matchedGrouped = groupSkillsByCategory(uniqueMatched)
    const missingGrouped = groupSkillsByCategory(uniqueMissing)

    // 8. Recommendations
    const recommendations = generateRecommendations(score, uniqueMissing, sections, strongFound.length, weakFound.length)

    return {
        score,
        matchedSkills: matchedGrouped,
        missingSkills: missingGrouped,
        totalSkillsFound: uniqueMatched.length,
        strongWords: strongFound,
        weakWords: weakFound,
        sections,
        recommendations
    }
}

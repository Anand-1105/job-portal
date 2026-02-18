
import { analyzeResume } from './src/lib/atsAnalyzer.ts';

// Mock data
const jd = `
We are looking for a Senior React Developer who knows TypeScript and Node.js.
Must have experience with AWS and CI/CD.
Excellent communication skills required.
`;

const resume = `
I am a Frontend Developer with 5 years of experience.
I work with ReactJS, TS, and Redux.
Familiar with backend techs like Node and Express.
`;

console.log("Running ATS Analysis...");
const result = analyzeResume(resume, jd);

console.log("Score:", result.score);
console.log("Matched Skills:", JSON.stringify(result.matchedSkills, null, 2));
console.log("Missing Skills:", JSON.stringify(result.missingSkills, null, 2));
console.log("Sections:", result.sections);

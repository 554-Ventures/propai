const SYSTEM_PROMPT_PATTERNS = [/system\s+prompt/i, /developer\s+message/i, /hidden\s+instructions/i];
const SOCIAL_ENGINEERING_PATTERNS = [
  /send\s+me\s+your\s+(password|ssn|social\s+security|bank\s+account|credit\s+card)/i,
  /click\s+this\s+link\s+to\s+verify/i
];
const PROFANITY_PATTERNS = [/\b(fuck|shit|bitch|asshole|bastard)\b/i];
const HATE_PATTERNS = [/\b(kill\s+all|exterminate)\b/i];
const PII_PATTERNS = [/\b\d{3}-\d{2}-\d{4}\b/, /\b(?:\d[ -]*?){13,16}\b/];

export type OutputFilterResult = {
  allowed: boolean;
  reason?: string;
};

export const filterAiOutput = (text: string): OutputFilterResult => {
  for (const pattern of SYSTEM_PROMPT_PATTERNS) {
    if (pattern.test(text)) {
      return { allowed: false, reason: "system_prompt_exfil" };
    }
  }

  for (const pattern of SOCIAL_ENGINEERING_PATTERNS) {
    if (pattern.test(text)) {
      return { allowed: false, reason: "social_engineering" };
    }
  }

  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(text)) {
      return { allowed: false, reason: "profanity" };
    }
  }

  for (const pattern of HATE_PATTERNS) {
    if (pattern.test(text)) {
      return { allowed: false, reason: "hate_speech" };
    }
  }

  for (const pattern of PII_PATTERNS) {
    if (pattern.test(text)) {
      return { allowed: false, reason: "pii_detected" };
    }
  }

  return { allowed: true };
};

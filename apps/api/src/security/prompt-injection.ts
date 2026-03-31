export type PromptInjectionMatch = {
  label: string;
  severity: "low" | "medium" | "high";
  pattern: RegExp;
};

const PROMPT_INJECTION_PATTERNS: PromptInjectionMatch[] = [
  { label: "ignore_instructions", severity: "high", pattern: /ignore\s+(all|any|previous|earlier)\s+instructions/i },
  { label: "role_hijack", severity: "high", pattern: /you\s+are\s+now\b/i },
  { label: "system_prompt_exfil", severity: "high", pattern: /(reveal|show|print).{0,40}(system|developer|hidden)\s+prompt/i },
  { label: "system_override", severity: "high", pattern: /(system|developer)\s+message/i },
  { label: "tool_exfil", severity: "medium", pattern: /(list|show).{0,20}tools?/i },
  { label: "sql_injection_union", severity: "medium", pattern: /\bunion\b\s+\bselect\b/i },
  { label: "sql_injection_comment", severity: "medium", pattern: /(--|;--|\/\*|\*\/)/ },
  { label: "sql_injection_or", severity: "medium", pattern: /'\s*or\s*1=1/i },
  { label: "xss_script", severity: "high", pattern: /<\s*script\b/i },
  { label: "xss_event_handler", severity: "medium", pattern: /on\w+\s*=/i },
  { label: "xss_js_protocol", severity: "medium", pattern: /javascript:/i }
];

export type PromptInjectionResult = {
  blocked: boolean;
  matches: string[];
  severity: "low" | "medium" | "high" | "none";
};

const severityRank: Record<PromptInjectionResult["severity"], number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3
};

export const detectPromptInjection = (input: string): PromptInjectionResult => {
  const matches: string[] = [];
  let maxSeverity: PromptInjectionResult["severity"] = "none";

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.pattern.test(input)) {
      matches.push(pattern.label);
      if (severityRank[pattern.severity] > severityRank[maxSeverity]) {
        maxSeverity = pattern.severity;
      }
    }
  }

  const blocked = matches.length > 0;

  return { blocked, matches, severity: maxSeverity };
};

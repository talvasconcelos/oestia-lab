const REQUIRED_SECTIONS_EMAIL = [
  'Recommended reply',
  'Shorter version',
  'Alternative tone',
  'Assumptions I made',
  'Check before sending',
];

const REQUIRED_SECTIONS_DOCUMENT = [
  'Executive summary',
  'Main changes: Added, Removed, Changed',
  'Possible risks or questions',
  'Reviewer checklist',
  'Suggested reply',
];

export function hasSensitivePatterns(text = '') {
  const patterns = [
    /password\s*[:=]/i,
    /api[_ -]?key\s*[:=]/i,
    /secret\s*[:=]/i,
    /bearer\s+[a-z0-9._-]+/i,
    /\b(?:\d[ -]*?){13,16}\b/,
    /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/,
  ];
  return patterns.some((pattern) => pattern.test(text));
}

function cleanLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function summarizeTextDiff(oldText = '', newText = '') {
  const oldLines = cleanLines(oldText);
  const newLines = cleanLines(newText);
  const newSet = new Set(newLines);
  const oldSet = new Set(oldLines);
  const removedLines = oldLines.filter((line) => !newSet.has(line));
  const addedLines = newLines.filter((line) => !oldSet.has(line));

  return {
    oldWordCount: countWords(oldText),
    newWordCount: countWords(newText),
    addedLines,
    removedLines,
    changedLineCount: addedLines.length + removedLines.length,
  };
}

export function countWords(text = '') {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function buildEmailPrompt({
  language,
  outcome,
  tone,
  senderContext = 'Not provided',
  additionalContext = 'Not provided',
  emailThread,
  maxLength = 'No strict limit',
}) {
  return `You help professionals draft clear, useful email replies. Do not invent facts. If context is missing, state assumptions. Keep the reply human, practical and appropriate to the chosen tone. Avoid hype, clichés and overly polished corporate language. Never include private analysis in the final email body.

Draft an email reply.

Language: ${language}
Desired outcome: ${outcome}
Tone: ${tone}
Maximum length: ${maxLength}
Sender context: ${senderContext || 'Not provided'}
Additional context: ${additionalContext || 'Not provided'}

Email/thread:
${emailThread}

Return exactly these sections:
${REQUIRED_SECTIONS_EMAIL.map((section, index) => `${index + 1}. ${section}`).join('\n')}`;
}

export function buildDocumentPrompt({
  language,
  documentType,
  reviewFocus,
  reviewerRole = 'Not provided',
  knownConcern = 'Not provided',
  oldText,
  newText,
  diff = summarizeTextDiff(oldText, newText),
}) {
  return `You help professionals compare document versions. Be precise and conservative. Do not provide legal advice. Do not invent differences. Base your answer only on the supplied old and new text plus any deterministic diff summary provided. Explain changes in plain language and flag questions for human review.

Compare two document versions.

Language: ${language}
Document type: ${documentType}
Review focus: ${reviewFocus}
Reviewer role: ${reviewerRole || 'Not provided'}
Known concern: ${knownConcern || 'Not provided'}

Deterministic diff summary:
${JSON.stringify(diff, null, 2)}

Old version:
${oldText}

New version:
${newText}

Return exactly these sections:
${REQUIRED_SECTIONS_DOCUMENT.map((section, index) => `${index + 1}. ${section}`).join('\n')}

Important: Do not provide legal advice. Say when a human/legal/commercial review is needed.`;
}

export function copyText(text) {
  if (!navigator.clipboard) {
    throw new Error('Clipboard API unavailable');
  }
  return navigator.clipboard.writeText(text);
}

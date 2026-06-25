import { describe, expect, it } from 'vitest';
import {
  buildEmailPrompt,
  buildDocumentPrompt,
  hasSensitivePatterns,
  summarizeTextDiff,
} from '../src/automation.js';

describe('Oestia Lab automation helpers', () => {
  it('builds an email prompt with the selected outcome, tone and required sections', () => {
    const prompt = buildEmailPrompt({
      language: 'Português',
      outcome: 'Fazer follow-up de forma educada',
      tone: 'Profissional e próximo',
      senderContext: 'Consultor da Oestia',
      additionalContext: 'Formação de IA para PME',
      emailThread: 'Olá, ainda estamos a avaliar a proposta.',
      maxLength: '150 palavras',
    });

    expect(prompt).toContain('Fazer follow-up de forma educada');
    expect(prompt).toContain('Profissional e próximo');
    expect(prompt).toContain('Recommended reply');
    expect(prompt).toContain('Check before sending');
    expect(prompt).toContain('Olá, ainda estamos a avaliar a proposta.');
  });

  it('builds a document comparison prompt with deterministic diff context', () => {
    const oldText = 'Payment is due within 30 days.\nTwo sessions are included.';
    const newText = 'Payment is due within 15 days.\nThree sessions are included.';
    const diff = summarizeTextDiff(oldText, newText);
    const prompt = buildDocumentPrompt({
      language: 'English',
      documentType: 'Proposal',
      reviewFocus: 'Payment and scope',
      reviewerRole: 'Business owner',
      knownConcern: 'Check if scope increased',
      oldText,
      newText,
      diff,
    });

    expect(prompt).toContain('Payment and scope');
    expect(prompt).toContain('Executive summary');
    expect(prompt).toContain('Reviewer checklist');
    expect(prompt).toContain('Payment is due within 30 days.');
    expect(prompt).toContain('Payment is due within 15 days.');
    expect(prompt).toContain('changedLineCount');
  });

  it('summarizes added and removed lines', () => {
    const diff = summarizeTextDiff('A\nB\nC', 'A\nB changed\nD');

    expect(diff.removedLines).toEqual(['B', 'C']);
    expect(diff.addedLines).toEqual(['B changed', 'D']);
    expect(diff.changedLineCount).toBe(4);
  });

  it('flags obvious sensitive patterns', () => {
    expect(hasSensitivePatterns('password: hunter2')).toBe(true);
    expect(hasSensitivePatterns('api_key=abc123')).toBe(true);
    expect(hasSensitivePatterns('normal business email')).toBe(false);
  });
});

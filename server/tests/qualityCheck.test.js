import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { stripAgentLabels, checkQuality } from '../utils/qualityCheck.js';

describe('stripAgentLabels', () => {
  it('removes plain Agent 1 / Agent 2 label lines', () => {
    const text = 'Agent 1: Expert Copywriter\nHello world.\nAgent 2: Brutal AI Reviewer\nMore text.';
    const out = stripAgentLabels(text);
    assert.equal(out, 'Hello world.\nMore text.');
  });

  it('removes bolded label lines', () => {
    const text = '**Agent 1: Expert Copywriter**\nReal content here.';
    assert.equal(stripAgentLabels(text), 'Real content here.');
  });

  it('removes a bare "Agent 2" line', () => {
    const text = 'First paragraph.\nAgent 2\nSecond paragraph.';
    assert.equal(stripAgentLabels(text), 'First paragraph.\nSecond paragraph.');
  });

  it('keeps normal lines that merely mention the word agent', () => {
    const text = 'A travel agent can help you book flights.\nAgent Smith is a character in a film.';
    assert.equal(stripAgentLabels(text), text);
  });

  it('collapses the blank lines left behind', () => {
    const text = 'Para one.\n\nAgent 1: Expert Copywriter\n\nPara two.';
    assert.equal(stripAgentLabels(text), 'Para one.\n\nPara two.');
  });

  it('handles empty input', () => {
    assert.equal(stripAgentLabels(''), '');
    assert.equal(stripAgentLabels(null), '');
  });
});

describe('checkQuality with stripped output', () => {
  it('passes clean text with no placeholders', () => {
    const report = checkQuality('Drinking water keeps you focused and healthy. Make it a habit today.', { type: 'social', length: 'short' });
    assert.equal(report.passed, true);
  });
});

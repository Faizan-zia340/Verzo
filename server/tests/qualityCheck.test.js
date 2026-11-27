import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { stripAgentLabels, checkQuality, checkAiTells } from '../utils/qualityCheck.js';

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

  it('flags an AI tell through checkQuality', () => {
    const report = checkQuality('In the digital age, writing well matters. Keep sentences short and clear. Write every day and your readers will stay. Make each paragraph do one job.', { type: 'blog', length: 'short' });
    assert.equal(report.passed, false);
    assert.ok(report.issues.some((issue) => issue.startsWith('AI tell:')));
  });
});

describe('checkAiTells', () => {
  it('flags emoji in a markdown heading', () => {
    const issues = checkAiTells('# 🚀 How to Write a Blog\n\nWrite clearly and keep it short.', { type: 'blog' });
    assert.equal(issues.length, 1);
    assert.ok(issues[0].includes('emoji in a heading'));
  });

  it('flags emoji in a bold label', () => {
    const issues = checkAiTells('**✅ Key points:** Write clearly. Keep it short.', { type: 'blog' });
    assert.equal(issues.length, 1);
    assert.ok(issues[0].includes('emoji in a heading'));
  });

  it('does not flag emoji in social posts', () => {
    const issues = checkAiTells('# 🚀 New launch!\n\nWe shipped a big update today. 🎉', { type: 'social' });
    assert.equal(issues.length, 0);
  });

  it('flags shouty all-caps words', () => {
    const issues = checkAiTells('This is a FREE AMAZING LIMITED offer you must GRAB now.', { type: 'ad' });
    assert.equal(issues.length, 1);
    assert.ok(issues[0].includes('shouty all-caps'));
  });

  it('does not flag legitimate all-caps acronyms', () => {
    const issues = checkAiTells('The page uses HTML and CSS and JSON for its data.', { type: 'blog' });
    assert.equal(issues.length, 0);
  });

  it('flags clickbait phrasing', () => {
    const issues = checkAiTells("You won't believe what this tool can do for your writing.", { type: 'blog' });
    assert.equal(issues.length, 1);
    assert.ok(issues[0].includes('clickbait'));
  });

  it('flags a cliché opener', () => {
    const issues = checkAiTells('In the digital age, writing well matters more than ever. Keep it simple and clear.', { type: 'blog' });
    assert.equal(issues.length, 1);
    assert.ok(issues[0].includes('cliché opener'));
  });

  it('flags overused AI-cliché words at 3+ hits', () => {
    const issues = checkAiTells('The tapestry of the modern landscape is crucial. Moreover, it is pivotal. Furthermore, it shapes the realm of content.', { type: 'blog' });
    assert.equal(issues.length, 1);
    assert.ok(issues[0].includes('overused AI-cliché words'));
  });

  it('does not flag a single cliché word', () => {
    const issues = checkAiTells('This point is crucial for your readers. Keep it short and clear.', { type: 'blog' });
    assert.equal(issues.length, 0);
  });

  it('flags em-dash overuse', () => {
    const issues = checkAiTells('The tool — fast and simple — writes your blog — in seconds — and checks it — for errors.', { type: 'blog' });
    assert.equal(issues.length, 1);
    assert.ok(issues[0].includes('em-dashes'));
  });

  it('does not flag one or two em-dashes', () => {
    const issues = checkAiTells('The tool — fast and simple — writes your blog in seconds. It checks the draft and saves it.', { type: 'blog' });
    assert.equal(issues.length, 0);
  });

  it('passes clean text', () => {
    const issues = checkAiTells('Drinking water keeps you focused and healthy. Make it a habit today.', { type: 'blog' });
    assert.equal(issues.length, 0);
  });
});

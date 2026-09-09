import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';

function backend() {
  const properties = new Map();
  const context = vm.createContext({
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key) => properties.get(key), setProperty: (key, value) => properties.set(key, value) }) },
    console: { log() {} },
    Utilities: { getUuid: randomUUID, formatDate: (date) => date.toISOString() },
    Session: { getActiveUser: () => ({ getEmail: () => 'tester' }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  });
  vm.runInContext(readFileSync(new URL('../apps-script/Code.gs', import.meta.url), 'utf8'), context);
  const headers = vm.runInContext('HEADERS', context);
  const sheets = Object.fromEntries(Object.entries(headers).map(([name, columns]) => {
    const data = [[...columns]];
    return [name, {
      data,
      getLastRow: () => data.length,
      getLastColumn: () => Math.max(...data.map((row) => row.length)),
      getRange(row, col, height = 1, width = 1) {
        return {
          getValues: () => Array.from({ length: height }, (_, r) => Array.from({ length: width }, (_, c) => data[row - 1 + r]?.[col - 1 + c] ?? '')),
          setValues(values) {
            values.forEach((valuesRow, r) => {
              data[row - 1 + r] ??= [];
              valuesRow.forEach((value, c) => { data[row - 1 + r][col - 1 + c] = value; });
            });
          },
          setValue(value) { this.setValues([[value]]); },
        };
      },
    }];
  }));
  context.SpreadsheetApp = { openById: () => ({ getSheetByName: (name) => sheets[name] }) };
  return { context, sheets };
}

test('header mapping and applicant/stage writes retain IDs and HR recommendation', () => {
  const { context: c, sheets } = backend();
  assert.equal(c.headerToKey_('Applicant ID'), 'applicantId');
  assert.equal(c.headerToKey_('HR Recommendation'), 'hrRecommendation');
  const applicant = c.createApplicant({ applicantName: 'Sample', dateApplied: '2026-09-09' });
  assert.ok(applicant.applicantId);
  assert.equal(sheets.Applicants.data[1][0], applicant.applicantId);
  assert.equal(sheets.Status_History.data[1][1], applicant.applicantId);
  const interview = c.saveInitialInterview({ applicantId: applicant.applicantId, hrRecommendation: 'Proceed' });
  const loaded = c.getStageRecords_('Initial_Interview', applicant.applicantId);
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].interviewId, interview.interviewId);
  assert.equal(loaded[0].hrRecommendation, 'Proceed');
  assert.equal(c.updateApplicant({ applicantId: applicant.applicantId, applicantName: 'Updated' }).applicantId, applicant.applicantId);
});

test('RBM sequence continues across dates and deletions while updates retain identity', () => {
  const { context: c, sheets } = backend();
  const first = c.createApplicant({ applicantName: 'First', dateApplied: '2026-09-09' });
  assert.equal(first.applicantId, 'RBM-0001-20260909');
  sheets.Applicants.data.splice(1, 1);
  const second = c.createApplicant({ applicantName: 'Second', dateApplied: '2026-10-01' });
  assert.equal(second.applicantId, 'RBM-0002-20261001');
  const updated = c.updateApplicant({ applicantId: second.applicantId, dateApplied: '2026-10-02' });
  assert.equal(updated.applicantId, second.applicantId);
  assert.equal(sheets.Status_History.data[2][1], second.applicantId);
});

test('RBM sequence resumes from existing IDs and rejects invalid dates before writing', () => {
  const { context: c, sheets } = backend();
  sheets.Applicants.data.push(['RBM-0042-20260901', 'Existing']);
  for (const dateApplied of ['', '2026-02-30', '09/09/2026']) {
    assert.throws(() => c.createApplicant({ applicantName: 'Invalid', dateApplied }), /valid Date Applied/);
  }
  assert.equal(sheets.Applicants.data.length, 2);
  assert.equal(c.createApplicant({ applicantName: 'Next', dateApplied: '2026-09-09' }).applicantId, 'RBM-0043-20260909');
});

test('repair preserves existing IDs, skips empty rows, reports lost links, and is repeatable', () => {
  const { context: c, sheets } = backend();
  sheets.Applicants.data.push(['', 'First'], [], ['APP-existing', 'Second']);
  sheets.Status_History.data.push(['', '', '', 'New Applicant']);
  const result = c.repairMissingRecordIds();
  assert.equal(result.repaired.length, 2);
  assert.equal(result.unlinkedRows.length, 1);
  assert.ok(sheets.Applicants.data[1][0]);
  assert.equal(sheets.Applicants.data[3][0], 'APP-existing');
  assert.equal(sheets.Status_History.data[1][1], '');
  assert.equal(c.getApplicants().length, 2);
  assert.equal(c.repairMissingRecordIds().repaired.length, 0);
});

test('duplicate existing IDs abort repair before writes', () => {
  const { context: c, sheets } = backend();
  sheets.Applicants.data.push(['', 'Missing'], ['APP-1', 'First'], ['APP-1', 'Second']);
  assert.throws(() => c.repairMissingRecordIds(), /Duplicate ID/);
  assert.equal(sheets.Applicants.data[1][0], '');
});

test('repair accepts reordered ID columns and unrelated header differences', () => {
  const { context: c, sheets } = backend();
  sheets.Initial_Screening.data.splice(0, 1, ['Remarks', 'Applicant ID', 'Screening ID']);
  sheets.Initial_Screening.data.push(['Keep this', 'APP-existing', '']);
  c.repairMissingRecordIds();
  assert.equal(sheets.Initial_Screening.data[1][0], 'Keep this');
  assert.equal(sheets.Initial_Screening.data[1][1], 'APP-existing');
  assert.match(sheets.Initial_Screening.data[1][2], /^SCR-/);
  assert.deepEqual(sheets.Initial_Screening.data[0], ['Remarks', 'Applicant ID', 'Screening ID']);
});

test('incompatible stage headers are reported without blocking applicant repair', () => {
  const { context: c, sheets } = backend();
  sheets.Applicants.data.push(['', 'First']);
  sheets.Initial_Screening.data.splice(0, 1, ['Unknown ID', 'Notes']);
  sheets.Initial_Screening.data.push(['', 'Preserve me']);
  const result = c.repairMissingRecordIds();
  assert.equal(result.repaired.length, 1);
  assert.equal(result.skippedSheets[0].sheet, 'Initial_Screening');
  assert.equal(sheets.Initial_Screening.data[1][0], '');
  assert.throws(() => c.getStageRecords_('Initial_Screening'), /Header mismatch/);
  assert.deepEqual(sheets.Initial_Screening.data[0], ['Unknown ID', 'Notes']);
});

test('frontend normalizes legacy and blank aliases and rejects unusable IDs', () => {
  const source = readFileSync(new URL('../src/services/api.js', import.meta.url), 'utf8')
    .replace('import.meta.env.VITE_APPS_SCRIPT_URL', '"https://example.invalid"')
    .replaceAll('export async function', 'async function');
  const c = vm.createContext({ console });
  vm.runInContext(source, c);
  const records = c.normalizeApplicantList([{ id: '', applicantId: 'APP-1' }, { applicantID: 'APP-2' }, {}]);
  assert.equal(records.length, 2);
  assert.equal(records[0].id, 'APP-1');
  assert.equal(records[1].applicantId, 'APP-2');
  assert.throws(() => c.normalizeApplicantList([{ applicantName: 'Missing' }]), /missing or duplicate IDs/);
  assert.throws(() => c.normalizeApplicantList([{ id: 'same' }, { applicantId: 'same' }]), /missing or duplicate IDs/);
});

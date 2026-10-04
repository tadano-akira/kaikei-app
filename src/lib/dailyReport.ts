import type { DailyReport, DailyReportItem } from '../types';

// 旧形式の done（改行区切りテキスト）を箇条書き項目に読み替える。稼働時間は空。
export const legacyDoneToItems = (done?: string): DailyReportItem[] =>
  (done ?? '')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '')
    .map(content => ({ content, hours: null }));

export const reportItems = (r: DailyReport): DailyReportItem[] =>
  r.items ?? legacyDoneToItems(r.done);

export const reportTotalHours = (r: DailyReport): number =>
  reportItems(r).reduce((sum, i) => sum + (i.hours ?? 0), 0);

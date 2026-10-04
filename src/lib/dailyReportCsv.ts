import type { DailyReport } from '../types';
import { reportItems } from './dailyReport';

// kaikei-django の日報CSVと同じ列構成・同じ行の作り方にする。
export const DAILY_REPORT_CSV_HEADER = [
  '日付',
  '業務開始時間',
  '業務終了時間',
  '休憩時間(h)',
  '作業内容',
  '稼働時間(h)',
  '明日やること',
  '所感・メモ',
];

const formatHours = (h: number | null | undefined) => (h == null ? '' : h.toFixed(2));

// 1行 = 1作業項目。項目がない日は作業内容・稼働時間を空欄にして1行出す。
// 明日やること・所感・メモは日の最初の行にだけ出す。
export const buildDailyReportRows = (reports: DailyReport[], month: string): string[][] => {
  const rows: string[][] = [DAILY_REPORT_CSV_HEADER];
  const target = reports
    .filter(r => r.date.startsWith(`${month}-`))
    .sort((a, b) => a.date.localeCompare(b.date));

  for (const r of target) {
    const head = [
      r.date,
      r.workStartTime ?? '',
      r.workEndTime ?? '',
      formatHours(r.breakHours),
    ];
    const tail = [r.plan ?? '', r.note ?? ''];
    const items = reportItems(r);
    if (items.length === 0) {
      rows.push([...head, '', '', ...tail]);
      continue;
    }
    items.forEach((item, index) => {
      rows.push([
        ...head,
        item.content,
        formatHours(item.hours),
        ...(index === 0 ? tail : ['', '']),
      ]);
    });
  }
  return rows;
};

export const downloadDailyReportCsv = (reports: DailyReport[], month: string) => {
  const bom = '﻿';
  const csv = bom + buildDailyReportRows(reports, month)
    .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `daily_reports_${month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

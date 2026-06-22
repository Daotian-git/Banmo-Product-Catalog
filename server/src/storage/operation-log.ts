import * as fs from 'fs';
import * as path from 'path';

export interface LogEntry {
  code: string;
  name: string;
  success: boolean;
  error?: string;
}

export interface LogResult {
  type: '导入' | '删除' | '修改';
  total: number;
  success: number;
  failed: number;
  entries: LogEntry[];
  filename: string;
}

/**
 * 写入操作日志到本地 txt 文件
 */
export function writeOperationLog(result: LogResult): string {
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const logFilename = `${result.type}_${timestamp}.txt`;
  const logPath = path.join(logDir, logFilename);

  const lines: string[] = [];
  lines.push('='.repeat(50));
  lines.push(`  操作类型: 批量${result.type}`);
  lines.push(`  操作时间: ${now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
  lines.push('='.repeat(50));
  lines.push(`  总计: ${result.total} 条`);
  lines.push(`  成功: ${result.success} 条`);
  lines.push(`  失败: ${result.failed} 条`);
  lines.push('='.repeat(50));

  // 成功记录
  const successEntries = result.entries.filter(e => e.success);
  if (successEntries.length > 0) {
    lines.push('');
    lines.push(`成功记录 (${successEntries.length}):`);
    for (const entry of successEntries) {
      lines.push(`  ✓ ${entry.code || '(无编号)'} | ${entry.name}`);
    }
  }

  // 失败记录
  const failedEntries = result.entries.filter(e => !e.success);
  if (failedEntries.length > 0) {
    lines.push('');
    lines.push(`失败记录 (${failedEntries.length}):`);
    for (const entry of failedEntries) {
      lines.push(`  ✗ ${entry.code || '(无编号)'} | ${entry.name} — ${entry.error || '未知错误'}`);
    }
  }

  lines.push('');
  lines.push('='.repeat(50));
  lines.push('');

  fs.writeFileSync(logPath, lines.join('\n'), 'utf-8');

  setImmediate(async () => {
    try {
      result.filename = logFilename;
    } catch {
      // ignore
    }
  });
  result.filename = logFilename;

  console.log(`📋 操作日志已保存: logs/${logFilename}`);

  return logFilename;
}

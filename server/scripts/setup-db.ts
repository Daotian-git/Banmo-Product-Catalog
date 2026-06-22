/**
 * 数据库初始化脚本
 * 用法: npx ts-node scripts/setup-db.ts
 *
 * 如果表已存在则跳过，否则打印 SQL 让用户在 Supabase Dashboard 执行
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const url = process.env.COZE_SUPABASE_URL;
  const key = process.env.COZE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('❌ 请在 server/.env 中配置 COZE_SUPABASE_URL 和 COZE_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  const supabase = createClient(url, key);

  // 检查 categories 表
  const { error: catError } = await supabase.from('categories').select('count', { count: 'exact', head: true });
  const categoriesExist = !catError || !catError.message?.includes('does not exist');

  // 检查 products 表
  const { error: prodError } = await supabase.from('products').select('count', { count: 'exact', head: true });
  const productsExist = !prodError || !prodError.message?.includes('does not exist');

  if (categoriesExist && productsExist) {
    console.log('✅ 数据库表已存在，无需初始化');
    // 显示已有数据统计
    const { count: catCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
    const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
    console.log(`   categories: ${catCount ?? 0} 条记录`);
    console.log(`   products: ${prodCount ?? 0} 条记录`);
  } else {
    console.log('⚠️  数据库表尚未创建\n');
    console.log('请在 Supabase Dashboard → SQL Editor 中执行以下 SQL：');
    console.log('───────────────────────────────────────────────');
    const fs = require('fs');
    const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', '001_init.sql'), 'utf-8');
    console.log(sql);
    console.log('───────────────────────────────────────────────');
    console.log(`\n📋 Supabase Dashboard: ${url.replace('.supabase.co', '.supabase.com')}/project/default/sql/new`);
  }
}

main().catch(console.error);

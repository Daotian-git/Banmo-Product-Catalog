import { pgTable, serial, timestamp, varchar, numeric, jsonb, integer, index, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"


export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 产品分类表（支持二级分类）
export const categories = pgTable(
	"categories",
	{
		id: serial().primaryKey(),
		name: varchar("name", { length: 50 }).notNull(),
		parent_id: integer("parent_id").references(() => categories.id),  // 父分类ID，一级分类为null
		sort_order: numeric("sort_order", { precision: 10, scale: 3 }).notNull().default('0'),  // 排序权重：数值越大越靠后，支持小数点后3位
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("categories_sort_order_idx").on(table.sort_order),
		index("categories_parent_id_idx").on(table.parent_id),
	]
);

// 产品表
export const products = pgTable(
	"products",
	{
		id: serial().primaryKey(),
		code: varchar("code", { length: 50 }).unique(),               // 产品编号（唯一）
		name: varchar("name", { length: 100 }).notNull(),           // 产品名称
		category_id: integer("category_id").notNull().references(() => categories.id),  // 二级分类ID
		models: jsonb("models").notNull().default(sql`'[]'::jsonb`), // 型号列表，如 [{"model": "MJ-001", "size": "120×60×45"}]
		image_key: varchar("image_key", { length: 255 }),            // 对象存储key
		image_url: varchar("image_url", { length: 500 }),            // 图片URL
		layout: integer("layout").notNull().default(1),              // 排列方式：1=单列，2=双列
		sort_order: numeric("sort_order", { precision: 10, scale: 3 }).notNull().default('0'),  // 排序权重：数值越大越靠后，支持小数点后3位
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("products_category_id_idx").on(table.category_id),
		index("products_sort_order_idx").on(table.sort_order),
		index("products_layout_idx").on(table.layout),
	]
);
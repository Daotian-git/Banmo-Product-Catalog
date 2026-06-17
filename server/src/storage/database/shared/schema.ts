import { pgTable, serial, timestamp, varchar, numeric, jsonb, integer, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"


export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 产品分类表
export const categories = pgTable(
	"categories",
	{
		id: serial().primaryKey(),
		name: varchar("name", { length: 50 }).notNull(),
		icon: varchar("icon", { length: 10 }).notNull().default('📋'),
		sort_order: integer("sort_order").notNull().default(0),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("categories_sort_order_idx").on(table.sort_order),
	]
);

// 产品表
export const products = pgTable(
	"products",
	{
		id: serial().primaryKey(),
		name: varchar("name", { length: 100 }).notNull(),
		category_id: integer("category_id").notNull().references(() => categories.id),
		price: numeric("price", { precision: 10, scale: 2 }),  // 可选，图册不展示价格
		description: varchar("description", { length: 500 }),
		image_key: varchar("image_key", { length: 255 }),  // 对象存储key
		image_url: varchar("image_url", { length: 500 }),  // 签名URL（临时）
		material: varchar("material", { length: 100 }),
		size: varchar("size", { length: 100 }),
		weight: varchar("weight", { length: 50 }),
		process: varchar("process", { length: 100 }),
		origin: varchar("origin", { length: 100 }),
		features: jsonb("features"),  // 产品特点数组
		sort_order: integer("sort_order").notNull().default(0),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("products_category_id_idx").on(table.category_id),  // 外键索引
		index("products_sort_order_idx").on(table.sort_order),     // 排序索引
		index("products_created_at_idx").on(table.created_at),     // 时间索引
	]
);
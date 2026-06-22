-- 半墨家具 数据库初始化
-- 在 Supabase SQL Editor 中执行此文件，或在本地通过 psql 运行

-- 健康检查表
CREATE TABLE IF NOT EXISTS health_check (
    id SERIAL NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 产品分类表（支持二级分类）
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    parent_id INTEGER REFERENCES categories(id),
    sort_order NUMERIC(10, 3) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS categories_sort_order_idx ON categories(sort_order);
CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON categories(parent_id);

-- 产品表
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE,
    name VARCHAR(100) NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    models JSONB NOT NULL DEFAULT '[]'::jsonb,
    image_key VARCHAR(255),
    image_url VARCHAR(500),
    layout INTEGER NOT NULL DEFAULT 1,
    sort_order NUMERIC(10, 3) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS products_category_id_idx ON products(category_id);
CREATE INDEX IF NOT EXISTS products_sort_order_idx ON products(sort_order);
CREATE INDEX IF NOT EXISTS products_layout_idx ON products(layout);

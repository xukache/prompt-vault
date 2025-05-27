-- 为版本历史表添加用户版本号字段
ALTER TABLE prompt_versions ADD COLUMN user_version TEXT;

-- 为现有记录设置默认的用户版本号
UPDATE prompt_versions 
SET user_version = 'v' || version_number 
WHERE user_version IS NULL;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_prompt_versions_user_version ON prompt_versions(user_version); 
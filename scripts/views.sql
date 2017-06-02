
--- Definition
CREATE VIEW auth_user_groups AS

SELECT 1 AS id,
    ( SELECT auth_group.id
           FROM auth_group
          WHERE auth_group.name::text = 'Editors'::text) AS group_id,
    ( SELECT account_geokitsite.user_id
           FROM account_geokitsite
          WHERE account_geokitsite.schema_name::name = "current_schema"()) AS user_id
UNION
 SELECT 2 AS id,
    ( SELECT auth_group.id
           FROM auth_group
          WHERE auth_group.name::text = 'Moderators'::text) AS group_id,
    ( SELECT account_geokitsite.user_id
           FROM account_geokitsite
          WHERE account_geokitsite.schema_name::name = "current_schema"()) AS user_id;

--- Definition for site model

DROP TABLE wagtailcore_site CASCADE;
CREATE VIEW wagtailcore_site AS

 SELECT 2 AS id,
    ( SELECT account_geokitsite.schema_name
           FROM account_geokitsite
          WHERE account_geokitsite.schema_name::name = "current_schema"()) AS hostname,
    ( SELECT account_geokitsite.name
           FROM account_geokitsite
          WHERE account_geokitsite.schema_name::name = "current_schema"()) AS site_name,
    80 AS port,
    true AS is_default_site,
    2 AS root_page_id;
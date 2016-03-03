
Definition
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
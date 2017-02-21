CREATE INDEX layers_feature_properites_fid_idx ON layers_feature (((layers_feature.properties->>'fid')::integer));
CREATE INDEX geokit_tables_record_properties_fid_idx ON geokit_tables_record (((geokit_tables_record.properites->>'fid')::integer));

CREATE INDEX table_record_properties_idx ON geokit_tables_record USING gin (properties);
CREATE INDEX feature_properties_index ON layers_feature USING gin (properties)	

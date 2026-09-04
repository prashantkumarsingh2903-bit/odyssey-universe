CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS celestial_entities (
    entity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nasa_jpl_id VARCHAR,
    entity_class VARCHAR NOT NULL,
    spatial_coord GEOMETRY(PointZ) NOT NULL
);

CREATE INDEX IF NOT EXISTS celestial_entities_spatial_idx 
    ON celestial_entities USING GiST (spatial_coord);

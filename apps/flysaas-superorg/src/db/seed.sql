-- FlySaaS Seed Data
-- Initial organizations for development

-- Insert fly-swatter organization
INSERT INTO organizations (slug, name, status)
VALUES ('fly-swatter', 'Fly Swatter', 'active')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status;

-- Insert fly-high organization
INSERT INTO organizations (slug, name, status)
VALUES ('fly-high', 'Fly High', 'active')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status;

-- Add approved column to observation_pictures
ALTER TABLE "observation_pictures" ADD COLUMN "approved" boolean;

-- Add approved column to project_pictures
ALTER TABLE "project_pictures" ADD COLUMN "approved" boolean;

-- Add approved column to project_update_pictures
ALTER TABLE "project_update_pictures" ADD COLUMN "approved" boolean;

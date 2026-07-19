export type TagRecord = {
  tag_id: number;
  tag_name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
  deleted_at: string | null;
};

export type CreateTagBody = {
  tag_name: string;
};

export type UpdateTagBody = {
  tag_name?: string;
  active?: boolean;
};

export type TagParams = {
  tagId: number;
};

export type CreateTagResult = {
  success: true;
  created: true;
  tag: TagRecord;
  message: string;
};

export type UpdateTagResult = {
  success: true;
  tag: TagRecord;
  message: string;
};

export type DeleteTagResult = {
  success: true;
  tag_id: number;
  message: string;
};
// This file adds the group_chat_typing_status table to the Supabase types
// Import this file in any component that needs to use the typing status

import { Database } from './supabase';

// Extend the Database type to include the group_chat_typing_status table
declare module './supabase' {
  interface Database {
    public: {
      Tables: {
        group_chat_typing_status: {
          Row: {
            id: string;
            study_group_id: string;
            user_id: string;
            is_typing: boolean;
            updated_at: string;
          };
          Insert: {
            id?: string;
            study_group_id: string;
            user_id: string;
            is_typing?: boolean;
            updated_at?: string;
          };
          Update: {
            id?: string;
            study_group_id?: string;
            user_id?: string;
            is_typing?: boolean;
            updated_at?: string;
          };
          Relationships: [
            {
              foreignKeyName: "group_chat_typing_status_study_group_id_fkey";
              columns: ["study_group_id"];
              isOneToOne: false;
              referencedRelation: "study_groups";
              referencedColumns: ["id"];
            },
            {
              foreignKeyName: "group_chat_typing_status_user_id_fkey";
              columns: ["user_id"];
              isOneToOne: false;
              referencedRelation: "user_profiles";
              referencedColumns: ["id"];
            }
          ];
        };
      };
    };
  }
}

// Create a type for the typing status with profile information
export type TypingStatusWithProfile = {
  id: string;
  study_group_id: string;
  user_id: string;
  is_typing: boolean;
  updated_at: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
};

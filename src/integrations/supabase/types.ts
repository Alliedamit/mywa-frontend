export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      automation_queue: {
        Row: {
          action_type: string;
          attempts: number;
          created_at: string;
          executed_at: string | null;
          flow_execution_id: string;
          flow_id: string;
          id: string;
          is_test: boolean;
          last_error: string | null;
          max_attempts: number;
          payload: Json;
          scheduled_for: string;
          status: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          action_type: string;
          attempts?: number;
          created_at?: string;
          executed_at?: string | null;
          flow_execution_id: string;
          flow_id: string;
          id?: string;
          is_test?: boolean;
          last_error?: string | null;
          max_attempts?: number;
          payload?: Json;
          scheduled_for?: string;
          status?: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          action_type?: string;
          attempts?: number;
          created_at?: string;
          executed_at?: string | null;
          flow_execution_id?: string;
          flow_id?: string;
          id?: string;
          is_test?: boolean;
          last_error?: string | null;
          max_attempts?: number;
          payload?: Json;
          scheduled_for?: string;
          status?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "automation_queue_flow_execution_id_fkey";
            columns: ["flow_execution_id"];
            isOneToOne: false;
            referencedRelation: "flow_executions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "automation_queue_flow_id_fkey";
            columns: ["flow_id"];
            isOneToOne: false;
            referencedRelation: "flows";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "automation_queue_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      companies: {
        Row: {
          company_name: string;
          created_at: string;
          email: string | null;
          id: string;
          industry: string | null;
          phone: string | null;
          updated_at: string;
          website: string | null;
          workspace_id: string;
        };
        Insert: {
          company_name: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          industry?: string | null;
          phone?: string | null;
          updated_at?: string;
          website?: string | null;
          workspace_id: string;
        };
        Update: {
          company_name?: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          industry?: string | null;
          phone?: string | null;
          updated_at?: string;
          website?: string | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "companies_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_tags: {
        Row: {
          contact_id: string;
          created_at: string;
          id: string;
          tag_id: string;
        };
        Insert: {
          contact_id: string;
          created_at?: string;
          id?: string;
          tag_id: string;
        };
        Update: {
          contact_id?: string;
          created_at?: string;
          id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contact_tags_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      contacts: {
        Row: {
          archived_at: string | null;
          company_id: string | null;
          created_at: string;
          designation: string | null;
          display_name: string | null;
          email: string | null;
          first_name: string;
          id: string;
          last_name: string | null;
          owner_user_id: string | null;
          updated_at: string;
          wa_id: string | null;
          wa_is_group: boolean;
          wa_synced_at: string | null;
          whatsapp_number: string;
          workspace_id: string;
        };
        Insert: {
          archived_at?: string | null;
          company_id?: string | null;
          created_at?: string;
          designation?: string | null;
          display_name?: string | null;
          email?: string | null;
          first_name: string;
          id?: string;
          last_name?: string | null;
          owner_user_id?: string | null;
          updated_at?: string;
          wa_id?: string | null;
          wa_is_group?: boolean;
          wa_synced_at?: string | null;
          whatsapp_number: string;
          workspace_id: string;
        };
        Update: {
          archived_at?: string | null;
          company_id?: string | null;
          created_at?: string;
          designation?: string | null;
          display_name?: string | null;
          email?: string | null;
          first_name?: string;
          id?: string;
          last_name?: string | null;
          owner_user_id?: string | null;
          updated_at?: string;
          wa_id?: string | null;
          wa_is_group?: boolean;
          wa_synced_at?: string | null;
          whatsapp_number?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contacts_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      conversations: {
        Row: {
          assigned_user_id: string | null;
          channel: Database["public"]["Enums"]["channel_type"];
          contact_id: string;
          created_at: string;
          id: string;
          is_archived: boolean;
          is_muted: boolean;
          is_pinned: boolean;
          last_message_at: string | null;
          last_message_preview: string | null;
          status: Database["public"]["Enums"]["conversation_status"];
          unread_count: number;
          updated_at: string;
          wa_chat_id: string | null;
          wa_is_group: boolean;
          wa_synced_at: string | null;
          workspace_id: string;
        };
        Insert: {
          assigned_user_id?: string | null;
          channel?: Database["public"]["Enums"]["channel_type"];
          contact_id: string;
          created_at?: string;
          id?: string;
          is_archived?: boolean;
          is_muted?: boolean;
          is_pinned?: boolean;
          last_message_at?: string | null;
          last_message_preview?: string | null;
          status?: Database["public"]["Enums"]["conversation_status"];
          unread_count?: number;
          updated_at?: string;
          wa_chat_id?: string | null;
          wa_is_group?: boolean;
          wa_synced_at?: string | null;
          workspace_id: string;
        };
        Update: {
          assigned_user_id?: string | null;
          channel?: Database["public"]["Enums"]["channel_type"];
          contact_id?: string;
          created_at?: string;
          id?: string;
          is_archived?: boolean;
          is_muted?: boolean;
          is_pinned?: boolean;
          last_message_at?: string | null;
          last_message_preview?: string | null;
          status?: Database["public"]["Enums"]["conversation_status"];
          unread_count?: number;
          updated_at?: string;
          wa_chat_id?: string | null;
          wa_is_group?: boolean;
          wa_synced_at?: string | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      custom_field_values: {
        Row: {
          created_at: string;
          custom_field_id: string;
          id: string;
          record_id: string;
          updated_at: string;
          value: Json | null;
        };
        Insert: {
          created_at?: string;
          custom_field_id: string;
          id?: string;
          record_id: string;
          updated_at?: string;
          value?: Json | null;
        };
        Update: {
          created_at?: string;
          custom_field_id?: string;
          id?: string;
          record_id?: string;
          updated_at?: string;
          value?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "custom_field_values_custom_field_id_fkey";
            columns: ["custom_field_id"];
            isOneToOne: false;
            referencedRelation: "custom_fields";
            referencedColumns: ["id"];
          },
        ];
      };
      custom_fields: {
        Row: {
          created_at: string;
          id: string;
          module: string;
          name: string;
          options: Json;
          type: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          module: string;
          name: string;
          options?: Json;
          type: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          module?: string;
          name?: string;
          options?: Json;
          type?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "custom_fields_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      flow_executions: {
        Row: {
          completed_at: string | null;
          created_at: string;
          error_message: string | null;
          execution_time_ms: number | null;
          flow_id: string;
          id: string;
          is_test: boolean;
          matched_conditions: boolean;
          started_at: string;
          status: string;
          trigger_payload: Json;
          trigger_type: string;
          workspace_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          error_message?: string | null;
          execution_time_ms?: number | null;
          flow_id: string;
          id?: string;
          is_test?: boolean;
          matched_conditions?: boolean;
          started_at?: string;
          status?: string;
          trigger_payload?: Json;
          trigger_type: string;
          workspace_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          error_message?: string | null;
          execution_time_ms?: number | null;
          flow_id?: string;
          id?: string;
          is_test?: boolean;
          matched_conditions?: boolean;
          started_at?: string;
          status?: string;
          trigger_payload?: Json;
          trigger_type?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flow_executions_flow_id_fkey";
            columns: ["flow_id"];
            isOneToOne: false;
            referencedRelation: "flows";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flow_executions_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      flow_logs: {
        Row: {
          completed_at: string | null;
          created_at: string;
          execution_time_ms: number | null;
          flow_id: string;
          id: string;
          message: string | null;
          started_at: string;
          status: string;
          workspace_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          execution_time_ms?: number | null;
          flow_id: string;
          id?: string;
          message?: string | null;
          started_at?: string;
          status: string;
          workspace_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          execution_time_ms?: number | null;
          flow_id?: string;
          id?: string;
          message?: string | null;
          started_at?: string;
          status?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flow_logs_flow_id_fkey";
            columns: ["flow_id"];
            isOneToOne: false;
            referencedRelation: "flows";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flow_logs_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      flows: {
        Row: {
          actions: Json;
          archived_at: string | null;
          conditions: Json;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          last_run_at: string | null;
          name: string;
          run_count: number;
          status: string;
          trigger: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          actions?: Json;
          archived_at?: string | null;
          conditions?: Json;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          last_run_at?: string | null;
          name: string;
          run_count?: number;
          status?: string;
          trigger: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          actions?: Json;
          archived_at?: string | null;
          conditions?: Json;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          last_run_at?: string | null;
          name?: string;
          run_count?: number;
          status?: string;
          trigger?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flows_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      media: {
        Row: {
          category: string | null;
          content_hash: string | null;
          created_at: string;
          description: string | null;
          file_size: number;
          file_type: Database["public"]["Enums"]["media_file_type"];
          id: string;
          is_favorite: boolean;
          last_used_at: string | null;
          mime_type: string;
          name: string;
          original_filename: string;
          storage_path: string;
          thumbnail_path: string | null;
          updated_at: string;
          uploaded_by: string | null;
          workspace_id: string;
        };
        Insert: {
          category?: string | null;
          content_hash?: string | null;
          created_at?: string;
          description?: string | null;
          file_size?: number;
          file_type: Database["public"]["Enums"]["media_file_type"];
          id?: string;
          is_favorite?: boolean;
          last_used_at?: string | null;
          mime_type: string;
          name: string;
          original_filename: string;
          storage_path: string;
          thumbnail_path?: string | null;
          updated_at?: string;
          uploaded_by?: string | null;
          workspace_id: string;
        };
        Update: {
          category?: string | null;
          content_hash?: string | null;
          created_at?: string;
          description?: string | null;
          file_size?: number;
          file_type?: Database["public"]["Enums"]["media_file_type"];
          id?: string;
          is_favorite?: boolean;
          last_used_at?: string | null;
          mime_type?: string;
          name?: string;
          original_filename?: string;
          storage_path?: string;
          thumbnail_path?: string | null;
          updated_at?: string;
          uploaded_by?: string | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "media_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      message_attachments: {
        Row: {
          created_at: string;
          file_name: string;
          file_size: number | null;
          file_type: string;
          id: string;
          message_id: string;
          storage_path: string | null;
          thumbnail_path: string | null;
        };
        Insert: {
          created_at?: string;
          file_name: string;
          file_size?: number | null;
          file_type: string;
          id?: string;
          message_id: string;
          storage_path?: string | null;
          thumbnail_path?: string | null;
        };
        Update: {
          created_at?: string;
          file_name?: string;
          file_size?: number | null;
          file_type?: string;
          id?: string;
          message_id?: string;
          storage_path?: string | null;
          thumbnail_path?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
      message_media: {
        Row: {
          created_at: string;
          media_id: string;
          message_id: string;
        };
        Insert: {
          created_at?: string;
          media_id: string;
          message_id: string;
        };
        Update: {
          created_at?: string;
          media_id?: string;
          message_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "message_media_media_id_fkey";
            columns: ["media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "message_media_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          conversation_id: string;
          created_at: string;
          delivered_at: string | null;
          direction: Database["public"]["Enums"]["message_direction"];
          id: string;
          message_type: Database["public"]["Enums"]["message_type"];
          read_at: string | null;
          reply_to_message_id: string | null;
          sender_type: Database["public"]["Enums"]["message_sender_type"];
          sender_user_id: string | null;
          sent_at: string;
          status: Database["public"]["Enums"]["message_status"];
          text: string | null;
          wa_ack: number | null;
          wa_from_me: boolean | null;
          wa_media_mime: string | null;
          wa_media_url: string | null;
          wa_message_id: string | null;
          workspace_id: string;
        };
        Insert: {
          conversation_id: string;
          created_at?: string;
          delivered_at?: string | null;
          direction: Database["public"]["Enums"]["message_direction"];
          id?: string;
          message_type?: Database["public"]["Enums"]["message_type"];
          read_at?: string | null;
          reply_to_message_id?: string | null;
          sender_type: Database["public"]["Enums"]["message_sender_type"];
          sender_user_id?: string | null;
          sent_at?: string;
          status?: Database["public"]["Enums"]["message_status"];
          text?: string | null;
          wa_ack?: number | null;
          wa_from_me?: boolean | null;
          wa_media_mime?: string | null;
          wa_media_url?: string | null;
          wa_message_id?: string | null;
          workspace_id: string;
        };
        Update: {
          conversation_id?: string;
          created_at?: string;
          delivered_at?: string | null;
          direction?: Database["public"]["Enums"]["message_direction"];
          id?: string;
          message_type?: Database["public"]["Enums"]["message_type"];
          read_at?: string | null;
          reply_to_message_id?: string | null;
          sender_type?: Database["public"]["Enums"]["message_sender_type"];
          sender_user_id?: string | null;
          sent_at?: string;
          status?: Database["public"]["Enums"]["message_status"];
          text?: string | null;
          wa_ack?: number | null;
          wa_from_me?: boolean | null;
          wa_media_mime?: string | null;
          wa_media_url?: string | null;
          wa_message_id?: string | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_reply_to_message_id_fkey";
            columns: ["reply_to_message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      notes: {
        Row: {
          contact_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          note: string;
          workspace_id: string;
        };
        Insert: {
          contact_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          note: string;
          workspace_id: string;
        };
        Update: {
          contact_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          note?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notes_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          theme_preference: Database["public"]["Enums"]["theme_preference"];
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          theme_preference?: Database["public"]["Enums"]["theme_preference"];
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          theme_preference?: Database["public"]["Enums"]["theme_preference"];
          updated_at?: string;
        };
        Relationships: [];
      };
      saved_filters: {
        Row: {
          created_at: string;
          created_by: string | null;
          filters: Json;
          id: string;
          module: string;
          name: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          filters?: Json;
          id?: string;
          module: string;
          name: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          filters?: Json;
          id?: string;
          module?: string;
          name?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_filters_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      segments: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          name: string;
          rules: Json;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          rules?: Json;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          rules?: Json;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "segments_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      tags: {
        Row: {
          color: string;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tags_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      template_media: {
        Row: {
          created_at: string;
          media_id: string;
          position: number;
          template_id: string;
        };
        Insert: {
          created_at?: string;
          media_id: string;
          position?: number;
          template_id: string;
        };
        Update: {
          created_at?: string;
          media_id?: string;
          position?: number;
          template_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "template_media_media_id_fkey";
            columns: ["media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "template_media_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "templates";
            referencedColumns: ["id"];
          },
        ];
      };
      templates: {
        Row: {
          category: string;
          content: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_favorite: boolean;
          name: string;
          shortcut: string | null;
          updated_at: string;
          variables: Json;
          workspace_id: string;
        };
        Insert: {
          category?: string;
          content: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_favorite?: boolean;
          name: string;
          shortcut?: string | null;
          updated_at?: string;
          variables?: Json;
          workspace_id: string;
        };
        Update: {
          category?: string;
          content?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_favorite?: boolean;
          name?: string;
          shortcut?: string | null;
          updated_at?: string;
          variables?: Json;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "templates_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      whatsapp_sessions: {
        Row: {
          connected_at: string | null;
          created_at: string;
          id: string;
          last_error: string | null;
          last_seen_at: string | null;
          phone_number: string | null;
          platform: string | null;
          profile_name: string | null;
          profile_picture_url: string | null;
          qr: string | null;
          qr_expires_at: string | null;
          status: Database["public"]["Enums"]["whatsapp_status"];
          updated_at: string;
          wa_user_id: string | null;
          workspace_id: string;
        };
        Insert: {
          connected_at?: string | null;
          created_at?: string;
          id?: string;
          last_error?: string | null;
          last_seen_at?: string | null;
          phone_number?: string | null;
          platform?: string | null;
          profile_name?: string | null;
          profile_picture_url?: string | null;
          qr?: string | null;
          qr_expires_at?: string | null;
          status?: Database["public"]["Enums"]["whatsapp_status"];
          updated_at?: string;
          wa_user_id?: string | null;
          workspace_id: string;
        };
        Update: {
          connected_at?: string | null;
          created_at?: string;
          id?: string;
          last_error?: string | null;
          last_seen_at?: string | null;
          phone_number?: string | null;
          platform?: string | null;
          profile_name?: string | null;
          profile_picture_url?: string | null;
          qr?: string | null;
          qr_expires_at?: string | null;
          status?: Database["public"]["Enums"]["whatsapp_status"];
          updated_at?: string;
          wa_user_id?: string | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "whatsapp_sessions_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: true;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      whatsapp_sync_state: {
        Row: {
          created_at: string;
          finished_at: string | null;
          id: string;
          last_error: string | null;
          phase: Database["public"]["Enums"]["whatsapp_sync_phase"];
          processed: number;
          started_at: string | null;
          total: number;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          finished_at?: string | null;
          id?: string;
          last_error?: string | null;
          phase?: Database["public"]["Enums"]["whatsapp_sync_phase"];
          processed?: number;
          started_at?: string | null;
          total?: number;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          finished_at?: string | null;
          id?: string;
          last_error?: string | null;
          phase?: Database["public"]["Enums"]["whatsapp_sync_phase"];
          processed?: number;
          started_at?: string | null;
          total?: number;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "whatsapp_sync_state_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: true;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_members: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["workspace_role"];
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["workspace_role"];
          user_id: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["workspace_role"];
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspaces: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      channel_type: "whatsapp" | "sms" | "email" | "internal";
      conversation_status: "open" | "pending" | "resolved" | "closed";
      media_file_type: "image" | "pdf" | "document" | "video" | "audio";
      message_direction: "inbound" | "outbound";
      message_sender_type: "contact" | "user" | "system" | "bot";
      message_status: "pending" | "sent" | "delivered" | "read" | "failed";
      message_type:
        "text" | "image" | "video" | "document" | "audio" | "sticker" | "location" | "system";
      theme_preference: "light" | "dark" | "system";
      whatsapp_status:
        | "disconnected"
        | "connecting"
        | "qr_ready"
        | "connected"
        | "reconnecting"
        | "expired"
        | "failed";
      whatsapp_sync_phase: "idle" | "contacts" | "chats" | "messages" | "done" | "failed";
      workspace_role: "owner" | "admin" | "member";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      channel_type: ["whatsapp", "sms", "email", "internal"],
      conversation_status: ["open", "pending", "resolved", "closed"],
      media_file_type: ["image", "pdf", "document", "video", "audio"],
      message_direction: ["inbound", "outbound"],
      message_sender_type: ["contact", "user", "system", "bot"],
      message_status: ["pending", "sent", "delivered", "read", "failed"],
      message_type: [
        "text",
        "image",
        "video",
        "document",
        "audio",
        "sticker",
        "location",
        "system",
      ],
      theme_preference: ["light", "dark", "system"],
      whatsapp_status: [
        "disconnected",
        "connecting",
        "qr_ready",
        "connected",
        "reconnecting",
        "expired",
        "failed",
      ],
      whatsapp_sync_phase: ["idle", "contacts", "chats", "messages", "done", "failed"],
      workspace_role: ["owner", "admin", "member"],
    },
  },
} as const;

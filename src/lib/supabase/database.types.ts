export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      log_entries: {
        Row: {
          id: string
          timescale: string
          display_time: string
          tag: string
          tag_label: string
          content: string
          observer_note: string
          title: string | null
          publish_at: string
          is_published: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          timescale: string
          display_time: string
          tag: string
          tag_label: string
          content: string
          observer_note: string
          title?: string | null
          publish_at: string
          is_published?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          timescale?: string
          display_time?: string
          tag?: string
          tag_label?: string
          content?: string
          observer_note?: string
          title?: string | null
          publish_at?: string
          is_published?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type LogEntryRow = Database['public']['Tables']['log_entries']['Row']
export type LogEntryInsert = Database['public']['Tables']['log_entries']['Insert']
export type LogEntryUpdate = Database['public']['Tables']['log_entries']['Update']

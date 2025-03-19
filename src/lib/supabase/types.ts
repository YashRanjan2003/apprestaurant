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
      users: {
        Row: {
          id: string
          phone: string
          email: string | null
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phone: string
          email?: string | null
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone?: string
          email?: string | null
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      menu_categories: {
        Row: {
          id: string
          name: string
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_order: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      menu_items: {
        Row: {
          id: string
          category_id: string
          name: string
          description: string
          price: number
          original_price: number | null
          image_url: string
          is_veg: boolean
          rating: number | null
          rating_count: number | null
          calories: number | null
          protein: number | null
          offer: string | null
          available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          description: string
          price: number
          original_price?: number | null
          image_url: string
          is_veg: boolean
          rating?: number | null
          rating_count?: number | null
          calories?: number | null
          protein?: number | null
          offer?: string | null
          available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          description?: string
          price?: number
          original_price?: number | null
          image_url?: string
          is_veg?: boolean
          rating?: number | null
          rating_count?: number | null
          calories?: number | null
          protein?: number | null
          offer?: string | null
          available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          order_type: 'pickup' | 'delivery'
          delivery_address: string | null
          scheduled_time: string
          payment_method: 'card' | 'cash'
          item_total: number
          gst: number
          platform_fee: number
          delivery_charge: number
          final_total: number
          status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
          otp: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          order_type: 'pickup' | 'delivery'
          delivery_address?: string | null
          scheduled_time: string
          payment_method: 'card' | 'cash'
          item_total: number
          gst: number
          platform_fee: number
          delivery_charge: number
          final_total: number
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
          otp: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          order_type?: 'pickup' | 'delivery'
          delivery_address?: string | null
          scheduled_time?: string
          payment_method?: 'card' | 'cash'
          item_total?: number
          gst?: number
          platform_fee?: number
          delivery_charge?: number
          final_total?: number
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
          otp?: string
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_item_id: string
          name: string
          price: number
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          menu_item_id: string
          name: string
          price: number
          quantity: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          menu_item_id?: string
          name?: string
          price?: number
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          key: string
          value: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 
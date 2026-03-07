/**
 * Supabase database type definitions
 * Generated/maintained for type-safe database queries
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string
          first_name: string
          avatar_url: string | null
          settings: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          display_name: string
          first_name?: string
          avatar_url?: string | null
          settings?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          display_name?: string
          first_name?: string
          avatar_url?: string | null
          settings?: Record<string, unknown>
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          tier: 'free' | 'pro' | 'lifetime'
          status: 'active' | 'canceled' | 'past_due' | 'trialing'
          current_period_start: string | null
          current_period_end: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tier?: 'free' | 'pro' | 'lifetime'
          status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          current_period_start?: string | null
          current_period_end?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          tier?: 'free' | 'pro' | 'lifetime'
          status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          current_period_start?: string | null
          current_period_end?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          data: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          data: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          data?: Record<string, unknown>
          updated_at?: string
        }
      }
    }
  }
}

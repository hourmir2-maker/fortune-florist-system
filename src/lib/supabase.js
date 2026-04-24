import { createClient } from '@supabase/supabase-js'

// ฝังค่าเชื่อมต่อโดยตรงเพื่อป้องกันปัญหาหน้าจอขาวบนมือถือ
const supabaseUrl = "https://fxldpxwgpzxagraguqtz.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4bGRweHdncHp4YWdyYWd1cXR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MTgzODEsImV4cCI6MjA5MjQ5NDM4MX0.qJYDI6YdwjoL1wEXR2mw_RMqkPNjSdiibH3zipBQ4y0"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

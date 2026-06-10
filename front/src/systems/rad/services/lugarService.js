import { supabase } from './supabaseClient'

export const lugarService = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('rad_lugar')
        .select('*')
        .order('nombre_ciudad')
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  async create(payload) {
    try {
      const { data, error } = await supabase
        .from('rad_lugar')
        .insert(payload)
        .select()
        .single()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },
}

import { supabase } from './supabaseClient'

export const comercializadoraService = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('rad_comercializadora')
        .select('*')
        .order('nombre_comercializadora')
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  async create(payload) {
    try {
      const { data, error } = await supabase
        .from('rad_comercializadora')
        .insert(payload)
        .select()
        .single()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  async update(id, payload) {
    try {
      const { data, error } = await supabase
        .from('rad_comercializadora')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  async delete(id) {
    try {
      const { data, error } = await supabase
        .from('rad_comercializadora')
        .delete()
        .eq('id', id)
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },
}

import { supabase } from './supabaseClient'

export const locutorService = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('rad_locutor')
        .select('*')
        .order('nombre_locutor')
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('rad_locutor')
        .select(`
          *,
          rad_producto_x_locutor (
            precio_locutor,
            rad_producto ( id, nombre_producto, tipo_producto )
          )
        `)
        .eq('id', id)
        .single()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  async create(payload) {
    try {
      const { data, error } = await supabase
        .from('rad_locutor')
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
        .from('rad_locutor')
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
        .from('rad_locutor')
        .delete()
        .eq('id', id)
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },
}

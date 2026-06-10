import { supabase } from './supabaseClient'

export const horarioService = {
  async getByProducto(id_producto) {
    try {
      const { data, error } = await supabase
        .from('rad_horario_dia')
        .select('*')
        .eq('id_producto', id_producto)
        .order('dias')
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  async create(payload) {
    try {
      const { data, error } = await supabase
        .from('rad_horario_dia')
        .insert(payload)
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
        .from('rad_horario_dia')
        .delete()
        .eq('id', id)
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },
}

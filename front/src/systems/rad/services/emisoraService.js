import { supabase } from './supabaseClient'

export const emisoraService = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('rad_emisora')
        .select(`
          *,
          rad_lugar ( id, nombre_ciudad, nombre_estado ),
          rad_emisora_x_comercializadora (
            rad_comercializadora ( id, nombre_comercializadora )
          )
        `)
        .order('nombre_emisora')
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('rad_emisora')
        .select(`
          *,
          rad_lugar ( id, nombre_ciudad, nombre_estado ),
          rad_emisora_x_comercializadora (
            rad_comercializadora ( id, nombre_comercializadora )
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
        .from('rad_emisora')
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
        .from('rad_emisora')
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
        .from('rad_emisora')
        .delete()
        .eq('id', id)
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  async setComercializadoras(emisoraId, comercializadoraIds) {
    try {
      await supabase
        .from('rad_emisora_x_comercializadora')
        .delete()
        .eq('id_emisora', emisoraId)

      if (!comercializadoraIds.length) return { data: [], error: null }

      const rows = comercializadoraIds.map((id_comercializadora) => ({
        id_emisora: emisoraId,
        id_comercializadora,
      }))

      const { data, error } = await supabase
        .from('rad_emisora_x_comercializadora')
        .insert(rows)
        .select()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },
}

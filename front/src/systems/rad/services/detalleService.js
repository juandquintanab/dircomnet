import { supabase } from './supabaseClient'

export const detalleService = {
  async getDetalle(id_producto) {
    try {
      const { data, error } = await supabase
        .from('rad_detalle_producto')
        .select('*')
        .eq('id_producto', id_producto)
        .maybeSingle()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  async getSpot(id_producto) {
    try {
      const { data, error } = await supabase
        .from('rad_producto_spot')
        .select('*')
        .eq('id_producto', id_producto)
        .maybeSingle()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  async upsertDetalle(id_producto, payload) {
    try {
      const { data, error } = await supabase
        .from('rad_detalle_producto')
        .upsert({ ...payload, id_producto }, { onConflict: 'id_producto' })
        .select()
        .single()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  async upsertSpot(id_producto, payload) {
    try {
      const { data, error } = await supabase
        .from('rad_producto_spot')
        .upsert({ ...payload, id_producto }, { onConflict: 'id_producto' })
        .select()
        .single()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },
}

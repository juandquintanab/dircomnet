import { supabase } from './supabaseClient'
import { calcProductoMetricas } from '../utils/metricas'

const PROPUESTA_SELECT = `
  *,
  rad_propuesta_detalle (
    id,
    rad_producto (
      id, nombre_producto, tipo_producto, nota,
      rad_emisora (
        id, nombre_emisora,
        rad_lugar ( nombre_ciudad, nombre_estado )
      ),
      rad_producto_x_locutor (
        precio_locutor,
        rad_locutor ( id, nombre_locutor )
      ),
      rad_detalle_producto ( precio_guardado, descuento_aplicado ),
      rad_producto_spot ( precio_guardado, descuento_aplicado, duracion_segundos )
    )
  )
`

const TRANSICIONES = {
  borrador: ['enviada'],
  enviada: ['aprobada', 'rechazada'],
  aprobada: [],
  rechazada: [],
}

export const propuestaService = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('rad_propuesta')
        .select('*, rad_propuesta_detalle ( id )')
        .order('created_at', { ascending: false })
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('rad_propuesta')
        .select(PROPUESTA_SELECT)
        .eq('id', id)
        .single()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  async create({ nombre, productos = [] }) {
    try {
      const { data: prop, error: e1 } = await supabase
        .from('rad_propuesta')
        .insert({ nombre, estado: 'borrador' })
        .select()
        .single()
      if (e1) return { data: null, error: e1 }

      if (productos.length) {
        const rows = productos.map((id_producto) => ({
          id_propuesta: prop.id,
          id_producto,
        }))
        const { error: e2 } = await supabase
          .from('rad_propuesta_detalle')
          .insert(rows)
        if (e2) {
          await supabase.from('rad_propuesta').delete().eq('id', prop.id)
          return { data: null, error: e2 }
        }
      }

      return { data: prop, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async addProducto(id_propuesta, id_producto) {
    try {
      const { data, error } = await supabase
        .from('rad_propuesta_detalle')
        .insert({ id_propuesta, id_producto })
        .select()
        .single()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  async removeProducto(id_propuesta, id_producto) {
    try {
      const { data, error } = await supabase
        .from('rad_propuesta_detalle')
        .delete()
        .eq('id_propuesta', id_propuesta)
        .eq('id_producto', id_producto)
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  async cambiarEstado(id, nuevoEstado) {
    if (!Object.keys(TRANSICIONES).includes(nuevoEstado)) {
      return { data: null, error: { message: 'Estado no válido' } }
    }
    try {
      const { data: actual, error: e1 } = await supabase
        .from('rad_propuesta')
        .select('estado')
        .eq('id', id)
        .single()
      if (e1) return { data: null, error: e1 }

      const permitidos = TRANSICIONES[actual.estado] ?? []
      if (!permitidos.includes(nuevoEstado)) {
        return {
          data: null,
          error: { message: `No se puede pasar de "${actual.estado}" a "${nuevoEstado}"` },
        }
      }

      const { data, error } = await supabase
        .from('rad_propuesta')
        .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
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
      await supabase.from('rad_propuesta_detalle').delete().eq('id_propuesta', id)
      const { data, error } = await supabase.from('rad_propuesta').delete().eq('id', id)
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  async exportarCSV(id) {
    try {
      const { data, error } = await this.getById(id)
      if (error) return { data: null, error }

      const rows = (data.rad_propuesta_detalle ?? [])
        .map(({ rad_producto: p }) => {
          if (!p) return null
          const { precioGuardado, descuento, precioMercado, ahorro, precioLocutores, precioTotal } =
            calcProductoMetricas(p)
          const locutores = (p.rad_producto_x_locutor ?? [])
            .map((r) => r.rad_locutor?.nombre_locutor)
            .filter(Boolean)
            .join(' / ')
          return {
            nombre_producto: p.nombre_producto,
            tipo: p.tipo_producto,
            emisora: p.rad_emisora?.nombre_emisora ?? '',
            locutores,
            precio_guardado: precioGuardado.toFixed(2),
            descuento,
            precio_mercado: precioMercado.toFixed(2),
            ahorro: ahorro.toFixed(2),
            precio_locutores: precioLocutores.toFixed(2),
            precio_total: precioTotal.toFixed(2),
          }
        })
        .filter(Boolean)

      return { data: rows, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },
}

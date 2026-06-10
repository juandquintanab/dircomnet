import { supabase } from './supabaseClient'

const PRODUCTO_SELECT = `
  *,
  rad_emisora (
    id, nombre_emisora,
    rad_lugar ( id, nombre_ciudad, nombre_estado ),
    rad_emisora_x_comercializadora (
      rad_comercializadora ( id, nombre_comercializadora )
    )
  ),
  rad_producto_x_locutor (
    precio_locutor,
    rad_locutor ( id, nombre_locutor, alcance, genero )
  ),
  rad_detalle_producto ( * ),
  rad_producto_spot ( * ),
  rad_horario_dia ( * )
`

export const productoService = {
  async getAll(filtros = {}) {
    try {
      let query = supabase
        .from('rad_producto')
        .select(PRODUCTO_SELECT)
        .order('nombre_producto')

      if (filtros.tipo) query = query.eq('tipo_producto', filtros.tipo)
      if (filtros.id_emisora) query = query.eq('id_emisora', filtros.id_emisora)
      if (filtros.busqueda) query = query.ilike('nombre_producto', `%${filtros.busqueda}%`)

      const { data, error } = await query
      if (error) return { data: null, error }

      let rows = data ?? []

      // Filtros que dependen de relaciones (aplicados en memoria)
      if (filtros.id_comercializadora) {
        rows = rows.filter((p) =>
          (p.rad_emisora?.rad_emisora_x_comercializadora ?? []).some(
            (r) => r.rad_comercializadora?.id === filtros.id_comercializadora
          )
        )
      }
      if (filtros.id_locutor) {
        rows = rows.filter((p) =>
          (p.rad_producto_x_locutor ?? []).some(
            (r) => r.rad_locutor?.id === filtros.id_locutor
          )
        )
      }
      if (filtros.precio_min != null) {
        rows = rows.filter((p) => _precioBase(p) >= Number(filtros.precio_min))
      }
      if (filtros.precio_max != null) {
        rows = rows.filter((p) => _precioBase(p) <= Number(filtros.precio_max))
      }

      return { data: rows, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('rad_producto')
        .select(PRODUCTO_SELECT)
        .eq('id', id)
        .single()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  async create({ producto, detalle, spot, locutores, horarios }) {
    try {
      // 1. Insertar cabecera
      const { data: prod, error: e1 } = await supabase
        .from('rad_producto')
        .insert(producto)
        .select()
        .single()
      if (e1) return { data: null, error: e1 }

      const id = prod.id

      // 2. Detalle según tipo
      if (detalle && producto.tipo_producto !== 'rotativa') {
        const { error: e2 } = await supabase
          .from('rad_detalle_producto')
          .insert({ ...detalle, id_producto: id })
        if (e2) { await _borrarProducto(id); return { data: null, error: e2 } }
      }
      if (spot && producto.tipo_producto === 'rotativa') {
        const { error: e3 } = await supabase
          .from('rad_producto_spot')
          .insert({ ...spot, id_producto: id })
        if (e3) { await _borrarProducto(id); return { data: null, error: e3 } }
      }

      // 3. Locutores
      if (locutores?.length) {
        const rows = locutores.map((l) => ({
          id_producto: id,
          id_locutor: l.id_locutor,
          precio_locutor: l.precio_locutor ?? 0,
        }))
        const { error: e4 } = await supabase.from('rad_producto_x_locutor').insert(rows)
        if (e4) { await _borrarProducto(id); return { data: null, error: e4 } }
      }

      // 4. Horarios
      if (horarios?.length) {
        const rows = horarios.map((h) => ({ ...h, id_producto: id }))
        const { error: e5 } = await supabase.from('rad_horario_dia').insert(rows)
        if (e5) { await _borrarProducto(id); return { data: null, error: e5 } }
      }

      return { data: prod, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async update(id, { producto, detalle, spot, locutores, horarios }) {
    try {
      // 1. Actualizar cabecera
      const { error: e1 } = await supabase
        .from('rad_producto')
        .update({ ...producto, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (e1) return { data: null, error: e1 }

      // 2. Sincronizar detalle
      if (producto.tipo_producto !== 'rotativa') {
        await supabase.from('rad_producto_spot').delete().eq('id_producto', id)
        if (detalle) {
          await supabase
            .from('rad_detalle_producto')
            .upsert({ ...detalle, id_producto: id }, { onConflict: 'id_producto' })
        }
      } else {
        await supabase.from('rad_detalle_producto').delete().eq('id_producto', id)
        if (spot) {
          await supabase
            .from('rad_producto_spot')
            .upsert({ ...spot, id_producto: id }, { onConflict: 'id_producto' })
        }
      }

      // 3. Sincronizar locutores (reemplazar)
      await supabase.from('rad_producto_x_locutor').delete().eq('id_producto', id)
      if (locutores?.length) {
        const rows = locutores.map((l) => ({
          id_producto: id,
          id_locutor: l.id_locutor,
          precio_locutor: l.precio_locutor ?? 0,
        }))
        const { error: e4 } = await supabase.from('rad_producto_x_locutor').insert(rows)
        if (e4) return { data: null, error: e4 }
      }

      // 4. Sincronizar horarios (reemplazar)
      await supabase.from('rad_horario_dia').delete().eq('id_producto', id)
      if (horarios?.length) {
        const rows = horarios.map((h) => ({ ...h, id_producto: id }))
        const { error: e5 } = await supabase.from('rad_horario_dia').insert(rows)
        if (e5) return { data: null, error: e5 }
      }

      return { data: { id }, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async delete(id) {
    try {
      await supabase.from('rad_propuesta_detalle').delete().eq('id_producto', id)
      await supabase.from('rad_horario_dia').delete().eq('id_producto', id)
      await supabase.from('rad_producto_x_locutor').delete().eq('id_producto', id)
      await supabase.from('rad_detalle_producto').delete().eq('id_producto', id)
      await supabase.from('rad_producto_spot').delete().eq('id_producto', id)
      const { data, error } = await supabase.from('rad_producto').delete().eq('id', id)
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },
}

// Elimina un producto recién creado cuando falla algún paso posterior
async function _borrarProducto(id) {
  await supabase.from('rad_producto').delete().eq('id', id)
}

// Extrae el precio base para filtros en memoria
function _precioBase(producto) {
  if (producto.rad_detalle_producto) return Number(producto.rad_detalle_producto.precio_guardado ?? 0)
  if (producto.rad_producto_spot) return Number(producto.rad_producto_spot.precio_guardado ?? 0)
  return 0
}

import { useState, useCallback } from 'react'
import { productoService } from '../services/productoService'
import { emisoraService } from '../services/emisoraService'
import { locutorService } from '../services/locutorService'
import { comercializadoraService } from '../services/comercializadoraService'

const DETALLE_VACIO = {
  sinopsis: '',
  precio_guardado: '',
  descuento_aplicado: '',
  participacion: '',
  edad: '',
  genero: '',
  estrato: '',
  tono: '',
}

const SPOT_VACIO = {
  duracion_segundos: '',
  precio_guardado: '',
  descuento_aplicado: '',
}

function estadoInicial(producto) {
  if (!producto) {
    return {
      tipo_producto: '',
      nombre_producto: '',
      nota: '',
      id_emisora: '',
      locutores: [],
      comercializadoras: [],
      horarios: [],
      detalle: { ...DETALLE_VACIO },
      spot: { ...SPOT_VACIO },
    }
  }

  const locutores = (producto.rad_producto_x_locutor ?? []).map((r) => ({
    id_locutor: r.rad_locutor?.id ?? '',
    nombre_locutor: r.rad_locutor?.nombre_locutor ?? '',
    precio_locutor: String(r.precio_locutor ?? '0'),
  }))

  const comercializadoras = (
    producto.rad_emisora?.rad_emisora_x_comercializadora ?? []
  ).map((r) => r.rad_comercializadora?.id).filter(Boolean)

  const horarios = (producto.rad_horario_dia ?? []).map((h) => ({
    id: h.id,
    dias: h.dias ?? '',
    hora_inicio: h.hora_inicio ?? '',
    hora_fin: h.hora_fin ?? '',
  }))

  const det = producto.rad_detalle_producto
  const sp = producto.rad_producto_spot

  return {
    tipo_producto: producto.tipo_producto ?? '',
    nombre_producto: producto.nombre_producto ?? '',
    nota: producto.nota ?? '',
    id_emisora: producto.id_emisora ?? '',
    locutores,
    comercializadoras,
    horarios,
    detalle: det
      ? {
          sinopsis: det.sinopsis ?? '',
          precio_guardado: String(det.precio_guardado ?? ''),
          descuento_aplicado: String(det.descuento_aplicado ?? ''),
          participacion: det.participacion ?? '',
          edad: det.edad ?? '',
          genero: det.genero ?? '',
          estrato: det.estrato ?? '',
          tono: det.tono ?? '',
        }
      : { ...DETALLE_VACIO },
    spot: sp
      ? {
          duracion_segundos: String(sp.duracion_segundos ?? ''),
          precio_guardado: String(sp.precio_guardado ?? ''),
          descuento_aplicado: String(sp.descuento_aplicado ?? ''),
        }
      : { ...SPOT_VACIO },
  }
}

export function useProductoForm(productoInicial = null) {
  const [form, setForm] = useState(() => estadoInicial(productoInicial))
  const [submitState, setSubmitState] = useState('idle') // idle | loading | success | error
  const [submitError, setSubmitError] = useState(null)

  const setField = useCallback((key) => (val) =>
    setForm((f) => ({ ...f, [key]: val })), [])

  const setDetalleField = useCallback((key) => (val) =>
    setForm((f) => ({ ...f, detalle: { ...f.detalle, [key]: val } })), [])

  const setSpotField = useCallback((key) => (val) =>
    setForm((f) => ({ ...f, spot: { ...f.spot, [key]: val } })), [])

  const setTipo = useCallback((tipo) => {
    setForm((f) => ({
      ...f,
      tipo_producto: tipo,
      detalle: { ...DETALLE_VACIO },
      spot: { ...SPOT_VACIO },
    }))
  }, [])

  // Locutores
  const agregarLocutor = useCallback((locutor) => {
    setForm((f) => {
      if (f.locutores.some((l) => l.id_locutor === locutor.id)) return f
      return {
        ...f,
        locutores: [
          ...f.locutores,
          { id_locutor: locutor.id, nombre_locutor: locutor.nombre_locutor, precio_locutor: '0' },
        ],
      }
    })
  }, [])

  const quitarLocutor = useCallback((id_locutor) => {
    setForm((f) => ({ ...f, locutores: f.locutores.filter((l) => l.id_locutor !== id_locutor) }))
  }, [])

  const setPrecioLocutor = useCallback((id_locutor, precio) => {
    setForm((f) => ({
      ...f,
      locutores: f.locutores.map((l) =>
        l.id_locutor === id_locutor ? { ...l, precio_locutor: precio } : l
      ),
    }))
  }, [])

  // Horarios
  const agregarHorario = useCallback(() => {
    setForm((f) => ({
      ...f,
      horarios: [...f.horarios, { dias: '', hora_inicio: '', hora_fin: '' }],
    }))
  }, [])

  const setHorarioField = useCallback((index, key, val) => {
    setForm((f) => {
      const horarios = [...f.horarios]
      horarios[index] = { ...horarios[index], [key]: val }
      return { ...f, horarios }
    })
  }, [])

  const quitarHorario = useCallback((index) => {
    setForm((f) => ({ ...f, horarios: f.horarios.filter((_, i) => i !== index) }))
  }, [])

  // Comercializadoras
  const toggleComercializadora = useCallback((id) => {
    setForm((f) => {
      const set = new Set(f.comercializadoras)
      if (set.has(id)) set.delete(id)
      else set.add(id)
      return { ...f, comercializadoras: [...set] }
    })
  }, [])

  function validate() {
    if (!form.tipo_producto) return 'Selecciona el tipo de producto'
    if (!form.nombre_producto.trim()) return 'El nombre del producto es obligatorio'
    if (!form.id_emisora) return 'Selecciona una emisora'
    const esRotativa = form.tipo_producto === 'rotativa'
    const precio = esRotativa ? form.spot.precio_guardado : form.detalle.precio_guardado
    if (!precio && precio !== '0') return 'El precio es obligatorio'
    return null
  }

  async function crearEmisoraInline({ nombre_emisora, id_lugar, ...resto }) {
    const { data, error } = await emisoraService.create({ nombre_emisora, id_lugar: id_lugar || null, ...resto })
    if (error) throw new Error(error.message)
    return data.id
  }

  async function crearLocutorInline({ nombre_locutor, ...resto }) {
    const { data, error } = await locutorService.create({ nombre_locutor, ...resto })
    if (error) throw new Error(error.message)
    return data
  }

  async function crearComercializadoraInline(nombre) {
    const { data, error } = await comercializadoraService.create({ nombre_comercializadora: nombre })
    if (error) throw new Error(error.message)
    return data.id
  }

  async function submit(productoId = null) {
    const validationError = validate()
    if (validationError) {
      setSubmitError(validationError)
      return { ok: false }
    }

    setSubmitState('loading')
    setSubmitError(null)

    const esRotativa = form.tipo_producto === 'rotativa'

    const payload = {
      producto: {
        tipo_producto: form.tipo_producto,
        nombre_producto: form.nombre_producto.trim(),
        nota: form.nota.trim() || null,
        id_emisora: form.id_emisora,
      },
      detalle: esRotativa ? null : {
        sinopsis: form.detalle.sinopsis || null,
        precio_guardado: Number(form.detalle.precio_guardado) || 0,
        descuento_aplicado: Number(form.detalle.descuento_aplicado) || 0,
        participacion: form.detalle.participacion || null,
        edad: form.detalle.edad || null,
        genero: form.detalle.genero || null,
        estrato: form.detalle.estrato || null,
        tono: form.detalle.tono || null,
      },
      spot: esRotativa ? {
        duracion_segundos: form.spot.duracion_segundos ? Number(form.spot.duracion_segundos) : null,
        precio_guardado: Number(form.spot.precio_guardado) || 0,
        descuento_aplicado: Number(form.spot.descuento_aplicado) || 0,
      } : null,
      locutores: form.locutores.map((l) => ({
        id_locutor: l.id_locutor,
        precio_locutor: Number(l.precio_locutor) || 0,
      })),
      horarios: form.horarios
        .filter((h) => h.dias.trim())
        .map((h) => ({
          dias: h.dias.trim(),
          hora_inicio: h.hora_inicio || null,
          hora_fin: h.hora_fin || null,
        })),
    }

    const result = productoId
      ? await productoService.update(productoId, payload)
      : await productoService.create(payload)

    if (result.error) {
      setSubmitState('error')
      setSubmitError(result.error.message ?? 'Error al guardar')
      return { ok: false }
    }

    setSubmitState('success')
    return { ok: true, id: result.data?.id ?? productoId }
  }

  return {
    form,
    submitState,
    submitError,
    setField,
    setTipo,
    setDetalleField,
    setSpotField,
    agregarLocutor,
    quitarLocutor,
    setPrecioLocutor,
    agregarHorario,
    setHorarioField,
    quitarHorario,
    toggleComercializadora,
    crearEmisoraInline,
    crearLocutorInline,
    crearComercializadoraInline,
    submit,
    validate,
  }
}

const svc = require('../services/perService')

const w = (fn) => async (req, res, next) => {
  try { await fn(req, res) } catch (err) { next(err) }
}

// ── personas ──────────────────────────────────────────────────────────────────

// Filtros multivalor llegan coma-separados (?medio=1,2,3) → arreglo de ids.
const _arr = (v) =>
  v == null || v === '' ? [] : String(v).split(',').map((s) => s.trim()).filter(Boolean)

const listarPersonas  = w(async (req, res) => {
  const { buscar, frecuencia, medio, fuente, stakeholder, tipo_pr, page, limit } = req.query
  res.json(await svc.listarPersonas({
    buscar, frecuencia, page, limit,
    medio:       _arr(medio),
    fuente:      _arr(fuente),
    stakeholder: _arr(stakeholder),
    tipo_pr:     _arr(tipo_pr),
  }))
})
const obtenerPersona  = w(async (req, res) => res.json(await svc.obtenerPersona(req.params.id)))
const crearPersona    = w(async (req, res) => res.status(201).json(await svc.crearPersona(req.body)))
const editarPersona   = w(async (req, res) => res.json(await svc.editarPersona(req.params.id, req.body)))
const inactivarPersona = w(async (req, res) => {
  await svc.inactivarPersona(req.params.id)
  res.json({ ok: true })
})

// ── catálogos ─────────────────────────────────────────────────────────────────

const listarMedios       = w(async (req, res) => res.json(await svc.listarMedios()))
const listarStakeholders = w(async (req, res) => res.json(await svc.listarStakeholders()))
const listarFuentes      = w(async (req, res) => res.json(await svc.listarFuentes()))
const listarTiposPr      = w(async (req, res) => res.json(await svc.listarTiposPr()))

// ── plantillas ────────────────────────────────────────────────────────────────

const listarPlantillas = w(async (req, res) => res.json(await svc.listarPlantillas()))
const obtenerPlantilla = w(async (req, res) => res.json(await svc.obtenerPlantilla(req.params.id)))
const crearPlantilla   = w(async (req, res) => res.status(201).json(await svc.crearPlantilla(req.body)))
const editarPlantilla  = w(async (req, res) => res.json(await svc.editarPlantilla(req.params.id, req.body)))

// ── listas ────────────────────────────────────────────────────────────────────

const listarListas       = w(async (req, res) => res.json(await svc.listarListas(req.query)))
const obtenerLista       = w(async (req, res) => res.json(await svc.obtenerLista(req.params.id)))
const crearLista         = w(async (req, res) => res.status(201).json(await svc.crearLista(req.body)))
const editarLista        = w(async (req, res) => res.json(await svc.editarLista(req.params.id, req.body)))
const cambiarEstadoLista = w(async (req, res) =>
  res.json(await svc.cambiarEstadoLista(req.params.id, req.body.estado))
)

const listarParticipantes = w(async (req, res) => {
  const lista = await svc.obtenerLista(req.params.id)
  res.json(lista.participantes_lista || [])
})
const agregarParticipante = w(async (req, res) =>
  res.status(201).json(await svc.agregarParticipante(req.params.id, req.body))
)
const editarParticipante  = w(async (req, res) =>
  res.json(await svc.editarParticipante(req.params.id, req.params.pid, req.body))
)
const quitarParticipante  = w(async (req, res) => {
  await svc.quitarParticipante(req.params.id, req.params.pid)
  res.status(204).end()
})

// ── exports ───────────────────────────────────────────────────────────────────

module.exports = {
  listarPersonas, obtenerPersona, crearPersona, editarPersona, inactivarPersona,
  listarMedios, listarStakeholders, listarFuentes, listarTiposPr,
  listarPlantillas, obtenerPlantilla, crearPlantilla, editarPlantilla,
  listarListas, obtenerLista, crearLista, editarLista, cambiarEstadoLista,
  listarParticipantes, agregarParticipante, editarParticipante, quitarParticipante,
}

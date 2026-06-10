const svc = require('../services/infService')

// Envuelve un handler async y delega errores al errorHandler
const w = (fn) => async (req, res, next) => {
  try {
    await fn(req, res)
  } catch (err) {
    next(err)
  }
}

// ── influencers ───────────────────────────────────────────────────────────────

const listarInfluencers = w(async (req, res) =>
  res.json(await svc.listarInfluencers(req.query)))

const obtenerInfluencer = w(async (req, res) =>
  res.json(await svc.obtenerInfluencer(req.params.id)))

const contratosDeInfluencer = w(async (req, res) =>
  res.json(await svc.obtenerContratosDeInfluencer(req.params.id)))

const campanasDeInfluencer = w(async (req, res) =>
  res.json(await svc.obtenerCampanasDeInfluencer(req.params.id)))

const crearInfluencer = w(async (req, res) =>
  res.status(201).json(await svc.crearInfluencer(req.body)))

const editarInfluencer = w(async (req, res) =>
  res.json(await svc.editarInfluencer(req.params.id, req.body)))

const eliminarInfluencer = w(async (req, res) => {
  await svc.eliminarInfluencer(req.params.id)
  res.status(204).end()
})

// ── marcas ────────────────────────────────────────────────────────────────────

const listarMarcas = w(async (req, res) =>
  res.json(await svc.listarMarcas()))

const obtenerMarca = w(async (req, res) =>
  res.json(await svc.obtenerMarca(req.params.id)))

const crearMarca = w(async (req, res) =>
  res.status(201).json(await svc.crearMarca(req.body)))

const editarMarca = w(async (req, res) =>
  res.json(await svc.editarMarca(req.params.id, req.body)))

const eliminarMarca = w(async (req, res) => {
  await svc.eliminarMarca(req.params.id)
  res.status(204).end()
})

// ── contratos ─────────────────────────────────────────────────────────────────

const listarContratos = w(async (req, res) =>
  res.json(await svc.listarContratos(req.query)))

const obtenerContrato = w(async (req, res) =>
  res.json(await svc.obtenerContrato(req.params.id)))

const crearContrato = w(async (req, res) =>
  res.status(201).json(await svc.crearContrato(req.body)))

const editarContrato = w(async (req, res) =>
  res.json(await svc.editarContrato(req.params.id, req.body)))

const eliminarContrato = w(async (req, res) => {
  await svc.eliminarContrato(req.params.id)
  res.status(204).end()
})

// ── entregables ───────────────────────────────────────────────────────────────

const crearEntregable = w(async (req, res) =>
  res.status(201).json(await svc.crearEntregable(req.body)))

const editarEntregable = w(async (req, res) =>
  res.json(await svc.editarEntregable(req.params.id, req.body)))

const eliminarEntregable = w(async (req, res) => {
  await svc.eliminarEntregable(req.params.id)
  res.status(204).end()
})

// ── pagos ─────────────────────────────────────────────────────────────────────

const crearPago = w(async (req, res) =>
  res.status(201).json(await svc.crearPago(req.body)))

const editarPago = w(async (req, res) =>
  res.json(await svc.editarPago(req.params.id, req.body)))

const eliminarPago = w(async (req, res) => {
  await svc.eliminarPago(req.params.id)
  res.status(204).end()
})

// ── campanas ──────────────────────────────────────────────────────────────────

const listarCampanas = w(async (req, res) =>
  res.json(await svc.listarCampanas()))

const obtenerCampana = w(async (req, res) =>
  res.json(await svc.obtenerCampana(req.params.id)))

const crearCampana = w(async (req, res) =>
  res.status(201).json(await svc.crearCampana(req.body)))

const editarCampana = w(async (req, res) =>
  res.json(await svc.editarCampana(req.params.id, req.body)))

const eliminarCampana = w(async (req, res) => {
  await svc.eliminarCampana(req.params.id)
  res.status(204).end()
})

const agregarInfluencerACampana = w(async (req, res) =>
  res.status(201).json(await svc.agregarInfluencerACampana(req.params.id, req.body)))

const quitarInfluencerDeCampana = w(async (req, res) => {
  await svc.quitarInfluencerDeCampana(req.params.id, req.params.infId)
  res.status(204).end()
})

// ── exports ───────────────────────────────────────────────────────────────────

module.exports = {
  listarInfluencers, obtenerInfluencer, contratosDeInfluencer, campanasDeInfluencer,
  crearInfluencer, editarInfluencer, eliminarInfluencer,
  listarMarcas, obtenerMarca, crearMarca, editarMarca, eliminarMarca,
  listarContratos, obtenerContrato, crearContrato, editarContrato, eliminarContrato,
  crearEntregable, editarEntregable, eliminarEntregable,
  crearPago, editarPago, eliminarPago,
  listarCampanas, obtenerCampana, crearCampana, editarCampana, eliminarCampana,
  agregarInfluencerACampana, quitarInfluencerDeCampana,
}

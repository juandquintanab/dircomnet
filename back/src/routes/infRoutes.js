const { Router } = require('express')
const ctrl = require('../controllers/infController')

const router = Router()

// ── influencers ───────────────────────────────────────────────────────────────
router.get('/influencers',                   ctrl.listarInfluencers)
router.post('/influencers',                  ctrl.crearInfluencer)
router.get('/influencers/:id',               ctrl.obtenerInfluencer)
router.put('/influencers/:id',               ctrl.editarInfluencer)
router.delete('/influencers/:id',            ctrl.eliminarInfluencer)
router.get('/influencers/:id/contratos',     ctrl.contratosDeInfluencer)
router.get('/influencers/:id/campanas',      ctrl.campanasDeInfluencer)

// ── marcas ────────────────────────────────────────────────────────────────────
router.get('/marcas',        ctrl.listarMarcas)
router.post('/marcas',       ctrl.crearMarca)
router.get('/marcas/:id',    ctrl.obtenerMarca)
router.put('/marcas/:id',    ctrl.editarMarca)
router.delete('/marcas/:id', ctrl.eliminarMarca)

// ── contratos ─────────────────────────────────────────────────────────────────
router.get('/contratos',        ctrl.listarContratos)
router.post('/contratos',       ctrl.crearContrato)
router.get('/contratos/:id',    ctrl.obtenerContrato)
router.put('/contratos/:id',    ctrl.editarContrato)
router.delete('/contratos/:id', ctrl.eliminarContrato)

// ── entregables ───────────────────────────────────────────────────────────────
router.post('/entregables',        ctrl.crearEntregable)
router.put('/entregables/:id',     ctrl.editarEntregable)
router.delete('/entregables/:id',  ctrl.eliminarEntregable)

// ── pagos ─────────────────────────────────────────────────────────────────────
router.post('/pagos',        ctrl.crearPago)
router.put('/pagos/:id',     ctrl.editarPago)
router.delete('/pagos/:id',  ctrl.eliminarPago)

// ── campanas ──────────────────────────────────────────────────────────────────
router.get('/campanas',                              ctrl.listarCampanas)
router.post('/campanas',                             ctrl.crearCampana)
router.get('/campanas/:id',                          ctrl.obtenerCampana)
router.put('/campanas/:id',                          ctrl.editarCampana)
router.delete('/campanas/:id',                       ctrl.eliminarCampana)
router.post('/campanas/:id/influencers',             ctrl.agregarInfluencerACampana)
router.delete('/campanas/:id/influencers/:infId',    ctrl.quitarInfluencerDeCampana)

module.exports = router

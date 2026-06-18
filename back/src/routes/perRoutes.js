const { Router } = require('express')
const ctrl = require('../controllers/perController')

const router = Router()

// ── personas ──────────────────────────────────────────────────────────────────
router.get('/personas',                     ctrl.listarPersonas)
router.post('/personas',                    ctrl.crearPersona)
router.get('/personas/:id',                 ctrl.obtenerPersona)
router.put('/personas/:id',                 ctrl.editarPersona)
router.patch('/personas/:id/inactivar',     ctrl.inactivarPersona)

// ── catálogos ─────────────────────────────────────────────────────────────────
router.get('/medios',        ctrl.listarMedios)
router.get('/stakeholders',  ctrl.listarStakeholders)
router.get('/fuentes',       ctrl.listarFuentes)
router.get('/tipos-pr',      ctrl.listarTiposPr)

// ── plantillas ────────────────────────────────────────────────────────────────
router.get('/plantillas',        ctrl.listarPlantillas)
router.post('/plantillas',       ctrl.crearPlantilla)
router.get('/plantillas/:id',    ctrl.obtenerPlantilla)
router.put('/plantillas/:id',    ctrl.editarPlantilla)

// ── listas ────────────────────────────────────────────────────────────────────
router.get('/listas',                             ctrl.listarListas)
router.post('/listas',                            ctrl.crearLista)
router.get('/listas/:id',                         ctrl.obtenerLista)
router.put('/listas/:id',                         ctrl.editarLista)
router.patch('/listas/:id/estado',                ctrl.cambiarEstadoLista)
router.get('/listas/:id/participantes',           ctrl.listarParticipantes)
router.post('/listas/:id/participantes',          ctrl.agregarParticipante)
router.put('/listas/:id/participantes/:pid',      ctrl.editarParticipante)
router.delete('/listas/:id/participantes/:pid',   ctrl.quitarParticipante)

module.exports = router

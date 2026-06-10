import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, EmptyDash, Chip, Icon } from '../../../components/primitives'
import { getPersonaById, inactivarPersona } from '../lib/perQueries'

const FRECUENCIA_TONE = { alta: 'green', media: 'blue', baja: 'yellow', ocasional: 'slate' }

function Field({ label, children }) {
  return (
    <div className="per-field">
      <span className="label-field">{label}</span>
      <span className="per-field__val">{children ?? <EmptyDash />}</span>
    </div>
  )
}

function ModalConfirm({ nombre, onConfirmar, onCancelar, inactivando }) {
  return (
    <div className="pl-modal-scrim" role="dialog" aria-modal="true">
      <div className="pl-modal">
        <div className="pl-modal__head">
          <h2>Inactivar periodista</h2>
          <span className="sub">{nombre}</span>
          <button
            type="button"
            className="pl-modal__x"
            onClick={onCancelar}
            aria-label="Cerrar"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="pl-modal__body">
          <p style={{ fontSize: 'var(--fs-body-m)', color: 'var(--fg-2)', margin: 0, lineHeight: 1.6 }}>
            El periodista quedará marcado como inactivo. No se eliminarán sus datos ni su historial.
            Esta acción puede revertirse editando el registro.
          </p>
        </div>
        <div className="pl-modal__footer">
          <Button variant="secondary" onClick={onCancelar} disabled={inactivando}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirmar} disabled={inactivando}>
            {inactivando ? 'Inactivando…' : 'Inactivar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function PersonaDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [persona, setPersona]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [confirmar, setConfirmar]   = useState(false)
  const [inactivando, setInactivando] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getPersonaById(id)
      .then(setPersona)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleInactivar = async () => {
    setInactivando(true)
    try {
      await inactivarPersona(id)
      navigate('/per/personas')
    } catch (e) {
      setError(e.message)
      setConfirmar(false)
    } finally {
      setInactivando(false)
    }
  }

  if (loading) return <div className="per-loading">Cargando…</div>
  if (error)   return <div className="per-error">Error al cargar los datos.</div>
  if (!persona) return null

  const p = persona

  const mediosPrincipales = p.persona_medios?.filter((pm) => pm.medios) ?? []
  const correosPrincipal  = p.correos?.filter((c) => c.es_principal) ?? []
  const correosResto      = p.correos?.filter((c) => !c.es_principal) ?? []
  const telPrincipal      = p.telefonos?.filter((t) => t.es_principal) ?? []
  const telResto          = p.telefonos?.filter((t) => !t.es_principal) ?? []

  return (
    <>
      {confirmar && (
        <ModalConfirm
          nombre={p.nombre}
          onConfirmar={handleInactivar}
          onCancelar={() => setConfirmar(false)}
          inactivando={inactivando}
        />
      )}

      <div className="per-page-stack">
        {/* ── Encabezado ── */}
        <div className="pl-page__head">
          <div className="pl-page__title">
            <h1>
              {p.nombre}
              {!p.activo && (
                <Chip tone="slate" style={{ marginLeft: 'var(--space-3)', verticalAlign: 'middle' }}>
                  Inactivo
                </Chip>
              )}
            </h1>
            <span className="meta"><b>PER</b> · Difusión y PR</span>
          </div>
          <div className="pl-page__actions">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Volver
            </Button>
            {p.activo && (
              <Button variant="destructive" onClick={() => setConfirmar(true)}>
                Inactivar
              </Button>
            )}
            <Button variant="accent" icon="edit" onClick={() => navigate(`/per/personas/${id}/editar`)}>
              Editar
            </Button>
          </div>
        </div>

        {/* ── Datos personales ── */}
        <div className="pl-card" style={{ padding: 'var(--space-6)' }}>
          <div className="pl-section__head">
            <div className="pl-section__title">
              <Icon name="user" size={14} />
              <span className="label-section">Datos personales</span>
            </div>
          </div>
          <div className="pl-section__body">
            <Field label="Cédula">{p.cedula}</Field>
            <Field label="Frecuencia">
              {p.frecuencia
                ? <Chip tone={FRECUENCIA_TONE[p.frecuencia] ?? 'slate'}>{p.frecuencia}</Chip>
                : null}
            </Field>
          </div>
        </div>

        {/* ── Métricas ── */}
        <div className="pl-card" style={{ padding: 'var(--space-6)' }}>
          <div className="pl-section__head">
            <div className="pl-section__title">
              <Icon name="bar" size={14} />
              <span className="label-section">Métricas</span>
            </div>
          </div>
          <div className="pl-section__body">
            <Field label="Tendencia">{p.tendencia}</Field>
            <Field label="Sentimiento EP">{p.sentimiento_ep}</Field>
            <Field label="Influencia">{p.influencia}</Field>
            <Field label="Contacto">{p.contacto}</Field>
            <Field label="Respuesta">{p.respuesta}</Field>
            <Field label="Compromiso">{p.compromiso}</Field>
            <Field label="Engagement">{p.engagement}</Field>
          </div>
        </div>

        {/* ── Medios ── */}
        <div className="pl-card" style={{ padding: 'var(--space-6)' }}>
          <div className="pl-section__head">
            <div className="pl-section__title">
              <Icon name="building" size={14} />
              <span className="label-section">Medios</span>
            </div>
          </div>
          <div style={{ padding: 'var(--space-5) 0 var(--space-2)' }}>
            {mediosPrincipales.length === 0 ? (
              <EmptyDash />
            ) : (
              <div className="per-contact-chips">
                {mediosPrincipales.map((pm) => (
                  <Chip key={pm.medios.id} tone="blue">{pm.medios.nombre}</Chip>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Contacto ── */}
        <div className="pl-card" style={{ padding: 'var(--space-6)' }}>
          <div className="pl-section__head">
            <div className="pl-section__title">
              <Icon name="user" size={14} />
              <span className="label-section">Datos de contacto</span>
            </div>
          </div>

          {/* Correos */}
          <div style={{ marginTop: 'var(--space-5)' }}>
            <span className="label-field">Correos</span>
            {p.correos?.length === 0 || !p.correos ? (
              <div className="per-field__val"><EmptyDash /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginTop: 'var(--space-2)' }}>
                {[...correosPrincipal, ...correosResto].map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span className="per-field__val">{c.direccion}</span>
                    {c.es_principal && <Chip tone="blue">Principal</Chip>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Teléfonos */}
          <div style={{ marginTop: 'var(--space-5)' }}>
            <span className="label-field">Teléfonos</span>
            {p.telefonos?.length === 0 || !p.telefonos ? (
              <div className="per-field__val"><EmptyDash /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginTop: 'var(--space-2)' }}>
                {[...telPrincipal, ...telResto].map((t) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span className="per-field__val">{t.numero}</span>
                    {t.es_principal && <Chip tone="blue">Principal</Chip>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Redes sociales */}
          <div style={{ marginTop: 'var(--space-5)' }}>
            <span className="label-field">Redes sociales</span>
            {p.redes_sociales?.length === 0 || !p.redes_sociales ? (
              <div className="per-field__val"><EmptyDash /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginTop: 'var(--space-2)' }}>
                {p.redes_sociales.map((r) => (
                  <span key={r.id} className="per-field__val">
                    {r.plataforma}: {r.usuario}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Relaciones ── */}
        <div className="pl-card" style={{ padding: 'var(--space-6)' }}>
          <div className="pl-section__head">
            <div className="pl-section__title">
              <Icon name="list" size={14} />
              <span className="label-section">Relaciones</span>
            </div>
          </div>
          <div className="pl-section__body" style={{ marginTop: 'var(--space-5)' }}>
            <div className="per-field">
              <span className="label-field">Stakeholders</span>
              <div className="per-contact-chips" style={{ marginTop: 'var(--space-2)' }}>
                {p.persona_stakeholders?.length
                  ? p.persona_stakeholders.map((ps) => (
                      <Chip key={ps.stakeholders?.id} tone="slate">{ps.stakeholders?.nombre}</Chip>
                    ))
                  : <EmptyDash />}
              </div>
            </div>
            <div className="per-field">
              <span className="label-field">Fuentes</span>
              <div className="per-contact-chips" style={{ marginTop: 'var(--space-2)' }}>
                {p.persona_fuentes?.length
                  ? p.persona_fuentes.map((pf) => (
                      <Chip key={pf.fuentes?.id} tone="slate">{pf.fuentes?.nombre}</Chip>
                    ))
                  : <EmptyDash />}
              </div>
            </div>
            <div className="per-field">
              <span className="label-field">Tipos PR</span>
              <div className="per-contact-chips" style={{ marginTop: 'var(--space-2)' }}>
                {p.persona_tipos_pr?.length
                  ? p.persona_tipos_pr.map((pt) => (
                      <Chip key={pt.tipos_pr?.id} tone="slate">{pt.tipos_pr?.nombre}</Chip>
                    ))
                  : <EmptyDash />}
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Field, Input, Select } from '../../../components/primitives'
import {
  getInfluencerById,
  createInfluencer,
  updateInfluencer,
  sincronizarRelacionesInfluencer,
  getTiposInfluencer,
  getTematicas,
  getCategorias,
  getMarcas,
  getMarcasComerciales,
  getMarcasCompetencia,
} from '../lib/infQueries'

const SEXOS = ['F', 'M', 'Otro']
const PLATAFORMAS = ['Instagram', 'TikTok', 'YouTube', 'X', 'Facebook', 'Otra']

const FORM_VACIO = {
  nombre: '',
  sexo: '',
  ciudad: '',
  estado: '',
  pais: '',
  direccion: '',
  descripcion: '',
  comentarios: '',
}

const nuevaRed = () => ({
  _key: crypto.randomUUID(),
  plataforma: '',
  usuario: '',
  seguidores: '',
  tipo_id: '',
})

// Selector múltiple basado en chips toggle sobre un catálogo [{id, nombre}].
function MultiChips({ catalogo, seleccion, onToggle, vacio }) {
  if (!catalogo.length) return <span className="inf-field__val">{vacio}</span>
  return (
    <div className="inf-chips inf-chips--toggle">
      {catalogo.map((c) => {
        const activo = seleccion.includes(c.id)
        return (
          <button
            type="button"
            key={c.id}
            className={`inf-toggle-chip${activo ? ' is-active' : ''}`}
            onClick={() => onToggle(c.id)}
          >
            {c.nombre}
          </button>
        )
      })}
    </div>
  )
}

export default function InfluencerForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const esEdicion = Boolean(id)

  const [form, setForm] = useState(FORM_VACIO)
  const [redes, setRedes] = useState([])
  const [telefonos, setTelefonos] = useState([])
  const [correos, setCorreos] = useState([])
  const [tematicaIds, setTematicaIds] = useState([])
  const [categoriaIds, setCategoriaIds] = useState([])
  const [marcasEp, setMarcasEp] = useState([]) // [{ marca_id, estado, embajador }]
  const [marcaComercialIds, setMarcaComercialIds] = useState([])
  const [marcaCompetenciaIds, setMarcaCompetenciaIds] = useState([])

  const [cat, setCat] = useState({ tipos: [], tematicas: [], categorias: [], marcasEp: [], comerciales: [], competencia: [] })

  const [errores, setErrores] = useState({})
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [errorApi, setErrorApi] = useState(null)

  // Carga de catálogos + (en edición) datos del influencer
  useEffect(() => {
    let activo = true
    setCargando(true)
    Promise.all([
      getTiposInfluencer(),
      getTematicas(),
      getCategorias(),
      getMarcas(),
      getMarcasComerciales(),
      getMarcasCompetencia(),
      esEdicion ? getInfluencerById(id) : Promise.resolve(null),
    ])
      .then(([tipos, tematicas, categorias, marcas, comerciales, competencia, inf]) => {
        if (!activo) return
        setCat({
          tipos,
          tematicas,
          categorias,
          marcasEp: (marcas || []).filter((m) => m.es_propia),
          comerciales,
          competencia,
        })
        if (inf) {
          setForm({
            nombre: inf.nombre ?? '',
            sexo: inf.sexo ?? '',
            ciudad: inf.ciudad ?? '',
            estado: inf.estado ?? '',
            pais: inf.pais ?? '',
            direccion: inf.direccion ?? '',
            descripcion: inf.descripcion ?? '',
            comentarios: inf.comentarios ?? '',
          })
          setRedes(
            (inf.redes || []).map((r) => ({
              _key: crypto.randomUUID(),
              plataforma: r.plataforma ?? '',
              usuario: r.usuario ?? '',
              seguidores: r.seguidores != null ? String(r.seguidores) : '',
              tipo_id: r.tipo_id ?? '',
            })),
          )
          setTelefonos((inf.telefonos || []).map((t) => t.numero))
          setCorreos((inf.correos || []).map((c) => c.direccion))
          setTematicaIds(inf.tematica_ids || [])
          setCategoriaIds(inf.categoria_ids || [])
          setMarcasEp(
            (inf.marcas_ep || []).map((m) => ({
              marca_id: m.marca_id,
              estado: m.estado ?? '',
              embajador: !!m.embajador,
            })),
          )
          setMarcaComercialIds(inf.marca_comercial_ids || [])
          setMarcaCompetenciaIds(inf.marca_competencia_ids || [])
        }
      })
      .catch((e) => activo && setErrorApi(e.message))
      .finally(() => activo && setCargando(false))
    return () => { activo = false }
  }, [id, esEdicion])

  const set = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }))
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: null }))
  }

  const toggleEn = (setter) => (valor) =>
    setter((prev) => (prev.includes(valor) ? prev.filter((x) => x !== valor) : [...prev, valor]))

  // Redes dinámicas
  const setRed = (key, campo, valor) =>
    setRedes((rs) => rs.map((r) => (r._key === key ? { ...r, [campo]: valor } : r)))
  const quitarRed = (key) => setRedes((rs) => rs.filter((r) => r._key !== key))

  // Marcas EP: el chip alterna pertenencia; estado/embajador se editan en la fila
  const toggleMarcaEp = (marca_id) =>
    setMarcasEp((prev) =>
      prev.some((m) => m.marca_id === marca_id)
        ? prev.filter((m) => m.marca_id !== marca_id)
        : [...prev, { marca_id, estado: '', embajador: false }],
    )
  const setMarcaEp = (marca_id, campo, valor) =>
    setMarcasEp((prev) => prev.map((m) => (m.marca_id === marca_id ? { ...m, [campo]: valor } : m)))

  const nombreMarca = (marca_id) => cat.marcasEp.find((m) => m.id === marca_id)?.nombre ?? marca_id

  const validar = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    return e
  }

  const guardar = async (ev) => {
    ev.preventDefault()
    const e = validar()
    if (Object.keys(e).length) { setErrores(e); return }

    const base = {
      nombre: form.nombre.trim(),
      sexo: form.sexo || null,
      ciudad: form.ciudad.trim() || null,
      estado: form.estado.trim() || null,
      pais: form.pais.trim() || null,
      direccion: form.direccion.trim() || null,
      descripcion: form.descripcion.trim() || null,
      comentarios: form.comentarios.trim() || null,
    }

    const rel = {
      redes: redes
        .filter((r) => r.plataforma || r.usuario)
        .map((r) => ({
          plataforma: r.plataforma || null,
          usuario: r.usuario.trim() || null,
          seguidores: r.seguidores ? parseInt(r.seguidores, 10) : null,
          tipo_id: r.tipo_id || null,
        })),
      telefonos: telefonos.map((t) => t.trim()).filter(Boolean),
      correos: correos.map((c) => c.trim()).filter(Boolean),
      tematica_ids: tematicaIds,
      categoria_ids: categoriaIds,
      marcas_ep: marcasEp.map((m) => ({
        marca_id: m.marca_id,
        estado: m.estado.trim() || null,
        embajador: m.embajador,
      })),
      marca_comercial_ids: marcaComercialIds,
      marca_competencia_ids: marcaCompetenciaIds,
    }

    setGuardando(true)
    setErrorApi(null)
    try {
      const row = esEdicion
        ? await updateInfluencer(id, base)
        : await createInfluencer(base)
      await sincronizarRelacionesInfluencer(row.id, rel)
      navigate(`/inf/influencers/${row.id}`)
    } catch (e) {
      setErrorApi(e.message)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <div className="inf-loading">Cargando…</div>

  return (
    <>
      <div className="pl-page__head">
        <div className="pl-page__title">
          <h1>{esEdicion ? 'Editar influencer' : 'Nuevo influencer'}</h1>
          <span className="meta"><b>INF</b> · Medios Pagos</span>
        </div>
      </div>

      <form onSubmit={guardar} noValidate>
        <div className="pl-card inf-form-card" style={{ padding: 'var(--space-6)' }}>

          {/* ── Datos personales ── */}
          <div className="inf-form-section">
            <span className="inf-form-section-title">Datos personales</span>
            <Field label="Nombre" error={errores.nombre}>
              <Input value={form.nombre} onChange={(v) => set('nombre', v)} placeholder="Nombre completo" error={!!errores.nombre} />
            </Field>
            <div className="pl-grid-2">
              <Field label="Sexo">
                <Select value={form.sexo} onChange={(v) => set('sexo', v)} options={SEXOS} placeholder="Seleccionar" />
              </Field>
              <Field label="Ciudad">
                <Input value={form.ciudad} onChange={(v) => set('ciudad', v)} placeholder="Ej. Caracas" />
              </Field>
              <Field label="Estado">
                <Input value={form.estado} onChange={(v) => set('estado', v)} placeholder="Ej. Miranda" />
              </Field>
              <Field label="País">
                <Input value={form.pais} onChange={(v) => set('pais', v)} placeholder="Ej. Venezuela" />
              </Field>
            </div>
            <Field label="Dirección">
              <Input value={form.direccion} onChange={(v) => set('direccion', v)} placeholder="Dirección" />
            </Field>
            <Field label="Descripción">
              <Input value={form.descripcion} onChange={(v) => set('descripcion', v)} placeholder="Descripción" />
            </Field>
            <Field label="Comentarios">
              <Input value={form.comentarios} onChange={(v) => set('comentarios', v)} placeholder="Comentarios" />
            </Field>
          </div>

          {/* ── Redes sociales ── */}
          <div className="inf-form-section">
            <span className="inf-form-section-title">Redes sociales</span>
            {redes.map((r) => (
              <div key={r._key} className="inf-red-row">
                <select
                  className="inf-select-native"
                  value={r.plataforma}
                  onChange={(ev) => setRed(r._key, 'plataforma', ev.target.value)}
                >
                  <option value="">Plataforma…</option>
                  {PLATAFORMAS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <Input value={r.usuario} onChange={(v) => setRed(r._key, 'usuario', v)} placeholder="usuario" />
                <Input value={r.seguidores} onChange={(v) => setRed(r._key, 'seguidores', v.replace(/\D/g, ''))} placeholder="Seguidores" />
                <select
                  className="inf-select-native"
                  value={r.tipo_id}
                  onChange={(ev) => setRed(r._key, 'tipo_id', ev.target.value)}
                >
                  <option value="">Tipo…</option>
                  {cat.tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
                <Button variant="ghost" icon="trash" onClick={() => quitarRed(r._key)} />
              </div>
            ))}
            <div>
              <Button variant="secondary" icon="plus" onClick={() => setRedes((rs) => [...rs, nuevaRed()])}>
                Agregar red
              </Button>
            </div>
          </div>

          {/* ── Teléfonos ── */}
          <div className="inf-form-section">
            <span className="inf-form-section-title">Teléfonos</span>
            {telefonos.map((t, i) => (
              <div key={i} className="inf-list-row">
                <Input value={t} onChange={(v) => setTelefonos((arr) => arr.map((x, j) => (j === i ? v : x)))} placeholder="Ej. 0414-1234567" />
                <Button variant="ghost" icon="trash" onClick={() => setTelefonos((arr) => arr.filter((_, j) => j !== i))} />
              </div>
            ))}
            <div>
              <Button variant="secondary" icon="plus" onClick={() => setTelefonos((arr) => [...arr, ''])}>
                Agregar teléfono
              </Button>
            </div>
          </div>

          {/* ── Correos ── */}
          <div className="inf-form-section">
            <span className="inf-form-section-title">Correos</span>
            {correos.map((c, i) => (
              <div key={i} className="inf-list-row">
                <Input value={c} onChange={(v) => setCorreos((arr) => arr.map((x, j) => (j === i ? v : x)))} placeholder="correo@ejemplo.com" />
                <Button variant="ghost" icon="trash" onClick={() => setCorreos((arr) => arr.filter((_, j) => j !== i))} />
              </div>
            ))}
            <div>
              <Button variant="secondary" icon="plus" onClick={() => setCorreos((arr) => [...arr, ''])}>
                Agregar correo
              </Button>
            </div>
          </div>

          {/* ── Temáticas ── */}
          <div className="inf-form-section">
            <span className="inf-form-section-title">Temáticas</span>
            <MultiChips catalogo={cat.tematicas} seleccion={tematicaIds} onToggle={toggleEn(setTematicaIds)} vacio="No hay temáticas en el catálogo." />
          </div>

          {/* ── Categorías ── */}
          <div className="inf-form-section">
            <span className="inf-form-section-title">Categorías</span>
            <MultiChips catalogo={cat.categorias} seleccion={categoriaIds} onToggle={toggleEn(setCategoriaIds)} vacio="No hay categorías en el catálogo." />
          </div>

          {/* ── Marcas Empresas Polar ── */}
          <div className="inf-form-section">
            <span className="inf-form-section-title">Marcas Empresas Polar</span>
            <MultiChips
              catalogo={cat.marcasEp}
              seleccion={marcasEp.map((m) => m.marca_id)}
              onToggle={toggleMarcaEp}
              vacio="No hay marcas propias en el catálogo."
            />
            {marcasEp.map((m) => (
              <div key={m.marca_id} className="inf-marca-ep-row">
                <span className="inf-field__val--lg">{nombreMarca(m.marca_id)}</span>
                <Input value={m.estado} onChange={(v) => setMarcaEp(m.marca_id, 'estado', v)} placeholder="Estado" />
                <label className="inf-check">
                  <input type="checkbox" checked={m.embajador} onChange={(ev) => setMarcaEp(m.marca_id, 'embajador', ev.target.checked)} />
                  Embajador
                </label>
              </div>
            ))}
          </div>

          {/* ── Marcas comerciales ── */}
          <div className="inf-form-section">
            <span className="inf-form-section-title">Marcas comerciales</span>
            <MultiChips catalogo={cat.comerciales} seleccion={marcaComercialIds} onToggle={toggleEn(setMarcaComercialIds)} vacio="No hay marcas comerciales en el catálogo." />
          </div>

          {/* ── Marcas de la competencia ── */}
          <div className="inf-form-section">
            <span className="inf-form-section-title">Marcas de la competencia</span>
            <MultiChips catalogo={cat.competencia} seleccion={marcaCompetenciaIds} onToggle={toggleEn(setMarcaCompetenciaIds)} vacio="No hay marcas de competencia en el catálogo." />
          </div>

          {errorApi && <div className="inf-error">{errorApi}</div>}

          {/* ── Acciones ── */}
          <div className="pl-row" style={{ justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => navigate(-1)} disabled={guardando}>
              Cancelar
            </Button>
            <Button variant="accent" type="submit" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </div>
      </form>
    </>
  )
}

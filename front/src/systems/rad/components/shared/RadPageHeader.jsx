import { Button } from '../../../../components/primitives'

export default function RadPageHeader({ titulo, labelAccion, onAccion }) {
  return (
    <div className="pl-page__head">
      <div className="pl-page__title">
        <h1>{titulo}</h1>
      </div>
      {labelAccion && (
        <Button variant="primary" size="m" icon="plus" onClick={onAccion}>
          {labelAccion}
        </Button>
      )}
    </div>
  )
}

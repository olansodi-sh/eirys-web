import { Button } from './index'

export function RowActions({
  onEdit,
  onDelete,
  deleteConfirm = '¿Eliminar este registro?',
}: {
  onEdit?: () => void
  onDelete?: () => void
  deleteConfirm?: string
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      {onEdit && (
        <Button variant="ghost" className="!px-2 !py-1" onClick={onEdit} title="Editar">
          ✎
        </Button>
      )}
      {onDelete && (
        <Button
          variant="danger"
          className="!px-2 !py-1"
          onClick={() => {
            if (window.confirm(deleteConfirm)) onDelete()
          }}
          title="Eliminar"
        >
          🗑
        </Button>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tasksApi, type BoardColumn } from '@/shared/api/endpoints'
import { Button, Input, Modal } from '@/shared/ui'

export default function TasksPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [columnId, setColumnId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)

  const board = useQuery({ queryKey: ['board'], queryFn: tasksApi.board })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['board'] })

  const create = useMutation({
    mutationFn: () => tasksApi.createTask({ title, description, columnId }),
    onSuccess: () => {
      invalidate()
      setOpen(false)
      setTitle('')
      setDescription('')
    },
  })

  const move = useMutation({
    mutationFn: ({ id, colId, order }: { id: string; colId: string; order: number }) =>
      tasksApi.move(id, colId, order),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),
    onSuccess: invalidate,
  })

  function onDrop(col: BoardColumn) {
    if (!dragId) return
    move.mutate({ id: dragId, colId: col.id, order: col.tasks.length })
    setDragId(null)
  }

  function openFor(colId: string) {
    setColumnId(colId)
    setOpen(true)
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Mis tareas</h1>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {board.data?.map((col) => (
          <div
            key={col.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(col)}
            className="flex w-72 flex-shrink-0 flex-col rounded-lg bg-gray-100 p-3"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-gray-700">
                {col.name}
                <span className="ml-2 text-gray-500">{col.tasks.length}</span>
              </h2>
              <button
                onClick={() => openFor(col.id)}
                className="text-gray-500 hover:text-primary"
                title="Agregar tarea"
              >
                +
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {col.tasks.map((t) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={() => setDragId(t.id)}
                  className="group cursor-grab rounded-md border border-gray-300 bg-white p-3 shadow-sm active:cursor-grabbing"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-700">
                      {t.title}
                    </p>
                    <button
                      onClick={() => remove.mutate(t.id)}
                      className="text-gray-300 opacity-0 transition group-hover:opacity-100 hover:text-danger"
                    >
                      ✕
                    </button>
                  </div>
                  {t.description && (
                    <p className="mt-1 text-xs text-gray-500">
                      {t.description}
                    </p>
                  )}
                </div>
              ))}
              {col.tasks.length === 0 && (
                <p className="px-1 py-4 text-center text-xs text-gray-500">
                  Arrastra tarjetas aquí
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} title="Nueva tarea" onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <Input
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => create.mutate()}
              disabled={!title || create.isPending}
            >
              Crear
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

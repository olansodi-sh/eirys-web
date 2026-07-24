import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { creditNotesApi, salesApi } from '@/shared/api/endpoints'
import { Badge, Button, Card, EmptyState, Input, Modal, Select } from '@/shared/ui'
import { money } from '@/shared/utils/format'

export default function CreditNotesPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [saleId, setSaleId] = useState('')
  const [type, setType] = useState<'partial' | 'total'>('total')
  const [amount, setAmount] = useState(0)
  const [reason, setReason] = useState('')
  const [restock, setRestock] = useState(true)
  const [generateVoucher, setGenerateVoucher] = useState(true)

  const notes = useQuery({ queryKey: ['credit-notes'], queryFn: creditNotesApi.list })
  const sales = useQuery({ queryKey: ['sales'], queryFn: () => salesApi.list() })

  const create = useMutation({
    mutationFn: () =>
      creditNotesApi.create({
        saleId,
        type,
        amount: type === 'partial' ? amount : undefined,
        reason: reason || undefined,
        restock,
        generateVoucher,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credit-notes'] })
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['vouchers'] })
      setOpen(false)
      setSaleId('')
    },
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Notas crédito</h1>
        <Button onClick={() => setOpen(true)}>Nueva nota crédito</Button>
      </div>

      <Card>
        {notes.isLoading ? (
          <EmptyState message="Cargando…" />
        ) : !notes.data?.length ? (
          <EmptyState message="No hay notas crédito" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Número</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium">Monto</th>
                <th className="px-5 py-3 font-medium">Vale</th>
              </tr>
            </thead>
            <tbody>
              {notes.data.map((n) => (
                <tr key={n.id} className="border-b border-gray-100">
                  <td className="px-5 py-3 font-mono text-xs text-gray-700">
                    {n.number}
                  </td>
                  <td className="px-5 py-3">
                    <Badge>{n.type === 'total' ? 'Total' : 'Parcial'}</Badge>
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-700">
                    {money(n.amount)}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {n.voucherId ? 'Sí' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={open} title="Nueva nota crédito" onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <Select
            label="Factura"
            value={saleId}
            onChange={(e) => setSaleId(e.target.value)}
          >
            <option value="">Seleccionar factura…</option>
            {sales.data
              ?.filter((s) => s.status !== 'cancelled')
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.number} · {money(s.total)}
                </option>
              ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Tipo"
              value={type}
              onChange={(e) => setType(e.target.value as 'partial' | 'total')}
            >
              <option value="total">Total</option>
              <option value="partial">Parcial</option>
            </Select>
            {type === 'partial' && (
              <Input
                label="Monto"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            )}
          </div>
          <Input
            label="Motivo"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={restock}
              onChange={(e) => setRestock(e.target.checked)}
            />
            Devolver unidades al inventario (solo total)
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={generateVoucher}
              onChange={(e) => setGenerateVoucher(e.target.checked)}
            />
            Generar vale por el monto
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => create.mutate()}
              disabled={!saleId || create.isPending}
            >
              Registrar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

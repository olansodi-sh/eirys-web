import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { vouchersApi } from '@/shared/api/endpoints'
import { Badge, Button, Card, EmptyState, Input, Modal } from '@/shared/ui'
import { money } from '@/shared/utils/format'

export default function VouchersPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(0)
  const [reason, setReason] = useState('')
  const [redeemFor, setRedeemFor] = useState<string | null>(null)
  const [redeemAmount, setRedeemAmount] = useState(0)

  const vouchers = useQuery({ queryKey: ['vouchers'], queryFn: vouchersApi.list })

  const create = useMutation({
    mutationFn: () => vouchersApi.create({ amount, reason: reason || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vouchers'] })
      setOpen(false)
      setAmount(0)
      setReason('')
    },
  })

  const redeem = useMutation({
    mutationFn: (code: string) => vouchersApi.redeem(code, redeemAmount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vouchers'] })
      setRedeemFor(null)
      setRedeemAmount(0)
    },
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Vales</h1>
        <Button onClick={() => setOpen(true)}>Nuevo vale</Button>
      </div>

      <Card>
        {vouchers.isLoading ? (
          <EmptyState message="Cargando…" />
        ) : !vouchers.data?.length ? (
          <EmptyState message="No hay vales" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-400">
                <th className="px-5 py-3 font-medium">Código</th>
                <th className="px-5 py-3 font-medium">Monto</th>
                <th className="px-5 py-3 font-medium">Saldo</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {vouchers.data.map((v) => (
                <tr key={v.id} className="border-b border-slate-50">
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">
                    {v.code}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{money(v.amount)}</td>
                  <td className="px-5 py-3 font-medium text-slate-700">
                    {money(v.balance)}
                  </td>
                  <td className="px-5 py-3">
                    <Badge>
                      {v.status === 'active'
                        ? 'Activo'
                        : v.status === 'redeemed'
                          ? 'Redimido'
                          : 'Vencido'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {v.status === 'active' && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setRedeemFor(v.code)
                          setRedeemAmount(Number(v.balance))
                        }}
                      >
                        Redimir
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={open} title="Nuevo vale" onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <Input
            label="Monto"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
          <Input
            label="Motivo"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => create.mutate()} disabled={amount <= 0}>
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!redeemFor}
        title={`Redimir vale ${redeemFor ?? ''}`}
        onClose={() => setRedeemFor(null)}
      >
        <div className="space-y-4">
          <Input
            label="Monto a redimir"
            type="number"
            value={redeemAmount}
            onChange={(e) => setRedeemAmount(Number(e.target.value))}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRedeemFor(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => redeemFor && redeem.mutate(redeemFor)}
              disabled={redeemAmount <= 0 || redeem.isPending}
            >
              Redimir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

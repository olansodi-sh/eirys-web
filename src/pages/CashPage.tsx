import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cashApi } from '@/shared/api/endpoints'
import { Badge, Button, Card, Input } from '@/shared/ui'
import { money } from '@/shared/utils/format'
import type { CashMovement } from '@/shared/types'

export default function CashPage() {
  const qc = useQueryClient()
  const [opening, setOpening] = useState(0)
  const [counted, setCounted] = useState(0)
  const [concept, setConcept] = useState('')
  const [amount, setAmount] = useState(0)

  const current = useQuery({ queryKey: ['cash-current'], queryFn: cashApi.current })
  const movements = useQuery({
    queryKey: ['cash-movements', current.data?.id],
    queryFn: () => cashApi.movements(current.data!.id),
    enabled: !!current.data,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['cash-current'] })
    qc.invalidateQueries({ queryKey: ['cash-movements'] })
  }

  const open = useMutation({
    mutationFn: () => cashApi.open(opening),
    onSuccess: invalidate,
  })
  const close = useMutation({
    mutationFn: () => cashApi.close(counted),
    onSuccess: invalidate,
  })
  const addOut = useMutation({
    mutationFn: () => cashApi.movementOut(concept || 'Retiro', amount),
    onSuccess: () => {
      setConcept('')
      setAmount(0)
      invalidate()
    },
  })

  const session = current.data

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Caja</h1>

      {!session ? (
        <Card className="max-w-md p-6">
          <p className="mb-4 text-sm text-gray-500">
            No hay una sesión de caja abierta.
          </p>
          <Input
            label="Fondo inicial"
            type="number"
            value={opening}
            onChange={(e) => setOpening(Number(e.target.value))}
          />
          <Button className="mt-4" onClick={() => open.mutate()}>
            Abrir caja
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Sesión abierta</h2>
              <Badge>Abierta</Badge>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Fondo inicial</dt>
                <dd className="font-medium">{money(session.openingAmount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Apertura</dt>
                <dd>{new Date(session.openedAt).toLocaleString('es-CO')}</dd>
              </div>
            </dl>

            <div className="mt-6 border-t border-gray-100 pt-4">
              <h3 className="mb-2 text-sm font-medium text-gray-700">
                Registrar egreso
              </h3>
              <div className="flex items-end gap-2">
                <Input
                  label="Concepto"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                />
                <Input
                  label="Monto"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
                <Button variant="secondary" onClick={() => addOut.mutate()}>
                  Registrar
                </Button>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-4">
              <h3 className="mb-2 text-sm font-medium text-gray-700">
                Cerrar caja (arqueo)
              </h3>
              <div className="flex items-end gap-2">
                <Input
                  label="Efectivo contado"
                  type="number"
                  value={counted}
                  onChange={(e) => setCounted(Number(e.target.value))}
                />
                <Button variant="danger" onClick={() => close.mutate()}>
                  Cerrar
                </Button>
              </div>
              {close.data && (
                <p className="mt-2 text-sm text-gray-700">
                  Esperado {money(close.data.expectedAmount ?? 0)} · Diferencia{' '}
                  <span
                    className={
                      Number(close.data.difference) === 0
                        ? 'text-success'
                        : 'text-danger'
                    }
                  >
                    {money(close.data.difference ?? 0)}
                  </span>
                </p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-3 font-semibold text-gray-900">Movimientos</h2>
            <ul className="divide-y divide-gray-100 text-sm">
              {(movements.data as CashMovement[] | undefined)?.length ? (
                (movements.data as CashMovement[]).map((m) => (
                  <li key={m.id} className="flex justify-between py-2">
                    <span className="text-gray-700">{m.concept}</span>
                    <span
                      className={
                        m.type === 'in' ? 'text-success' : 'text-danger'
                      }
                    >
                      {m.type === 'in' ? '+' : '−'}
                      {money(m.amount)}
                    </span>
                  </li>
                ))
              ) : (
                <li className="py-6 text-center text-gray-500">
                  Sin movimientos
                </li>
              )}
            </ul>
          </Card>
        </div>
      )}
    </div>
  )
}

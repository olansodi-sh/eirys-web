import { Badge, Button, Modal } from '@/shared/ui'
import { money } from '@/shared/utils/format'
import type { Sale, SaleStatus } from '@/shared/types'

const STATUS_LABEL: Record<SaleStatus, string> = {
  confirmed: 'Pendiente',
  partial: 'Abono',
  paid: 'Pagada',
  cancelled: 'Anulada',
}

export function SaleInvoiceModal({
  sale,
  onClose,
}: {
  sale: Sale | null
  onClose: () => void
}) {
  if (!sale) return null

  const paid = Number(sale.paidAmount)
  const total = Number(sale.total)
  const change = paid > total ? paid - total : 0
  const balance = paid < total ? total - paid : 0

  return (
    <Modal open={!!sale} title="Factura de venta" onClose={onClose} size="xl">
      <div id="invoice-print" className="text-sm text-gray-900">
        <div className="mb-4 flex items-start justify-between border-b border-gray-300 pb-4">
          <div>
            <p className="text-lg font-semibold">EIRYS</p>
            <p className="text-xs text-gray-500">Calzado para dama</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-base font-semibold">{sale.number}</p>
            <p className="text-xs text-gray-500">
              {new Date(sale.date).toLocaleString('es-CO')}
            </p>
            <Badge>{STATUS_LABEL[sale.status]}</Badge>
          </div>
        </div>

        <div className="mb-4">
          <p className="mb-1 text-xs font-medium uppercase text-gray-500">Cliente</p>
          {sale.clientName ? (
            <div>
              <p className="font-medium text-gray-900">{sale.clientName}</p>
              {sale.clientDocNumber && (
                <p className="text-xs text-gray-500">
                  {sale.clientDocType} {sale.clientDocNumber}
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Consumidor final</p>
          )}
        </div>

        <table className="mb-4 w-full text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-left text-gray-500">
              <th className="py-2 font-medium">Producto</th>
              <th className="py-2 text-right font-medium">Cant.</th>
              <th className="py-2 text-right font-medium">Precio unit.</th>
              <th className="py-2 text-right font-medium">Desc.</th>
              <th className="py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.lines.map((l) => (
              <tr key={l.id} className="border-b border-gray-100">
                <td className="py-2">{l.description}</td>
                <td className="py-2 text-right">{Number(l.quantity)}</td>
                <td className="py-2 text-right">{money(l.unitPrice)}</td>
                <td className="py-2 text-right">
                  {Number(l.discount) > 0 ? money(l.discount) : '—'}
                </td>
                <td className="py-2 text-right font-medium">{money(l.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto max-w-xs space-y-1">
          <div className="flex justify-between text-gray-500">
            <span>Total</span>
            <span className="font-semibold text-gray-900">{money(sale.total)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Pagado</span>
            <span>{money(sale.paidAmount)}</span>
          </div>
          {change > 0 && (
            <div className="flex justify-between font-medium text-success">
              <span>Vueltos</span>
              <span>{money(change)}</span>
            </div>
          )}
          {balance > 0 && (
            <div className="flex justify-between font-medium text-warning">
              <span>Saldo pendiente</span>
              <span>{money(balance)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2 print:hidden">
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
        <Button onClick={() => window.print()}>Imprimir</Button>
      </div>
    </Modal>
  )
}

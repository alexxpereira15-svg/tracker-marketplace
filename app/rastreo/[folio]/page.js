'use client';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TrackerCliente() {
  const { folio } = useParams();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function consultarPedido() {
      if (folio) {
        const { data } = await supabase
          .from('pedidos')
          .select('*, productos(nombre)')
          .eq('folio', parseInt(folio))
          .single();
        setPedido(data);
        setLoading(false);
      }
    }
    consultarPedido();
  }, [folio]);

  if (loading) return <div className="p-8 text-center text-slate-500">Buscando tu pedido...</div>;
  if (!pedido) return <div className="p-8 text-center text-rose-600 font-bold">No encontramos ningún pedido con el folio #{folio}</div>;

  const total = pedido.cantidad * pedido.precio_venta_capturado;
  const saldoPendiente = total - pedido.monto_pagado;

  // Estados visuales de la barra de progreso
  const estados = ['Realizado', 'En camino', 'Listo para entregar', 'Entregado'];
  const indiceActual = estados.indexOf(pedido.estatus);

  return (
    <div className="min-h-screen bg-slate-100 p-4 flex items-center justify-center font-sans">
      <div className="bg-white p-6 rounded-2xl shadow-md border w-full max-w-md">
        <div className="text-center mb-6">
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase">Rastreo Digital</span>
          <h1 className="text-xl font-bold mt-2 text-slate-900">Hola, {pedido.nombre_cliente} 👋</h1>
          <p className="text-sm text-slate-400">Aquí puedes ver el avance de tu compra en tiempo real.</p>
        </div>

        {/* 📊 BARRA DE PROGRESO DE ESTATUS */}
        <div className="mb-8 relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6">
          {estados.map((est, i) => {
            const completado = i <= indiceActual;
            return (
              <div key={est} className="relative">
                <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 bg-white transition-colors ${completado ? 'bg-blue-600 border-blue-600 shadow' : 'border-slate-300'}`} />
                <p className={`text-sm font-semibold ${completado ? 'text-slate-900' : 'text-slate-400'}`}>{est}</p>
                {pedido.estatus === est && <p className="text-xs text-blue-600 font-medium">¡Tu pedido se encuentra aquí actualmente!</p>}
              </div>
            );
          })}
        </div>

        {/* 📝 NOTA DE VENTA DIGITAL */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
          <h3 className="font-bold text-slate-900 border-b pb-2 mb-2">Resumen de tu Nota (Folio #{pedido.folio})</h3>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">{pedido.productos?.nombre} x{pedido.cantidad}</span>
            <span className="font-semibold text-slate-800">${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 text-emerald-600">
            <span>Monto Abonado:</span>
            <span>-${pedido.monto_pagado.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 mt-2 text-base font-bold text-slate-900">
            <span>Saldo a Liquidar al Entregar:</span>
            <span className={saldoPendiente > 0 ? "text-amber-600" : "text-emerald-600"}>
              ${saldoPendiente.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
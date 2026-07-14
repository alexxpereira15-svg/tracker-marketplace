'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPanel() {
  // Estados para el Catálogo Maestro
  const [productos, setProductos] = useState([]);
  const [nuevoProd, setNuevoProd] = useState({ codigo: '', nombre: '', costo: '', precio: '' });

  // Estados para el Formulario de Pedidos
  const [pedidos, setPedidos] = useState([]);
  const [nuevoPedido, setNuevoPedido] = useState({
    cliente: '', whatsapp: '', productoId: '', cantidad: 1,
    precioAuto: 0, costoAuto: 0, pagado: 0, estatus: 'Realizado'
  });

  // Métricas del Dashboard
  const [metricas, setMetricas] = useState({ ingresos: 0, costos: 0, ganancias: 0, porCobrar: 0 });

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    // 1. Cargar Productos
    const { data: prods } = await supabase.from('productos').select('*');
    setProductos(prods || []);

    // 2. Cargar Pedidos
    const { data: peds } = await supabase.from('pedidos').select('*, productos(nombre)');
    setPedidos(peds || []);

    // 3. Calcular Métricas en tiempo real
    if (peds) {
      let ingresos = 0, costos = 0, porCobrar = 0;
      peds.forEach(p => {
        const totalPedido = p.cantidad * p.precio_venta_capturado;
        ingresos += totalPedido;
        costos += (p.cantidad * p.costo_capturado);
        porCobrar += (totalPedido - p.monto_pagado);
      });
      setMetricas({ ingresos, costos, ganancias: ingresos - costos, porCobrar });
    }
  }

  // Al seleccionar un producto, auto-completa precio y costo
  const handleSeleccionarProducto = (id) => {
    const prod = productos.find(p => p.id === id);
    if (prod) {
      setNuevoPedido({
        ...nuevoPedido,
        productoId: id,
        precioAuto: prod.precio_venta,
        costoAuto: prod.costo_proveedor
      });
    }
  };

  // Guardar Producto en el Maestro
  async function crearProducto(e) {
    e.preventDefault();
    await supabase.from('productos').insert([{
      codigo: nuevoProd.codigo, nombre: nuevoProd.nombre,
      precio_venta: parseFloat(nuevoProd.precio), costo_proveedor: parseFloat(nuevoProd.costo)
    }]);
    setNuevoProd({ codigo: '', nombre: '', costo: '', precio: '' });
    cargarDatos();
  }

  // Guardar Pedido Nuevo
  async function crearPedido(e) {
    e.preventDefault();
    await supabase.from('pedidos').insert([{
      nombre_cliente: nuevoPedido.cliente,
      whatsapp: nuevoPedido.whatsapp,
      producto_id: nuevoPedido.productoId,
      cantidad: parseInt(nuevoPedido.cantidad),
      precio_venta_capturado: nuevoPedido.precioAuto,
      costo_capturado: nuevoPedido.costoAuto,
      monto_pagado: parseFloat(nuevoPedido.pagado),
      estatus: nuevoPedido.estatus
    }]);
    setNuevoPedido({ cliente: '', whatsapp: '', productoId: '', cantidad: 1, precioAuto: 0, costoAuto: 0, pagado: 0, estatus: 'Realizado' });
    cargarDatos();
  }

  // Actualizar Estatus desde la Tabla
  async function cambiarEstatus(id, nuevoEstatus) {
    await supabase.from('pedidos').update({ estatus: nuevoEstatus }).eq('id', id);
    cargarDatos();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Control de Ventas Marketplace 🚀</h1>
        <p className="text-sm text-slate-500">Gestión de productos, pedidos y rastreo de clientes.</p>
      </header>

      {/* 📊 DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-semibold text-slate-400 uppercase">Ingresos Totales</p>
          <p className="text-2xl font-bold text-emerald-600">${metricas.ingresos.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-semibold text-slate-400 uppercase">Costos Totales</p>
          <p className="text-2xl font-bold text-rose-600">${metricas.costos.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-semibold text-slate-400 uppercase">Ganancia Neta</p>
          <p className="text-2xl font-bold text-blue-600">${metricas.ganancias.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-semibold text-slate-400 uppercase">Por Cobrar (Pendiente)</p>
          <p className="text-2xl font-bold text-amber-600">${metricas.porCobrar.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* 🛒 FORMULARIO LEVANTAR PEDIDO */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <h2 className="text-lg font-bold mb-4 text-slate-900">Levantar Nuevo Pedido</h2>
          <form onSubmit={crearPedido} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Nombre del Cliente" className="p-2 border rounded" value={nuevoPedido.cliente} onChange={e => setNuevoPedido({...nuevoPedido, cliente: e.target.value})} required />
            <input type="text" placeholder="WhatsApp (Ej: 5512345678)" className="p-2 border rounded" value={nuevoPedido.whatsapp} onChange={e => setNuevoPedido({...nuevoPedido, whatsapp: e.target.value})} />
            
            <select className="p-2 border rounded" value={nuevoPedido.productoId} onChange={e => handleSeleccionarProducto(e.target.value)} required>
              <option value="">-- Selecciona Producto del Maestro --</option>
              {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.codigo})</option>)}
            </select>

            <div className="flex gap-2">
              <input type="number" placeholder="Cant." className="p-2 border rounded w-20" value={nuevoPedido.cantidad} onChange={e => setNuevoPedido({...nuevoPedido, cantidad: e.target.value})} min="1" required />
              <div className="bg-slate-100 p-2 rounded flex-1 text-sm flex items-center justify-between">
                <span>Precio unitario sugerido:</span>
                <span className="font-bold text-slate-700">${nuevoPedido.precioAuto}</span>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded md:col-span-2 flex justify-between items-center text-sm">
              <span className="font-semibold text-blue-900">Total a pagar estimado: ${nuevoPedido.precioAuto * nuevoPedido.cantidad}</span>
              <div className="flex items-center gap-2">
                <span>Monto pagado hoy: $</span>
                <input type="number" className="p-1 border rounded w-24 bg-white" value={nuevoPedido.pagado} onChange={e => setNuevoPedido({...nuevoPedido, pagado: e.target.value})} min="0" step="0.01" />
              </div>
            </div>

            <button type="submit" className="md:col-span-2 bg-slate-900 text-white p-2 rounded font-semibold hover:bg-slate-800 transition">Guardar Pedido y Generar Folio</button>
          </form>
        </div>

        {/* 📦 FORMULARIO CATÁLOGO MAESTRO */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold mb-4 text-slate-900">Agregar al Catálogo Maestro</h2>
          <form onSubmit={crearProducto} className="flex flex-col gap-3">
            <input type="text" placeholder="Código (Ej: AUD-01)" className="p-2 border rounded" value={nuevoProd.codigo} onChange={e => setNuevoProd({...nuevoProd, codigo: e.target.value})} required   />
            <input type="text" placeholder="Nombre del Producto" className="p-2 border rounded" value={nuevoProd.nombre} onChange={e => setNuevoProd({...nuevoProd, nombre: e.target.value})} required />
            <input type="number" placeholder="Costo Proveedor ($)" className="p-2 border rounded" value={nuevoProd.costo} onChange={e => setNuevoProd({...nuevoProd, costo: e.target.value})} min="0" step="0.01" required />
            <input type="number" placeholder="Precio de Venta ($)" className="p-2 border rounded" value={nuevoProd.precio} onChange={e => setNuevoProd({...nuevoProd, precio: e.target.value})} min="0" step="0.01" required />
            <button type="submit" className="bg-emerald-600 text-white p-2 rounded font-semibold hover:bg-emerald-700 transition">Guardar en Inventario</button>
          </form>
        </div>
      </div>

      {/* 📋 TABLA GENERAL DE PEDIDOS */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <h2 className="text-lg font-bold mb-4 text-slate-900">Listado General de Pedidos</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b text-slate-400 text-sm">
              <th className="py-2">Folio</th>
              <th>Cliente</th>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Total</th>
              <th>Abonado</th>
              <th>Debe</th>
              <th>Estatus</th>
              <th>Link de Rastreo</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map(p => {
              const total = p.cantidad * p.precio_venta_capturado;
              const debe = total - p.monto_pagado;
              return (
                <tr key={p.id} className="border-b text-sm text-slate-700 hover:bg-slate-50">
                  <td className="py-3 font-bold">#{p.folio}</td>
                  <td>{p.nombre_cliente}</td>
                  <td>{p.productos?.nombre || 'Producto Eliminado'}</td>
                  <td>{p.cantidad}</td>
                  <td>${total.toFixed(2)}</td>
                  <td className="text-emerald-600">${p.monto_pagado.toFixed(2)}</td>
                  <td className={debe > 0 ? "text-amber-600 font-semibold" : "text-slate-400"}>${debe.toFixed(2)}</td>
                  <td>
                    <select className="p-1 border rounded text-xs font-semibold bg-white" value={p.estatus} onChange={e => cambiarEstatus(p.id, e.target.value)}>
                      <option value="Realizado">Realizado</option>
                      <option value="En camino">En camino</option>
                      <option value="Listo para entregar">Listo para entregar</option>
                      <option value="Entregado">Entregado</option>
                    </select>
                  </td>
                  <td>
                    <button type="button" onClick={() => {
                      const url = `${window.location.origin}/rastreo/${p.folio}`;
                      navigator.clipboard.writeText(url);
                      alert('¡Link copiado para enviarle al cliente!');
                    }} className="text-xs bg-slate-100 text-slate-600 p-1 px-2 rounded border hover:bg-slate-200">
                      📋 Copiar Link
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

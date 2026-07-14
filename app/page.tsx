'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Inicialización de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Definición de estructuras de datos para TypeScript
interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  precio_venta: number;
  costo_proveedor: number;
  enlace_compra?: string;
  creado_el?: string;
}

interface Pedido {
  id: number;
  nombre_cliente: string;
  whatsapp: string;
  producto_id: number;
  cantidad: number;
  precio_venta_capturado: number;
  costo_capturado: number;
  monto_pagado: number;
  estatus: string;
  creado_el?: string;
}

export default function AdminDashboard() {
  // Navegación lateral: 'dashboard' | 'pedidos' | 'productos'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pedidos' | 'productos'>('dashboard');

  // Estados de datos
  const [productos, setProductos] = useState<Producto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  // Estados de formularios (Productos)
  const [prodCodigo, setProdCodigo] = useState('');
  const [prodNombre, setProdNombre] = useState('');
  const [prodCosto, setProdCosto] = useState('');
  const [prodPrecio, setProdPrecio] = useState('');
  const [prodEnlace, setProdEnlace] = useState('');

  // Estados de formularios (Pedidos)
  const [selectedProdId, setSelectedProdId] = useState('');
  const [pedCliente, setPedCliente] = useState('');
  const [pedWhatsapp, setPedWhatsapp] = useState('');
  const [pedCantidad, setPedCantidad] = useState('1');
  const [pedPrecioCapturado, setPedPrecioCapturado] = useState('');
  const [pedCostoCapturado, setPedCostoCapturado] = useState('');
  const [pedMontoPagado, setPedMontoPagado] = useState('');
  const [pedEstatus, setPedEstatus] = useState('Realizado');

  // Cargar datos al iniciar
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: prodData } = await supabase.from('productos').select('*').order('nombre', { ascending: true });
      const { data: pedData } = await supabase.from('pedidos').select('*').order('id', { ascending: false });
      
      if (prodData) setProductos(prodData as Producto[]);
      if (pedData) setPedidos(pedData as Pedido[]);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  // Al seleccionar un producto en pedido, autocompletar precio y costo
  useEffect(() => {
    if (selectedProdId) {
      const prod = productos.find(p => p.id.toString() === selectedProdId);
      if (prod) {
        setPedPrecioCapturado(prod.precio_venta.toString());
        setPedCostoCapturado(prod.costo_proveedor.toString());
      }
    } else {
      setPedPrecioCapturado('');
      setPedCostoCapturado('');
    }
  }, [selectedProdId, productos]);

  // Guardar Producto en Catálogo Maestro
  const handleGuardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodCodigo || !prodNombre || !prodPrecio || !prodCosto) {
      alert('Por favor llena los campos obligatorios del producto.');
      return;
    }

    try {
      const { error } = await supabase.from('productos').insert([
        {
          codigo: prodCodigo,
          nombre: prodNombre,
          precio_venta: parseFloat(prodPrecio),
          costo_proveedor: parseFloat(prodCosto),
          enlace_compra: prodEnlace
        }
      ]);

      if (error) throw error;

      alert('¡Producto guardado exitosamente!');
      setProdCodigo('');
      setProdNombre('');
      setProdCosto('');
      setProdPrecio('');
      setProdEnlace('');
      fetchData();
    } catch (error: any) {
      alert('Error al guardar producto: ' + error.message);
    }
  };

  // Guardar Pedido
  const handleGuardarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProdId || !pedCliente || !pedCantidad || !pedPrecioCapturado) {
      alert('Por favor llena los campos obligatorios del pedido.');
      return;
    }

    try {
      const { error } = await supabase.from('pedidos').insert([
        {
          nombre_cliente: pedCliente,
          whatsapp: pedWhatsapp,
          producto_id: parseInt(selectedProdId),
          cantidad: parseInt(pedCantidad),
          precio_venta_capturado: parseFloat(pedPrecioCapturado),
          costo_capturado: parseFloat(pedCostoCapturado) || 0,
          monto_pagado: parseFloat(pedMontoPagado) || 0,
          estatus: pedEstatus
        }
      ]);

      if (error) throw error;

      alert('¡Pedido guardado y registrado con éxito!');
      setPedCliente('');
      setPedWhatsapp('');
      setSelectedProdId('');
      setPedCantidad('1');
      setPedMontoPagado('');
      setPedEstatus('Realizado');
      fetchData();
    } catch (error: any) {
      alert('Error al guardar pedido: ' + error.message);
    }
  };

  // Actualizar Estatus de Pedido
  const handleCambiarEstatus = async (pedidoId: number, nuevoEstatus: string) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ estatus: nuevoEstatus })
        .eq('id', pedidoId);

      if (error) throw error;
      fetchData();
    } catch (error: any) {
      alert('Error al actualizar estatus: ' + error.message);
    }
  };

  // Eliminar Pedido
  const handleEliminarPedido = async (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este pedido permanentemente?')) {
      try {
        const { error } = await supabase.from('pedidos').delete().eq('id', id);
        if (error) throw error;
        fetchData();
      } catch (error: any) {
        alert('Error al eliminar: ' + error.message);
      }
    }
  };

  // Eliminar Producto
  const handleEliminarProducto = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este producto del catálogo maestro?')) {
      try {
        const { error } = await supabase.from('productos').delete().eq('id', id);
        if (error) throw error;
        fetchData();
      } catch (error: any) {
        alert('Error al eliminar producto: ' + error.message);
      }
    }
  };

  // Copiar link de cliente
  const copiarLinkCliente = (id: number) => {
    const urlCliente = `${window.location.origin}/pedido/${id}`;
    navigator.clipboard.writeText(urlCliente);
    alert('¡Enlace de rastreo copiado al portapapeles!');
  };

  // Cálculos del Dashboard (Dinámicos)
  const totalPedidosCount = pedidos.length;
  const ingresosTotales = pedidos.reduce((acc, p) => acc + (p.precio_venta_capturado * p.cantidad), 0);
  const costosTotales = pedidos.reduce((acc, p) => acc + (p.costo_capturado * p.cantidad), 0);
  const gananciasNetas = ingresosTotales - costosTotales;
  const dineroPorCobrar = pedidos.reduce((acc, p) => {
    const totalPedido = p.precio_venta_capturado * p.cantidad;
    const saldoPendiente = totalPedido - p.monto_pagado;
    return acc + (saldoPendiente > 0 ? saldoPendiente : 0);
  }, 0);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* --- BARRA LATERAL IZQUIERDA (SIDEBAR) --- */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col justify-between shadow-xl">
        <div>
          {/* Logo / Título */}
          <div className="p-6 border-b border-slate-800">
            <h1 className="text-xl font-bold tracking-wider text-teal-400 flex items-center gap-2">
              <span>🛍️</span> Cashflow Control
            </h1>
            <p className="text-xs text-slate-400 mt-1">Marketplace Manager</p>
          </div>

          {/* Menú de Navegación */}
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'dashboard' ? 'bg-teal-500 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              📊 Dashboard General
            </button>
            <button
              onClick={() => setActiveTab('pedidos')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'pedidos' ? 'bg-teal-500 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              📦 Ventas y Pedidos
            </button>
            <button
              onClick={() => setActiveTab('productos')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'productos' ? 'bg-teal-500 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              🏷️ Catálogo Maestro
            </button>
          </nav>
        </div>

        {/* Info de pie de página */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          v2.0 • Conectado a Supabase
        </div>
      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <h2 className="text-2xl font-bold capitalize text-slate-800">
            {activeTab === 'dashboard' && 'Dashboard de Desempeño'}
            {activeTab === 'pedidos' && 'Panel de Control de Ventas'}
            {activeTab === 'productos' && 'Administración de Catálogo'}
          </h2>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            Sistema Sincronizado
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          
          {/* ================= TAB 1: DASHBOARD ================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Tarjetas de Métricas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ventas Totales</p>
                  <p className="text-3xl font-extrabold text-slate-900 mt-2">${ingresosTotales.toLocaleString()}</p>
                  <p className="text-xs text-teal-600 mt-1">Bruto acumulado</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Costo Proveedor</p>
                  <p className="text-3xl font-extrabold text-red-600 mt-2">${costosTotales.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-1">Inversión total</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ganancia Neta 💰</p>
                  <p className="text-3xl font-extrabold text-green-600 mt-2">${gananciasNetas.toLocaleString()}</p>
                  <p className="text-xs text-green-600 mt-1">Dinero real libre</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dinero en la Calle 💸</p>
                  <p className="text-3xl font-extrabold text-amber-600 mt-2">${dineroPorCobrar.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-1">Saldos por liquidar</p>
                </div>
              </div>

              {/* Resumen y Acciones Rápidas */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-8 rounded-2xl text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h3 className="text-xl font-bold">¡Lleva el control de tus ventas mensuales!</h3>
                  <p className="text-slate-300 text-sm mt-1 max-w-xl">
                    Agrega tus productos en el Catálogo para que el sistema calcule de forma exacta tus costos de proveedor y tus ganancias reales al levantar cada orden de Marketplace.
                  </p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setActiveTab('pedidos')} 
                    className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-colors shadow-md"
                  >
                    + Registrar Pedido
                  </button>
                  <button 
                    onClick={() => setActiveTab('productos')} 
                    className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-colors border border-slate-700"
                  >
                    Gestionar Productos
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: PEDIDOS ================= */}
          {activeTab === 'pedidos' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Formulario de Pedidos */}
              <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 h-fit lg:sticky lg:top-24">
                <h3 className="text-lg font-bold text-slate-900 mb-6 border-b pb-2 flex items-center gap-2">
                  <span>📝</span> Levantar Nuevo Pedido
                </h3>
                <form onSubmit={handleGuardarPedido} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Producto Maestro *</label>
                    <select
                      value={selectedProdId}
                      onChange={(e) => setSelectedProdId(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-sm focus:ring-2 focus:ring-teal-400 focus:bg-white outline-none"
                      required
                    >
                      <option value="">-- Selecciona del catálogo --</option>
                      {productos.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre} ({p.codigo})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Precio Venta ($)</label>
                      <input
                        type="number"
                        value={pedPrecioCapturado}
                        onChange={(e) => setPedPrecioCapturado(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-100 text-sm outline-none"
                        placeholder="0.00"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Costo ($)</label>
                      <input
                        type="number"
                        value={pedCostoCapturado}
                        onChange={(e) => setPedCostoCapturado(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-100 text-sm outline-none"
                        placeholder="0.00"
                        readOnly
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Nombre del Cliente *</label>
                    <input
                      type="text"
                      value={pedCliente}
                      onChange={(e) => setPedCliente(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-sm focus:ring-2 focus:ring-teal-400 focus:bg-white outline-none"
                      placeholder="Ej. Carlos Mendoza"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Cantidad *</label>
                      <input
                        type="number"
                        value={pedCantidad}
                        onChange={(e) => setPedCantidad(e.target.value)}
                        min="1"
                        className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-sm focus:ring-2 focus:ring-teal-400 focus:bg-white outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Monto Pagado (Anticipo)</label>
                      <input
                        type="number"
                        value={pedMontoPagado}
                        onChange={(e) => setPedMontoPagado(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-sm focus:ring-2 focus:ring-teal-400 focus:bg-white outline-none"
                        placeholder="Ej. 200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">WhatsApp de Cliente (Opcional)</label>
                    <input
                      type="text"
                      value={pedWhatsapp}
                      onChange={(e) => setPedWhatsapp(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-sm focus:ring-2 focus:ring-teal-400 focus:bg-white outline-none"
                      placeholder="Ej. 9993204050"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors text-sm mt-4"
                  >
                    💾 Guardar Pedido y Generar Folio
                  </button>
                </form>
              </div>

              {/* Listado General de Pedidos */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-md border border-slate-100 overflow-hidden">
                <h3 className="text-lg font-bold text-slate-900 mb-6 border-b pb-2 flex items-center justify-between">
                  <span>📋 Listado General de Pedidos</span>
                  <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded font-normal">{totalPedidosCount} pedidos</span>
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                        <th className="py-3 px-4">Folio</th>
                        <th className="py-3 px-4">Cliente</th>
                        <th className="py-3 px-4">Producto</th>
                        <th className="py-3 px-4">Saldo</th>
                        <th className="py-3 px-4">Estatus</th>
                        <th className="py-3 px-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pedidos.map((p) => {
                        const total = p.precio_venta_capturado * p.cantidad;
                        const saldo = total - p.monto_pagado;
                        const prodAsociado = productos.find(pr => pr.id === p.producto_id);

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-4 font-bold text-teal-600">#{p.id}</td>
                            <td className="py-4 px-4">
                              <p className="font-semibold text-slate-800">{p.nombre_cliente}</p>
                              <p className="text-xs text-slate-400">{p.whatsapp || 'Sin teléfono'}</p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="font-medium text-slate-700">{prodAsociado ? prodAsociado.nombre : 'Cargando...'}</p>
                              <p className="text-xs text-slate-400">Cant: {p.cantidad} • ${p.precio_venta_capturado}</p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="font-semibold text-slate-900">${total}</p>
                              <p className={`text-xs font-bold ${saldo <= 0 ? 'text-green-600' : 'text-amber-600'}`}>
                                {saldo <= 0 ? 'Liquidado' : `Resta: $${saldo}`}
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              <select
                                value={p.estatus}
                                onChange={(e) => handleCambiarEstatus(p.id, e.target.value)}
                                className={`text-xs font-bold border rounded-md p-1 outline-none ${
                                  p.estatus === 'Entregado' ? 'bg-green-100 text-green-800 border-green-200' :
                                  p.estatus === 'En camino' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                  'bg-amber-100 text-amber-800 border-amber-200'
                                }`}
                              >
                                <option value="Realizado">Realizado</option>
                                <option value="En camino">En camino</option>
                                <option value="Listo para entregar">Listo para entregar</option>
                                <option value="Entregado">Entregado</option>
                              </select>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => copiarLinkCliente(p.id)}
                                  className="bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-600 p-1.5 rounded-lg border border-slate-200 text-xs flex items-center gap-1 font-medium transition-colors"
                                  title="Copiar link para cliente"
                                >
                                  🔗 Copiar Link
                                </button>
                                <button
                                  onClick={() => handleEliminarPedido(p.id)}
                                  className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-red-200"
                                  title="Eliminar Pedido"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {pedidos.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-400">
                            Aún no has registrado ningún pedido.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: CATALOGO DE PRODUCTOS ================= */}
          {activeTab === 'productos' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Formulario de Productos */}
              <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 h-fit">
                <h3 className="text-lg font-bold text-slate-900 mb-6 border-b pb-2 flex items-center gap-2">
                  <span>🛍️</span> Agregar al Catálogo Maestro
                </h3>
                <form onSubmit={handleGuardarProducto} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Código único *</label>
                      <input
                        type="text"
                        value={prodCodigo}
                        onChange={(e) => setProdCodigo(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-sm focus:ring-2 focus:ring-teal-400 focus:bg-white outline-none"
                        placeholder="Ej. AUD-01"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Nombre Producto *</label>
                      <input
                        type="text"
                        value={prodNombre}
                        onChange={(e) => setProdNombre(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-sm focus:ring-2 focus:ring-teal-400 focus:bg-white outline-none"
                        placeholder="Ej. Audífonos Pro"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Costo Proveedor ($) *</label>
                      <input
                        type="number"
                        value={prodCosto}
                        onChange={(e) => setProdCosto(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-sm focus:ring-2 focus:ring-teal-400 focus:bg-white outline-none"
                        placeholder="Ej. 150"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Precio Venta ($) *</label>
                      <input
                        type="number"
                        value={prodPrecio}
                        onChange={(e) => setProdPrecio(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-sm focus:ring-2 focus:ring-teal-400 focus:bg-white outline-none"
                        placeholder="Ej. 350"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">🔗 Enlace de Compra (Link de proveedor)</label>
                    <input
                      type="url"
                      value={prodEnlace}
                      onChange={(e) => setProdEnlace(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-sm focus:ring-2 focus:ring-teal-400 focus:bg-white outline-none"
                      placeholder="https://mercadolibre.com/ejemplo..."
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">Guarda aquí el link para comprarlo directamente de tu proveedor</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors text-sm mt-4"
                  >
                    💾 Registrar en Catálogo
                  </button>
                </form>
              </div>

              {/* Tabla de Catálogo de Productos */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-md border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-6 border-b pb-2 flex items-center justify-between">
                  <span>📦 Catálogo de Productos Registrados</span>
                  <span className="text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded font-normal">{productos.length} productos</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                        <th className="py-3 px-4">Código</th>
                        <th className="py-3 px-4">Producto</th>
                        <th className="py-3 px-4">Costo / Venta</th>
                        <th className="py-3 px-4">Margen Ganancia</th>
                        <th className="py-3 px-4 text-center">Proveedor</th>
                        <th className="py-3 px-4 text-center">Eliminar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {productos.map((prod) => {
                        const margen = prod.precio_venta - prod.costo_proveedor;
                        const pctMargen = ((margen / prod.precio_venta) * 100).toFixed(0);

                        return (
                          <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-4 font-mono font-bold text-slate-500">{prod.codigo}</td>
                            <td className="py-4 px-4 font-semibold text-slate-800">{prod.nombre}</td>
                            <td className="py-4 px-4">
                              <p className="text-slate-500">Costo: <span className="font-medium text-slate-700">${prod.costo_proveedor}</span></p>
                              <p className="text-slate-800 font-bold">Venta: ${prod.precio_venta}</p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-green-600 font-bold">+${margen}</p>
                              <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-bold">
                                {pctMargen}% util
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              {prod.enlace_compra ? (
                                <a
                                  href={prod.enlace_compra}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                                >
                                  🛒 Comprar
                                </a>
                              ) : (
                                <span className="text-xs text-slate-400 italic">No asignado</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <button
                                onClick={() => handleEliminarProducto(prod.id)}
                                className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors border border-transparent hover:border-red-200"
                                title="Eliminar Producto"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {productos.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-400">
                            El catálogo de productos está vacío.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

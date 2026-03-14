import { useAuth, PRODUCTION_STATUSES, PRODUCTION_STATUSES_USER } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Filter, FileText, Download, Printer, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';

const formatDateBR = (date: string, time?: string) => {
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}${time ? ` — ${time}` : ''}`;
};

const ReportsPage = () => {
  const { isLoggedIn, isAdmin, orders, allOrders, user } = useAuth();
  const navigate = useNavigate();
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVendedor, setFilterVendedor] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const displayOrders = isAdmin && filterVendedor
    ? allOrders.filter(o => o.vendedor === filterVendedor)
    : orders;

  const filteredOrders = useMemo(() => {
    return displayOrders.filter(o => {
      if (searchQuery && !o.numero.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterDate && o.dataCriacao < filterDate) return false;
      if (filterStatus && o.status !== filterStatus) return false;
      return true;
    });
  }, [displayOrders, filterDate, filterStatus, searchQuery]);

  const totalValue = filteredOrders.reduce((s, o) => s + o.preco * o.quantidade, 0);
  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const statuses = isAdmin ? PRODUCTION_STATUSES : PRODUCTION_STATUSES_USER;
  const allStatuses = [...new Set(displayOrders.map(o => o.status))].sort((a, b) => statuses.indexOf(a) - statuses.indexOf(b));
  const allVendedores = isAdmin ? [...new Set(allOrders.map(o => o.vendedor))].sort() : [];

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const ordersToExport = selectedIds.size > 0
    ? filteredOrders.filter(o => selectedIds.has(o.id))
    : filteredOrders;

  const generateReportPDF = () => {
    const doc = new jsPDF();
    const list = ordersToExport;
    doc.setFontSize(18);
    doc.text('Relatório de Pedidos — 7ESTRIVOS', 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

    let y = 38;
    list.forEach((o, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}. ${o.numero}`, 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`Vendedor: ${o.vendedor} | Data: ${formatDateBR(o.dataCriacao, o.horaCriacao)} | Status: ${o.status}`, 14, y + 5);
      doc.text(`Valor: ${formatCurrency(o.preco * o.quantidade)} | Qtd: ${o.quantidade}`, 14, y + 10);
      y += 18;
    });

    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total de Pedidos: ${list.length}`, 14, y + 5);
    doc.text(`Valor Total: ${formatCurrency(list.reduce((s, o) => s + o.preco * o.quantidade, 0))}`, 14, y + 12);

    doc.save('relatorio-pedidos.pdf');
  };

  const generateProductionSheetPDF = () => {
    const list = ordersToExport;
    const doc = new jsPDF({ format: 'a5' });
    const pw = doc.internal.pageSize.getWidth();

    list.forEach((order, idx) => {
      if (idx > 0) doc.addPage();

      // Header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('7ESTRIVOS', 10, 12);
      doc.setFontSize(9);
      doc.text(`Código: ${order.numero}`, 10, 20);
      doc.text(`Vendedor: ${order.vendedor}`, 10, 25);
      doc.text(`Data: ${formatDateBR(order.dataCriacao, order.horaCriacao)}`, pw - 10, 20, { align: 'right' });

      // Details
      let y = 35;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const details = [
        ['Modelo', order.modelo], ['Tamanho', order.tamanho],
        ['Solado', order.solado], ['Bico', order.formatoBico],
        ['Vira', order.corVira], ['C. Gáspea', order.couroGaspea],
        ['C. Cano', order.couroCano], ['C. Taloneira', order.couroTaloneira],
        ['B. Cano', order.bordadoCano], ['B. Gáspea', order.bordadoGaspea],
        ['B. Taloneira', order.bordadoTaloneira], ['Personalização', order.personalizacaoNome],
        ['Cor Linha', order.corLinha], ['Borrachinha', order.corBorrachinha],
        ['Trisce', order.trisce], ['Tiras', order.tiras],
        ['Metais', order.metais], ['Acessórios', order.acessorios],
      ].filter(([, v]) => v);

      details.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, 10, y);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 45, y);
        y += 5;
      });

      if (order.observacao) {
        y += 3;
        doc.setFont('helvetica', 'bold');
        doc.text('Observação:', 10, y);
        doc.setFont('helvetica', 'normal');
        doc.text(order.observacao, 10, y + 5, { maxWidth: pw - 20 });
        y += 12;
      }

      // Stubs (canhotos) at bottom
      const stubY = doc.internal.pageSize.getHeight() - 35;
      doc.setDrawColor(150);
      doc.setLineDash([2, 2]);
      doc.line(5, stubY - 3, pw - 5, stubY - 3);
      doc.setLineDash([]);

      const stubs = ['CORTE', 'BORDADO OU LASER', 'PESPONTO', 'EXPEDIÇÃO'];
      const stubW = (pw - 10) / 4;
      stubs.forEach((stub, i) => {
        const x = 5 + i * stubW;
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(stub, x + 2, stubY + 2);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.text(`PEDIDO: ${order.numero}`, x + 2, stubY + 7);
        doc.text(`VENDEDOR: ${order.vendedor}`, x + 2, stubY + 11);
        doc.text(`DATA: ${formatDateBR(order.dataCriacao, order.horaCriacao)}`, x + 2, stubY + 15);
        if (i < 3) {
          doc.setDrawColor(180);
          doc.line(x + stubW, stubY - 3, x + stubW, stubY + 30);
        }
      });
    });

    doc.save('fichas-producao.pdf');
  };

  const [showReportOptions, setShowReportOptions] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-display font-bold mb-2">Faça login para ver relatórios</h2>
          <button onClick={() => navigate('/login')} className="orange-gradient text-primary-foreground px-6 py-2 rounded-lg font-bold">LOGIN</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold mb-6">MEUS PEDIDOS</h1>

        {/* Filters */}
        <div className="bg-card rounded-xl p-4 western-shadow mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-primary" />
            <span className="text-sm font-bold">Filtros</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div>
              <label className="block text-xs font-semibold mb-1">Buscar por Nº do Pedido</label>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Ex: 7E-2024..." className="bg-muted rounded-lg px-3 py-2 text-sm border border-border focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Data de Criação (a partir de)</label>
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="bg-muted rounded-lg px-3 py-2 text-sm border border-border focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-muted rounded-lg px-3 py-2 text-sm border border-border focus:border-primary outline-none">
                <option value="">Todos</option>
                {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {isAdmin && (
              <div>
                <label className="block text-xs font-semibold mb-1">Vendedor</label>
                <select value={filterVendedor} onChange={e => setFilterVendedor(e.target.value)} className="bg-muted rounded-lg px-3 py-2 text-sm border border-border focus:border-primary outline-none">
                  <option value="">Todos</option>
                  {allVendedores.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-xl p-4 western-shadow">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Total de Pedidos</p>
            <p className="text-2xl font-bold">{filteredOrders.length}</p>
          </div>
          <div className="bg-card rounded-xl p-4 western-shadow">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Valor Total</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalValue)}</p>
          </div>
          <div className="bg-card rounded-xl p-4 western-shadow flex items-center justify-center">
            {isAdmin ? (
              <div className="relative">
                <button onClick={() => setShowReportOptions(!showReportOptions)} className="orange-gradient text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
                  <FileText size={16} /> GERAR RELATÓRIO
                </button>
                {showReportOptions && (
                  <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-lg western-shadow p-2 z-20 min-w-[200px]">
                    <button onClick={() => { generateReportPDF(); setShowReportOptions(false); }} className="w-full text-left px-3 py-2 text-sm font-semibold hover:bg-muted rounded-md flex items-center gap-2">
                      <Download size={14} /> Relatório por Filtros
                    </button>
                    <button onClick={() => { navigate('/relatorio-pecas'); setShowReportOptions(false); }} className="w-full text-left px-3 py-2 text-sm font-semibold hover:bg-muted rounded-md flex items-center gap-2">
                      <FileText size={14} /> Relatório por Peças
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={generateReportPDF} className="orange-gradient text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
                <FileText size={16} /> GERAR RELATÓRIO
              </button>
            )}
          </div>
          {isAdmin && (
            <div className="bg-card rounded-xl p-4 western-shadow flex items-center justify-center">
              <button onClick={generateProductionSheetPDF} className="leather-gradient text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
                <Printer size={16} /> IMPRIMIR FICHAS
              </button>
            </div>
          )}
        </div>

        {/* Select All */}
        <div className="flex items-center gap-3 mb-3">
          <button onClick={toggleSelectAll} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedIds.size === filteredOrders.length && filteredOrders.length > 0 ? 'bg-primary border-primary' : 'border-border hover:border-primary'}`}>
            {selectedIds.size === filteredOrders.length && filteredOrders.length > 0 && <CheckCircle size={14} className="text-primary-foreground" />}
          </button>
          <span className="text-sm font-semibold">Selecionar todos</span>
          {selectedIds.size > 0 && <span className="text-xs text-muted-foreground">({selectedIds.size} selecionado{selectedIds.size > 1 ? 's' : ''})</span>}
        </div>

        {/* Orders list */}
        <div className="space-y-3">
          {filteredOrders.map(order => (
            <div
              key={order.id}
              className="bg-card rounded-xl p-4 western-shadow hover:shadow-xl transition-shadow flex items-center gap-3"
            >
              {/* Selection circle */}
              <button onClick={() => toggleSelect(order.id)} className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${selectedIds.has(order.id) ? 'bg-primary border-primary' : 'border-border hover:border-primary'}`}>
                {selectedIds.has(order.id) && <CheckCircle size={14} className="text-primary-foreground" />}
              </button>

              <div className="flex-1 cursor-pointer" onClick={() => navigate(`/pedido/${order.id}`)}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-display font-bold">{order.numero}</span>
                    {isAdmin && <span className="text-sm text-muted-foreground ml-2">— {order.vendedor}</span>}
                  </div>
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <span className="text-muted-foreground">{formatDateBR(order.dataCriacao, order.horaCriacao)}</span>
                    <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-bold">{order.status}</span>
                    <span className="font-bold text-primary">{formatCurrency(order.preco * order.quantidade)}</span>
                    <span className="text-xs text-muted-foreground">{order.diasRestantes > 0 ? `${order.diasRestantes}d úteis` : '✓'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum pedido encontrado com esses filtros.</p>
        )}
      </motion.div>
    </div>
  );
};

export default ReportsPage;

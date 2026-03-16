import { useAuth, PRODUCTION_STATUSES, PRODUCTION_STATUSES_USER, orderBarcodeValue } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Filter, FileText, Download, Printer, CheckCircle, StickyNote, Pencil, Trash2, RefreshCw, ScanBarcode } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

const formatDateBR = (date: string, time?: string) => {
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}${time ? ` — ${time}` : ''}`;
};

/** Generate barcode as data URL for PDF embedding */
function barcodeDataUrl(value: string, opts?: { width?: number; height?: number }): string {
  const canvas = document.createElement('canvas');
  try {
    JsBarcode(canvas, value, {
      format: 'CODE128', width: opts?.width ?? 1, height: opts?.height ?? 30,
      displayValue: false, margin: 2,
    });
    return canvas.toDataURL('image/png');
  } catch { return ''; }
}

const ReportsPage = () => {
  const { isLoggedIn, isAdmin, isFernanda, orders, allOrders, user, deleteOrder, updateOrderStatus } = useAuth();
  const navigate = useNavigate();
  const [filterDate, setFilterDate] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVendedor, setFilterVendedor] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Bulk progress modal
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedProgress, setSelectedProgress] = useState('');
  const [progressObservacao, setProgressObservacao] = useState('');

  // Barcode scanner
  const [showScanner, setShowScanner] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const [scanValue, setScanValue] = useState('');

  const [appliedFilters, setAppliedFilters] = useState({
    searchQuery: '', filterDate: '', filterDateEnd: '', filterStatus: '', filterVendedor: '',
  });

  const applyFilters = () => {
    setAppliedFilters({ searchQuery, filterDate, filterDateEnd, filterStatus, filterVendedor });
    setSelectedIds(new Set());
  };

  const displayOrders = isAdmin && appliedFilters.filterVendedor
    ? allOrders.filter(o => o.vendedor === appliedFilters.filterVendedor)
    : orders;

  const filteredOrders = useMemo(() => {
    return displayOrders.filter(o => {
      if (appliedFilters.searchQuery && !o.numero.toLowerCase().includes(appliedFilters.searchQuery.toLowerCase())) return false;
      if (appliedFilters.filterDate && o.dataCriacao < appliedFilters.filterDate) return false;
      if (appliedFilters.filterDateEnd && o.dataCriacao > appliedFilters.filterDateEnd) return false;
      if (appliedFilters.filterStatus && o.status !== appliedFilters.filterStatus) return false;
      return true;
    });
  }, [displayOrders, appliedFilters]);

  const totalValue = filteredOrders.reduce((s, o) => s + o.preco * o.quantidade, 0);
  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const statuses = isAdmin ? PRODUCTION_STATUSES : PRODUCTION_STATUSES_USER;
  const allStatuses = [...statuses];
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

  const handleBulkProgressUpdate = () => {
    if (!selectedProgress) { toast.error('Selecione uma etapa de produção.'); return; }
    selectedIds.forEach(id => updateOrderStatus(id, selectedProgress, progressObservacao.trim() || undefined));
    toast.success(`${selectedIds.size} pedido(s) atualizado(s) para "${selectedProgress}".`);
    setShowProgressModal(false);
    setSelectedProgress('');
    setProgressObservacao('');
  };

  // Barcode scan handler
  const handleScan = useCallback((code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    const source = isAdmin ? allOrders : orders;
    const match = source.find(o => {
      const bv = orderBarcodeValue(o.numero);
      return bv === trimmed || o.numero === trimmed || trimmed.endsWith(o.numero.replace(/\D/g, ''));
    });
    if (match) {
      if (isAdmin) {
        setSelectedIds(prev => {
          const next = new Set(prev);
          if (!next.has(match.id)) {
            next.add(match.id);
            toast.success(`Pedido ${match.numero} selecionado.`);
          } else {
            toast.info(`Pedido ${match.numero} já está selecionado.`);
          }
          return next;
        });
      } else {
        navigate(`/pedido/${match.id}`);
        toast.success(`Pedido ${match.numero} encontrado.`);
      }
    } else {
      toast.error(`Pedido não encontrado para código: ${trimmed}`);
    }
    setScanValue('');
  }, [allOrders, orders, isAdmin, navigate]);

  useEffect(() => {
    if (showScanner && scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [showScanner]);

  const generateReportPDF = () => {
    const doc = new jsPDF();
    const list = ordersToExport;
    doc.setFontSize(18);
    doc.text('Relatório de Pedidos — 7ESTRIVOS', 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`, 14, 28);

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

  const generateProductionSheetPDF = async () => {
    const list = ordersToExport;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [148.5, 210] });
    const pw = 210;
    const ph = 148.5;
    const m = 6;

    for (let idx = 0; idx < list.length; idx++) {
      const order = list[idx];
      if (idx > 0) doc.addPage();

      const orderNumClean = order.numero.replace('7E-', '');

      // ─── HEADER TOP LEFT ───
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('7ESTRIVOS', m + 2, m + 8);

      const hx = m + 2;
      let hy = m + 16;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Código: `, hx, hy);
      doc.setFont('helvetica', 'normal');
      doc.text(orderNumClean, hx + doc.getTextWidth('Código: '), hy);
      hy += 6;
      doc.setFont('helvetica', 'bold');
      doc.text(`Vendedor: `, hx, hy);
      doc.setFont('helvetica', 'normal');
      doc.text(order.vendedor, hx + doc.getTextWidth('Vendedor: '), hy);
      hy += 6;
      doc.setFont('helvetica', 'bold');
      doc.text(`Data e hora: `, hx, hy);
      doc.setFont('helvetica', 'normal');
      const dateStr = `${order.dataCriacao.slice(8, 10)}/${order.dataCriacao.slice(5, 7)} ${order.horaCriacao}`;
      doc.text(dateStr, hx + doc.getTextWidth('Data e hora: '), hy);

      // ─── QR CODE TOP RIGHT ───
      const qrSize = 30;
      const qrX = pw - qrSize - m - 2;
      const qrY = m + 2;
      if (order.fotos && order.fotos.length > 0 && order.fotos[0].startsWith('http')) {
        try {
          const qrDataUrl = await QRCode.toDataURL(order.fotos[0], { width: 300, margin: 1 });
          doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.text('ESCANEIE PARA', qrX + qrSize / 2, qrY + qrSize + 3, { align: 'center' });
          doc.text('VER A FOTO', qrX + qrSize / 2, qrY + qrSize + 6, { align: 'center' });
        } catch { /* skip */ }
      }

      // ─── SEPARATOR LINE ───
      const headerBottom = m + 37;
      doc.setLineWidth(0.4);
      doc.line(m, headerBottom, pw - m, headerBottom);

      // ─── DESCRIPTION AREA (3 columns) ───
      const descTop = headerBottom + 5;
      const fs = 10; // main description font size
      const fieldGap = 5.5;

      // Column 1 (left)
      const col1X = m + 3;
      let y1 = descTop;

      const printField = (label: string, value: string, x: number, y: number) => {
        doc.setFontSize(fs);
        doc.setFont('helvetica', 'bold');
        doc.text(`${label} `, x, y);
        doc.setFont('helvetica', 'normal');
        const lw = doc.getTextWidth(`${label} `);
        doc.text(value, x + lw, y);
      };

      if (order.tamanho) {
        const tamText = `${order.tamanho}${order.genero ? ' ' + order.genero.substring(0, 3).toLowerCase() + '.' : ''}`;
        printField('Tamanho:', tamText, col1X, y1);
        y1 += fieldGap;
      }
      if (order.modelo) {
        printField('Modelo:', order.modelo.toLowerCase().replace('tradicional', 'trad.').replace('feminino', 'fem.'), col1X, y1);
        y1 += fieldGap;
      }
      if (order.couroCano) {
        const t = `${order.couroCano.toLowerCase().replace('crazy horse', 'horse')}${order.corCouroCano ? ' ' + order.corCouroCano.toLowerCase() : ''}`;
        printField('C. cano:', t, col1X, y1);
        y1 += fieldGap;
      }
      if (order.couroGaspea) {
        const t = `${order.couroGaspea.toLowerCase().replace('crazy horse', 'horse')}${order.corCouroGaspea ? ' ' + order.corCouroGaspea.toLowerCase() : ''}`;
        printField('C. gaspea:', t, col1X, y1);
        y1 += fieldGap;
      }
      if (order.couroTaloneira) {
        const t = `${order.couroTaloneira.toLowerCase().replace('crazy horse', 'horse')}${order.corCouroTaloneira ? ' ' + order.corCouroTaloneira.toLowerCase() : ''}`;
        printField('C. taloneira:', t, col1X, y1);
        y1 += fieldGap;
      }
      if (order.bordadoCano) {
        const t = `${order.bordadoCano.toLowerCase().replace('florão básico', 'florão b.')}${order.corBordadoCano ? ' ' + order.corBordadoCano.toLowerCase() : ''}`;
        printField('B. cano:', t, col1X, y1);
        y1 += fieldGap;
      }
      if (order.bordadoGaspea) {
        const t = `${order.bordadoGaspea.toLowerCase().replace('florão básico', 'florão b.')}${order.corBordadoGaspea ? ' ' + order.corBordadoGaspea.toLowerCase() : ''}`;
        printField('B. gáspea:', t, col1X, y1);
        y1 += fieldGap;
      }
      if (order.nomeBordadoDesc || order.personalizacaoNome) {
        printField('Nome bordado:', order.nomeBordadoDesc || order.personalizacaoNome || '', col1X, y1);
        y1 += fieldGap;
      }

      // Column 2 (middle)
      const col2X = col1X + 72;
      let y2 = descTop;

      if (order.acessorios) {
        printField('Acessórios:', order.acessorios, col2X, y2);
        y2 += fieldGap;
      }
      if (order.corLinha) {
        printField('Linha:', order.corLinha.toLowerCase(), col2X, y2);
        y2 += fieldGap;
      }
      if (order.corBorrachinha) {
        printField('Borrachinha:', order.corBorrachinha.toLowerCase(), col2X, y2);
        y2 += fieldGap;
      }
      if (order.corVivo) {
        printField('Vivo:', order.corVivo.toLowerCase(), col2X, y2);
        y2 += fieldGap;
      }
      if (order.metais) {
        let metalStr = order.metais.toLowerCase();
        if (order.tipoMetal) metalStr += ', ' + order.tipoMetal.toLowerCase();
        if (order.corMetal) metalStr += ', ' + order.corMetal.toLowerCase();
        printField('Metal:', metalStr, col2X, y2);
        y2 += fieldGap;
      }
      if (order.trisce === 'Sim' && order.triceDesc) {
        printField('Tricê:', order.triceDesc.toLowerCase(), col2X, y2);
        y2 += fieldGap;
      }
      if (order.tiras === 'Sim' && order.tirasDesc) {
        printField('Tiras:', order.tirasDesc.toLowerCase(), col2X, y2);
        y2 += fieldGap;
      }

      // Column 3 (right - SOLA)
      const col3X = col2X + 65;
      const col3Y = descTop;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Sola:', col3X, col3Y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fs);
      const solaLine1 = `${order.solado || 'Borracha'} ${order.formatoBico || 'quadrada'}`.toLowerCase();
      const solaLine2 = (order.corSola || 'preta').toLowerCase();
      doc.text(solaLine1, col3X, col3Y + 6);
      doc.text(solaLine2, col3X, col3Y + 12);

      // Extra fields (laser, estampa, etc.) below columns if space
      let extraY = Math.max(y1, y2) + 2;
      if (order.laserCano) {
        printField('L. cano:', `${order.laserCano.toLowerCase()}${order.corGlitterCano ? ' ' + order.corGlitterCano.toLowerCase() : ''}`, col1X, extraY);
        extraY += fieldGap;
      }
      if (order.laserGaspea) {
        printField('L. gáspea:', `${order.laserGaspea.toLowerCase()}${order.corGlitterGaspea ? ' ' + order.corGlitterGaspea.toLowerCase() : ''}`, col1X, extraY);
        extraY += fieldGap;
      }
      if (order.laserTaloneira) {
        printField('L. taloneira:', `${order.laserTaloneira.toLowerCase()}${order.corGlitterTaloneira ? ' ' + order.corGlitterTaloneira.toLowerCase() : ''}`, col1X, extraY);
        extraY += fieldGap;
      }
      if (order.observacao) {
        printField('Obs:', order.observacao, col1X, extraY);
        extraY += fieldGap;
      }

      // ─── STUBS AT BOTTOM ───
      const stubTop = ph - 34;
      doc.setLineWidth(0.3);
      (doc as any).setLineDash([1, 1]);
      doc.line(m, stubTop - 2, pw - m, stubTop - 2);
      (doc as any).setLineDash([]);

      const stubAreaW = pw - m * 2;
      const stubW = stubAreaW / 3;
      const bcVal = orderBarcodeValue(order.numero);
      const bcUrl = barcodeDataUrl(bcVal, { width: 1.2, height: 28 });

      // Stub 1: BORDADO / LASER
      let stubX = m;
      doc.setLineWidth(0.3);
      doc.line(stubX + stubW, stubTop, stubX + stubW, ph - m);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('BORDADO / LASER', stubX + stubW / 2, stubTop + 4, { align: 'center' });
      if (bcUrl) {
        try { doc.addImage(bcUrl, 'PNG', stubX + 6, stubTop + 6, stubW - 12, 14); } catch {}
      }
      doc.setFontSize(10);
      doc.text(orderNumClean, stubX + stubW / 2, stubTop + 24, { align: 'center' });

      // Stub 2: PESPONTO
      stubX += stubW;
      doc.line(stubX + stubW, stubTop, stubX + stubW, ph - m);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('PESPONTO', stubX + stubW / 2, stubTop + 4, { align: 'center' });
      if (bcUrl) {
        try { doc.addImage(bcUrl, 'PNG', stubX + 6, stubTop + 6, stubW - 12, 14); } catch {}
      }
      doc.setFontSize(10);
      doc.text(orderNumClean, stubX + stubW / 2, stubTop + 24, { align: 'center' });

      // Stub 3: MONTAGEM
      stubX += stubW;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('MONTAGEM', stubX + stubW / 2, stubTop + 4, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const solaStubText = `${order.solado || 'BORRACHA'} ${order.formatoBico || 'QUADRADA'}`.toUpperCase();
      const corSolaStubText = `${order.corSola || 'PRETA'}`.toUpperCase();
      doc.text(`SOLA:`, stubX + 2, stubTop + 8);
      doc.text(solaStubText, stubX + 2, stubTop + 11.5);
      doc.text(corSolaStubText, stubX + 2, stubTop + 15);
      doc.text(`FORMA: ${orderNumClean}`, stubX + stubW - 28, stubTop + 8);
      doc.text(`NÚMERO: ${order.tamanho}`, stubX + stubW - 28, stubTop + 12);
      if (bcUrl) {
        try { doc.addImage(bcUrl, 'PNG', stubX + 6, stubTop + 17, stubW - 12, 10); } catch {}
      }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(orderNumClean, stubX + stubW / 2, stubTop + 30, { align: 'center' });
    }

    doc.save('fichas-producao.pdf');
  };

  const [showReportOptions, setShowReportOptions] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    deleteOrder(id);
    setConfirmDeleteId(null);
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    toast.success('Pedido excluído com sucesso!');
  };

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
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <h1 className="text-3xl font-display font-bold">MEUS PEDIDOS</h1>
          <button onClick={() => navigate('/rascunhos')} className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary text-primary font-bold text-sm hover:bg-primary/10 transition-colors">
            <StickyNote size={16} /> Rascunhos
          </button>
          <button onClick={() => navigate('/pedido')} className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary text-primary font-bold text-sm hover:bg-primary/10 transition-colors">
            <FileText size={16} /> Fazer pedido
          </button>
          {/* Barcode scanner for all users */}
          <button onClick={() => setShowScanner(v => !v)} className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary text-primary font-bold text-sm hover:bg-primary/10 transition-colors">
            <ScanBarcode size={16} /> {showScanner ? 'Fechar Scanner' : 'Escanear Código'}
          </button>
          {/* Admin bulk progress button */}
          {isAdmin && selectedIds.size > 0 && (
            <button onClick={() => setShowProgressModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg orange-gradient text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity ml-auto">
              <RefreshCw size={16} /> Mudar progresso de produção
            </button>
          )}
        </div>

        {/* Barcode scanner for all users */}
        {showScanner && (
          <div className="bg-card rounded-xl p-4 western-shadow mb-4">
            <div className="flex items-center gap-3">
              <ScanBarcode size={20} className="text-primary flex-shrink-0" />
              <div className="flex-1">
                <label className="block text-xs font-semibold mb-1">Escaneie ou digite o código de barras do pedido</label>
                <input
                  ref={scanInputRef}
                  type="text"
                  value={scanValue}
                  onChange={e => setScanValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleScan(scanValue);
                    }
                  }}
                  placeholder="Escaneie o código de barras aqui..."
                  className="w-full bg-muted rounded-lg px-4 py-2.5 text-sm border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  autoFocus
                />
              </div>
              <button onClick={() => handleScan(scanValue)} className="orange-gradient text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">
                Buscar
              </button>
            </div>
            {isAdmin && selectedIds.size > 0 && (
              <p className="text-xs text-muted-foreground mt-2">{selectedIds.size} pedido(s) selecionado(s)</p>
            )}
          </div>
        )}

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
              <label className="block text-xs font-semibold mb-1">Data de Criação (até)</label>
              <input type="date" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} className="bg-muted rounded-lg px-3 py-2 text-sm border border-border focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Progresso da Produção</label>
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
            <div className="flex items-end">
              <button onClick={applyFilters} className="orange-gradient text-primary-foreground px-6 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2">
                <Filter size={14} /> FILTRAR
              </button>
            </div>
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
            <div className="relative">
              <button onClick={() => setShowReportOptions(!showReportOptions)} className="orange-gradient text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
                <FileText size={16} /> GERAR RELATÓRIO
              </button>
              {showReportOptions && (
                <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-lg western-shadow p-2 z-20 min-w-[200px]">
                  <button onClick={() => { generateReportPDF(); setShowReportOptions(false); }} className="w-full text-left px-3 py-2 text-sm font-semibold hover:bg-muted rounded-md flex items-center gap-2">
                    <Download size={14} /> Relatório por Filtros
                  </button>
                  {isAdmin && (
                    <button onClick={() => { navigate('/relatorio-pecas'); setShowReportOptions(false); }} className="w-full text-left px-3 py-2 text-sm font-semibold hover:bg-muted rounded-md flex items-center gap-2">
                      <FileText size={14} /> Relatório por Peças
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          {isAdmin && (
            <div className="bg-card rounded-xl p-4 western-shadow flex items-center justify-center">
              <button onClick={generateProductionSheetPDF} className="leather-gradient text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
                <Printer size={16} /> IMPRIMIR FICHAS
              </button>
            </div>
          )}
        </div>

        {/* Select All - admin only */}
        {isAdmin && (
          <div className="flex items-center gap-3 mb-3">
            <button onClick={toggleSelectAll} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedIds.size === filteredOrders.length && filteredOrders.length > 0 ? 'bg-primary border-primary' : 'border-border hover:border-primary'}`}>
              {selectedIds.size === filteredOrders.length && filteredOrders.length > 0 && <CheckCircle size={14} className="text-primary-foreground" />}
            </button>
            <span className="text-sm font-semibold">Selecionar todos</span>
            {selectedIds.size > 0 && <span className="text-xs text-muted-foreground">({selectedIds.size} selecionado{selectedIds.size > 1 ? 's' : ''})</span>}
          </div>
        )}

        {/* Orders list */}
        <div className="space-y-3">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-card rounded-xl p-4 western-shadow hover:shadow-xl transition-shadow flex items-center gap-3">
              {isAdmin && (
                <button onClick={() => toggleSelect(order.id)} className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${selectedIds.has(order.id) ? 'bg-primary border-primary' : 'border-border hover:border-primary'}`}>
                  {selectedIds.has(order.id) && <CheckCircle size={14} className="text-primary-foreground" />}
                </button>
              )}

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

              {isAdmin && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => navigate(`/pedido/${order.id}/editar`)} className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors" title="Editar pedido">
                    <Pencil size={16} />
                  </button>
                  {confirmDeleteId === order.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDelete(order.id)} className="px-2 py-1 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold hover:opacity-90">Confirmar</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 rounded-lg bg-muted text-xs font-bold hover:opacity-80">Cancelar</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteId(order.id)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors" title="Excluir pedido">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum pedido encontrado com esses filtros.</p>
        )}
      </motion.div>

      {/* Bulk Progress Modal */}
      <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mudar Progresso de Produção</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-3">
            Selecione a nova etapa para {selectedIds.size} pedido(s):
          </p>
          <select
            value={selectedProgress}
            onChange={e => setSelectedProgress(e.target.value)}
            className="w-full bg-muted rounded-lg px-4 py-2.5 text-sm border border-border focus:border-primary outline-none"
          >
            <option value="">Selecione a etapa...</option>
            {PRODUCTION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="mt-3">
            <label className="block text-xs font-semibold mb-1">Observação (opcional)</label>
            <textarea
              value={progressObservacao}
              onChange={e => setProgressObservacao(e.target.value)}
              placeholder="Ex: pedido priorizado..."
              className="w-full bg-muted rounded-lg px-4 py-2.5 text-sm border border-border focus:border-primary outline-none min-h-[60px]"
            />
          </div>
          <DialogFooter className="mt-4">
            <button onClick={() => setShowProgressModal(false)} className="px-4 py-2 rounded-lg bg-muted text-foreground font-bold text-sm">Cancelar</button>
            <button onClick={handleBulkProgressUpdate} className="px-4 py-2 rounded-lg orange-gradient text-primary-foreground font-bold text-sm hover:opacity-90">OK</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsPage;

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
  const { isLoggedIn, isAdmin, orders, allOrders, user, deleteOrder, updateOrderStatus } = useAuth();
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
    selectedIds.forEach(id => updateOrderStatus(id, selectedProgress));
    toast.success(`${selectedIds.size} pedido(s) atualizado(s) para "${selectedProgress}".`);
    setShowProgressModal(false);
    setSelectedProgress('');
  };

  // Barcode scan handler
  const handleScan = useCallback((code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    // Try to find order by barcode value or numero
    const match = allOrders.find(o => {
      const bv = orderBarcodeValue(o.numero);
      return bv === trimmed || o.numero === trimmed || trimmed.endsWith(o.numero.replace(/\D/g, ''));
    });
    if (match) {
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
      toast.error(`Pedido não encontrado para código: ${trimmed}`);
    }
    setScanValue('');
  }, [allOrders]);

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
    const doc = new jsPDF({ format: 'a4', orientation: 'portrait' });
    const pw = doc.internal.pageSize.getWidth(); // 210mm
    const contentH = 148.5; // A5 height (half A4)
    const m = 6; // margin

    for (let idx = 0; idx < list.length; idx++) {
      const order = list[idx];
      if (idx > 0) doc.addPage();

      // ─── Outer border ───
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.rect(m, m, pw - m * 2, contentH - m * 2);

      // ─── HEADER ───
      const hx = m + 3;
      let hy = m + 5;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Código: `, hx, hy);
      doc.setFont('helvetica', 'normal');
      doc.text(`${order.numero.replace('7E-', '')}`, hx + doc.getTextWidth('Código: '), hy);
      hy += 4.5;
      doc.setFont('helvetica', 'bold');
      doc.text(`Vendedor: `, hx, hy);
      doc.setFont('helvetica', 'normal');
      doc.text(`${order.vendedor}`, hx + doc.getTextWidth('Vendedor: '), hy);
      hy += 4.5;
      doc.setFont('helvetica', 'bold');
      doc.text(`Data e hora: `, hx, hy);
      doc.setFont('helvetica', 'normal');
      const dateStr = `${order.dataCriacao.slice(8, 10)}/${order.dataCriacao.slice(5, 7)} ${order.horaCriacao}`;
      doc.text(dateStr, hx + doc.getTextWidth('Data e hora: '), hy);

      // Header divider line
      const headerBottom = m + 22;
      doc.setLineWidth(0.3);
      doc.line(m, headerBottom, pw - m, headerBottom);

      // ─── Layout areas ───
      const descTop = headerBottom;
      const stubH = 28;
      const stubTop = contentH - m - stubH;
      const descBottom = stubTop;
      // Photo takes right portion
      const photoX = pw * 0.48;
      // Vertical divider between description and photo
      doc.line(photoX, headerBottom, photoX, descBottom);
      // Horizontal line above stubs
      doc.line(m, stubTop, pw - m, stubTop);

      // ─── DESCRIPTION (2 columns, left of photo) ───
      const descW = photoX - m - 3;
      const colW = descW / 2;

      // Build detail lines with abbreviations
      const details: string[] = [];

      // Tamanho + Gênero
      if (order.tamanho) {
        details.push(`**Tamanho:** ${order.tamanho}${order.genero ? ' ' + order.genero.substring(0, 3).toLowerCase() + '.' : ''}`);
      }
      // Modelo
      if (order.modelo) {
        const modeloAbr = order.modelo.toLowerCase().replace('tradicional', 'trad.').replace('feminino', 'fem.');
        details.push(`**Modelo:** ${modeloAbr}`);
      }
      // Couro - merged type + color
      if (order.couroCano) {
        const tipo = order.couroCano.toLowerCase().replace('crazy horse', 'horse');
        details.push(`**C. cano:** ${tipo}${order.corCouroCano ? ' ' + order.corCouroCano.toLowerCase() : ''}`);
      }
      if (order.couroGaspea) {
        const tipo = order.couroGaspea.toLowerCase().replace('crazy horse', 'horse');
        details.push(`**C. gáspea:** ${tipo}${order.corCouroGaspea ? ' ' + order.corCouroGaspea.toLowerCase() : ''}`);
      }
      if (order.couroTaloneira) {
        const tipo = order.couroTaloneira.toLowerCase().replace('crazy horse', 'horse');
        details.push(`**C. taloneira:** ${tipo}${order.corCouroTaloneira ? ' ' + order.corCouroTaloneira.toLowerCase() : ''}`);
      }
      // Bordado - merged type + color
      if (order.bordadoCano) {
        const bord = order.bordadoCano.toLowerCase().replace('florão básico', 'florão b.');
        details.push(`**B. cano:** ${bord}${order.corBordadoCano ? ' ' + order.corBordadoCano.toLowerCase() : ''}`);
      }
      if (order.bordadoGaspea) {
        const bord = order.bordadoGaspea.toLowerCase().replace('florão básico', 'florão b.');
        details.push(`**B. gáspea:** ${bord}${order.corBordadoGaspea ? ' ' + order.corBordadoGaspea.toLowerCase() : ''}`);
      }
      if (order.bordadoTaloneira) {
        const bord = order.bordadoTaloneira.toLowerCase().replace('florão básico', 'florão b.');
        details.push(`**B. taloneira:** ${bord}${order.corBordadoTaloneira ? ' ' + order.corBordadoTaloneira.toLowerCase() : ''}`);
      }
      // Nome bordado
      if (order.nomeBordadoDesc || order.personalizacaoNome) {
        details.push(`**Nome bordado:** ${order.nomeBordadoDesc || order.personalizacaoNome}`);
      }
      // Laser - merged with glitter
      if (order.laserCano) {
        details.push(`**L. cano:** ${order.laserCano.toLowerCase()}${order.corGlitterCano ? ' ' + order.corGlitterCano.toLowerCase() : ''}`);
      }
      if (order.laserGaspea) {
        details.push(`**L. gáspea:** ${order.laserGaspea.toLowerCase()}${order.corGlitterGaspea ? ' ' + order.corGlitterGaspea.toLowerCase() : ''}`);
      }
      if (order.laserTaloneira) {
        details.push(`**L. taloneira:** ${order.laserTaloneira.toLowerCase()}${order.corGlitterTaloneira ? ' ' + order.corGlitterTaloneira.toLowerCase() : ''}`);
      }
      // Estampa
      if (order.estampa === 'Sim' && order.estampaDesc) {
        details.push(`**L. estampa:** ${order.estampaDesc.toLowerCase()}`);
      }
      // Pintura
      if (order.pintura === 'Sim') {
        details.push(`**Pintura:** ${order.pinturaDesc || 'sim'}`);
      }
      // Linha
      if (order.corLinha) details.push(`**Linha:** ${order.corLinha.toLowerCase()}`);
      // Borrachinha
      if (order.corBorrachinha) details.push(`**Borrachinha:** ${order.corBorrachinha.toLowerCase()}`);
      // Vivo
      if (order.corVivo) details.push(`**Vivo:** ${order.corVivo.toLowerCase()}`);
      // Metal - merged
      if (order.metais) {
        let metalStr = order.metais.toLowerCase();
        if (order.tipoMetal) metalStr += ', ' + order.tipoMetal.toLowerCase();
        if (order.corMetal) metalStr += ', ' + order.corMetal.toLowerCase();
        details.push(`**Metal:** ${metalStr}`);
      }
      // Strass
      if (order.strassQtd) details.push(`**Strass:** ${order.strassQtd} un.`);
      // Cruz Metal
      if (order.cruzMetalQtd) details.push(`**Cruz metal:** ${order.cruzMetalQtd} un.`);
      // Bridão Metal
      if (order.bridaoMetalQtd) details.push(`**Bridão metal:** ${order.bridaoMetalQtd} un.`);
      // Tricê
      if (order.trisce === 'Sim') details.push(`**Tricê:** ${order.triceDesc ? order.triceDesc.toLowerCase() : 'sim'}`);
      // Tiras
      if (order.tiras === 'Sim') details.push(`**Tiras:** ${order.tirasDesc ? order.tirasDesc.toLowerCase() : 'sim'}`);
      // Solado + Cor sola + Formato bico - grouped
      if (order.solado) {
        let solaStr = order.solado.toLowerCase();
        if (order.corSola) solaStr += ' ' + order.corSola.toLowerCase();
        details.push(`**Sola:** ${solaStr}`);
      }
      if (order.formatoBico) {
        details.push(`**Bico:** ${order.formatoBico.toLowerCase()}`);
      }
      if (order.corVira) details.push(`**Vira:** ${order.corVira.toLowerCase()}`);
      // Costura atrás
      if (order.costuraAtras === 'Sim') details.push(`**Costura atrás:** sim`);
      // Carimbo
      if (order.carimbo) {
        details.push(`**Carimbo:** ${order.carimbo.toLowerCase()}${order.carimboDesc ? ' ' + order.carimboDesc : ''}`);
      }
      // Acessórios
      if (order.acessorios) details.push(`**Acessórios:** ${order.acessorios.toLowerCase()}`);
      // Sob medida
      if (order.sobMedida) details.push(`**Sob medida:** ${order.sobMedidaDesc || 'sim'}`);
      // Desenvolvimento
      if (order.desenvolvimento) details.push(`**Desenvolvimento:** ${order.desenvolvimento.toLowerCase()}`);
      // Adicional
      if (order.adicionalDesc) details.push(`**Adicional:** ${order.adicionalDesc}`);
      // Observação
      if (order.observacao) details.push(`**Obs:** ${order.observacao}`);

      // Render details in 2 columns
      doc.setFontSize(8);
      const lineH = 5;
      const startY = descTop + 5;
      const maxLines = Math.floor((descBottom - startY - 2) / lineH);
      const col1X = m + 3;
      const col2X = m + 3 + colW;

      let lineIdx = 0;
      details.forEach((detail) => {
        if (lineIdx >= maxLines * 2) return; // overflow protection
        const col = lineIdx < maxLines ? 0 : 1;
        const row = lineIdx < maxLines ? lineIdx : lineIdx - maxLines;
        const x = col === 0 ? col1X : col2X;
        const y = startY + row * lineH;

        // Parse **bold:** normal pattern
        const match = detail.match(/^\*\*(.+?)\*\*\s*(.*)$/);
        if (match) {
          doc.setFont('helvetica', 'bold');
          doc.text(match[1], x, y);
          doc.setFont('helvetica', 'normal');
          const labelW = doc.getTextWidth(match[1] + ' ');
          const availW = colW - labelW - 2;
          const valText = doc.splitTextToSize(match[2], availW);
          doc.text(valText[0] || '', x + labelW, y);
          // If text wraps, count extra lines
          if (valText.length > 1) {
            for (let vi = 1; vi < valText.length && lineIdx + vi < maxLines * 2; vi++) {
              const extraY = y + vi * lineH;
              doc.text(valText[vi], x + labelW, extraY);
              lineIdx++;
            }
          }
        } else {
          doc.text(detail, x, y);
        }
        lineIdx++;
      });

      // ─── QR CODE (right side, between header and stubs) ───
      if (order.fotos && order.fotos.length > 0 && order.fotos[0].startsWith('http')) {
        try {
          const qrSize = Math.min(pw - m - photoX - 6, descBottom - headerBottom - 10);
          const qrX = photoX + 2 + ((pw - m - photoX - 3 - qrSize) / 2);
          const qrY = headerBottom + 2;
          const qrDataUrl = await QRCode.toDataURL(order.fotos[0], { width: 200, margin: 1 });
          doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
          doc.setFontSize(6);
          doc.setFont('helvetica', 'normal');
          doc.text('Escaneie para ver a foto', qrX + qrSize / 2, qrY + qrSize + 3, { align: 'center' });
        } catch { /* skip invalid */ }
      } else if (order.fotos && order.fotos.length > 0) {
        try {
          const photoW = pw - m - photoX - 3;
          const photoH = descBottom - headerBottom - 4;
          doc.addImage(order.fotos[0], 'JPEG', photoX + 2, headerBottom + 2, photoW, photoH);
        } catch { /* skip invalid */ }
      }

      // ─── STUBS (bottom) ───
      const stubs = ['CORTE', 'BORDADO / LASER', 'PESPONTO', 'EXPEDIÇÃO'];
      const stubAreaW = pw - m * 2;
      const singleStubW = stubAreaW / 4;
      const bcVal = orderBarcodeValue(order.numero);
      const bcUrl = barcodeDataUrl(bcVal, { width: 1, height: 30 });
      const orderNumClean = order.numero.replace('7E-', '');

      stubs.forEach((stub, i) => {
        const sx = m + i * singleStubW;
        // Vertical dividers between stubs
        if (i > 0) {
          doc.setDrawColor(0);
          doc.setLineWidth(0.3);
          doc.line(sx, stubTop, sx, contentH - m);
        }
        // Stage name centered
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        const textW = doc.getTextWidth(stub);
        doc.text(stub, sx + (singleStubW - textW) / 2, stubTop + 5);
        // Barcode centered
        if (bcUrl) {
          const bcW = singleStubW - 10;
          try { doc.addImage(bcUrl, 'PNG', sx + 5, stubTop + 7, bcW, 10); } catch {}
        }
        // Order number below barcode, centered, larger
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        const numW = doc.getTextWidth(orderNumClean);
        doc.text(orderNumClean, sx + (singleStubW - numW) / 2, stubTop + 22);
      });
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
          {/* Admin: barcode scanner toggle */}
          {isAdmin && (
            <button onClick={() => setShowScanner(v => !v)} className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary text-primary font-bold text-sm hover:bg-primary/10 transition-colors">
              <ScanBarcode size={16} /> {showScanner ? 'Fechar Scanner' : 'Escanear Código'}
            </button>
          )}
          {/* Admin bulk progress button */}
          {isAdmin && selectedIds.size > 0 && (
            <button onClick={() => setShowProgressModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg orange-gradient text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity ml-auto">
              <RefreshCw size={16} /> Mudar progresso de produção
            </button>
          )}
        </div>

        {/* Barcode scanner input (admin only) */}
        {isAdmin && showScanner && (
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
            {selectedIds.size > 0 && (
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
            <div key={order.id} className="bg-card rounded-xl p-4 western-shadow hover:shadow-xl transition-shadow flex items-center gap-3">
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

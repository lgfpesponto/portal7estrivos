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

      // ─── HEADER ───
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('7ESTRIVOS', m + 2, m + 8);

      // QR Code top right
      const qrSize = 30;
      const qrX = pw - qrSize - m - 2;
      const qrY = m + 2;
      let hasQR = false;
      if (order.fotos && order.fotos.length > 0 && order.fotos[0].startsWith('http')) {
        try {
          const qrDataUrl = await QRCode.toDataURL(order.fotos[0], { width: 300, margin: 1 });
          doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
          hasQR = true;
        } catch { /* skip */ }
      }

      // Header columns
      const hx = m + 2;
      const hx2 = 105;
      let hy = m + 16;
      const hGap = 6;

      const printHeaderField = (label: string, value: string, x: number, y: number) => {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(label, x, y);
        doc.setFont('helvetica', 'normal');
        doc.text(value, x + doc.getTextWidth(label), y);
      };

      // Left column
      printHeaderField('Código:    ', orderNumClean, hx, hy);
      printHeaderField('Vendedor:  ', order.vendedor, hx, hy + hGap);
      const dateStr = `${order.dataCriacao.slice(8, 10)}/${order.dataCriacao.slice(5, 7)} ${order.horaCriacao}`;
      printHeaderField('Data:      ', dateStr, hx, hy + hGap * 2);

      // Right column — dynamic Y with wrapping
      let rhY = hy;
      const rhMaxW = qrX - hx2 - 4; // max width before QR code

      let tamText = `${order.tamanho || ''}${order.genero ? ' ' + order.genero.substring(0, 3).toLowerCase() + '.' : ''}`;
      if (order.sobMedida) {
        tamText += ` | sob medida${order.sobMedidaDesc ? ': ' + order.sobMedidaDesc : ''}`;
      }

      // Render Tamanho with wrapping
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      const tamLabel = 'Tamanho:  ';
      doc.text(tamLabel, hx2, rhY);
      doc.setFont('helvetica', 'normal');
      const tamLabelW = doc.getTextWidth(tamLabel);
      const tamLines = doc.splitTextToSize(tamText, rhMaxW - tamLabelW);
      tamLines.forEach((line: string, li: number) => {
        doc.text(line, hx2 + tamLabelW, rhY + li * 4);
      });
      rhY += Math.max(tamLines.length, 1) * 4 + 2;

      // Modelo
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      const modLabel = 'Modelo:   ';
      doc.text(modLabel, hx2, rhY);
      doc.setFont('helvetica', 'normal');
      const modLabelW = doc.getTextWidth(modLabel);
      const modeloText = (order.modelo || '').toLowerCase();
      const modLines = doc.splitTextToSize(modeloText, rhMaxW - modLabelW);
      modLines.forEach((line: string, li: number) => {
        doc.text(line, hx2 + modLabelW, rhY + li * 4);
      });
      rhY += Math.max(modLines.length, 1) * 4 + 2;

      // QR phrase
      if (hasQR) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text('Escaneie para ver a foto ->', hx2, rhY);
      }

      // Separator
      const headerBottom = m + 37;
      doc.setLineWidth(0.4);
      doc.line(m, headerBottom, pw - m, headerBottom);

      // ─── DESCRIPTION AREA (dynamic 3-column categories) ───
      const descTop = headerBottom + 5;
      const fs = 11;
      const fieldGap = 5.5;
      const catGap = 3;
      const descBottom = (ph - 34) - 4; // stubTop - 4mm safety

      // Build categories with filled fields only
      type CatField = { label: string; value: string };
      type Category = { title: string; fields: CatField[] };
      const categories: Category[] = [];

      // COUROS
      const courosFields: CatField[] = [];
      if (order.couroCano) courosFields.push({ label: 'Cano:', value: `${order.couroCano.toLowerCase()}${order.corCouroCano ? ' ' + order.corCouroCano.toLowerCase() : ''}` });
      if (order.couroGaspea) courosFields.push({ label: 'Gáspea:', value: `${order.couroGaspea.toLowerCase()}${order.corCouroGaspea ? ' ' + order.corCouroGaspea.toLowerCase() : ''}` });
      if (order.couroTaloneira) courosFields.push({ label: 'Taloneira:', value: `${order.couroTaloneira.toLowerCase()}${order.corCouroTaloneira ? ' ' + order.corCouroTaloneira.toLowerCase() : ''}` });
      if (courosFields.length) categories.push({ title: 'COUROS', fields: courosFields });

      // BORDADOS
      const bordadoFields: CatField[] = [];
      if (order.bordadoCano) bordadoFields.push({ label: 'Cano:', value: `${order.bordadoCano.toLowerCase()}${order.corBordadoCano ? ' ' + order.corBordadoCano.toLowerCase() : ''}` });
      if (order.bordadoGaspea) bordadoFields.push({ label: 'Gáspea:', value: `${order.bordadoGaspea.toLowerCase()}${order.corBordadoGaspea ? ' ' + order.corBordadoGaspea.toLowerCase() : ''}` });
      if (order.bordadoTaloneira) bordadoFields.push({ label: 'Taloneira:', value: `${(order.bordadoTaloneira || '').toLowerCase()}${order.corBordadoTaloneira ? ' ' + order.corBordadoTaloneira.toLowerCase() : ''}` });
      if (order.nomeBordadoDesc || order.personalizacaoNome) bordadoFields.push({ label: 'Nome:', value: (order.nomeBordadoDesc || order.personalizacaoNome || '').toLowerCase() });
      if (bordadoFields.length) categories.push({ title: 'BORDADOS', fields: bordadoFields });

      // LASER
      const laserFields: CatField[] = [];
      if (order.laserCano) laserFields.push({ label: 'Cano:', value: `${order.laserCano.toLowerCase()}${order.corGlitterCano ? ' ' + order.corGlitterCano.toLowerCase() : ''}` });
      if (order.laserGaspea) laserFields.push({ label: 'Gáspea:', value: `${order.laserGaspea.toLowerCase()}${order.corGlitterGaspea ? ' ' + order.corGlitterGaspea.toLowerCase() : ''}` });
      if (order.laserTaloneira) laserFields.push({ label: 'Taloneira:', value: `${(order.laserTaloneira || '').toLowerCase()}${order.corGlitterTaloneira ? ' ' + order.corGlitterTaloneira.toLowerCase() : ''}` });
      if (laserFields.length) categories.push({ title: 'LASER', fields: laserFields });

      // PESPONTO
      const pespontoFields: CatField[] = [];
      if (order.corLinha) pespontoFields.push({ label: 'Linha:', value: order.corLinha.toLowerCase() });
      if (order.corBorrachinha) pespontoFields.push({ label: 'Borrachinha:', value: order.corBorrachinha.toLowerCase() });
      if (order.corVivo) pespontoFields.push({ label: 'Vivo:', value: order.corVivo.toLowerCase() });
      if (pespontoFields.length) categories.push({ title: 'PESPONTO', fields: pespontoFields });

      // SOLADOS
      const soladoFields: CatField[] = [];
      const solaType = `${order.solado || 'Borracha'} ${order.formatoBico || 'quadrada'}`.toLowerCase();
      soladoFields.push({ label: 'Tipo:', value: solaType });
      if (order.corSola) soladoFields.push({ label: 'Cor:', value: order.corSola.toLowerCase() });
      if (order.corVira) soladoFields.push({ label: 'Vira:', value: order.corVira.toLowerCase() });
      categories.push({ title: 'SOLADOS', fields: soladoFields });

      // METAIS
      const metaisFields: CatField[] = [];
      if (order.metais) {
        const metalParts = [order.metais.toLowerCase()];
        if (order.tipoMetal) metalParts.push(order.tipoMetal.toLowerCase());
        if (order.corMetal) metalParts.push(order.corMetal.toLowerCase());
        metaisFields.push({ label: 'Metais:', value: metalParts.join(', ') });
        const metalExtras: string[] = [];
        if (order.strassQtd) metalExtras.push(`strass x${order.strassQtd}`);
        if (order.cruzMetalQtd) metalExtras.push(`cruz x${order.cruzMetalQtd}`);
        if (order.bridaoMetalQtd) metalExtras.push(`bridao x${order.bridaoMetalQtd}`);
        if (metalExtras.length) metaisFields.push({ label: '', value: metalExtras.join(', ') });
      }
      if (metaisFields.length) categories.push({ title: 'METAIS', fields: metaisFields });

      // ACESSÓRIOS
      const acessorioFields: CatField[] = [];
      if (order.acessorios) acessorioFields.push({ label: '', value: order.acessorios });
      if (acessorioFields.length) categories.push({ title: 'ACESSÓRIOS', fields: acessorioFields });

      // EXTRAS
      const extrasFields: CatField[] = [];
      if (order.trisce === 'Sim' && order.triceDesc) extrasFields.push({ label: 'Tricê:', value: order.triceDesc.toLowerCase() });
      if (order.tiras === 'Sim' && order.tirasDesc) extrasFields.push({ label: 'Tiras:', value: order.tirasDesc.toLowerCase() });
      if (order.costuraAtras === 'Sim') extrasFields.push({ label: 'Costura atrás:', value: 'sim' });
      if (order.estampa === 'Sim') extrasFields.push({ label: 'Estampa:', value: order.estampaDesc || 'sim' });
      if (order.pintura === 'Sim') extrasFields.push({ label: 'Pintura:', value: order.pinturaDesc || 'sim' });
      if (order.carimbo) extrasFields.push({ label: 'Carimbo:', value: `${order.carimbo}${order.carimboDesc ? ' - ' + order.carimboDesc : ''}` });
      if (order.adicionalDesc) extrasFields.push({ label: 'Adicional:', value: `${order.adicionalDesc} R$${order.adicionalValor || 0}` });
      if (extrasFields.length) categories.push({ title: 'EXTRAS', fields: extrasFields });

      // OBS
      if (order.observacao) {
        categories.push({ title: 'OBS', fields: [{ label: '', value: order.observacao }] });
      }

      // 3-column layout
      const colWidth = (pw - m * 2 - 8) / 3;
      const col1X = m + 3;
      const col2X = col1X + colWidth + 2;
      const col3X = col2X + colWidth + 2;

      // Estimate height for each category (considering text wrapping)
      const estimateCatHeight = (cat: Category): number => {
        let h = fieldGap; // title line
        cat.fields.forEach(f => {
          const labelW = f.label ? doc.getTextWidth(f.label) + 3 : 0;
          doc.setFontSize(fs);
          const valLines = doc.splitTextToSize(f.value, colWidth - labelW - 5);
          h += Math.max(valLines.length, 1) * (fieldGap * 0.8);
        });
        h += catGap;
        return h;
      };

      const catHeights = categories.map(c => estimateCatHeight(c));

      // Greedy distribution into 3 columns
      const colHeights = [0, 0, 0];
      const colCats: number[][] = [[], [], []];
      catHeights.forEach((h, i) => {
        const minCol = colHeights.indexOf(Math.min(...colHeights));
        colCats[minCol].push(i);
        colHeights[minCol] += h;
      });

      // Render categories with text wrapping
      const renderCats = (catIndices: number[], startX: number) => {
        let cy = descTop;
        catIndices.forEach(ci => {
          const cat = categories[ci];
          if (cy > descBottom) return;
          // Title
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text(cat.title, startX, cy);
          cy += fieldGap;

          cat.fields.forEach(f => {
            if (cy > descBottom) return;
            doc.setFontSize(fs);
            if (f.label) {
              doc.setFont('helvetica', 'bold');
              doc.text(f.label, startX, cy);
              const lw = doc.getTextWidth(f.label) + 3;
              doc.setFont('helvetica', 'normal');
              const valLines = doc.splitTextToSize(f.value, colWidth - lw - 3);
              valLines.forEach((line: string, li: number) => {
                if (cy + li * (fieldGap * 0.8) <= descBottom) {
                  doc.text(line, startX + lw, cy + li * (fieldGap * 0.8));
                }
              });
              cy += Math.max(valLines.length, 1) * (fieldGap * 0.8);
            } else {
              doc.setFont('helvetica', 'normal');
              const valLines = doc.splitTextToSize(f.value, colWidth - 3);
              valLines.forEach((line: string, li: number) => {
                if (cy + li * (fieldGap * 0.8) <= descBottom) {
                  doc.text(line, startX, cy + li * (fieldGap * 0.8));
                }
              });
              cy += Math.max(valLines.length, 1) * (fieldGap * 0.8);
            }
          });
          cy += catGap;
        });
      };

      renderCats(colCats[0], col1X);
      renderCats(colCats[1], col2X);
      renderCats(colCats[2], col3X);

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

      // Stub 3: (no title - more space for info)
      stubX += stubW;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      const solaStubText = `${order.solado || 'BORRACHA'}`.toUpperCase();
      const bicoStubText = `${order.formatoBico || 'QUADRADO'}`.toUpperCase();
      const corSolaStubText = `${order.corSola || 'PRETA'}`.toUpperCase();
      doc.text(`SOLA: ${solaStubText}`, stubX + 2, stubTop + 4);
      doc.text(`BICO: ${bicoStubText}`, stubX + 2, stubTop + 7);
      doc.text(`COR: ${corSolaStubText}`, stubX + 2, stubTop + 10);
      doc.setFontSize(8);
      doc.text(`FORMA: ${orderNumClean}`, stubX + 2, stubTop + 14);
      doc.text(`NUM: ${order.tamanho}`, stubX + 2, stubTop + 17.5);
      if (bcUrl) {
        try { doc.addImage(bcUrl, 'PNG', stubX + 6, stubTop + 19, stubW - 12, 6); } catch {}
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(orderNumClean, stubX + stubW / 2, stubTop + 28, { align: 'center' });
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

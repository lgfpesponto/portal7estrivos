import { useState, useMemo } from 'react';
import { useAuth, Order, orderBarcodeValue, PRODUCTION_STATUSES } from '@/contexts/AuthContext';
import { FileText, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import {
  MODELOS, ACESSORIOS, BORDADOS_CANO, BORDADOS_GASPEA, BORDADOS_TALONEIRA, COURO_PRECOS, SOLADO, COR_SOLA, COR_VIRA,
  CARIMBO, AREA_METAL, DESENVOLVIMENTO,
  SOB_MEDIDA_PRECO, NOME_BORDADO_PRECO, ESTAMPA_PRECO, PINTURA_PRECO,
  TRICE_PRECO, TIRAS_PRECO, COSTURA_ATRAS_PRECO, STRASS_PRECO, CRUZ_METAL_PRECO,
  BRIDAO_METAL_PRECO, LASER_CANO_PRECO, LASER_GASPEA_PRECO, GLITTER_CANO_PRECO, GLITTER_GASPEA_PRECO,
} from '@/lib/orderFieldsConfig';
import { BELT_SIZES, BORDADO_P_PRECO, NOME_BORDADO_CINTO_PRECO, BELT_CARIMBO, EXTRA_DETAIL_LABELS } from '@/lib/extrasConfig';

const formatDateBR = (date: string) => {
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
};

const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function barcodeDataUrl(value: string, opts?: { width?: number; height?: number }): string {
  const canvas = document.createElement('canvas');
  try {
    JsBarcode(canvas, value, { format: 'CODE128', width: opts?.width ?? 2, height: opts?.height ?? 50, displayValue: false, margin: 2 });
    return canvas.toDataURL('image/png');
  } catch { return ''; }
}

type ReportType = 'escalacao' | 'forro' | 'pesponto' | 'bordados' | 'expedicao' | 'cobranca' | 'extras_cintos';

interface SpecializedReportsProps {
  reports: ReportType[];
  showTitle?: boolean;
}

const REPORT_LABELS: Record<ReportType, string> = {
  escalacao: 'Escalação',
  forro: 'Forro',
  pesponto: 'Metais',
  bordados: 'Bordados',
  expedicao: 'Expedição',
  cobranca: 'Cobrança',
  extras_cintos: 'Extras / Cintos',
};

const PESPONTO_STATUSES = ['Pesponto 01', 'Pesponto 02', 'Pesponto 03', 'Pesponto 04', 'Pesponto 05', 'Pespontando'];
const BORDADO_STATUSES = ['Bordado Dinei', 'Bordado Sandro', 'Bordado 7Estrivos'];

/** Products available for the extras_cintos grouping report */
const EXTRAS_CINTOS_PRODUCTS: { value: string; label: string }[] = [
  { value: 'cinto', label: 'Cinto' },
  { value: 'kit_faca', label: 'Kit Faca' },
  { value: 'kit_canivete', label: 'Kit Canivete' },
  { value: 'desmanchar', label: 'Desmanchar' },
  { value: 'tiras_laterais', label: 'Tiras Laterais' },
  { value: 'gravata_country', label: 'Gravata Country' },
  { value: 'carimbo_fogo', label: 'Carimbo a Fogo' },
  { value: 'revitalizador', label: 'Revitalizador' },
  { value: 'kit_revitalizador', label: 'Kit 2 Revitalizador' },
  { value: 'adicionar_metais', label: 'Adicionar Metais' },
  { value: 'chaveiro_carimbo', label: 'Chaveiro c/ Carimbo' },
  { value: 'bainha_cartao', label: 'Bainha de Cartão' },
  { value: 'regata', label: 'Regata' },
  { value: 'bota_pronta_entrega', label: 'Bota Pronta Entrega' },
];

/** Groupable fields per product type */
const PRODUCT_GROUPABLE_FIELDS: Record<string, { key: string; label: string }[]> = {
  cinto: [
    { key: 'tamanhoCinto', label: 'Tamanho' },
    { key: 'tipoCouro', label: 'Tipo de Couro' },
    { key: 'corCouro', label: 'Cor do Couro' },
    { key: 'bordadoP', label: 'Bordado P' },
    { key: 'nomeBordado', label: 'Nome Bordado' },
    { key: 'carimbo', label: 'Carimbo' },
  ],
  kit_faca: [
    { key: 'tipoCouro', label: 'Tipo de Couro' },
    { key: 'corCouro', label: 'Cor do Couro' },
    { key: 'vaiCanivete', label: 'Vai a Faca' },
  ],
  kit_canivete: [
    { key: 'tipoCouro', label: 'Tipo de Couro' },
    { key: 'corCouro', label: 'Cor do Couro' },
    { key: 'vaiCanivete', label: 'Vai o Canivete' },
  ],
  desmanchar: [
    { key: 'qualSola', label: 'Sola' },
    { key: 'trocaGaspea', label: 'Troca Gáspea' },
  ],
  tiras_laterais: [
    { key: 'corTiras', label: 'Cor das Tiras' },
  ],
  gravata_country: [
    { key: 'corTira', label: 'Cor da Tira' },
    { key: 'tipoMetal', label: 'Tipo de Metal' },
    { key: 'corBridao', label: 'Cor do Bridão' },
  ],
  carimbo_fogo: [
    { key: 'qtdCarimbos', label: 'Qtd. de Carimbos' },
    { key: 'ondeAplicado', label: 'Onde Aplicado' },
  ],
  revitalizador: [
    { key: 'tipoRevitalizador', label: 'Tipo' },
    { key: 'quantidade', label: 'Quantidade' },
  ],
  kit_revitalizador: [
    { key: 'tipoRevitalizador', label: 'Tipo' },
    { key: 'quantidade', label: 'Quantidade' },
  ],
  adicionar_metais: [
    { key: 'metaisSelecionados', label: 'Metais Selecionados' },
  ],
  regata: [
    { key: 'corRegata', label: 'Cor' },
    { key: 'descBordadoRegata', label: 'Bordado' },
  ],
  bota_pronta_entrega: [
    { key: 'descricaoProduto', label: 'Descrição do Produto' },
  ],
};

// ── Helper: draw a tabular header row ──
function drawTableHeader(doc: jsPDF, y: number, mx: number, cw: number, headers: { label: string; x: number }[]) {
  doc.setFillColor(232, 232, 232);
  doc.rect(mx, y, cw, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  headers.forEach(h => doc.text(h.label, h.x, y + 5.5));
  return y + 8;
}

// ── Helper: draw a data row with border ──
function drawTableRow(doc: jsPDF, y: number, mx: number, cw: number, colWidths: number[], rowH: number) {
  doc.setLineWidth(0.2);
  doc.rect(mx, y, cw, rowH);
  let x = mx;
  colWidths.forEach(w => {
    x += w;
    if (x < mx + cw) doc.line(x, y, x, y + rowH);
  });
}

const SpecializedReports = ({ reports, showTitle = true }: SpecializedReportsProps) => {
  const { allOrders, orders, isAdmin } = useAuth();
  const sourceOrders = isAdmin ? allOrders : orders;

  const [activeReport, setActiveReport] = useState<ReportType | null>(null);
  const [filterVendedor, setFilterVendedor] = useState('todos');
  const [filterProgresso, setFilterProgresso] = useState('todos');

  // Extras/Cintos report state
  const [filterTipoProduto, setFilterTipoProduto] = useState('');
  const [filterCampos, setFilterCampos] = useState<Set<string>>(new Set());

  const vendedores = useMemo(() => [...new Set(sourceOrders.map(o => o.vendedor))].sort(), [sourceOrders]);

  const resetFilters = () => {
    setFilterVendedor('todos');
    setFilterProgresso('todos');
    setFilterTipoProduto('');
    setFilterCampos(new Set());
  };

  const availableFields = useMemo(() => {
    return PRODUCT_GROUPABLE_FIELDS[filterTipoProduto] || [];
  }, [filterTipoProduto]);

  const toggleCampo = (key: string) => {
    setFilterCampos(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // ── Escalação: tabular format ──
  const generateEscalacaoPDF = () => {
    const filtered = sourceOrders.filter(o => o.status.toLowerCase() === 'pespontando');
    const groups: Record<string, { tamanho: string; solado: string; formatoBico: string; corSola: string; quantidade: number }> = {};
    filtered.forEach(o => {
      const key = `${o.tamanho}|${o.solado}|${o.formatoBico}|${o.corSola || ''}`;
      if (!groups[key]) groups[key] = { tamanho: o.tamanho, solado: o.solado, formatoBico: o.formatoBico, corSola: o.corSola || '', quantidade: 0 };
      groups[key].quantidade += o.quantidade;
    });
    const rows = Object.values(groups).sort((a, b) => Number(a.tamanho) - Number(b.tamanho));

    const doc = new jsPDF();
    const mx = 14;
    const cw = 182;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Escalação — 7ESTRIVOS', mx, 20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`, mx, 27);
    doc.text(`Filtro: Pespontando | Total de pares: ${rows.reduce((s, r) => s + r.quantidade, 0)}`, mx, 32);

    const cols = [30, 55, 45, 35, 17];
    const cx = [mx, mx + cols[0], mx + cols[0] + cols[1], mx + cols[0] + cols[1] + cols[2], mx + cols[0] + cols[1] + cols[2] + cols[3]];

    let y = drawTableHeader(doc, 38, mx, cw, [
      { label: 'TAMANHO', x: cx[0] + 2 },
      { label: 'TIPO DE SOLA', x: cx[1] + 2 },
      { label: 'FORMATO BICO', x: cx[2] + 2 },
      { label: 'COR DA SOLA', x: cx[3] + 2 },
      { label: 'QTD', x: cx[4] + 2 },
    ]);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const rowH = 7;
    rows.forEach(r => {
      if (y + rowH > 280) { doc.addPage(); y = 20; }
      drawTableRow(doc, y, mx, cw, cols, rowH);
      doc.text(r.tamanho, cx[0] + 2, y + 5);
      doc.text(r.solado, cx[1] + 2, y + 5);
      doc.text(r.formatoBico, cx[2] + 2, y + 5);
      doc.text(r.corSola, cx[3] + 2, y + 5);
      doc.text(String(r.quantidade), cx[4] + 2, y + 5);
      y += rowH;
    });

    doc.save('relatorio-escalacao.pdf');
  };

  // ── Forro: tabular format ──
  const generateForroPDF = () => {
    const filtered = sourceOrders.filter(o => filterProgresso === 'todos' || o.status === filterProgresso);
    const groups: Record<string, { modelo: string; tamanho: string; quantidade: number }> = {};
    filtered.forEach(o => {
      const key = `${o.modelo}|${o.tamanho}`;
      if (!groups[key]) groups[key] = { modelo: o.modelo, tamanho: o.tamanho, quantidade: 0 };
      groups[key].quantidade += o.quantidade;
    });
    const rows = Object.values(groups).sort((a, b) => a.modelo.localeCompare(b.modelo) || Number(a.tamanho) - Number(b.tamanho));

    const doc = new jsPDF();
    const mx = 14;
    const cw = 182;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Forro — 7ESTRIVOS', mx, 20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`, mx, 27);
    doc.text(`Filtro progresso: ${filterProgresso === 'todos' ? 'Todos' : filterProgresso}`, mx, 32);

    const cols = [100, 50, 32];
    const cx = [mx, mx + cols[0], mx + cols[0] + cols[1]];

    let y = drawTableHeader(doc, 38, mx, cw, [
      { label: 'MODELO', x: cx[0] + 2 },
      { label: 'TAMANHO', x: cx[1] + 2 },
      { label: 'QTD', x: cx[2] + 2 },
    ]);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const rowH = 7;
    rows.forEach(r => {
      if (y + rowH > 280) { doc.addPage(); y = 20; }
      drawTableRow(doc, y, mx, cw, cols, rowH);
      doc.text(r.modelo, cx[0] + 2, y + 5);
      doc.text(r.tamanho, cx[1] + 2, y + 5);
      doc.text(String(r.quantidade), cx[2] + 2, y + 5);
      y += rowH;
    });

    doc.save('relatorio-forro.pdf');
  };

  // ── Pesponto: tabular format ──
  const generatePespontoPDF = () => {
    const statusFilter = filterProgresso === 'todos' ? PESPONTO_STATUSES : [filterProgresso];
    const filtered = sourceOrders.filter(o => statusFilter.some(s => s.toLowerCase() === o.status.toLowerCase()));

    const doc = new jsPDF();
    const mx = 14;
    const cw = 182;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Pesponto — 7ESTRIVOS', mx, 20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`, mx, 27);
    doc.text(`Filtro: ${filterProgresso === 'todos' ? 'Todos os pespontos' : filterProgresso}`, mx, 32);

    const cols = [25, 40, 70, 25, 22];
    const cx = [mx, mx + cols[0], mx + cols[0] + cols[1], mx + cols[0] + cols[1] + cols[2], mx + cols[0] + cols[1] + cols[2] + cols[3]];

    // Group by status
    const byStatus: Record<string, Order[]> = {};
    filtered.forEach(o => {
      if (!byStatus[o.status]) byStatus[o.status] = [];
      byStatus[o.status].push(o);
    });

    let y = 38;

    Object.entries(byStatus).forEach(([status, ords]) => {
      if (y > 260) { doc.addPage(); y = 20; }
      // Status header
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(status, mx, y + 5);
      y += 8;

      y = drawTableHeader(doc, y, mx, cw, [
        { label: 'Nº PEDIDO', x: cx[0] + 2 },
        { label: 'VENDEDOR', x: cx[1] + 2 },
        { label: 'MODELO', x: cx[2] + 2 },
        { label: 'TAM.', x: cx[3] + 2 },
        { label: 'QTD', x: cx[4] + 2 },
      ]);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      const rowH = 7;
      ords.forEach(o => {
        if (y + rowH > 280) { doc.addPage(); y = 20; }
        drawTableRow(doc, y, mx, cw, cols, rowH);
        doc.text(o.numero, cx[0] + 2, y + 5);
        doc.text(o.vendedor.substring(0, 20), cx[1] + 2, y + 5);
        doc.text(o.modelo.substring(0, 35), cx[2] + 2, y + 5);
        doc.text(o.tamanho, cx[3] + 2, y + 5);
        doc.text(String(o.quantidade), cx[4] + 2, y + 5);
        y += rowH;
      });
      y += 5;
    });

    doc.save('relatorio-pesponto.pdf');
  };

  // ── Bordados: tabular format ──
  const generateBordadosPDF = () => {
    const statusFilter = filterProgresso === 'todos' ? BORDADO_STATUSES : [filterProgresso];
    const filtered = sourceOrders.filter(o => statusFilter.some(s => s.toLowerCase() === o.status.toLowerCase()));

    const doc = new jsPDF();
    const mx = 14;
    const cw = 182;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Bordados — 7ESTRIVOS', mx, 20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`, mx, 27);
    doc.text(`Filtro: ${filterProgresso === 'todos' ? 'Todos os bordados' : filterProgresso}`, mx, 32);

    const cols = [25, 35, 95, 27];
    const cx = [mx, mx + cols[0], mx + cols[0] + cols[1], mx + cols[0] + cols[1] + cols[2]];

    const byStatus: Record<string, Order[]> = {};
    filtered.forEach(o => {
      if (!byStatus[o.status]) byStatus[o.status] = [];
      byStatus[o.status].push(o);
    });

    let y = 38;

    Object.entries(byStatus).forEach(([status, ords]) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(status, mx, y + 5);
      y += 8;

      y = drawTableHeader(doc, y, mx, cw, [
        { label: 'Nº PEDIDO', x: cx[0] + 2 },
        { label: 'VENDEDOR', x: cx[1] + 2 },
        { label: 'BORDADOS', x: cx[2] + 2 },
        { label: 'QTD', x: cx[3] + 2 },
      ]);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      const rowH = 7;
      ords.forEach(o => {
        if (y + rowH > 280) { doc.addPage(); y = 20; }
        drawTableRow(doc, y, mx, cw, cols, rowH);
        doc.text(o.numero, cx[0] + 2, y + 5);
        doc.text(o.vendedor.substring(0, 18), cx[1] + 2, y + 5);
        const bordados = [o.bordadoCano, o.bordadoGaspea, o.bordadoTaloneira].filter(Boolean).join(', ') || 'sem bordado';
        const bordLines = doc.splitTextToSize(bordados, cols[2] - 4);
        doc.text(bordLines[0] || '', cx[2] + 2, y + 5);
        doc.text(String(o.quantidade), cx[3] + 2, y + 5);
        y += rowH;
      });
      y += 5;
    });

    doc.save('relatorio-bordados.pdf');
  };

  // ── Expedição: tabular A4 layout ──
  const generateExpedicaoPDF = () => {
    const filtered = sourceOrders.filter(o =>
      o.status.toLowerCase() === 'expedição' &&
      (filterVendedor === 'todos' || o.vendedor === filterVendedor)
    );

    const doc = new jsPDF('p', 'mm', 'a4');
    const pw = 210;
    const mx = 14;
    const cw = pw - mx * 2;
    const geradoEm = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const vendedorLabel = filterVendedor === 'todos' ? 'Todos vendedores' : filterVendedor;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Expedição  [${geradoEm} — ${vendedorLabel}]`, mx, 20);

    const cols = [30, 50, 20, 35, cw - 30 - 50 - 20 - 35];
    const cx = [mx, mx + cols[0], mx + cols[0] + cols[1], mx + cols[0] + cols[1] + cols[2], mx + cols[0] + cols[1] + cols[2] + cols[3]];

    let y = 30;
    const rowH = 16;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(232, 232, 232);
    doc.rect(mx, y, cw, 8, 'F');
    doc.text('Nº PEDIDO', cx[0] + 2, y + 5.5);
    doc.text('CÓD. BARRAS', cx[1] + 2, y + 5.5);
    doc.text('QTD', cx[2] + 2, y + 5.5);
    doc.text('PREÇO', cx[3] + 2, y + 5.5);
    doc.text('ASSINATURA', cx[4] + 2, y + 5.5);
    y += 8;

    let totalValor = 0;
    let totalQtd = 0;

    doc.setFont('helvetica', 'normal');
    filtered.forEach(o => {
      if (y + rowH > 280) { doc.addPage(); y = 20; }
      doc.setLineWidth(0.2);
      doc.rect(mx, y, cw, rowH);
      cols.reduce((x, w) => { doc.line(x + w, y, x + w, y + rowH); return x + w; }, mx);

      doc.setFontSize(9);
      doc.text(o.numero, cx[0] + 2, y + 6);

      const bcVal = orderBarcodeValue(o.numero);
      const bcUrl = barcodeDataUrl(bcVal, { width: 2, height: 40 });
      if (bcUrl) {
        try { doc.addImage(bcUrl, 'PNG', cx[1] + 2, y + 2, cols[1] - 4, 10); } catch {}
      }

      doc.text(String(o.quantidade), cx[2] + 2, y + 6);
      doc.text(formatCurrency(o.preco * o.quantidade), cx[3] + 2, y + 6);
      doc.setLineWidth(0.3);
      doc.line(cx[4] + 4, y + rowH - 4, cx[4] + cols[4] - 4, y + rowH - 4);

      y += rowH;
      totalValor += o.preco * o.quantidade;
      totalQtd += o.quantidade;
    });

    if (y + 10 > 285) { doc.addPage(); y = 20; }
    doc.setFillColor(232, 232, 232);
    doc.rect(mx, y, cw, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TOTAL', cx[0] + 2, y + 7);
    doc.text(String(totalQtd), cx[2] + 2, y + 7);
    doc.text(formatCurrency(totalValor), cx[3] + 2, y + 7);

    doc.save('relatorio-expedicao.pdf');
  };

  // ── Cobrança: tabular A4 layout ──
  const generateCobrancaPDF = () => {
    const filtered = sourceOrders.filter(o =>
      o.status.toLowerCase() === 'entregue' &&
      (filterVendedor === 'todos' || o.vendedor === filterVendedor)
    );

    const doc = new jsPDF('p', 'mm', 'a4');
    const pw = 210;
    const mx = 14;
    const cw = pw - mx * 2;
    const geradoEm = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const vendedorLabel = filterVendedor === 'todos' ? 'Todos vendedores' : filterVendedor;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Cobrança  [${geradoEm} — ${vendedorLabel}]`, mx, 20);

    const cols = [25, 80, 15, 30, cw - 25 - 80 - 15 - 30];
    const cx = [mx, mx + cols[0], mx + cols[0] + cols[1], mx + cols[0] + cols[1] + cols[2], mx + cols[0] + cols[1] + cols[2] + cols[3]];

    let y = 30;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(232, 232, 232);
    doc.rect(mx, y, cw, 8, 'F');
    doc.text('Nº PEDIDO', cx[0] + 1, y + 5.5);
    doc.text('COMPOSIÇÃO', cx[1] + 1, y + 5.5);
    doc.text('QTD', cx[2] + 1, y + 5.5);
    doc.text('PREÇO', cx[3] + 1, y + 5.5);
    doc.text('PAGO', cx[4] + 1, y + 5.5);
    y += 8;

    let totalValor = 0;
    let totalQtd = 0;

    doc.setFont('helvetica', 'normal');
    filtered.forEach(o => {
      const priceItems: [string, number][] = [];

      if (o.tipoExtra === 'cinto' && o.extraDetalhes) {
        const det = o.extraDetalhes as any;
        priceItems.push(['Cinto', 0]);
        const sizeEntry = BELT_SIZES.find(s => s.label === det.tamanhoCinto);
        if (sizeEntry) priceItems.push([`Tamanho: ${sizeEntry.label}`, sizeEntry.preco]);
        if (det.bordadoP === 'Sim') priceItems.push(['Bordado P', BORDADO_P_PRECO]);
        if (det.nomeBordado === 'Sim') priceItems.push(['Nome Bordado', NOME_BORDADO_CINTO_PRECO]);
        const carimboEntry = BELT_CARIMBO.find(c => c.label === det.carimbo);
        if (carimboEntry) priceItems.push([det.carimbo, carimboEntry.preco]);
      } else if (o.tipoExtra && o.extraDetalhes) {
        const det = o.extraDetalhes as any;
        const extraLabel = o.modelo.replace('Extra — ', '');

        switch (o.tipoExtra) {
          case 'desmanchar': {
            priceItems.push(['Desmanchar (base)', 65]);
            if (det.qualSola === 'Preta borracha') priceItems.push(['Sola preta borracha', 25]);
            else if (det.qualSola === 'De cor borracha') priceItems.push(['Sola de cor borracha', 40]);
            else if (det.qualSola === 'De couro') priceItems.push(['Sola de couro', 60]);
            if (det.trocaGaspea === 'Sim') priceItems.push(['Troca Gáspea/Taloneira', 35]);
            break;
          }
          case 'kit_canivete': {
            priceItems.push(['Kit Canivete', 30]);
            if (det.vaiCanivete === 'Sim') priceItems.push(['Com canivete', 30]);
            break;
          }
          case 'kit_faca': {
            priceItems.push(['Kit Faca', 35]);
            if (det.vaiCanivete === 'Sim') priceItems.push(['Com faca', 35]);
            break;
          }
          case 'carimbo_fogo': {
            const qty = parseInt(det.qtdCarimbos) || 1;
            priceItems.push([`Carimbo a Fogo (${qty} un.)`, qty >= 4 ? 40 : 20]);
            break;
          }
          case 'revitalizador': {
            const qty = parseInt(det.quantidade) || 1;
            priceItems.push([`Revitalizador (${qty} un.)`, 10 * qty]);
            break;
          }
          case 'kit_revitalizador': {
            const qty = parseInt(det.quantidade) || 1;
            priceItems.push([`Kit 2 Revitalizador (${qty} un.)`, 26 * qty]);
            break;
          }
          case 'adicionar_metais': {
            const sel = det.metaisSelecionados || [];
            if (sel.includes('Bola grande')) priceItems.push(['Bola grande', 15]);
            if (sel.includes('Strass')) {
              const qtd = parseInt(det.qtdStrass) || 1;
              priceItems.push([`Strass (${qtd} un.)`, 0.60 * qtd]);
            }
            break;
          }
          case 'bota_pronta_entrega': {
            priceItems.push([det.descricaoProduto || 'Bota Pronta Entrega', parseFloat(det.valorManual) || o.preco]);
            break;
          }
          default:
            priceItems.push([extraLabel, o.preco]);
            break;
        }
      } else {
        const modeloP = MODELOS.find(m => m.label === o.modelo)?.preco;
        if (modeloP) priceItems.push(['Modelo: ' + o.modelo, modeloP]);
        if (o.sobMedida) priceItems.push(['Sob Medida', SOB_MEDIDA_PRECO]);
        if (o.acessorios) {
          o.acessorios.split(', ').filter(Boolean).forEach(a => {
            const p = ACESSORIOS.find(x => x.label === a)?.preco;
            if (p) priceItems.push([a, p]);
          });
        }
        [o.couroCano, o.couroGaspea, o.couroTaloneira].forEach(t => {
          if (t && COURO_PRECOS[t]) priceItems.push(['Couro: ' + t, COURO_PRECOS[t]]);
        });
        const desenvP = DESENVOLVIMENTO.find(d => d.label === o.desenvolvimento)?.preco;
        if (desenvP) priceItems.push(['Desenvolvimento: ' + o.desenvolvimento, desenvP]);
        // Bordados — use region-specific price lists
        const bordadoLists: [string | undefined, typeof BORDADOS_CANO][] = [
          [o.bordadoCano, BORDADOS_CANO],
          [o.bordadoGaspea, BORDADOS_GASPEA],
          [o.bordadoTaloneira, BORDADOS_TALONEIRA],
        ];
        bordadoLists.forEach(([bStr, list]) => {
          if (bStr) bStr.split(', ').filter(Boolean).forEach(b => {
            const p = list.find(x => x.label === b)?.preco;
            if (p) priceItems.push([b.includes('Bordado Variado') ? (b + ' (variado)') : b, p]);
          });
        });
        if (o.nomeBordadoDesc || o.personalizacaoNome) priceItems.push(['Nome Bordado', NOME_BORDADO_PRECO]);
        if (o.laserCano) priceItems.push(['Laser Cano', LASER_CANO_PRECO]);
        if (o.corGlitterCano) priceItems.push(['Glitter/Tecido Cano', GLITTER_CANO_PRECO]);
        if (o.laserGaspea) priceItems.push(['Laser Gáspea', LASER_GASPEA_PRECO]);
        if (o.corGlitterGaspea) priceItems.push(['Glitter/Tecido Gáspea', GLITTER_GASPEA_PRECO]);
        if (o.pintura === 'Sim') priceItems.push(['Pintura', PINTURA_PRECO]);
        if (o.estampa === 'Sim') priceItems.push(['Estampa', ESTAMPA_PRECO]);
        const areaP = AREA_METAL.find(a => a.label === o.metais)?.preco;
        if (areaP) priceItems.push(['Área Metal: ' + o.metais, areaP]);
        if (o.strassQtd) priceItems.push([`Strass (${o.strassQtd} un.)`, o.strassQtd * STRASS_PRECO]);
        if (o.cruzMetalQtd) priceItems.push([`Cruz metal (${o.cruzMetalQtd} un.)`, o.cruzMetalQtd * CRUZ_METAL_PRECO]);
        if (o.bridaoMetalQtd) priceItems.push([`Bridão metal (${o.bridaoMetalQtd} un.)`, o.bridaoMetalQtd * BRIDAO_METAL_PRECO]);
        if (o.trisce === 'Sim') priceItems.push(['Tricê', TRICE_PRECO]);
        if (o.tiras === 'Sim') priceItems.push(['Tiras', TIRAS_PRECO]);
        const soladoP = SOLADO.find(s => s.label === o.solado)?.preco;
        if (soladoP) priceItems.push(['Solado: ' + o.solado, soladoP]);
        const corSolaP = COR_SOLA.find(c => c.label === o.corSola)?.preco;
        if (corSolaP) priceItems.push(['Cor Sola: ' + o.corSola, corSolaP]);
        const corViraP = (o.corVira && !['Bege', 'Neutra'].includes(o.corVira)) ? (COR_VIRA.find(c => c.label === o.corVira)?.preco || 0) : 0;
        if (corViraP) priceItems.push(['Cor Vira: ' + o.corVira, corViraP]);
        if (o.costuraAtras === 'Sim') priceItems.push(['Costura Atrás', COSTURA_ATRAS_PRECO]);
        const carimboP = CARIMBO.find(c => c.label === o.carimbo)?.preco;
        if (carimboP) priceItems.push([o.carimbo!, carimboP]);
        if (o.adicionalValor && o.adicionalValor > 0) priceItems.push(['Adicional: ' + (o.adicionalDesc || ''), o.adicionalValor]);
      }

      const orderTotal = o.tipoExtra ? o.preco : priceItems.reduce((s, [, v]) => s + v, 0);
      const compText = priceItems.map(([name, val]) => `${name} ${formatCurrency(val)}`).join('\n');

      doc.setFontSize(6);
      const lines = doc.splitTextToSize(compText, cols[1] - 4);
      const rowH = Math.max(12, lines.length * 3.5 + 6);

      if (y + rowH > 280) { doc.addPage(); y = 20; }

      doc.setLineWidth(0.2);
      doc.rect(mx, y, cw, rowH);
      cols.reduce((x, w) => { doc.line(x + w, y, x + w, y + rowH); return x + w; }, mx);

      doc.setFontSize(8);
      doc.text(o.numero, cx[0] + 1, y + 5);

      doc.setFontSize(6);
      doc.text(lines, cx[1] + 1, y + 4);

      doc.setFontSize(8);
      doc.text(String(o.quantidade), cx[2] + 1, y + 5);
      doc.text(formatCurrency(orderTotal), cx[3] + 1, y + 5);

      const cbSize = 4;
      doc.rect(cx[4] + (cols[4] - cbSize) / 2, y + (rowH - cbSize) / 2, cbSize, cbSize);

      y += rowH;
      totalValor += orderTotal;
      totalQtd += o.quantidade;
    });

    if (y + 10 > 285) { doc.addPage(); y = 20; }
    doc.setFillColor(232, 232, 232);
    doc.rect(mx, y, cw, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TOTAL', cx[0] + 1, y + 7);
    doc.text(String(totalQtd), cx[2] + 1, y + 7);
    doc.text(formatCurrency(totalValor), cx[3] + 1, y + 7);

    doc.save('relatorio-cobranca.pdf');
  };

  // ── Extras / Cintos: grouping report ──
  const generateExtrasCintosPDF = () => {
    if (!filterTipoProduto) return;
    const selectedFields = Array.from(filterCampos);
    if (selectedFields.length === 0) return;

    // Filter orders by tipoExtra
    const filtered = sourceOrders.filter(o => o.tipoExtra === filterTipoProduto && o.extraDetalhes);

    // Group by combination of selected fields
    const groups: Record<string, { fields: Record<string, string>; quantidade: number }> = {};
    filtered.forEach(o => {
      const det = o.extraDetalhes as any;
      const fieldValues: Record<string, string> = {};
      selectedFields.forEach(key => {
        let val = det[key];
        if (Array.isArray(val)) val = val.join(', ');
        fieldValues[key] = val != null && val !== '' ? String(val) : '(vazio)';
      });
      const groupKey = selectedFields.map(k => fieldValues[k]).join('|||');
      if (!groups[groupKey]) groups[groupKey] = { fields: fieldValues, quantidade: 0 };
      groups[groupKey].quantidade += o.quantidade;
    });

    const rows = Object.values(groups).sort((a, b) => b.quantidade - a.quantidade);
    const productLabel = EXTRAS_CINTOS_PRODUCTS.find(p => p.value === filterTipoProduto)?.label || filterTipoProduto;

    const doc = new jsPDF();
    const mx = 14;
    const cw = 182;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Relatório: ${productLabel} — 7ESTRIVOS`, mx, 20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`, mx, 27);
    doc.text(`Total de pedidos encontrados: ${filtered.length} | Combinações: ${rows.length}`, mx, 32);

    // Build columns dynamically: one per selected field + Qtd Total
    const fieldLabels = selectedFields.map(k => {
      const found = availableFields.find(f => f.key === k);
      return found ? found.label : (EXTRA_DETAIL_LABELS[k] || k);
    });
    const totalCols = fieldLabels.length + 1; // +1 for Qtd Total
    const qtdColW = 25;
    const fieldColW = Math.floor((cw - qtdColW) / fieldLabels.length);

    const headerItems = fieldLabels.map((label, i) => ({
      label: label.toUpperCase(),
      x: mx + i * fieldColW + 2,
    }));
    headerItems.push({ label: 'QTD TOTAL', x: mx + fieldLabels.length * fieldColW + 2 });

    const colWidths = fieldLabels.map(() => fieldColW);
    colWidths.push(qtdColW);

    let y = drawTableHeader(doc, 38, mx, cw, headerItems);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const rowH = 8;
    rows.forEach(r => {
      if (y + rowH > 280) { doc.addPage(); y = 20; }
      drawTableRow(doc, y, mx, cw, colWidths, rowH);
      selectedFields.forEach((key, i) => {
        const text = r.fields[key] || '';
        const truncated = text.length > 30 ? text.substring(0, 28) + '...' : text;
        doc.text(truncated, mx + i * fieldColW + 2, y + 5.5);
      });
      doc.setFont('helvetica', 'bold');
      doc.text(String(r.quantidade), mx + fieldLabels.length * fieldColW + 2, y + 5.5);
      doc.setFont('helvetica', 'normal');
      y += rowH;
    });

    // Footer total
    if (y + 10 > 285) { doc.addPage(); y = 20; }
    doc.setFillColor(232, 232, 232);
    doc.rect(mx, y, cw, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TOTAL', mx + 2, y + 7);
    doc.text(String(rows.reduce((s, r) => s + r.quantidade, 0)), mx + fieldLabels.length * fieldColW + 2, y + 7);

    doc.save(`relatorio-${filterTipoProduto}.pdf`);
  };

  const generateReport = () => {
    if (!activeReport) return;
    switch (activeReport) {
      case 'escalacao': generateEscalacaoPDF(); break;
      case 'forro': generateForroPDF(); break;
      case 'pesponto': generatePespontoPDF(); break;
      case 'bordados': generateBordadosPDF(); break;
      case 'expedicao': generateExpedicaoPDF(); break;
      case 'cobranca': generateCobrancaPDF(); break;
      case 'extras_cintos': generateExtrasCintosPDF(); break;
    }
  };

  const needsProgressFilter = activeReport === 'forro' || activeReport === 'pesponto' || activeReport === 'bordados';
  const needsVendedorFilter = activeReport === 'expedicao' || activeReport === 'cobranca';
  const needsExtrasCintosFilter = activeReport === 'extras_cintos';

  const progressOptions = useMemo(() => {
    if (activeReport === 'pesponto') return PESPONTO_STATUSES;
    if (activeReport === 'bordados') return BORDADO_STATUSES;
    return ['Aguardando', 'Corte', 'Sem bordado', ...BORDADO_STATUSES, ...PESPONTO_STATUSES, 'Montagem', 'Revisão', 'Expedição'];
  }, [activeReport]);

  return (
    <div className="bg-card rounded-xl p-6 western-shadow">
      {showTitle && (
        <h2 className="text-xl font-display font-bold flex items-center gap-2 mb-4">
          <FileText className="text-primary" size={22} /> Relatórios Especializados
        </h2>
      )}

      {/* Report buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {reports.map(r => (
          <button
            key={r}
            onClick={() => { setActiveReport(activeReport === r ? null : r); resetFilters(); }}
            className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors ${
              activeReport === r ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-primary/10'
            }`}
          >
            {REPORT_LABELS[r]}
          </button>
        ))}
      </div>

      {/* Filters when a report is selected */}
      {activeReport && (
        <div className="border-t border-border pt-4 space-y-3">
          <p className="text-sm font-semibold">{REPORT_LABELS[activeReport]}</p>

          {needsProgressFilter && (
            <div>
              <label className="block text-xs font-semibold mb-1">Progresso de Produção</label>
              <Select value={filterProgresso} onValueChange={setFilterProgresso}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {progressOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {needsVendedorFilter && (
            <div>
              <label className="block text-xs font-semibold mb-1">Vendedor</label>
              <Select value={filterVendedor} onValueChange={setFilterVendedor}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos vendedores</SelectItem>
                  {vendedores.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {needsExtrasCintosFilter && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Produto</label>
                <Select value={filterTipoProduto} onValueChange={(v) => { setFilterTipoProduto(v); setFilterCampos(new Set()); }}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Selecione o produto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {EXTRAS_CINTOS_PRODUCTS.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filterTipoProduto && availableFields.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold mb-2">Campos para agrupar</label>
                  <div className="flex flex-wrap gap-3">
                    {availableFields.map(f => (
                      <label key={f.key} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={filterCampos.has(f.key)}
                          onCheckedChange={() => toggleCampo(f.key)}
                        />
                        {f.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={generateReport}
            disabled={needsExtrasCintosFilter && (!filterTipoProduto || filterCampos.size === 0)}
            className="orange-gradient text-primary-foreground px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} /> GERAR PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default SpecializedReports;

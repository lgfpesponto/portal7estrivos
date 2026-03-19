import { useState, useMemo } from 'react';
import { useAuth, Order, orderBarcodeValue } from '@/contexts/AuthContext';
import { FileText, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import {
  MODELOS, ACESSORIOS, BORDADOS, COURO_PRECOS, SOLADO, COR_SOLA, COR_VIRA,
  CARIMBO, AREA_METAL, DESENVOLVIMENTO,
  SOB_MEDIDA_PRECO, NOME_BORDADO_PRECO, ESTAMPA_PRECO, PINTURA_PRECO,
  TRICE_PRECO, TIRAS_PRECO, COSTURA_ATRAS_PRECO, STRASS_PRECO, CRUZ_METAL_PRECO,
  BRIDAO_METAL_PRECO, LASER_CANO_PRECO, LASER_GASPEA_PRECO, GLITTER_CANO_PRECO, GLITTER_GASPEA_PRECO,
} from '@/lib/orderFieldsConfig';

const formatDateBR = (date: string) => {
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
};

const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function barcodeDataUrl(value: string, opts?: { width?: number; height?: number }): string {
  const canvas = document.createElement('canvas');
  try {
    JsBarcode(canvas, value, { format: 'CODE128', width: opts?.width ?? 1, height: opts?.height ?? 30, displayValue: false, margin: 2 });
    return canvas.toDataURL('image/png');
  } catch { return ''; }
}

type ReportType = 'escalacao' | 'forro' | 'pesponto' | 'bordados' | 'expedicao' | 'cobranca';

interface SpecializedReportsProps {
  reports: ReportType[];
  showTitle?: boolean;
}

const REPORT_LABELS: Record<ReportType, string> = {
  escalacao: 'Escalação',
  forro: 'Forro',
  pesponto: 'Pesponto',
  bordados: 'Bordados',
  expedicao: 'Expedição',
  cobranca: 'Cobrança',
};

const PESPONTO_STATUSES = ['Pesponto 01', 'Pesponto 02', 'Pesponto 03', 'Pesponto 04', 'Pesponto 05', 'Pespontando'];
const BORDADO_STATUSES = ['Bordado Dinei', 'Bordado Sandro', 'Bordado 7Estrivos'];

const SpecializedReports = ({ reports, showTitle = true }: SpecializedReportsProps) => {
  const { allOrders, orders, isAdmin } = useAuth();
  const sourceOrders = isAdmin ? allOrders : orders;

  const [activeReport, setActiveReport] = useState<ReportType | null>(null);
  const [filterVendedor, setFilterVendedor] = useState('todos');
  const [filterProgresso, setFilterProgresso] = useState('todos');

  const vendedores = useMemo(() => [...new Set(sourceOrders.map(o => o.vendedor))].sort(), [sourceOrders]);

  const resetFilters = () => {
    setFilterVendedor('todos');
    setFilterProgresso('todos');
  };

  // ── Escalação: pedidos em "Pespontando", agrupar por tamanho+sola+bico+corSola ──
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
    doc.setFontSize(16);
    doc.text('Relatório de Escalação — 7ESTRIVOS', 14, 20);
    doc.setFontSize(9);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`, 14, 27);
    doc.text(`Filtro: Pespontando | Total de pares: ${rows.reduce((s, r) => s + r.quantidade, 0)}`, 14, 32);

    let y = 40;
    // Header
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Tamanho', 14, y);
    doc.text('Tipo de Sola', 40, y);
    doc.text('Formato Bico', 90, y);
    doc.text('Cor da Sola', 135, y);
    doc.text('Qtd', 175, y);
    y += 2;
    doc.setLineWidth(0.3);
    doc.line(14, y, 196, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    rows.forEach(r => {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(r.tamanho, 14, y);
      doc.text(r.solado, 40, y);
      doc.text(r.formatoBico, 90, y);
      doc.text(r.corSola, 135, y);
      doc.text(String(r.quantidade), 175, y);
      y += 6;
    });

    doc.save('relatorio-escalacao.pdf');
  };

  // ── Forro: agrupar por modelo+tamanho com filtro por progresso ──
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
    doc.setFontSize(16);
    doc.text('Relatório de Forro — 7ESTRIVOS', 14, 20);
    doc.setFontSize(9);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`, 14, 27);
    doc.text(`Filtro progresso: ${filterProgresso === 'todos' ? 'Todos' : filterProgresso}`, 14, 32);

    let y = 40;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Modelo', 14, y);
    doc.text('Tamanho', 90, y);
    doc.text('Qtd', 175, y);
    y += 2;
    doc.line(14, y, 196, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    rows.forEach(r => {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(r.modelo, 14, y);
      doc.text(r.tamanho, 90, y);
      doc.text(String(r.quantidade), 175, y);
      y += 6;
    });

    doc.save('relatorio-forro.pdf');
  };

  // ── Pesponto: listar pedidos por progresso de pesponto ──
  const generatePespontoPDF = () => {
    const statusFilter = filterProgresso === 'todos' ? PESPONTO_STATUSES : [filterProgresso];
    const filtered = sourceOrders.filter(o => statusFilter.some(s => s.toLowerCase() === o.status.toLowerCase()));

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Relatório de Pesponto — 7ESTRIVOS', 14, 20);
    doc.setFontSize(9);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`, 14, 27);
    doc.text(`Filtro: ${filterProgresso === 'todos' ? 'Todos os pespontos' : filterProgresso}`, 14, 32);

    let y = 40;
    // Group by status
    const byStatus: Record<string, Order[]> = {};
    filtered.forEach(o => {
      if (!byStatus[o.status]) byStatus[o.status] = [];
      byStatus[o.status].push(o);
    });

    Object.entries(byStatus).forEach(([status, ords]) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(status, 14, y);
      y += 6;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      ords.forEach(o => {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(`${o.numero} — ${o.vendedor} — ${o.modelo} tam. ${o.tamanho} — Qtd: ${o.quantidade}`, 14, y);
        y += 5;
      });
      y += 3;
    });

    doc.save('relatorio-pesponto.pdf');
  };

  // ── Bordados: listar pedidos por progresso de bordado ──
  const generateBordadosPDF = () => {
    const statusFilter = filterProgresso === 'todos' ? BORDADO_STATUSES : [filterProgresso];
    const filtered = sourceOrders.filter(o => statusFilter.some(s => s.toLowerCase() === o.status.toLowerCase()));

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Relatório de Bordados — 7ESTRIVOS', 14, 20);
    doc.setFontSize(9);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`, 14, 27);
    doc.text(`Filtro: ${filterProgresso === 'todos' ? 'Todos os bordados' : filterProgresso}`, 14, 32);

    let y = 40;
    const byStatus: Record<string, Order[]> = {};
    filtered.forEach(o => {
      if (!byStatus[o.status]) byStatus[o.status] = [];
      byStatus[o.status].push(o);
    });

    Object.entries(byStatus).forEach(([status, ords]) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(status, 14, y);
      y += 6;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      ords.forEach(o => {
        if (y > 275) { doc.addPage(); y = 20; }
        const bordados = [o.bordadoCano, o.bordadoGaspea, o.bordadoTaloneira].filter(Boolean).join(', ');
        doc.text(`${o.numero} — ${o.vendedor} — ${bordados || 'sem bordado'} — Qtd: ${o.quantidade}`, 14, y);
        y += 5;
      });
      y += 3;
    });

    doc.save('relatorio-bordados.pdf');
  };

  // ── Expedição: tabular A4 layout ──
  const generateExpedicaoPDF = () => {
    const filtered = sourceOrders.filter(o =>
      o.status.toLowerCase() === 'expedição' &&
      (filterVendedor === 'todos' || o.vendedor === filterVendedor)
    ); // includes extras orders with status 'Expedição'

    const doc = new jsPDF('p', 'mm', 'a4');
    const pw = 210;
    const mx = 14;
    const cw = pw - mx * 2; // content width
    const geradoEm = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const vendedorLabel = filterVendedor === 'todos' ? 'Todos vendedores' : filterVendedor;

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Expedição  [${geradoEm} — ${vendedorLabel}]`, mx, 20);

    // Table columns: N. PEDIDO(30), CÓD. BARRAS(50), QTD(20), PREÇO(35), ASSINATURA(rest)
    const cols = [30, 50, 20, 35, cw - 30 - 50 - 20 - 35];
    const colX = cols.reduce<number[]>((acc, w) => { acc.push((acc.length ? acc[acc.length - 1] : mx) + (acc.length ? cols[acc.length - 1] : 0)); return acc; }, []);
    // Fix colX
    const cx = [mx, mx + cols[0], mx + cols[0] + cols[1], mx + cols[0] + cols[1] + cols[2], mx + cols[0] + cols[1] + cols[2] + cols[3]];

    let y = 30;
    const rowH = 16;

    // Header row
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
      // Row border
      doc.setLineWidth(0.2);
      doc.rect(mx, y, cw, rowH);
      // Vertical lines
      cols.reduce((x, w) => { doc.line(x + w, y, x + w, y + rowH); return x + w; }, mx);

      doc.setFontSize(9);
      doc.text(o.numero, cx[0] + 2, y + 6);

      // Barcode
      const bcVal = orderBarcodeValue(o.numero);
      const bcUrl = barcodeDataUrl(bcVal, { width: 1, height: 20 });
      if (bcUrl) {
        try { doc.addImage(bcUrl, 'PNG', cx[1] + 2, y + 2, cols[1] - 4, 10); } catch {}
      }

      doc.text(String(o.quantidade), cx[2] + 2, y + 6);
      doc.text(formatCurrency(o.preco * o.quantidade), cx[3] + 2, y + 6);
      // Signature line inside cell
      doc.setLineWidth(0.3);
      doc.line(cx[4] + 4, y + rowH - 4, cx[4] + cols[4] - 4, y + rowH - 4);

      y += rowH;
      totalValor += o.preco * o.quantidade;
      totalQtd += o.quantidade;
    });

    // Footer total
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

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Cobrança  [${geradoEm} — ${vendedorLabel}]`, mx, 20);

    // Columns: N. PEDIDO(25), COMPOSIÇÃO(80), QTD(15), PREÇO(30), PAGO(rest ~32)
    const cols = [25, 80, 15, 30, cw - 25 - 80 - 15 - 30];
    const cx = [mx, mx + cols[0], mx + cols[0] + cols[1], mx + cols[0] + cols[1] + cols[2], mx + cols[0] + cols[1] + cols[2] + cols[3]];

    let y = 30;

    // Header row
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(232, 232, 232);
    doc.rect(mx, y, cw, 8, 'F');
    doc.text('Nº PEDIDO', cx[0] + 1, y + 5.5);
    doc.text('COMPOSIÇÃO DA BOTA', cx[1] + 1, y + 5.5);
    doc.text('QTD', cx[2] + 1, y + 5.5);
    doc.text('PREÇO', cx[3] + 1, y + 5.5);
    doc.text('PAGO', cx[4] + 1, y + 5.5);
    y += 8;

    let totalValor = 0;
    let totalQtd = 0;

    doc.setFont('helvetica', 'normal');
    filtered.forEach(o => {
      // Build composition with prices
      const priceItems: [string, number][] = [];

      if (o.tipoExtra && o.extraDetalhes) {
        // EXTRAS order — show extra details as composition
        const extraLabel = o.modelo.replace('Extra — ', '');
        priceItems.push([extraLabel, o.preco]);
        // Add detail lines from extraDetalhes
        Object.entries(o.extraDetalhes).forEach(([key, val]) => {
          if (key === 'valor' || key === 'valorTotal' || !val) return;
          if (typeof val === 'object') return;
          // skip internal keys
          if (['tipo', 'numeroPedidoBota'].includes(key)) return;
        });
      } else {
        // Normal boot order composition
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
        [o.bordadoCano, o.bordadoGaspea, o.bordadoTaloneira].forEach(bStr => {
          if (bStr) bStr.split(', ').filter(Boolean).forEach(b => {
            const p = BORDADOS.find(x => x.label === b)?.preco;
            if (p) priceItems.push([b, p]);
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

      // Row border
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

      // Checkbox for PAGO
      const cbSize = 4;
      doc.rect(cx[4] + (cols[4] - cbSize) / 2, y + (rowH - cbSize) / 2, cbSize, cbSize);

      y += rowH;
      totalValor += orderTotal;
      totalQtd += o.quantidade;
    });

    // Footer total
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

  const generateReport = () => {
    if (!activeReport) return;
    switch (activeReport) {
      case 'escalacao': generateEscalacaoPDF(); break;
      case 'forro': generateForroPDF(); break;
      case 'pesponto': generatePespontoPDF(); break;
      case 'bordados': generateBordadosPDF(); break;
      case 'expedicao': generateExpedicaoPDF(); break;
      case 'cobranca': generateCobrancaPDF(); break;
    }
  };

  const needsProgressFilter = activeReport === 'forro' || activeReport === 'pesponto' || activeReport === 'bordados';
  const needsVendedorFilter = activeReport === 'expedicao' || activeReport === 'cobranca';

  const progressOptions = useMemo(() => {
    if (activeReport === 'pesponto') return PESPONTO_STATUSES;
    if (activeReport === 'bordados') return BORDADO_STATUSES;
    // For forro, all production statuses
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

          <button onClick={generateReport} className="orange-gradient text-primary-foreground px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Download size={16} /> GERAR PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default SpecializedReports;

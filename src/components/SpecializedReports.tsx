import { useState, useMemo } from 'react';
import { useAuth, Order, orderBarcodeValue } from '@/contexts/AuthContext';
import { FileText, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';

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

  // ── Expedição: pedidos em expedição com assinatura ──
  const generateExpedicaoPDF = () => {
    const filtered = sourceOrders.filter(o =>
      o.status.toLowerCase() === 'expedição' &&
      (filterVendedor === 'todos' || o.vendedor === filterVendedor)
    );

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Relatório de Expedição — 7ESTRIVOS', 14, 20);
    doc.setFontSize(9);
    const geradoEm = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    doc.text(`Gerado em: ${geradoEm}`, 14, 27);
    doc.text(`Vendedor: ${filterVendedor === 'todos' ? 'Todos' : filterVendedor}`, 14, 32);

    let y = 42;
    let totalValor = 0;
    let totalQtd = 0;

    filtered.forEach((o, i) => {
      if (y > 240) { doc.addPage(); y = 20; }
      const bcVal = orderBarcodeValue(o.numero);
      const bcUrl = barcodeDataUrl(bcVal, { width: 1, height: 20 });

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}. ${o.numero}`, 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`Data criação: ${formatDateBR(o.dataCriacao)}`, 60, y);
      doc.text(`Data relatório: ${geradoEm}`, 120, y);
      y += 5;
      doc.text(`Valor: ${formatCurrency(o.preco * o.quantidade)}`, 14, y);
      doc.text(`Quantidade: ${o.quantidade}`, 80, y);
      doc.text(`Vendedor: ${o.vendedor}`, 120, y);
      y += 5;

      if (bcUrl) {
        try { doc.addImage(bcUrl, 'PNG', 14, y, 50, 10); } catch {}
        y += 12;
      }

      // Signature line
      doc.setLineWidth(0.3);
      doc.line(14, y + 3, 100, y + 3);
      doc.setFontSize(7);
      doc.text('Assinatura', 14, y + 7);
      y += 14;

      totalValor += o.preco * o.quantidade;
      totalQtd += o.quantidade;
    });

    // Summary
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    y += 6;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${filtered.length} pedidos | ${totalQtd} pares | ${formatCurrency(totalValor)}`, 14, y);

    doc.save('relatorio-expedicao.pdf');
  };

  // ── Cobrança: pedidos entregues com composição de valores ──
  const generateCobrancaPDF = () => {
    const filtered = sourceOrders.filter(o =>
      o.status.toLowerCase() === 'entregue' &&
      (filterVendedor === 'todos' || o.vendedor === filterVendedor)
    );

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Relatório de Cobrança — 7ESTRIVOS', 14, 20);
    doc.setFontSize(9);
    const geradoEm = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    doc.text(`Gerado em: ${geradoEm}`, 14, 27);
    doc.text(`Vendedor: ${filterVendedor === 'todos' ? 'Todos' : filterVendedor}`, 14, 32);

    let y = 42;
    let totalValor = 0;
    let totalQtd = 0;

    filtered.forEach((o, i) => {
      if (y > 230) { doc.addPage(); y = 20; }
      const bcVal = orderBarcodeValue(o.numero);
      const bcUrl = barcodeDataUrl(bcVal, { width: 1, height: 18 });

      // Find "Entregue" date from historico
      const entregueHist = o.historico.find(h => h.local.toLowerCase() === 'entregue');
      const dataSaida = entregueHist ? formatDateBR(entregueHist.data) : '—';

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}. ${o.numero}`, 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`Criação: ${formatDateBR(o.dataCriacao)}`, 55, y);
      doc.text(`Saída: ${dataSaida}`, 110, y);
      doc.text(`Qtd: ${o.quantidade}`, 160, y);
      y += 5;
      doc.text(`Vendedor: ${o.vendedor}`, 14, y);
      doc.setFont('helvetica', 'bold');
      doc.text(`Valor: ${formatCurrency(o.preco * o.quantidade)}`, 110, y);
      doc.setFont('helvetica', 'normal');
      y += 5;

      // Composição do pedido
      const composicao: string[] = [];
      if (o.modelo) composicao.push(`Modelo: ${o.modelo}`);
      if (o.solado && o.solado !== 'Borracha') composicao.push(`Solado: ${o.solado}`);
      if (o.bordadoCano) composicao.push(`B. cano: ${o.bordadoCano}`);
      if (o.bordadoGaspea) composicao.push(`B. gáspea: ${o.bordadoGaspea}`);
      if (o.bordadoTaloneira) composicao.push(`B. taloneira: ${o.bordadoTaloneira}`);
      if (o.laserCano) composicao.push(`L. cano: ${o.laserCano}`);
      if (o.laserGaspea) composicao.push(`L. gáspea: ${o.laserGaspea}`);
      if (o.metais) composicao.push(`Metal: ${o.metais}`);
      if (o.acessorios) composicao.push(`Acessórios: ${o.acessorios}`);
      if (o.sobMedida) composicao.push('Sob medida');
      if (o.desenvolvimento) composicao.push(`Desenv: ${o.desenvolvimento}`);
      if (o.adicionalDesc) composicao.push(`Adicional: ${o.adicionalDesc} R$${o.adicionalValor || 0}`);

      if (composicao.length > 0) {
        doc.setFontSize(7);
        doc.text(`Composição: ${composicao.join(' | ')}`, 14, y);
        y += 4;
      }

      if (bcUrl) {
        try { doc.addImage(bcUrl, 'PNG', 14, y, 45, 8); } catch {}
        y += 11;
      }

      y += 3;
      totalValor += o.preco * o.quantidade;
      totalQtd += o.quantidade;
    });

    // Summary
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    y += 6;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${filtered.length} pedidos | ${totalQtd} pares | ${formatCurrency(totalValor)}`, 14, y);

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

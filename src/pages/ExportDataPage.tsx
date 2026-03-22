import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Download, Database, Users, FileText, Loader2, Copy, Check, Code } from 'lucide-react';

interface ExportOption {
  key: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const exportOptions: ExportOption[] = [
  { key: 'orders', label: 'Pedidos (Orders)', icon: <FileText size={20} />, description: 'Todos os pedidos do sistema' },
  { key: 'profiles', label: 'Perfis (Users)', icon: <Users size={20} />, description: 'Dados de perfis dos usuários' },
  { key: 'user_roles', label: 'Papéis de Usuário', icon: <Users size={20} />, description: 'Roles atribuídas aos usuários' },
  { key: 'verification_codes', label: 'Códigos de Verificação', icon: <Database size={20} />, description: 'Códigos de verificação gerados' },
];

const tableSchemas: Record<string, string> = {
  orders: `CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  numero text NOT NULL,
  vendedor text NOT NULL DEFAULT '',
  tamanho text NOT NULL DEFAULT '',
  genero text,
  modelo text NOT NULL DEFAULT '',
  solado text NOT NULL DEFAULT '',
  formato_bico text NOT NULL DEFAULT '',
  cor_vira text NOT NULL DEFAULT '',
  couro_gaspea text NOT NULL DEFAULT '',
  couro_cano text NOT NULL DEFAULT '',
  couro_taloneira text NOT NULL DEFAULT '',
  cor_couro_gaspea text,
  cor_couro_cano text,
  cor_couro_taloneira text,
  bordado_cano text NOT NULL DEFAULT '',
  bordado_gaspea text NOT NULL DEFAULT '',
  bordado_taloneira text NOT NULL DEFAULT '',
  cor_bordado_cano text,
  cor_bordado_gaspea text,
  cor_bordado_taloneira text,
  bordado_variado_desc_cano text,
  bordado_variado_desc_gaspea text,
  bordado_variado_desc_taloneira text,
  personalizacao_nome text NOT NULL DEFAULT '',
  personalizacao_bordado text NOT NULL DEFAULT '',
  nome_bordado_desc text,
  cor_linha text NOT NULL DEFAULT '',
  cor_borrachinha text NOT NULL DEFAULT '',
  trisce text NOT NULL DEFAULT 'Não',
  trice_desc text,
  tiras text NOT NULL DEFAULT 'Não',
  tiras_desc text,
  metais text NOT NULL DEFAULT '',
  tipo_metal text,
  cor_metal text,
  strass_qtd integer,
  cruz_metal_qtd integer,
  bridao_metal_qtd integer,
  acessorios text NOT NULL DEFAULT '',
  desenvolvimento text NOT NULL DEFAULT '',
  sob_medida boolean NOT NULL DEFAULT false,
  sob_medida_desc text,
  observacao text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Em aberto',
  quantidade integer NOT NULL DEFAULT 1,
  preco numeric NOT NULL DEFAULT 0,
  adicional_valor numeric,
  adicional_desc text,
  desconto numeric,
  desconto_justificativa text,
  dias_restantes integer NOT NULL DEFAULT 10,
  data_criacao text NOT NULL,
  hora_criacao text NOT NULL,
  tem_laser boolean NOT NULL DEFAULT false,
  laser_cano text,
  laser_gaspea text,
  laser_taloneira text,
  cor_glitter_cano text,
  cor_glitter_gaspea text,
  cor_glitter_taloneira text,
  estampa text,
  estampa_desc text,
  pintura text,
  pintura_desc text,
  costura_atras text,
  cor_sola text,
  carimbo text,
  carimbo_desc text,
  cor_vivo text,
  forma text,
  tipo_extra text,
  numero_pedido_bota text,
  extra_detalhes jsonb,
  fotos jsonb NOT NULL DEFAULT '[]'::jsonb,
  historico jsonb NOT NULL DEFAULT '[]'::jsonb,
  alteracoes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);`,
  profiles: `CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  nome_completo text NOT NULL DEFAULT '',
  nome_usuario text NOT NULL,
  telefone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  cpf_cnpj text NOT NULL DEFAULT '',
  verificado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);`,
  user_roles: `CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);`,
  verification_codes: `CREATE TABLE public.verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL,
  type text NOT NULL,
  destination text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);`,
};

function jsonToCsv(data: Record<string, unknown>[]): string {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h];
      const str = val === null || val === undefined ? '' : typeof val === 'object' ? JSON.stringify(val) : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function downloadCsv(csv: string, filename: string) {
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeSQL(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

function generateInserts(table: string, data: Record<string, unknown>[]): string {
  if (!data.length) return '-- Nenhum dado encontrado';
  const cols = Object.keys(data[0]);
  return data.map(row => {
    const vals = cols.map(c => escapeSQL(row[c])).join(', ');
    return `INSERT INTO public.${table} (${cols.join(', ')}) VALUES (${vals});`;
  }).join('\n');
}

const ExportDataPage = () => {
  const { isLoggedIn, isAdmin } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [expandedSql, setExpandedSql] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [sqlData, setSqlData] = useState<Record<string, string>>({});
  const [sqlLoading, setSqlLoading] = useState<string | null>(null);

  if (!isLoggedIn || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Acesso restrito a administradores.</p>
      </div>
    );
  }

  const handleExport = async (key: string) => {
    setLoading(key);
    setMessage('');
    try {
      let allData: Record<string, unknown>[] = [];
      let from = 0;
      const pageSize = 1000;

      while (true) {
        const { data, error } = await (supabase.from(key as 'orders' | 'profiles' | 'user_roles' | 'verification_codes') as any)
          .select('*')
          .range(from, from + pageSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        allData = [...allData, ...data];
        if (data.length < pageSize) break;
        from += pageSize;
      }

      if (!allData.length) {
        setMessage(`Nenhum dado encontrado na tabela "${key}".`);
        return;
      }

      const csv = jsonToCsv(allData);
      const date = new Date().toISOString().split('T')[0];
      downloadCsv(csv, `${key}_${date}.csv`);
      setMessage(`✅ ${allData.length} registros exportados de "${key}".`);
    } catch (err: any) {
      setMessage(`❌ Erro ao exportar: ${err.message}`);
    } finally {
      setLoading(null);
    }
  };

  const handleToggleSql = async (key: string) => {
    if (expandedSql === key) {
      setExpandedSql(null);
      return;
    }
    setExpandedSql(key);
    if (sqlData[key]) return; // already fetched

    setSqlLoading(key);
    try {
      let allData: Record<string, unknown>[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await (supabase.from(key as 'orders' | 'profiles' | 'user_roles' | 'verification_codes') as any)
          .select('*')
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allData = [...allData, ...data];
        if (data.length < pageSize) break;
        from += pageSize;
      }
      const inserts = generateInserts(key, allData);
      const full = `${tableSchemas[key]}\n\n-- Dados (${allData.length} registros)\n${inserts}`;
      setSqlData(prev => ({ ...prev, [key]: full }));
    } catch (err: any) {
      setSqlData(prev => ({ ...prev, [key]: `${tableSchemas[key]}\n\n-- Erro ao buscar dados: ${err.message}` }));
    } finally {
      setSqlLoading(null);
    }
  };

  const getFullSql = (key: string) => sqlData[key] || tableSchemas[key];

  const handleCopySql = (key: string) => {
    navigator.clipboard.writeText(getFullSql(key));
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyAll = async () => {
    // fetch all tables that haven't been fetched yet
    const keys = exportOptions.map(o => o.key);
    for (const key of keys) {
      if (!sqlData[key]) {
        setSqlLoading(key);
        try {
          let allData: Record<string, unknown>[] = [];
          let from = 0;
          const pageSize = 1000;
          while (true) {
            const { data, error } = await (supabase.from(key as 'orders' | 'profiles' | 'user_roles' | 'verification_codes') as any)
              .select('*')
              .range(from, from + pageSize - 1);
            if (error) throw error;
            if (!data || data.length === 0) break;
            allData = [...allData, ...data];
            if (data.length < pageSize) break;
            from += pageSize;
          }
          const inserts = generateInserts(key, allData);
          const full = `${tableSchemas[key]}\n\n-- Dados (${allData.length} registros)\n${inserts}`;
          setSqlData(prev => ({ ...prev, [key]: full }));
        } catch {
          // skip
        }
      }
    }
    setSqlLoading(null);
    // Need a small delay to let state update
    setTimeout(() => {
      const allSql = keys.map(k => sqlData[k] || tableSchemas[k]).join('\n\n---\n\n');
      navigator.clipboard.writeText(allSql);
      setCopied('all');
      setTimeout(() => setCopied(null), 2000);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-display font-bold text-foreground mb-2 flex items-center gap-2">
          <Database className="text-primary" size={24} /> Exportar Dados
        </h1>
        <p className="text-muted-foreground mb-6 text-sm">Exporte os dados em CSV ou copie o SQL das tabelas para migração.</p>

        {/* CSV Export Section */}
        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <Download size={18} className="text-primary" /> Exportar CSV
        </h2>
        <div className="space-y-3 mb-8">
          {exportOptions.map(opt => (
            <button
              key={opt.key}
              onClick={() => handleExport(opt.key)}
              disabled={loading !== null}
              className="w-full flex items-center gap-4 p-4 bg-card rounded-xl western-shadow hover:bg-accent/50 transition-colors text-left disabled:opacity-50"
            >
              <div className="text-primary">{opt.icon}</div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              </div>
              {loading === opt.key ? (
                <Loader2 size={18} className="animate-spin text-primary" />
              ) : (
                <Download size={18} className="text-muted-foreground" />
              )}
            </button>
          ))}
        </div>

        {message && (
          <p className="mb-6 text-sm text-muted-foreground bg-muted rounded-lg p-3">{message}</p>
        )}

        {/* SQL Schema Section */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Code size={18} className="text-primary" /> SQL das Tabelas
          </h2>
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {copied === 'all' ? <Check size={14} /> : <Copy size={14} />}
            {copied === 'all' ? 'Copiado!' : 'Copiar tudo'}
          </button>
        </div>
        <p className="text-muted-foreground text-xs mb-4">Clique em uma tabela para ver o SQL de criação. Use para migrar a estrutura.</p>

        <div className="space-y-2">
          {exportOptions.map(opt => (
            <div key={`sql-${opt.key}`} className="bg-card rounded-xl western-shadow overflow-hidden">
              <button
                onClick={() => setExpandedSql(expandedSql === opt.key ? null : opt.key)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Code size={16} className="text-primary" />
                  <span className="font-semibold text-sm text-foreground">{opt.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">{expandedSql === opt.key ? '▲ Fechar' : '▼ Ver SQL'}</span>
              </button>

              {expandedSql === opt.key && (
                <div className="border-t border-border/30 p-4">
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={() => handleCopySql(opt.key)}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-muted text-foreground hover:bg-accent transition-colors"
                    >
                      {copied === opt.key ? <Check size={12} /> : <Copy size={12} />}
                      {copied === opt.key ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  <pre className="bg-muted rounded-lg p-4 text-xs text-foreground overflow-x-auto whitespace-pre font-mono leading-relaxed">
                    {tableSchemas[opt.key]}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExportDataPage;

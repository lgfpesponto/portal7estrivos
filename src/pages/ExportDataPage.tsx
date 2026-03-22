import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Download, Database, Users, FileText, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

const ExportDataPage = () => {
  const { isLoggedIn, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-display font-bold text-foreground mb-2 flex items-center gap-2">
          <Database className="text-primary" size={24} /> Exportar Dados
        </h1>
        <p className="text-muted-foreground mb-6 text-sm">Exporte os dados das tabelas do banco de dados em formato CSV.</p>

        <div className="space-y-3">
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
          <p className="mt-4 text-sm text-muted-foreground bg-muted rounded-lg p-3">{message}</p>
        )}
      </div>
    </div>
  );
};

export default ExportDataPage;

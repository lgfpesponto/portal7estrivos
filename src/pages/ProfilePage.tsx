import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Phone, CreditCard } from 'lucide-react';

const ProfilePage = () => {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  if (!isLoggedIn || !user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold mb-6">Meu Perfil</h1>
        <div className="bg-card rounded-xl p-6 western-shadow space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={28} className="text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl">{user.nomeCompleto}</h2>
              <p className="text-sm text-muted-foreground">@{user.nomeUsuario}</p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-muted-foreground" />
              <span className="text-sm">{user.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-muted-foreground" />
              <span className="text-sm">{user.telefone}</span>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard size={16} className="text-muted-foreground" />
              <span className="text-sm">{user.cpfCnpj}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;

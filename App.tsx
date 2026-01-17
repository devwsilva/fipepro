
import React, { useState, useEffect } from 'react';
import { fipeService } from './services/fipeService';
import { VehicleType, FipeItem, FipeResult, HistoryItem, Favorite } from './types';
import VehicleTypeSelector from './components/VehicleTypeSelector';
import AiInsight from './components/AiInsight';
import PriceHistory from './components/PriceHistory';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [configMissing, setConfigMissing] = useState(false);

  useEffect(() => {
    const checkConfig = () => {
      const key = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (process as any).env?.VITE_SUPABASE_ANON_KEY;
      if (!key || key === 'KEY_NAO_CONFIGURADA') {
        setConfigMissing(true);
      }
    };
    
    checkConfig();

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) fetchFavorites(currentUser.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      if (activeUser) fetchFavorites(activeUser.id);
      else {
        setFavorites([]);
        setAuthMode(null);
      }
    });

    const savedHistory = localStorage.getItem('fipe_history_v2');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    return () => subscription.unsubscribe();
  }, []);

  const [type, setType] = useState<VehicleType>('cars');
  const [brands, setBrands] = useState<FipeItem[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [models, setModels] = useState<FipeItem[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [years, setYears] = useState<FipeItem[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  
  const [result, setResult] = useState<FipeResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  useEffect(() => {
    loadBrands();
  }, [type]);

  const loadBrands = async () => {
    setLoading(true);
    try {
      const data = await fipeService.getBrands(type);
      setBrands(data);
      setSelectedBrand(''); setModels([]); setSelectedModel(''); setYears([]); setSelectedYear('');
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchFavorites = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setFavorites(data.map(f => ({
          fipeCode: f.fipe_code, 
          yearId: f.year_id, 
          vehicleType: f.vehicle_type as VehicleType,
          brandName: f.brand_name, 
          modelName: f.model_name,
          savedPrice: f.saved_price || '---',
          savedReference: f.saved_reference || '---'
        })));
      }
    } catch (e) {
      console.warn("Erro ao buscar favoritos:", e);
    }
  };

  const clearAuth = () => {
    setEmail(''); setPassword(''); setConfirmPassword(''); setFullName('');
    setAuthError(null); setAuthMessage(null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthMessage(null);
    setLoading(true);
    try {
      if (authMode === 'signup') {
        if (password !== confirmPassword) throw new Error('As senhas não coincidem.');
        if (password.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');
        
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { full_name: fullName }
          }
        });
        
        if (signUpError) throw signUpError;
        
        // Se a sessão já vier no signup (Email Confirmation OFF no Supabase), logamos direto.
        if (data.session) {
          setAuthMode(null);
          clearAuth();
          setAuthMessage("Cadastro realizado! Bem-vindo.");
        } else {
          // Fallback caso o Supabase ainda exija confirmação (o usuário pediu para desabilitar, mas depende do Dashboard)
          setAuthMessage("Conta criada! Tente entrar agora.");
          setAuthMode('login');
        }
      } else if (authMode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        setAuthMode(null);
        clearAuth();
      }
    } catch (err: any) {
      setAuthError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleBrandChange = async (val: string) => {
    setSelectedBrand(val); setSelectedModel(''); setYears([]); setSelectedYear('');
    if (!val) return;
    setLoading(true);
    try {
      const data = await fipeService.getModels(type, val);
      setModels(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleModelChange = async (val: string) => {
    setSelectedModel(val); setSelectedYear('');
    if (!val) return;
    setLoading(true);
    try {
      const data = await fipeService.getYears(type, selectedBrand, val);
      setYears(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleYearChange = async (val: string) => {
    setSelectedYear(val);
    if (!val) return;
    setLoading(true);
    try {
      const data = await fipeService.getDetails(type, selectedBrand, selectedModel, val);
      displayResult(data, type, val);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const displayResult = (data: FipeResult, vType: VehicleType, yId: string) => {
    setResult(data);
    setType(vType);
    setSelectedYear(yId);
    setHistory(prev => {
      const newItem: HistoryItem = { id: `${data.codeFipe}-${yId}-${Date.now()}`, timestamp: Date.now(), data: data };
      const filtered = prev.filter(h => !(h.data.codeFipe === data.codeFipe && h.data.modelYear === data.modelYear));
      const newHistory = [newItem, ...filtered].slice(0, 10);
      localStorage.setItem('fipe_history_v2', JSON.stringify(newHistory));
      return newHistory;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadFromList = async (vType: VehicleType, fipe: string, yId: string) => {
    setLoading(true);
    try {
      setType(vType);
      const data = await fipeService.getDetailsByFipe(vType, fipe, yId);
      displayResult(data, vType, yId);
    } catch (err) { alert('Erro ao carregar dados do veículo.'); }
    finally { setLoading(false); }
  };

  const handleFavorite = async () => {
    if (!result || !user) { 
      if (!user) setAuthMode('login'); 
      return; 
    }

    const isFav = favorites.find(f => f.fipeCode === result.codeFipe && f.yearId === selectedYear);
    
    try {
      if (isFav) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('fipe_code', result.codeFipe)
          .eq('year_id', selectedYear);
          
        if (error) throw error;
        setFavorites(prev => prev.filter(f => !(f.fipeCode === result.codeFipe && f.yearId === selectedYear)));
      } else {
        const { error } = await supabase.from('favorites').insert({ 
          user_id: user.id, 
          vehicle_type: type, 
          fipe_code: result.codeFipe, 
          year_id: selectedYear, 
          brand_name: result.brand, 
          model_name: result.model, 
          saved_price: result.price, 
          saved_reference: result.referenceMonth
        });
        
        if (error) throw error;
        setFavorites(prev => [{ fipeCode: result.codeFipe, yearId: selectedYear, vehicleType: type, brandName: result.brand, modelName: result.model, savedPrice: result.price, savedReference: result.referenceMonth }, ...prev]);
      }
    } catch (err: any) {
      console.error("Erro ao processar favorito:", err);
      alert("Erro ao salvar favorito. Verifique se o banco de dados está configurado.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] text-slate-800 antialiased">
      {configMissing && (
        <div className="bg-red-600 text-white p-2 text-[10px] font-bold text-center uppercase tracking-widest sticky top-0 z-[200]">
          ⚠️ CRÍTICO: VITE_SUPABASE_ANON_KEY NÃO CONFIGURADA NA VERCEL. LOGIN E FAVORITOS DESATIVADOS.
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-[#005599] to-[#003366] text-white py-6 md:py-12 px-4 shadow-xl">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left cursor-pointer transition-transform active:scale-95" onClick={() => setResult(null)}>
            <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight">Tabela FIPE <span className="text-[#ff8800]">PRO</span></h1>
            <p className="text-blue-100/70 text-[10px] md:text-sm font-medium tracking-wide flex items-center justify-center md:justify-start gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> CONEXÃO SEGURA • INSIGHTS IA
            </p>
          </div>
          <div className="flex gap-4">
            {user ? (
              <div className="flex items-center gap-2 md:gap-4 bg-white/10 p-1.5 pl-3.5 rounded-full border border-white/20">
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest max-w-[100px] truncate">{user.email.split('@')[0]}</span>
                <button onClick={() => supabase.auth.signOut()} className="bg-red-500 hover:bg-red-600 px-3 md:px-5 py-1.5 md:py-2.5 rounded-full text-[9px] md:text-[10px] font-black transition-all shadow-lg active:scale-90">SAIR</button>
              </div>
            ) : (
              <button onClick={() => { setAuthMode('login'); clearAuth(); }} className="bg-[#ff8800] hover:bg-[#ff9911] px-6 md:px-8 py-3 rounded-full font-black text-xs md:text-sm shadow-lg transition-all active:scale-95">ENTRAR / CADASTRAR</button>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      {authMode && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden">
          <div className="bg-white rounded-[2rem] p-6 md:p-10 max-w-md w-full shadow-2xl relative my-auto animate-in fade-in zoom-in duration-300">
            <h2 className="text-xl md:text-2xl font-black mb-1 uppercase italic text-slate-900">
              {authMode === 'login' ? 'Acessar Conta' : 'Criar Conta'}
            </h2>
            <p className="text-slate-400 text-[9px] mb-6 italic uppercase tracking-widest">Acesso instantâneo sem confirmação</p>
            
            {authError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold border border-red-100">{authError}</div>}
            {authMessage && <div className="mb-4 p-3 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold border border-blue-100">{authMessage}</div>}

            <form onSubmit={handleAuth} className="space-y-3">
              {authMode === 'signup' && (
                <input type="text" placeholder="Nome Completo" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold" required />
              )}
              <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold" required />
              <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold" required />
              {authMode === 'signup' && (
                <input type="password" placeholder="Confirmar Senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold" required />
              )}
              <button type="submit" disabled={loading} className="w-full bg-[#005599] text-white font-black py-4 rounded-xl shadow-lg uppercase tracking-widest text-xs italic transition-all active:scale-95 disabled:opacity-50">
                {loading ? 'Processando...' : (authMode === 'login' ? 'Entrar' : 'Cadastrar e Logar')}
              </button>
            </form>

            <div className="mt-6 text-center flex flex-col gap-3">
              <button onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); clearAuth(); }} className="text-[11px] font-bold text-blue-500 hover:text-blue-700">
                {authMode === 'login' ? 'Não tem conta? Registre-se agora' : 'Já possui conta? Faça o login'}
              </button>
              <button onClick={() => { setAuthMode(null); clearAuth(); }} className="text-[9px] font-black text-slate-300 uppercase italic hover:text-red-500 transition-colors">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 md:py-12 flex flex-col lg:flex-row gap-6 md:gap-10">
        
        {/* Search Column */}
        <div className="flex-1 order-1 lg:order-2">
          {!result ? (
            <section className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl md:shadow-2xl p-5 md:p-10 space-y-6 md:space-y-10 border border-slate-100">
              <VehicleTypeSelector selected={type} onChange={setType} />
              <div className="grid grid-cols-1 gap-3 md:gap-6">
                <select value={selectedBrand} onChange={e => handleBrandChange(e.target.value)} className="w-full p-4 rounded-xl md:rounded-2xl border-2 border-slate-100 font-bold outline-none focus:border-blue-500 transition-all text-sm md:text-base bg-white shadow-sm appearance-none">
                  <option value="">Selecione a Marca</option>
                  {brands.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                </select>
                <select value={selectedModel} onChange={e => handleModelChange(e.target.value)} disabled={!selectedBrand} className="w-full p-4 rounded-xl md:rounded-2xl border-2 border-slate-100 font-bold outline-none focus:border-blue-500 transition-all text-sm md:text-base bg-white disabled:bg-slate-50 disabled:text-slate-300 appearance-none">
                  <option value="">Selecione o Modelo</option>
                  {models.map(m => <option key={m.code} value={m.code}>{m.name}</option>)}
                </select>
                <select value={selectedYear} onChange={e => handleYearChange(e.target.value)} disabled={!selectedModel} className="w-full p-4 rounded-xl md:rounded-2xl border-2 border-slate-100 font-bold outline-none focus:border-blue-500 transition-all text-sm md:text-base bg-white disabled:bg-slate-50 disabled:text-slate-300 appearance-none">
                  <option value="">Selecione o Ano</option>
                  {years.map(y => <option key={y.code} value={y.code}>{y.name.replace('32000', 'Zero KM')}</option>)}
                </select>
              </div>
              {loading && <div className="text-center py-2"><div className="loader rounded-full border-4 border-t-4 h-8 w-8 mx-auto"></div><p className="text-[9px] font-black text-blue-500 mt-2 uppercase tracking-[0.2em]">Consultando...</p></div>}
            </section>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
              <button onClick={() => setResult(null)} className="text-slate-400 font-black hover:text-blue-600 flex items-center gap-2 uppercase text-[9px] tracking-widest italic group active:scale-95 transition-all">
                <span className="group-hover:-translate-x-1 transition-transform">←</span> NOVA CONSULTA
              </button>

              <div className="bg-white rounded-[1.5rem] md:rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden relative">
                <div className="bg-[#005599] p-6 md:p-16 text-white text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 md:p-12 opacity-5 text-6xl md:text-9xl font-black rotate-12 select-none pointer-events-none">FIPE</div>
                  <p className="text-blue-100/70 uppercase tracking-[0.2em] text-[8px] md:text-[10px] font-black mb-3 italic">VALOR MÉDIO NACIONAL</p>
                  <h3 className="text-4xl sm:text-6xl md:text-8xl font-black mb-6 md:mb-8 italic tracking-tighter leading-none">{result.price}</h3>
                  <div className="inline-flex items-center gap-2 md:gap-4 bg-white/10 px-4 md:px-8 py-2 md:py-3 rounded-full text-[10px] md:text-sm font-black border border-white/20 backdrop-blur-md">
                    <span className="opacity-50 uppercase text-[8px]">Mês Ref:</span> {result.referenceMonth}
                  </div>
                </div>

                <div className="bg-slate-50/50 p-4 md:p-6 flex justify-center border-b border-slate-100">
                  <button onClick={handleFavorite} className={`w-full md:w-auto px-6 md:px-12 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase italic transition-all shadow-md flex items-center justify-center gap-2 border-2 active:scale-95 ${favorites.some(f => f.fipeCode === result.codeFipe && f.yearId === selectedYear) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-500 border-slate-200 hover:border-orange-500 hover:text-orange-500'}`}>
                    <span className="text-sm">{favorites.some(f => f.fipeCode === result.codeFipe && f.yearId === selectedYear) ? '★' : '☆'}</span>
                    {favorites.some(f => f.fipeCode === result.codeFipe && f.yearId === selectedYear) ? 'REMOVER DOS FAVORITOS' : 'ADICIONAR AOS FAVORITOS'}
                  </button>
                </div>

                <div className="p-4 md:p-14 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">
                  {[
                    { icon: '🏢', label: 'Marca', val: result.brand },
                    { icon: '🚘', label: 'Modelo', val: result.model },
                    { icon: '📅', label: 'Ano', val: result.modelYear === 32000 ? 'Zero KM' : result.modelYear },
                    { icon: '⛽', label: 'Combustível', val: result.fuel },
                    { icon: '📋', label: 'Cód Fipe', val: result.codeFipe },
                    { icon: result.vehicleType === 1 ? '🚗' : '🏍️', label: 'Tipo', val: result.vehicleType === 1 ? 'Carro' : 'Moto' }
                  ].map((it, idx) => (
                    <div key={idx} className="p-4 rounded-xl md:rounded-3xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
                      <span className="text-xl md:text-3xl mb-1.5 md:mb-2">{it.icon}</span>
                      <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase mb-0.5 md:mb-1 italic tracking-tight">{it.label}</p>
                      <p className="text-xs md:text-lg font-black text-slate-900 leading-tight truncate w-full">{it.val}</p>
                    </div>
                  ))}
                </div>

                <div className="px-4 md:px-10 pb-8 md:pb-14 space-y-6 md:space-y-10">
                  <AiInsight vehicle={result} />
                  <PriceHistory fipeCode={result.codeFipe} yearId={selectedYear} vehicleType={type} />
                </div>
              </div>

              <button onClick={() => setResult(null)} className="w-full bg-[#ff8800] text-white font-black py-6 md:py-10 rounded-[1.5rem] md:rounded-[3rem] hover:bg-[#ff9911] shadow-xl transition-all uppercase tracking-widest text-sm md:text-lg italic mt-4 border-2 md:border-4 border-white/20 active:scale-95">
                FAZER OUTRA BUSCA
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-80 space-y-4 md:space-y-8 order-2 lg:order-1">
          <div className="bg-white rounded-[1.2rem] md:rounded-[2rem] p-4 md:p-6 shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-[11px] md:text-sm uppercase italic">
              <span className="text-blue-500">⭐</span> FAVORITOS
            </h3>
            {favorites.length === 0 ? (
              <p className="text-[9px] text-slate-300 font-bold text-center italic py-4">{user ? 'Nenhum item salvo.' : 'Crie sua conta para salvar favoritos.'}</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 md:gap-4">
                {favorites.map(f => (
                  <button key={`${f.fipeCode}-${f.yearId}`} onClick={() => loadFromList(f.vehicleType, f.fipeCode, f.yearId)} className="w-full text-left p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all active:scale-[0.98]">
                    <p className="text-[8px] text-slate-400 font-black uppercase truncate">{f.brandName}</p>
                    <p className="text-[10px] md:text-xs font-black truncate">{f.modelName}</p>
                    <p className="text-[10px] font-black text-blue-600 mt-1">{f.savedPrice}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-[1.2rem] md:rounded-[2rem] p-4 md:p-6 shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-400 mb-4 text-[9px] md:text-[10px] uppercase italic">🕒 HISTÓRICO</h3>
            <div className="space-y-2">
              {history.length === 0 ? (
                 <p className="text-[9px] text-slate-300 font-bold text-center italic py-4">Suas buscas aparecerão aqui.</p>
              ) : (
                history.map(h => (
                  <button key={h.id} onClick={() => displayResult(h.data, (h.data.vehicleType === 1 ? 'cars' : h.data.vehicleType === 2 ? 'motorcycles' : 'trucks'), h.id.split('-')[1])} className="w-full text-left flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all active:scale-[0.98]">
                    <span className="opacity-40 text-sm md:text-lg">{h.data.vehicleType === 1 ? '🚗' : '🏍️'}</span>
                    <div className="overflow-hidden">
                      <p className="text-[8px] font-black text-slate-400 uppercase truncate">{h.data.brand}</p>
                      <p className="text-[10px] font-bold text-slate-600 truncate">{h.data.model}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

      </main>
      
      <footer className="py-10 text-center opacity-30">
         <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Tabela FIPE PRO &copy; 2025</p>
      </footer>
    </div>
  );
};

export default App;

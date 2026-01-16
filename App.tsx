
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
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'verify' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  // FIPE State
  const [type, setType] = useState<VehicleType>('cars');
  const [brands, setBrands] = useState<FipeItem[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [models, setModels] = useState<FipeItem[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [years, setYears] = useState<FipeItem[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  
  // Results & UI
  const [result, setResult] = useState<FipeResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) fetchFavorites(currentUser.id);
    });

    // Listen auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      if (activeUser) fetchFavorites(activeUser.id);
      else {
        setFavorites([]);
        setAuthMode(null);
      }
    });

    // Load local history
    const savedHistory = localStorage.getItem('fipe_history_v2');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    return () => subscription.unsubscribe();
  }, []);

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
    // Com RLS ativo, o Supabase filtrará automaticamente pelo user_id do token
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
  };

  const clearAuth = () => {
    setEmail(''); setPassword(''); setConfirmPassword(''); setFullName('');
    setVerificationCode(''); setAuthError(null); setAuthMessage(null);
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
        
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { full_name: fullName }
          }
        });
        
        if (signUpError) throw signUpError;
        
        setAuthMode('verify');
        setAuthMessage(`Um link de verificação foi enviado para ${email}.`);
      } else if (authMode === 'verify') {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email,
          token: verificationCode,
          type: 'signup'
        });
        
        if (verifyError) throw verifyError;
        setAuthMode(null);
      } else if (authMode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        setAuthMode(null);
        clearAuth();
      }
    } catch (err: any) {
      setAuthError(err.message || 'Erro na autenticação.');
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
          .eq('user_id', user.id) // Reforço de segurança, embora o RLS já trate isso
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
      alert("Erro de segurança ou conexão. Verifique se você está logado corretamente.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] text-slate-800">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#005599] to-[#003366] text-white py-10 px-4 shadow-xl">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left cursor-pointer" onClick={() => setResult(null)}>
            <h1 className="text-4xl font-black uppercase italic tracking-tight">Tabela FIPE <span className="text-[#ff8800]">PRO</span></h1>
            <p className="text-blue-100/70 text-sm font-medium tracking-wide flex items-center justify-center md:justify-start gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> CONEXÃO SEGURA • INSIGHTS IA
            </p>
          </div>
          <div className="flex gap-4">
            {user ? (
              <div className="flex items-center gap-4 bg-white/10 p-2 pl-4 rounded-full border border-white/20">
                <span className="text-xs font-bold uppercase tracking-widest">{user.email.split('@')[0]}</span>
                <button onClick={() => supabase.auth.signOut()} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-full text-[10px] font-black transition-all">SAIR</button>
              </div>
            ) : (
              <button onClick={() => { setAuthMode('login'); clearAuth(); }} className="bg-[#ff8800] hover:bg-[#ff9911] px-8 py-3 rounded-full font-black text-sm shadow-lg transition-all">ENTRAR / CADASTRAR</button>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      {authMode && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative overflow-hidden">
            <h2 className="text-2xl font-black mb-1 uppercase italic">
              {authMode === 'login' ? 'Acessar Conta' : authMode === 'signup' ? 'Cadastrar-se' : 'Verificar Cadastro'}
            </h2>
            <p className="text-slate-400 text-[10px] mb-8 italic uppercase tracking-widest">Proteção via Row Level Security (RLS)</p>
            
            {authError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100">{authError}</div>}
            {authMessage && <div className="mb-4 p-3 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-100">{authMessage}</div>}

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'signup' && (
                <input type="text" placeholder="Nome Completo" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-bold text-slate-800" required />
              )}
              {authMode !== 'verify' && (
                <>
                  <input type="email" placeholder="Seu E-mail" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-bold text-slate-800" required />
                  <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-bold text-slate-800" required />
                </>
              )}
              {authMode === 'signup' && (
                <input type="password" placeholder="Confirmar Senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-bold text-slate-800" required />
              )}
              {authMode === 'verify' && (
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-blue-500 uppercase text-center">Digite o código enviado ao seu e-mail</p>
                  <input type="text" placeholder="0 0 0 0 0 0" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-center text-3xl font-black tracking-[0.5em] outline-none" maxLength={6} required />
                </div>
              )}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#005599] text-white font-black py-4 rounded-xl shadow-lg uppercase tracking-widest text-sm italic transition-all hover:bg-blue-800 disabled:opacity-50"
              >
                {loading ? 'Processando...' : (authMode === 'login' ? 'Entrar Agora' : authMode === 'signup' ? 'Enviar Código' : 'Validar Token')}
              </button>
            </form>

            <div className="mt-6 text-center flex flex-col gap-3">
              <button onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); clearAuth(); }} className="text-xs font-bold text-blue-500 hover:underline">
                {authMode === 'login' ? 'Não tem conta? Crie uma aqui' : 'Já tem conta? Entre por aqui'}
              </button>
              <button onClick={() => { setAuthMode(null); clearAuth(); }} className="text-[10px] font-black text-slate-300 uppercase italic hover:text-red-500">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-4 gap-10">
        <aside className="lg:col-span-1 space-y-8">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 text-sm uppercase italic">
              <span className="text-blue-500">⭐</span> FAVORITOS
            </h3>
            {favorites.length === 0 ? (
              <p className="text-[10px] text-slate-300 font-bold text-center italic">{user ? 'Sua lista está vazia.' : 'Faça login para salvar.'}</p>
            ) : (
              <div className="space-y-4">
                {favorites.map(f => (
                  <button key={`${f.fipeCode}-${f.yearId}`} onClick={() => loadFromList(f.vehicleType, f.fipeCode, f.yearId)} className="w-full text-left p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all shadow-sm">
                    <p className="text-[9px] text-slate-400 font-black uppercase truncate">{f.brandName}</p>
                    <p className="text-xs font-black truncate">{f.modelName}</p>
                    <p className="text-[11px] font-black text-blue-600 mt-1">{f.savedPrice}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-400 mb-6 text-[10px] uppercase italic">🕒 HISTÓRICO</h3>
            <div className="space-y-3">
              {history.length === 0 ? (
                 <p className="text-[10px] text-slate-300 font-bold text-center italic">Nenhuma busca.</p>
              ) : (
                history.map(h => (
                  <button key={h.id} onClick={() => displayResult(h.data, (h.data.vehicleType === 1 ? 'cars' : h.data.vehicleType === 2 ? 'motorcycles' : 'trucks'), h.id.split('-')[1])} className="w-full text-left flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100">
                    <span className="opacity-30 text-lg">{h.data.vehicleType === 1 ? '🚗' : '🏍️'}</span>
                    <div className="overflow-hidden">
                      <p className="text-[9px] font-black text-slate-400 uppercase truncate">{h.data.brand}</p>
                      <p className="text-[11px] font-bold text-slate-600 truncate">{h.data.model}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

        <div className="lg:col-span-3">
          {!result ? (
            <section className="bg-white rounded-[2.5rem] shadow-2xl p-10 space-y-10 border border-slate-100">
              <VehicleTypeSelector selected={type} onChange={setType} />
              <div className="space-y-6">
                <select value={selectedBrand} onChange={e => handleBrandChange(e.target.value)} className="w-full p-5 rounded-2xl border-2 border-slate-100 font-bold outline-none focus:border-blue-500 appearance-none bg-white">
                  <option value="">Selecione a Marca</option>
                  {brands.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                </select>
                <select value={selectedModel} onChange={e => handleModelChange(e.target.value)} disabled={!selectedBrand} className="w-full p-5 rounded-2xl border-2 border-slate-100 font-bold outline-none focus:border-blue-500 appearance-none bg-white disabled:opacity-50">
                  <option value="">Selecione o Modelo</option>
                  {models.map(m => <option key={m.code} value={m.code}>{m.name}</option>)}
                </select>
                <select value={selectedYear} onChange={e => handleYearChange(e.target.value)} disabled={!selectedModel} className="w-full p-5 rounded-2xl border-2 border-slate-100 font-bold outline-none focus:border-blue-500 appearance-none bg-white disabled:opacity-50">
                  <option value="">Selecione o Ano</option>
                  {years.map(y => <option key={y.code} value={y.code}>{y.name.replace('32000', 'Zero KM')}</option>)}
                </select>
              </div>
              {loading && <div className="text-center py-4"><div className="loader rounded-full border-4 border-t-4 h-10 w-10 mx-auto"></div><p className="text-[10px] font-black text-blue-500 mt-2 uppercase">Sincronizando base oficial segura...</p></div>}
            </section>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-500">
              <button onClick={() => setResult(null)} className="text-slate-400 font-black hover:text-blue-600 flex items-center gap-2 uppercase text-[10px] tracking-widest italic group">
                <span className="group-hover:-translate-x-1 transition-transform">←</span> VOLTAR
              </button>

              <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden relative">
                <div className="bg-[#005599] p-16 text-white text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-5 text-9xl font-black rotate-12 select-none">FIPE</div>
                  <p className="text-blue-100/70 uppercase tracking-[0.3em] text-[10px] font-black mb-4 italic">VALOR MÉDIO ESTIMADO</p>
                  <h3 className="text-7xl md:text-8xl font-black mb-8 italic tracking-tighter">{result.price}</h3>
                  <div className="inline-flex items-center gap-4 bg-white/10 px-8 py-3 rounded-full text-sm font-black border border-white/20 backdrop-blur-md">
                    <span className="opacity-50 uppercase text-[10px]">Ref:</span> {result.referenceMonth}
                  </div>
                </div>

                <div className="bg-slate-50/80 p-6 flex justify-center gap-4 border-b border-slate-100">
                  <button onClick={handleFavorite} className={`px-10 py-4 rounded-2xl font-black text-[11px] uppercase italic transition-all shadow-md flex items-center gap-2 border-2 ${favorites.some(f => f.fipeCode === result.codeFipe && f.yearId === selectedYear) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-500 border-transparent hover:text-orange-500'}`}>
                    <span>{favorites.some(f => f.fipeCode === result.codeFipe && f.yearId === selectedYear) ? '★' : '☆'}</span>
                    {favorites.some(f => f.fipeCode === result.codeFipe && f.yearId === selectedYear) ? 'REMOVER DOS FAVORITOS' : 'ADICIONAR AOS FAVORITOS'}
                  </button>
                </div>

                <div className="p-10 md:p-14 grid grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { icon: '🏢', label: 'Marca', val: result.brand },
                    { icon: '🚘', label: 'Modelo', val: result.model },
                    { icon: '📅', label: 'Ano', val: result.modelYear === 32000 ? 'Zero KM' : result.modelYear },
                    { icon: '⛽', label: 'Combustível', val: result.fuel },
                    { icon: '📋', label: 'Cód Fipe', val: result.codeFipe },
                    { icon: result.vehicleType === 1 ? '🚗' : '🏍️', label: 'Tipo', val: result.vehicleType === 1 ? 'Carro' : 'Moto' }
                  ].map((it, idx) => (
                    <div key={idx} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 text-center">
                      <span className="text-3xl mb-2 block">{it.icon}</span>
                      <p className="text-[10px] text-slate-400 font-black uppercase mb-1 italic">{it.label}</p>
                      <p className="text-lg font-black text-slate-900 leading-tight">{it.val}</p>
                    </div>
                  ))}
                </div>

                <div className="px-10 pb-14 space-y-10">
                  <AiInsight vehicle={result} />
                  <PriceHistory fipeCode={result.codeFipe} yearId={selectedYear} vehicleType={type} />
                </div>
              </div>

              <button onClick={() => setResult(null)} className="w-full bg-[#ff8800] text-white font-black py-12 rounded-[3rem] hover:bg-[#ff9911] shadow-2xl shadow-orange-100 transition-all uppercase tracking-[0.4em] text-lg italic mt-8 border-4 border-white/20">
                REALIZAR NOVA CONSULTA OFICIAL
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;

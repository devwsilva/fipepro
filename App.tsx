
import React, { useState, useEffect } from 'react';
import { fipeService } from './services/fipeService';
import { VehicleType, FipeItem, FipeResult, HistoryItem, Favorite } from './types';
import VehicleTypeSelector from './components/VehicleTypeSelector';
import AiInsight from './components/AiInsight';
import PriceHistory from './components/PriceHistory';
import BannerAd from './components/BannerAd';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgotPassword' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) fetchFavorites(currentUser.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      if (activeUser) {
        fetchFavorites(activeUser.id);
        setAuthMode(null); // Fecha modal automaticamente ao logar
        clearAuth();
      } else {
        setFavorites([]);
      }
    });

    const savedHistory = localStorage.getItem('fipe_history_v2');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    return () => subscription.unsubscribe();
  }, []);

  const [type, setType] = useState<VehicleType>('cars');
  const [brands, setBrands] = useState<FipeItem[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  
  const [years, setYears] = useState<FipeItem[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  
  const [models, setModels] = useState<FipeItem[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  
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
      setSelectedBrand(''); 
      setYears([]); 
      setSelectedYear(''); 
      setModels([]); 
      setSelectedModel('');
      setResult(null);
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
          options: { data: { full_name: fullName } }
        });
        
        if (signUpError) throw signUpError;
        
        if (data.user) {
           // Se o projeto Supabase permitir cadastro sem confirmação, o data.session existirá
           if (data.session) {
             setAuthMode(null);
             setAuthMessage("Cadastro realizado com sucesso!");
           } else {
             setAuthMessage("Cadastro realizado! Por favor, faça login.");
             setAuthMode('login');
           }
        }
      } else if (authMode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else if (authMode === 'forgotPassword') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
        if (resetError) throw resetError;
        setAuthMessage("Instruções de recuperação enviadas para seu e-mail.");
      }
    } catch (err: any) {
      setAuthError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleBrandChange = async (val: string) => {
    setSelectedBrand(val); 
    setSelectedYear(''); 
    setYears([]); 
    setSelectedModel(''); 
    setModels([]);
    if (!val) return;
    setLoading(true);
    try {
      const data = await fipeService.getYearsByBrand(type, val);
      setYears(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleYearChange = async (val: string) => {
    setSelectedYear(val); 
    setSelectedModel(''); 
    setModels([]);
    if (!val) return;
    setLoading(true);
    try {
      const data = await fipeService.getModelsByYear(type, selectedBrand, val);
      setModels(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleModelChange = async (val: string) => {
    setSelectedModel(val);
    if (!val) return;
    setLoading(true);
    try {
      const data = await fipeService.getDetails(type, selectedBrand, val, selectedYear);
      displayResult(data, type, selectedYear);
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
      alert("Não foi possível salvar nos favoritos. Tente logar novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] text-slate-800 antialiased pb-24 md:pb-32">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#005599] to-[#003366] text-white py-6 md:py-12 px-4 shadow-xl">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left cursor-pointer transition-transform active:scale-95" onClick={() =>
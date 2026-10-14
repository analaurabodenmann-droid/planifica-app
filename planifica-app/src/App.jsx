import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Sparkles, Calendar, Layers, FileText, Wrench, Clock, 
  Settings, History, Download, Copy, RefreshCw, Edit3, Trash2, 
  Plus, Check, ChevronRight, AlertCircle, Send, Moon, Sun, HeartHandshake, ShieldAlert, X, ChevronDown, CheckCircle2
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const ETHICAL_DISCLAIMER = {
  title: "Uso ético y pedagógico de Planifica",
  message: "Esta herramienta fue diseñada como un soporte para destrabar ideas, estructurar actividades o diversificar recursos. No reemplaza tu criterio pedagógico ni el conocimiento real que tenés de tu grupo de estudiantes. Revisá, adaptá y contextualizá siempre cada propuesta antes de llevarla al aula."
};

const PROVINCIAL_CURRICULA = [
  { id: 'entre_rios', name: 'Entre Ríos (Diseño Curricular CGE)', note: 'Ejes por saberes, capacidades y orientaciones ESI/DUA' },
  { id: 'santa_fe', name: 'Santa Fe (Jurisdiccional Secundaria)', note: 'Enfoque por capacidades y áreas integradas' },
  { id: 'buenos_aires', name: 'Buenos Aires (Diseños Curriculares PBA)', note: 'Organización por contenidos y modos de conocer' },
  { id: 'caba', name: 'CABA (NES - Nueva Escuela Secundaria)', note: 'Enfoque por competencias y unidades de aprendizaje' },
  { id: 'cordoba', name: 'Córdoba (Diseño Curricular Tomo Secundaria)', note: 'Formatos pedagógicos diversos y aprendizajes priorizados' },
  { id: 'nap', name: 'NAP (Núcleos de Aprendizaje Prioritarios Nacionales)', note: 'Referente pedagógico federal común' }
];

export default function App() {
  const [apiKey, setApiKey] = useState(() => {
    return import.meta.env?.VITE_GEMINI_API_KEY || localStorage.getItem('planifica_api_key') || '';
  });
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('planifica_theme') === 'dark');
  const [jurisdiction, setJurisdiction] = useState(() => localStorage.getItem('planifica_jurisdiction') || 'entre_rios');
  const [detailLevel, setDetailLevel] = useState('completo');

  const [activeTab, setActiveTab] = useState('home'); 
  const [step, setStep] = useState(1);
  const [savedPlans, setSavedPlans] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('planifica_saved_plans')) || [];
    } catch (e) {
      return [];
    }
  });

  const [wizardData, setWizardData] = useState({
    type: 'Secuencia didáctica',
    subject: '',
    year: '',
    topic: '',
    classesCount: '4',
    classDuration: '80 min',
    groupCharacteristics: '',
    resourcesAvailable: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [quickToolType, setQuickToolType] = useState('warmup');
  const [quickToolInput, setQuickToolInput] = useState({ subject: '', topic: '', level: '3er Año' });
  const [quickToolResult, setQuickToolResult] = useState(null);
  const [isQuickToolLoading, setIsQuickToolLoading] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('planifica_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('planifica_theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('planifica_jurisdiction', jurisdiction);
  }, [jurisdiction]);

  useEffect(() => {
    localStorage.setItem('planifica_saved_plans', JSON.stringify(savedPlans));
  }, [savedPlans]);

  const handleSaveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('planifica_api_key', key);
  };

  const selectedJurisdictionName = PROVINCIAL_CURRICULA.find(j => j.id === jurisdiction)?.name || 'Entre Ríos';

  const generateWithGemini = async (promptText) => {
    if (!apiKey) {
      throw new Error("MODO_DEMO_NO_KEY");
    }
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text);
  };

  const handleGeneratePlan = async () => {
    if (!wizardData.subject || !wizardData.topic || !wizardData.year) {
      alert("Por favor completá materia, año y tema principal.");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    const prompt = `Actuá como un asesor pedagógico experto en la escuela secundaria de Argentina. 
Generá una planificación estructurada de tipo "${wizardData.type}" para la materia "${wizardData.subject}", año/curso "${wizardData.year}".
Tema/Contenido principal: "${wizardData.topic}".
Carga horaria: ${wizardData.classesCount} clases de ${wizardData.classDuration}.
Características del grupo: "${wizardData.groupCharacteristics || 'Grupo heterogéneo estándar'}".
Recursos disponibles: "${wizardData.resourcesAvailable || 'Proyector, pizarrón, celulares, carpetas'}".

Alineá la propuesta al diseño curricular de la provincia / referente: ${selectedJurisdictionName} y los NAP. Usá español rioplatense (trato de vos) y terminología docente argentina.
Nivel de detalle requerido: ${detailLevel}.

Respondé ÚNICAMENTE en formato JSON válido con la siguiente estructura de claves exactas:
{
  "title": "Título sugerido para la planificación",
  "materia": "${wizardData.subject}",
  "anio": "${wizardData.year}",
  "fundamentacion": "Fundamentación pedagógica sintética y clara (1 o 2 párrafos)",
  "propositos": ["Propósito 1 del docente", "Propósito 2 del docente"],
  "objetivos": ["Objetivo de aprendizaje 1", "Objetivo de aprendizaje 2"],
  "saberesContenidos": ["Saber o contenido 1", "Saber o contenido 2"],
  "secuenciaActividades": [
    {
      "claseNumero": 1,
      "tituloClase": "Título o eje de la clase 1",
      "inicio": "Actividad de inicio (recuperación de ideas previas, disparador)",
      "desarrollo": "Actividad de desarrollo (construcción del saber, trabajo en grupos o individual)",
      "cierre": "Actividad de cierre (puesta en común, síntesis, metacognición)"
    }
  ],
  "recursos": ["Recurso 1", "Recurso 2"],
  "evaluacion": {
    "criterios": ["Criterio de evaluación 1", "Criterio 2"],
    "instrumentos": ["Instrumento de evaluación 1", "Instrumento 2"]
  },
  "adecuacionesDUA": "Sugerencia breve de adecuación DUA/trayectorias diversas para esta secuencia",
  "esi": "Vinculación o propuesta ESI (Educación Sexual Integral) aplicable si corresponde",
  "bibliografia": ["Bibliografía docente o estudiantil sugerida (autores o documentos de referencia reales)"]
}`;

    try {
      const result = await generateWithGemini(prompt);
      const newPlan = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('es-AR'),
        jurisdiction: selectedJurisdictionName,
        ...result
      };
      setCurrentPlan(newPlan);
      setActiveTab('result');
      setChatHistory([{
        sender: 'ai',
        text: `¡Hola! Ya generé la planificación para **${wizardData.subject}** (${wizardData.year}). ¿Querés que le haga algún ajuste? Pedime cosas como: *"sumá una actividad en grupos"*, *"hacela más corta"* o *"agregá recursos digitales"*`
      }]);
    } catch (err) {
      if (err.message === "MODO_DEMO_NO_KEY") {
        setGenerationError("demo_mode");
      } else {
        setGenerationError(err.message || "Ocurrió un error al conectar con Gemini. Verificá tu clave en Ajustes.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendChatRefinement = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !currentPlan) return;

    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setIsChatLoading(true);

    const prompt = `Tenés esta planificación actual en JSON:
${JSON.stringify(currentPlan, null, 2)}

El docente solicita el siguiente ajuste o cambio: "${userMsg}".
Ajustá el JSON manteniendo la misma estructura y respondé ÚNICAMENTE en JSON válido con el objeto actualizado completo.`;

    try {
      const updatedPlanJSON = await generateWithGemini(prompt);
      const updatedPlan = { ...currentPlan, ...updatedPlanJSON };
      setCurrentPlan(updatedPlan);
      setChatHistory(prev => [...prev, { 
        sender: 'ai', 
        text: `¡Listo! Actualicé la planificación con tu pedido: "${userMsg}". Podés revisar las tarjetas.` 
      }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { 
        sender: 'ai', 
        text: err.message === "MODO_DEMO_NO_KEY" 
          ? "Para hacer ajustes con IA necesitás configurar tu API Key en Ajustes." 
          : "No pude aplicar el ajuste. Intentá pedirlo de otra forma." 
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSaveCurrentPlan = () => {
    if (!currentPlan) return;
    const exists = savedPlans.some(p => p.id === currentPlan.id);
    if (exists) {
      setSavedPlans(savedPlans.map(p => p.id === currentPlan.id ? currentPlan : p));
    } else {
      setSavedPlans([currentPlan, ...savedPlans]);
    }
    alert("¡Planificación guardada en 'Mis Planificaciones'!");
  };

  const handleCopyAsText = () => {
    if (!currentPlan) return;
    let text = `PLANIFICACIÓN DOCENTE: ${currentPlan.title.toUpperCase()}\n`;
    text += `Materia: ${currentPlan.materia} | Año: ${currentPlan.anio} | Marco: ${currentPlan.jurisdiction}\n\n`;
    text += `1. FUNDAMENTACIÓN:\n${currentPlan.fundamentacion}\n\n`;
    text += `2. PROPÓSITOS:\n${currentPlan.propositos.map(p => `- ${p}`).join('\n')}\n\n`;
    text += `3. OBJETIVOS:\n${currentPlan.objetivos.map(o => `- ${o}`).join('\n')}\n\n`;
    text += `4. SABERES / CONTENIDOS:\n${currentPlan.saberesContenidos.map(s => `- ${s}`).join('\n')}\n\n`;
    text += `5. SECUENCIA DE ACTIVIDADES:\n`;
    currentPlan.secuenciaActividades.forEach(act => {
      text += `Clase ${act.claseNumero}: ${act.tituloClase}\n`;
      text += `  • Inicio: ${act.inicio}\n`;
      text += `  • Desarrollo: ${act.desarrollo}\n`;
      text += `  • Cierre: ${act.cierre}\n\n`;
    });
    text += `6. RECURSOS:\n${currentPlan.recursos.map(r => `- ${r}`).join('\n')}\n\n`;
    text += `7. EVALUACIÓN:\nCriterios:\n${currentPlan.evaluacion.criterios.map(c => `- ${c}`).join('\n')}\n`;
    text += `Instrumentos:\n${currentPlan.evaluacion.instrumentos.map(i => `- ${i}`).join('\n')}\n\n`;
    if (currentPlan.adecuacionesDUA) text += `8. DUA / TRAYECTORIAS:\n${currentPlan.adecuacionesDUA}\n\n`;
    if (currentPlan.esi) text += `9. ESI:\n${currentPlan.esi}\n\n`;
    if (currentPlan.bibliografia) text += `10. BIBLIOGRAFÍA:\n${currentPlan.bibliografia.map(b => `- ${b}`).join('\n')}\n`;

    navigator.clipboard.writeText(text);
    alert("¡Texto copiado al portapapeles!");
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleRunQuickTool = async () => {
    if (!quickToolInput.subject || !quickToolInput.topic) {
      alert("Completá materia y tema.");
      return;
    }
    setIsQuickToolLoading(true);
    setQuickToolResult(null);

    const toolPrompts = {
      warmup: `Generá 3 actividades disparadoras de inicio rápidas (10-15 min) para la materia "${quickToolInput.subject}", curso "${quickToolInput.level}" sobre el tema "${quickToolInput.topic}".`,
      rubric: `Generá una rúbrica de evaluación sintética con 3 criterios y 3 niveles (Logrado, En proceso, Inicial) para la materia "${quickToolInput.subject}", tema "${quickToolInput.topic}".`,
      exam: `Diseñá una propuesta de evaluación escrita con 4 consignas variadas y su grilla de corrección/criterios para la materia "${quickToolInput.subject}", tema "${quickToolInput.topic}".`,
      problems: `Creá 2 situaciones problemáticas contextualizadas en la vida cotidiana para secundaria sobre el tema "${quickToolInput.topic}" en "${quickToolInput.subject}".`,
      dua: `Proponé 3 estrategias de adecuación DUA/trayectorias diversas para el aprendizaje del tema "${quickToolInput.topic}" en "${quickToolInput.subject}".`
    };

    const prompt = `${toolPrompts[quickToolType]} Usá tono docente argentino y marco pedagógico secundario. Respondé en formato JSON con la clave "resultadoText" conteniendo el texto formateado en markdown amigable.`;

    try {
      const res = await generateWithGemini(prompt);
      setQuickToolResult(res.resultadoText);
    } catch (err) {
      if (err.message === "MODO_DEMO_NO_KEY") {
        setQuickToolResult("⚠️ Para usar las Herramientas Rápidas con IA, asegurate de tener la API Key configurada.");
      } else {
        setQuickToolResult("Ocurrió un error al generar la herramienta. Reintentá.");
      }
    } finally {
      setIsQuickToolLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-[#FDFBF7] text-slate-800'} transition-colors duration-200`}>
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 px-4 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-10 h-10 rounded-2xl bg-emerald-700 dark:bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
            P
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white leading-none">Planifica</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Asistente Docente Secundario</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700">
          <button onClick={() => setActiveTab('home')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${activeTab === 'home' ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}>Inicio</button>
          <button onClick={() => { setActiveTab('wizard'); setStep(1); }} className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${activeTab === 'wizard' ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}>Asistente</button>
          <button onClick={() => setActiveTab('tools')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${activeTab === 'tools' ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}>Herramientas</button>
          <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}>Mis Planificaciones ({savedPlans.length})</button>
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => setActiveTab('settings')} className={`p-2.5 rounded-xl transition ${activeTab === 'settings' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* TAB: INICIO */}
        {activeTab === 'home' && (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-3xl p-8 md:p-10 shadow-lg relative overflow-hidden">
              <div className="relative z-10 max-w-2xl space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-700/60 text-emerald-100 border border-emerald-600/50">
                  <Sparkles size={14} /> Alineado a NAP y Diseño Curricular de {selectedJurisdictionName.split(' ')[0]}
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">¿Qué querés planificar hoy?</h2>
                <p className="text-emerald-100 text-base leading-relaxed">
                  Generá secuencias didácticas, clases sueltas o proyectos interdisciplinarios listos para usar en el aula de secundaria.
                </p>
                <div className="pt-2">
                  <button onClick={() => { setActiveTab('wizard'); setStep(1); }} className="px-6 py-3.5 bg-white text-emerald-900 hover:bg-emerald-50 font-bold rounded-2xl shadow-sm hover:shadow transition flex items-center gap-2 text-sm">
                    Iniciar asistente de planificación <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Advertencia Ética */}
            <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 rounded-2xl p-5 flex items-start gap-4 text-amber-900 dark:text-amber-200 text-sm leading-relaxed">
              <HeartHandshake className="shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" size={24} />
              <div>
                <h4 className="font-bold text-amber-950 dark:text-amber-100 mb-1">{ETHICAL_DISCLAIMER.title}</h4>
                <p className="text-xs md:text-sm text-amber-900/90 dark:text-amber-300/90">{ETHICAL_DISCLAIMER.message}</p>
              </div>
            </div>

            {/* Accesos rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { type: 'Secuencia didáctica', desc: '4 a 8 clases articuladas con inicio, desarrollo y cierre', icon: Layers, color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
                { type: 'Clase suelta', desc: 'Planificación de 80 min para un tema o sustitución puntual', icon: Clock, color: 'bg-teal-500/10 text-teal-700 dark:text-teal-400' },
                { type: 'Proyecto interdisciplinario', desc: 'Articulación con otras materias y producto final', icon: Wrench, color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' },
                { type: 'Planificación anual', desc: 'Organizador sintético de unidades y contenidos por trimestre', icon: Calendar, color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
              ].map((item, idx) => (
                <div key={idx} onClick={() => { setWizardData({...wizardData, type: item.type}); setActiveTab('wizard'); setStep(1); }} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-500/50 transition cursor-pointer group shadow-sm hover:shadow-md flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center`}>
                      <item.icon size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition">{item.type}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="pt-4 flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    Comenzar <ChevronRight size={14} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: WIZARD */}
        {activeTab === 'wizard' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between text-sm font-bold text-slate-500">
              <button onClick={() => setActiveTab('home')} className="hover:text-slate-800 dark:hover:text-white">← Volver al inicio</button>
              <span>Paso {step} de 4</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-700 h-full transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }}></div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">1. ¿Qué formato y materia vas a planificar?</h3>
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Tipo de planificación</label>
                    <select value={wizardData.type} onChange={e => setWizardData({...wizardData, type: e.target.value})} className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none">
                      <option>Secuencia didáctica</option>
                      <option>Clase suelta</option>
                      <option>Proyecto interdisciplinario</option>
                      <option>Planificación anual</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Materia / Espacio Curricular</label>
                    <input type="text" placeholder="Ej: Matemática, Lengua y Literatura, Historia, Biología..." value={wizardData.subject} onChange={e => setWizardData({...wizardData, subject: e.target.value})} className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Año / Curso del Nivel Secundario</label>
                    <input type="text" placeholder="Ej: 1er Año (CB), 3er Año, 5to Año Orientado..." value={wizardData.year} onChange={e => setWizardData({...wizardData, year: e.target.value})} className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">2. Contenido principal y tiempos</h3>
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Eje / Contenido / Saber a trabajar</label>
                    <textarea rows={3} placeholder="Ej: Ecuaciones de primer grado con una incógnita, Revolución de Mayo y contexto regional, Función de nutrición humana..." value={wizardData.topic} onChange={e => setWizardData({...wizardData, topic: e.target.value})} className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Cantidad de clases</label>
                      <input type="text" placeholder="Ej: 4 clases" value={wizardData.classesCount} onChange={e => setWizardData({...wizardData, classesCount: e.target.value})} className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Duración por clase</label>
                      <input type="text" placeholder="Ej: 80 min (módulo)" value={wizardData.classDuration} onChange={e => setWizardData({...wizardData, classDuration: e.target.value})} className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">3. Características del grupo y recursos (Opcional)</h3>
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">¿Cómo es el curso?</label>
                    <textarea rows={3} placeholder="Ej: Grupo numeroso (32 estudiantes), participativo en discusiones pero con dificultades para concentrarse en lecturas largas. Hay 2 estudiantes con PPI." value={wizardData.groupCharacteristics} onChange={e => setWizardData({...wizardData, groupCharacteristics: e.target.value})} className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Recursos disponibles</label>
                    <input type="text" placeholder="Ej: Celulares con internet, proyector en la escuela, afiches, fotocopias..." value={wizardData.resourcesAvailable} onChange={e => setWizardData({...wizardData, resourcesAvailable: e.target.value})} className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">4. Confirmación de datos</h3>
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl space-y-2 text-sm border border-slate-200 dark:border-slate-600">
                    <p><strong>Tipo:</strong> {wizardData.type}</p>
                    <p><strong>Materia:</strong> {wizardData.subject || '-'}</p>
                    <p><strong>Año:</strong> {wizardData.year || '-'}</p>
                    <p><strong>Tema:</strong> {wizardData.topic || '-'}</p>
                    <p><strong>Tiempos:</strong> {wizardData.classesCount} clases ({wizardData.classDuration})</p>
                    <p><strong>Jurisdicción:</strong> {selectedJurisdictionName}</p>
                  </div>

                  {generationError === 'demo_mode' && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl text-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold text-amber-950">
                        <AlertCircle size={16} /> Modo demo de prueba activo
                      </div>
                      <p>Para generar la planificación real con la IA de Gemini, conectá tu clave en <strong>Ajustes</strong> o configurala en el servidor.</p>
                    </div>
                  )}

                  {generationError && generationError !== 'demo_mode' && (
                    <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-xs">
                      {generationError}
                    </div>
                  )}

                  <button onClick={handleGeneratePlan} disabled={isGenerating} className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50">
                    {isGenerating ? (
                      <>
                        <RefreshCw className="animate-spin" size={20} />
                        Elaborando propuesta pedagógica...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        Generar Planificación con Gemini
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Wizard Nav buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                {step > 1 ? (
                  <button onClick={() => setStep(step - 1)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900">
                    Anterior
                  </button>
                ) : <div></div>}
                {step < 4 && (
                  <button onClick={() => setStep(step + 1)} className="px-6 py-2.5 bg-emerald-700 text-white text-sm font-bold rounded-xl hover:bg-emerald-800 transition">
                    Siguiente
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: RESULTADO */}
        {activeTab === 'result' && currentPlan && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Encabezado resultado */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    {currentPlan.materia} • {currentPlan.anio}
                  </span>
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{currentPlan.title}</h2>
                  <p className="text-xs text-slate-500 mt-1">Marco: {currentPlan.jurisdiction}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleSaveCurrentPlan} className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-emerald-100 transition">
                    <CheckCircle2 size={16} /> Guardar
                  </button>
                  <button onClick={handleCopyAsText} className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-slate-200 transition">
                    <Copy size={16} /> Copiar
                  </button>
                  <button onClick={handlePrintPDF} className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-slate-200 transition">
                    <Download size={16} /> Imprimir / PDF
                  </button>
                </div>
              </div>

              {/* Advertencia Ética en pantalla de resultado */}
              <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 p-4 rounded-2xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-3">
                <ShieldAlert className="shrink-0 text-emerald-700" size={20} />
                <span>Revisá y adaptá esta planificación antes de presentarla o llevarla a clase. El único responsable pedagógico es el docente a cargo.</span>
              </div>

              {/* Tarjetas de bloques */}
              <div className="space-y-4">
                {/* 1. Fundamentación */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-2">
                  <h3 className="font-bold text-emerald-800 dark:text-emerald-400 text-sm uppercase tracking-wider">1. Fundamentación Pedagógica</h3>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{currentPlan.fundamentacion}</p>
                </div>

                {/* 2. Propósitos y Objetivos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-3">
                    <h3 className="font-bold text-emerald-800 dark:text-emerald-400 text-sm uppercase tracking-wider">Propósitos Docentes</h3>
                    <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside">
                      {currentPlan.propositos?.map((p, idx) => <li key={idx}>{p}</li>)}
                    </ul>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-3">
                    <h3 className="font-bold text-emerald-800 dark:text-emerald-400 text-sm uppercase tracking-wider">Objetivos de Aprendizaje</h3>
                    <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside">
                      {currentPlan.objetivos?.map((o, idx) => <li key={idx}>{o}</li>)}
                    </ul>
                  </div>
                </div>

                {/* 3. Saberes / Contenidos */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-3">
                  <h3 className="font-bold text-emerald-800 dark:text-emerald-400 text-sm uppercase tracking-wider">Saberes y Contenidos Priorizados</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentPlan.saberesContenidos?.map((saber, idx) => (
                      <span key={idx} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold">
                        {saber}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 4. Secuencia didáctica por clases */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-4">
                  <h3 className="font-bold text-emerald-800 dark:text-emerald-400 text-sm uppercase tracking-wider">Secuencia de Actividades</h3>
                  <div className="space-y-4">
                    {currentPlan.secuenciaActividades?.map((clase, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-700/40 p-4 rounded-2xl space-y-2 text-sm border border-slate-200/60 dark:border-slate-600">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                          <span>Clase {clase.claseNumero}: {clase.tituloClase}</span>
                        </div>
                        <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300 pt-1">
                          <p><strong>• Inicio:</strong> {clase.inicio}</p>
                          <p><strong>• Desarrollo:</strong> {clase.desarrollo}</p>
                          <p><strong>• Cierre:</strong> {clase.cierre}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Evaluación y DUA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-3">
                    <h3 className="font-bold text-emerald-800 dark:text-emerald-400 text-sm uppercase tracking-wider">Evaluación</h3>
                    <div className="text-xs space-y-2 text-slate-700 dark:text-slate-300">
                      <p><strong>Criterios:</strong></p>
                      <ul className="list-disc list-inside space-y-1">
                        {currentPlan.evaluacion?.criterios?.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                      <p className="pt-2"><strong>Instrumentos:</strong></p>
                      <ul className="list-disc list-inside space-y-1">
                        {currentPlan.evaluacion?.instrumentos?.map((inst, i) => <li key={i}>{inst}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-3">
                    <h3 className="font-bold text-emerald-800 dark:text-emerald-400 text-sm uppercase tracking-wider">Atención a la Diversidad / DUA</h3>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{currentPlan.adecuacionesDUA || "Propuesta de actividades con múltiples formatos de representación y expresión."}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat de ajuste lateral */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm flex flex-col h-[600px]">
                <div className="pb-3 border-b border-slate-100 dark:border-slate-700">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-600" /> Chat de Ajustes
                  </h3>
                  <p className="text-xs text-slate-500">Pedile cambios a Gemini sobre la planificación</p>
                </div>

                <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1 text-xs">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`p-3 rounded-2xl leading-relaxed ${msg.sender === 'user' ? 'bg-emerald-700 text-white ml-6' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 mr-4'}`}>
                      {msg.text}
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-2xl text-slate-500 text-xs animate-pulse">
                      Ajustando propuesta...
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendChatRefinement} className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <input type="text" placeholder="Ej: Sumá una actividad grupal..." value={chatMessage} onChange={e => setChatMessage(e.target.value)} className="flex-1 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl text-xs outline-none border border-slate-200 dark:border-slate-600 focus:ring-1 focus:ring-emerald-500" />
                  <button type="submit" disabled={isChatLoading} className="p-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition">
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB: HERRAMIENTAS RÁPIDAS */}
        {activeTab === 'tools' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Herramientas Rápidas</h2>
                <p className="text-xs text-slate-500 mt-1">Generá recursos puntuales para tus clases en segundos</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'warmup', label: 'Inicio / Disparadores' },
                  { id: 'rubric', label: 'Rúbrica sintética' },
                  { id: 'exam', label: 'Evaluación escrita' },
                  { id: 'problems', label: 'Situaciones problema' },
                  { id: 'dua', label: 'Adecuación DUA' }
                ].map(tool => (
                  <button key={tool.id} onClick={() => setQuickToolType(tool.id)} className={`p-3 rounded-2xl text-xs font-bold transition border ${quickToolType === tool.id ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-100'}`}>
                    {tool.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <input type="text" placeholder="Materia (ej: Matemática)" value={quickToolInput.subject} onChange={e => setQuickToolInput({...quickToolInput, subject: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-xs outline-none" />
                <input type="text" placeholder="Tema específico (ej: Teorema de Pitágoras)" value={quickToolInput.topic} onChange={e => setQuickToolInput({...quickToolInput, topic: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-xs outline-none" />
              </div>

              <button onClick={handleRunQuickTool} disabled={isQuickToolLoading} className="w-full py-3 bg-emerald-700 text-white font-bold rounded-2xl text-xs hover:bg-emerald-800 transition flex items-center justify-center gap-2">
                {isQuickToolLoading ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                Generar Recurso
              </button>

              {quickToolResult && (
                <div className="bg-slate-50 dark:bg-slate-700/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-600 text-xs space-y-3 leading-relaxed whitespace-pre-wrap">
                  {quickToolResult}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: HISTORIAL / MIS PLANIFICACIONES */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Mis Planificaciones Guardadas</h2>
            {savedPlans.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl text-center border border-slate-200 dark:border-slate-700 space-y-3">
                <p className="text-sm text-slate-500">Todavía no guardaste ninguna planificación en tu navegador.</p>
                <button onClick={() => { setActiveTab('wizard'); setStep(1); }} className="px-5 py-2.5 bg-emerald-700 text-white text-xs font-bold rounded-xl">
                  Crear primera planificación
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedPlans.map(plan => (
                  <div key={plan.id} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3 shadow-sm hover:shadow transition flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">{plan.materia} • {plan.anio}</span>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base mt-0.5">{plan.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{plan.fundamentacion}</p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400">{plan.date}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setCurrentPlan(plan); setActiveTab('result'); }} className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-bold">
                          Abrir
                        </button>
                        <button onClick={() => setSavedPlans(savedPlans.filter(p => p.id !== plan.id))} className="p-1.5 text-slate-400 hover:text-red-500 transition">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: AJUSTES */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-6">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Ajustes Generales</h2>

              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Jurisdicción y Diseño Curricular de Referencia</label>
                <select value={jurisdiction} onChange={e => setJurisdiction(e.target.value)} className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-xs font-semibold outline-none">
                  {PROVINCIAL_CURRICULA.map(j => (
                    <option key={j.id} value={j.id}>{j.name}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-400">Por defecto está configurado en Entre Ríos (CGE).</p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Clave de API de Gemini (Opcional)</label>
                <input type="password" placeholder="AIzaSy..." value={apiKey} onChange={e => handleSaveApiKey(e.target.value)} className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-xs outline-none" />
                <p className="text-xs text-slate-400">Si desplegaste la app en Vercel con la variable de entorno `VITE_GEMINI_API_KEY`, no hace falta que completes este campo.</p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-400">
                <span>Planifica v1.0.0 • Asistente Docente Secundario</span>
                <span>NEA TecnoSoluciones</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

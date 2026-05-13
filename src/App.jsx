import React, { useState, useEffect, useRef } from 'react';
import Model from 'react-body-highlighter';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
  addDoc, collection, getDocs, orderBy, query, serverTimestamp, deleteDoc, doc, updateDoc
} from 'firebase/firestore';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from 'firebase/auth'; 
import { db, auth } from './firebase'; 
import './App.css'; 

import html2pdf from 'html2pdf.js';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// ==========================================
// CONFIGURACIÓN Y DICCIONARIOS
// ==========================================
const diccionarioMusculos = {
  head: 'Cabeza', neck: 'Cuello', trapezius: 'Trapecios', shoulders: 'Hombros',
  chest: 'Pecho', abs: 'Abdomen', obliques: 'Oblicuos', biceps: 'Bíceps',
  triceps: 'Tríceps', forearm: 'Antebrazo', hands: 'Manos', 'upper-back': 'Espalda Alta',
  'lower-back': 'Espalda Baja', gluteal: 'Glúteos', quadriceps: 'Cuádriceps',
  hamstring: 'Isquiotibiales', calves: 'Pantorrillas', knees: 'Rodillas', feet: 'Pies'
};

const traducirMusculo = (idMusculo) => diccionarioMusculos[idMusculo] || idMusculo;

const diccionarioIdiomas = {
  es: {
    titulo: "Evaluación de Salud",
    paso1_desc: "Por favor, complete este breve cuestionario para ayudarnos a entender su condición.",
    btn_iniciar: "Iniciar evaluación",
    paso2_titulo: "Identificación del Paciente",
    lbl_nombre: "👤 Nombre Completo",
    ph_nombre: "Ingrese su nombre",
    lbl_edad: "📅 Edad",
    ph_edad: "Seleccione su edad...",
    btn_continuar: "Continuar",
    paso3_titulo: "Seleccione el área afectada",
    btn_frontal: "Frontal",
    btn_posterior: "Posterior",
    btn_atras: "Atrás",
    btn_siguiente: "Siguiente",
    paso4_titulo: "Seleccione los síntomas",
    sintoma_dolor: "Dolor",
    sintoma_rigidez: "Rigidez",
    sintoma_inflamacion: "Inflamación",
    sintoma_hormigueo: "Hormigueo",
    paso5_titulo: "¿Qué tan intenso es?",
    paso6_titulo: "Preguntas Finales",
    q_rigidez: "¿Presenta rigidez matutina?",
    q_crisis: "Frecuencia de las crisis:",
    q_sueno: "¿El dolor interrumpe su sueño?",
    q_fatiga: "¿Siente fatiga constante o inusual?",
    btn_si: "Sí",
    btn_no: "No",
    btn_baja: "Baja",
    btn_moderada: "Moderada",
    btn_alta: "Alta",
    btn_revisar: "Revisar",
    paso7_titulo: "Resumen de Información",
    lbl_datos: "Datos del Paciente",
    lbl_areas: "Áreas Afectadas",
    lbl_sintomas: "Síntomas e Intensidad",
    lbl_preguntas: "Preguntas Adicionales",
    advertencia: "⚠️ Revisa tu información. Al presionar Enviar Datos, estos serán enviados al médico.",
    btn_corregir: "✏️ Corregir",
    btn_enviar: "Enviar Datos",
    btn_enviando: "Enviando...",
    paso8_titulo: "¡Registro Exitoso!",
    paso8_desc: "Tus datos han sido enviados al doctor.",
    btn_nuevo: "Nueva Evaluación",
    
    // Instrucciones de voz
    voz_paso1: "Bienvenido. Por favor, presione el botón azul para iniciar su evaluación.",
    voz_paso2: "Primer paso. Ingrese su nombre y edad.",
    voz_paso3: "Paso dos. Seleccione en el cuerpo el área afectada. Puede acercar la imagen si lo necesita.",
    voz_paso4: "Paso tres. Seleccione sus síntomas.",
    voz_paso5: "Paso cuatro. Indique la intensidad del uno al diez.",
    voz_paso6: "Paso cinco. Responda las preguntas finales.",
    voz_paso7: "Paso seis. Revise su información y envíe.",
    voz_paso8: "Registro exitoso. Gracias."
  },
  my: {
    titulo: "Xookil Toj Óolal",
    paso1_desc: "Beet utsil, ts'íibte'ex le k'áat chi'oba' ti'al k-na'atik bix a wanil.",
    btn_iniciar: "Káajbal",
    paso2_titulo: "U k'ajóolil máak",
    lbl_nombre: "👤 U k'aaba'",
    ph_nombre: "Ts'íibt a k'aaba'",
    lbl_edad: "📅 Ja'ab",
    ph_edad: "Yéey a ja'ab...",
    btn_continuar: "Seguir",
    paso3_titulo: "Yéey le tu'ux ku yajale'",
    btn_frontal: "Táanil",
    btn_posterior: "Paachil",
    btn_atras: "Paachil",
    btn_siguiente: "Tuláak'",
    paso4_titulo: "Yéey le k'oja'anilo'ob",
    sintoma_dolor: "Yajil",
    sintoma_rigidez: "Chichil",
    sintoma_inflamacion: "Chuchup",
    sintoma_hormigueo: "Sina'an",
    paso5_titulo: "¿Bix u k'a'amkil?",
    paso6_titulo: "Ts'ook K'áat chi'ob",
    q_rigidez: "¿Yaan chichil tu sástal?",
    q_crisis: "Buka'aj suuk u yantal:",
    q_sueno: "¿Ku p'atik a wéenel le yajo'?",
    q_fatiga: "¿Ka wu'uyik a ka'analil?",
    btn_si: "Bey",
    btn_no: "Ma'",
    btn_baja: "Ma' sen",
    btn_moderada: "Chúumuk",
    btn_alta: "Ya'ab",
    btn_revisar: "Ilik",
    paso7_titulo: "U tsoolil",
    lbl_datos: "U k'ajóolil máak",
    lbl_areas: "Tu'ux ku yajal",
    lbl_sintomas: "K'oja'anilo'ob",
    lbl_preguntas: "Ts'ook K'áat chi'ob",
    advertencia: "⚠️ Iil a ts'íib. Ken a ts'áa Túuxtik, yaan u bin ti' le ts'aakajo'.",
    btn_corregir: "✏️ Utkíinsik",
    btn_enviar: "Túuxtik",
    btn_enviando: "Táan u túuxtik...",
    paso8_titulo: "¡Ma'alob!",
    paso8_desc: "Ts'o'ok u túuxta'al ti' le ts'aakajo'.",
    btn_nuevo: "Túumben Xookil"
  }
};

const formatFecha = (fechaFirestore) => {
  if (!fechaFirestore?.toDate) return 'Sin fecha';
  return fechaFirestore.toDate().toLocaleString('es-EC', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
};

const COLORS_VIBRANT = ['#1a73e8', '#ff5252', '#ffb300', '#4caf50', '#9c27b0'];

// --- LÓGICA DE VOZ ---
const hablar = (texto, idiomaActual) => {
  if (!window.speechSynthesis) return;
  if (idiomaActual === 'my') return; 

  window.speechSynthesis.cancel(); 
  const mensaje = new SpeechSynthesisUtterance(texto);
  mensaje.lang = 'es-ES';
  mensaje.rate = 1.2; 
  window.speechSynthesis.speak(mensaje);
};

const App = () => {
  const [modo, setModo] = useState('cargando');
  const [idioma, setIdioma] = useState('es'); 
  const [step, setStep] = useState(1);
  const [vistaActual, setVistaActual] = useState('anterior');
  const [saving, setSaving] = useState(false);
  const [listaEvaluaciones, setListaEvaluaciones] = useState([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [cargandoPacientes, setCargandoPacientes] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [notasTemporales, setNotasTemporales] = useState('');
  const [guardandoNotas, setGuardandoNotas] = useState(false);

  // --- ESTADOS PARA LOGIN (AUTH) Y RECUPERAR CONTRASEÑA ---
  const [usuarioMedico, setUsuarioMedico] = useState(null);
  const [emailLogin, setEmailLogin] = useState('');
  const [passLogin, setPassLogin] = useState('');
  const [errorLogin, setErrorLogin] = useState('');
  const [mostrarPass, setMostrarPass] = useState(false);
  const [modoRecuperar, setModoRecuperar] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  const expedienteRef = useRef();

  const t = (clave) => diccionarioIdiomas[idioma][clave] || diccionarioIdiomas['es'][clave] || clave;

  const [formData, setFormData] = useState({
    nombre: '', edad: '', partesCuerpo: [], sintomas: [],
    intensidad: { Dolor: 5, Rigidez: 5, Inflamacion: 5, Hormigueo: 5 }, 
    rigidezMatutina: '', frecuenciaCrisis: '', suenoInterrumpido: '', fatiga: ''             
  });

  const listaSintomas = [
    { id: 'Dolor', nombre: 'Dolor', icono: '✋' },
    { id: 'Rigidez', nombre: 'Rigidez', icono: '😐' },
    { id: 'Inflamacion', nombre: 'Inflamación', icono: '⏳' },
    { id: 'Hormigueo', nombre: 'Hormigueo', icono: '〰️' }
  ];
  const emojisIntensidad = ['😄', '🙂', '😐', '😕', '😟', '😣', '😢', '😭', '😫', '🤬'];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuarioMedico(user);
      const path = window.location.pathname;
      if (path.includes('/panel')) {
        setModo('medico');
        if (user) cargarPacientes();
      } else {
        setModo('paciente');
      }
    });
    return () => unsubscribe();
  }, []);

  // --- ACCIONES DE LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorLogin('');
    try {
      await signInWithEmailAndPassword(auth, emailLogin, passLogin);
      cargarPacientes();
    } catch (error) {
      if (error.code === 'auth/invalid-credential') {
        setErrorLogin('El correo o contraseña no coinciden.');
      } else if (error.code === 'auth/invalid-email') {
        setErrorLogin('El formato del correo es inválido.');
      } else {
        setErrorLogin('Error al intentar iniciar sesión.');
      }
    }
  };

  const handleRecuperarPassword = async () => {
    setErrorLogin('');
    setMensajeExito('');
    if (!emailLogin) {
      setErrorLogin('Por favor, escribe tu correo arriba para enviarte el enlace.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, emailLogin);
      setMensajeExito('¡Listo! Te hemos enviado un correo para restablecer tu contraseña. (Revisa tu carpeta de Spam)');
    } catch (error) {
      setErrorLogin('Error al intentar recuperar la contraseña. Verifica el correo.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setListaEvaluaciones([]);
    setPacienteSeleccionado(null);
  };

  // --- NAVEGACIÓN Y ACCIONES DEL PACIENTE ---
  const nextStep = () => {
    const siguiente = step + 1;
    hablar(diccionarioIdiomas['es'][`voz_paso${siguiente}`], idioma);
    setStep(siguiente);
  };
  
  const prevStep = () => {
    const anterior = step - 1;
    hablar(diccionarioIdiomas['es'][`voz_paso${anterior}`], idioma);
    setStep(anterior);
  };

  const toggleSelection = (category, item) => {
    const currentList = formData[category];
    if (!currentList.includes(item)) {
       const claveTraduccion = item === 'Inflamación' ? 'sintoma_inflamacion' : `sintoma_${item.toLowerCase()}`;
       hablar(t(claveTraduccion), idioma); 
    }
    if (currentList.includes(item)) {
      setFormData({ ...formData, [category]: currentList.filter(i => i !== item) });
    } else {
      setFormData({ ...formData, [category]: [...currentList, item] });
    }
  };

  const handleMuscleClick = (data) => {
    hablar(traducirMusculo(data.muscle), idioma); 
    toggleSelection('partesCuerpo', data.muscle);
  };

  const handleIntensidad = (sintoma, valor) => {
    hablar(`Nivel ${valor}`, idioma); 
    const key = sintoma === 'Inflamación' ? 'Inflamacion' : sintoma;
    setFormData({ ...formData, intensidad: { ...formData.intensidad, [key]: valor } });
  };

  const preguntasFinalesCompletas = formData.rigidezMatutina && formData.frecuenciaCrisis && formData.suenoInterrumpido && formData.fatiga;
  const highlightedData = [{ name: 'Afectado', muscles: formData.partesCuerpo }];

  const handleSaveToFirestore = async () => {
    hablar("Enviando", idioma);
    setSaving(true);
    try {
      await addDoc(collection(db, 'evaluaciones_salud'), {
        ...formData,
        nombre: formData.nombre.trim(),
        nombreLower: formData.nombre.trim().toLowerCase(),
        createdAt: serverTimestamp(),
        notasDoctor: '' 
      });
      setStep(8);
      hablar(diccionarioIdiomas['es']['voz_paso8'], idioma); 
    } catch (error) { console.error(error); } 
    finally { setSaving(false); }
  };

  // --- ACCIONES DEL MÉDICO ---
  const cargarPacientes = async () => {
    setCargandoPacientes(true);
    try {
      const q = query(collection(db, 'evaluaciones_salud'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      setListaEvaluaciones(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) { console.error(error); } 
    finally { setCargandoPacientes(false); }
  };

  const handleEliminarPaciente = async (idPaciente) => {
    if (!window.confirm("¿Estás seguro de eliminar este expediente?")) return;
    try {
      await deleteDoc(doc(db, 'evaluaciones_salud', idPaciente));
      setListaEvaluaciones(prev => prev.filter(paciente => paciente.id !== idPaciente));
      if (pacienteSeleccionado?.id === idPaciente) setPacienteSeleccionado(null);
    } catch (error) { console.error(error); }
  };

  const handleGuardarNotas = async () => {
    if (!pacienteSeleccionado) return;
    setGuardandoNotas(true);
    try {
      await updateDoc(doc(db, 'evaluaciones_salud', pacienteSeleccionado.id), { notasDoctor: notasTemporales });
      setListaEvaluaciones(prev => prev.map(p => p.id === pacienteSeleccionado.id ? { ...p, notasDoctor: notasTemporales } : p));
      alert("✅ Diagnóstico guardado.");
    } catch (error) { console.error(error); } 
    finally { setGuardandoNotas(false); }
  };

  const descargarPDF = () => {
    const element = expedienteRef.current;
    const opt = { margin: [0.5, 0.5, 0.5, 0.5], filename: `Expediente.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }};
    html2pdf().set(opt).from(element).save();
  };

  // --- CÁLCULOS ESTADÍSTICAS ---
  const statsSintomas = {};
  const statsEdades = { '< 20': 0, '21-30': 0, '31-40': 0, '41-50': 0, '51+': 0 };
  listaEvaluaciones.forEach(paciente => {
    paciente.sintomas?.forEach(s => statsSintomas[s] = (statsSintomas[s] || 0) + 1);
    const edad = parseInt(paciente.edad);
    if (edad <= 20) statsEdades['< 20']++; else if (edad <= 30) statsEdades['21-30']++; else if (edad <= 40) statsEdades['31-40']++; else if (edad <= 50) statsEdades['41-50']++; else statsEdades['51+']++;
  });
  const dataSintomas = Object.keys(statsSintomas).map(key => ({ name: key, value: statsSintomas[key] }));
  const dataEdades = Object.keys(statsEdades).map(key => ({ name: key, value: statsEdades[key] }));
  const pacientesFiltrados = listaEvaluaciones.filter(paciente => paciente.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  if (modo === 'cargando') return null;

  return (
  <div className="app-container" translate="no" style={{ background: '#eef2f5' }}>

      {/* ========================================================= */}
      {/* ================= PANEL DEL PACIENTE ====================== */}
      {/* ========================================================= */}
      {modo === 'paciente' && (
        <div className="glass-card" style={{ position: 'relative' }}>
          
          {/* SELECTOR DE IDIOMA */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 10px 0 10px' }}>
            <div style={{ background: '#f1f3f4', borderRadius: '20px', display: 'inline-flex', overflow: 'hidden', border: '1px solid #ccc' }}>
              <button 
                onClick={() => { setIdioma('es'); hablar('Idioma cambiado a Español', 'es'); }} 
                style={{ padding: '8px 15px', border: 'none', background: idioma === 'es' ? '#1a73e8' : 'transparent', color: idioma === 'es' ? 'white' : '#555', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
              >
                Español
              </button>
              <button 
                onClick={() => setIdioma('my')} 
                style={{ padding: '8px 15px', border: 'none', background: idioma === 'my' ? '#1a73e8' : 'transparent', color: idioma === 'my' ? 'white' : '#555', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
              >
                Maya
              </button>
            </div>
          </div>

          <header className="header" style={{ marginTop: '5px' }}>
            <div className="heart-icon">💙</div>
            <h3>{t('titulo')}</h3>
          </header>
          
          {step === 1 && (
            <div className="step-content center-v">
              <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>{t('paso1_desc')}</p>
              <button className="btn-primary main-cta" onClick={() => { hablar(diccionarioIdiomas['es']['voz_paso1'], idioma); nextStep(); }}>{t('btn_iniciar')}</button>
            </div>
          )}

          {step === 2 && (
            <div className="step-content">
              <h4 className="title">{t('paso2_titulo')}</h4>
              <div className="input-field">
                <label>{t('lbl_nombre')}</label>
                <input type="text" placeholder={t('ph_nombre')} value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
              </div>
              <div className="input-field">
                <label>{t('lbl_edad')}</label>
                <select value={formData.edad} onChange={(e) => { hablar(`${e.target.value} años`, idioma); setFormData({...formData, edad: e.target.value}); }}>
                  <option value="">{t('ph_edad')}</option>
                  {Array.from({ length: 90 }, (_, i) => i + 10).map(num => <option key={num} value={num}>{num}</option>)}
                </select>
              </div>
              <div className="actions"><button className="btn-primary full" onClick={nextStep} disabled={!formData.nombre || !formData.edad}>{t('btn_continuar')}</button></div>
            </div>
          )}

          {step === 3 && (
            <div className="step-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <h4 className="title" style={{ marginBottom: '10px' }}>{t('paso3_titulo')}</h4>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '15px' }}>
                <button onClick={() => { hablar(t('btn_frontal'), idioma); setVistaActual('anterior'); }} style={{ padding: '8px 15px', borderRadius: '20px', border: 'none', background: vistaActual === 'anterior' ? '#1a73e8' : '#e0e0e0', color: vistaActual === 'anterior' ? 'white' : '#333', cursor: 'pointer', fontWeight: 'bold' }}>{t('btn_frontal')}</button>
                <button onClick={() => { hablar(t('btn_posterior'), idioma); setVistaActual('posterior'); }} style={{ padding: '8px 15px', borderRadius: '20px', border: 'none', background: vistaActual === 'posterior' ? '#1a73e8' : '#e0e0e0', color: vistaActual === 'posterior' ? 'white' : '#333', cursor: 'pointer', fontWeight: 'bold' }}>{t('btn_posterior')}</button>
              </div>
              <div style={{ flex: 1, background: '#f8fafd', borderRadius: '12px', border: '1px solid #e1e9f4', overflow: 'hidden', position: 'relative' }}>
                <TransformWrapper initialScale={1} minScale={0.5} maxScale={4} centerOnInit centerZoomedOut>
                  {({ zoomIn, zoomOut, resetTransform }) => (
                    <React.Fragment>
                      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '8px', background: 'white', padding: '8px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.15)' }}>
                        <button onClick={() => { zoomIn(); hablar("Acercar", idioma); }} style={{ width: '35px', height: '35px', borderRadius: '8px', background: 'white', border: '2px solid #1a73e8', cursor: 'pointer', color: '#1a73e8', fontWeight:'bold', fontSize:'18px' }}>+</button>
                        <button onClick={() => { zoomOut(); hablar("Alejar", idioma); }} style={{ width: '35px', height: '35px', borderRadius: '8px', background: 'white', border: '2px solid #1a73e8', cursor: 'pointer', color: '#1a73e8', fontWeight:'bold', fontSize:'18px' }}>-</button>
                        <button onClick={() => { resetTransform(); hablar("Reiniciar vista", idioma); }} style={{ width: '35px', height: '35px', borderRadius: '8px', background: 'white', border: '2px solid #1a73e8', cursor: 'pointer', color: '#1a73e8', fontSize:'18px' }}>🔄</button>
                      </div>
                      <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "300px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <div style={{ width: '180px' }}><Model type={vistaActual} data={highlightedData} style={{ width: '100%', cursor: 'pointer' }} onClick={handleMuscleClick} highlightedColors={['#ef5350']} /></div>
                      </TransformComponent>
                    </React.Fragment>
                  )}
                </TransformWrapper>
              </div>
              <div className="actions split" style={{ marginTop: '15px' }}>
                <button className="btn-back" onClick={prevStep}>{t('btn_atras')}</button>
                <button className="btn-primary" onClick={nextStep} disabled={formData.partesCuerpo.length === 0}>{t('btn_siguiente')}</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="step-content">
              <h4 className="title">{t('paso4_titulo')}</h4>
              <div className="symptoms-list">
                {listaSintomas.map(s => {
                  const claveTraduccion = s.nombre === 'Inflamación' ? 'sintoma_inflamacion' : `sintoma_${s.nombre.toLowerCase()}`;
                  return (
                    <button key={s.id} className={`symptom-item ${formData.sintomas.includes(s.nombre) ? 'active' : ''}`} onClick={() => toggleSelection('sintomas', s.nombre)}>
                      <span className="icon">{s.icono}</span> <span className="symptom-text">{t(claveTraduccion)}</span>
                    </button>
                  )
                })}
              </div>
              <div className="actions split">
                <button className="btn-back" onClick={prevStep}>{t('btn_atras')}</button>
                <button className="btn-primary" onClick={nextStep} disabled={formData.sintomas.length === 0}>{t('btn_siguiente')}</button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="step-content">
              <h4 className="title">{t('paso5_titulo')}</h4>
              <div className="scrollable-content" style={{ overflowY: 'auto', maxHeight: '350px', paddingRight: '5px' }}>
                {formData.sintomas.map(sintoma => {
                  const claveTraduccion = sintoma === 'Inflamación' ? 'sintoma_inflamacion' : `sintoma_${sintoma.toLowerCase()}`;
                  return (
                    <div key={sintoma} className="intensity-control">
                      <p className="sintoma-label">{t(claveTraduccion)}</p>
                      <div className="intensity-row">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n, i) => (
                          <div key={n} className="scale-point">
                            <span className="emoji-small">{emojisIntensidad[i]}</span>
                            <button className={`btn-number ${formData.intensidad[sintoma === 'Inflamación' ? 'Inflamacion' : sintoma] === n ? 'selected' : ''}`} onClick={() => handleIntensidad(sintoma, n)}>{n}</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="actions split">
                <button className="btn-back" onClick={prevStep}>{t('btn_atras')}</button>
                <button className="btn-primary" onClick={nextStep}>{t('btn_siguiente')}</button>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="step-content">
              <h4 className="title">{t('paso6_titulo')}</h4>
              <div className="extra-q" style={{ overflowY: 'auto', maxHeight: '350px', paddingRight: '5px' }}>
                <p className="q-label">{t('q_rigidez')}</p>
                <div className="btn-row">
                  {['Sí', 'No'].map(o => (
                    <button key={o} className={`btn-choice ${formData.rigidezMatutina === o ? 'active' : ''}`} onClick={() => { hablar(o === 'Sí' ? t('btn_si') : t('btn_no'), idioma); setFormData({...formData, rigidezMatutina: o}); }}>
                      {o === 'Sí' ? t('btn_si') : t('btn_no')}
                    </button>
                  ))}
                </div>
                
                <p className="q-label">{t('q_crisis')}</p>
                <div className="btn-row">
                  {['Baja', 'Moderada', 'Alta'].map(o => (
                    <button key={o} className={`btn-choice ${formData.frecuenciaCrisis === o ? 'active' : ''}`} onClick={() => { hablar(t(`btn_${o.toLowerCase()}`), idioma); setFormData({...formData, frecuenciaCrisis: o}); }}>
                      {t(`btn_${o.toLowerCase()}`)}
                    </button>
                  ))}
                </div>
                
                <p className="q-label">{t('q_sueno')}</p>
                <div className="btn-row">
                  {['Sí', 'No'].map(o => (
                    <button key={o} className={`btn-choice ${formData.suenoInterrumpido === o ? 'active' : ''}`} onClick={() => { hablar(o === 'Sí' ? t('btn_si') : t('btn_no'), idioma); setFormData({...formData, suenoInterrumpido: o}); }}>
                      {o === 'Sí' ? t('btn_si') : t('btn_no')}
                    </button>
                  ))}
                </div>
                
                <p className="q-label">{t('q_fatiga')}</p>
                <div className="btn-row">
                  {['Sí', 'No'].map(o => (
                    <button key={o} className={`btn-choice ${formData.fatiga === o ? 'active' : ''}`} onClick={() => { hablar(o === 'Sí' ? t('btn_si') : t('btn_no'), idioma); setFormData({...formData, fatiga: o}); }}>
                      {o === 'Sí' ? t('btn_si') : t('btn_no')}
                    </button>
                  ))}
                </div>
              </div>
              <div className="actions split">
                <button className="btn-back" onClick={prevStep}>{t('btn_atras')}</button>
                <button className="btn-primary" onClick={nextStep} disabled={!preguntasFinalesCompletas}>{t('btn_revisar')}</button>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="step-content">
              <h4 className="title">{t('paso7_titulo')}</h4>
              <div className="summary-content" style={{ overflowY: 'auto', maxHeight: '250px', paddingRight: '10px', textAlign: 'left', color: '#333' }}>
                <div style={{ background: '#f8fafd', padding: '10px', borderRadius: '8px', marginBottom: '10px', border: '1px solid #e1e9f4' }}>
                  <h5 style={{ margin: '0 0 5px 0', color: '#1a73e8', display: 'flex', alignItems: 'center', gap: '5px' }}><span>👤</span> {t('lbl_datos')}</h5>
                  <p style={{ margin: '2px 0', fontSize: '14px' }}><strong>{t('lbl_nombre').replace('👤 ', '')}:</strong> {formData.nombre}</p>
                  <p style={{ margin: '2px 0', fontSize: '14px' }}><strong>{t('lbl_edad').replace('📅 ', '')}:</strong> {formData.edad} años</p>
                </div>
                <div style={{ background: '#f8fafd', padding: '10px', borderRadius: '8px', marginBottom: '10px', border: '1px solid #e1e9f4' }}>
                  <h5 style={{ margin: '0 0 5px 0', color: '#1a73e8', display: 'flex', alignItems: 'center', gap: '5px' }}><span>📍</span> {t('lbl_areas')}</h5>
                  <p style={{ margin: '2px 0', fontSize: '14px', textTransform: 'capitalize' }}>{formData.partesCuerpo.map(traducirMusculo).join(', ')}</p>
                </div>
                <div style={{ background: '#f8fafd', padding: '10px', borderRadius: '8px', marginBottom: '10px', border: '1px solid #e1e9f4' }}>
                  <h5 style={{ margin: '0 0 5px 0', color: '#1a73e8', display: 'flex', alignItems: 'center', gap: '5px' }}><span>🩺</span> {t('lbl_sintomas')}</h5>
                  <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '14px' }}>
                    {formData.sintomas.map(s => {
                      const claveTraduccion = s === 'Inflamación' ? 'sintoma_inflamacion' : `sintoma_${s.toLowerCase()}`;
                      return (
                        <li key={s} style={{ margin: '2px 0' }}><strong>{t(claveTraduccion)}:</strong> {formData.intensidad[s === 'Inflamación' ? 'Inflamacion' : s]} / 10</li>
                      )
                    })}
                  </ul>
                </div>
                <div style={{ background: '#f8fafd', padding: '10px', borderRadius: '8px', border: '1px solid #e1e9f4' }}>
                  <h5 style={{ margin: '0 0 5px 0', color: '#1a73e8', display: 'flex', alignItems: 'center', gap: '5px' }}><span>📋</span> {t('lbl_preguntas')}</h5>
                  <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '14px' }}>
                    <li style={{ margin: '2px 0' }}><strong>{t('q_rigidez')}</strong> {formData.rigidezMatutina === 'Sí' ? t('btn_si') : t('btn_no')}</li>
                    <li style={{ margin: '2px 0' }}><strong>{t('q_crisis')}</strong> {t(`btn_${formData.frecuenciaCrisis.toLowerCase()}`)}</li>
                    <li style={{ margin: '2px 0' }}><strong>{t('q_sueno')}</strong> {formData.suenoInterrumpido === 'Sí' ? t('btn_si') : t('btn_no')}</li>
                    <li style={{ margin: '2px 0' }}><strong>{t('q_fatiga')}</strong> {formData.fatiga === 'Sí' ? t('btn_si') : t('btn_no')}</li>
                  </ul>
                </div>
              </div>
              <div style={{ background: '#fff3cd', color: '#856404', padding: '12px', borderRadius: '8px', border: '1px solid #ffeeba', marginTop: '15px', fontSize: '14px', textAlign: 'center' }}>
                {t('advertencia')}
              </div>
              <div className="actions split" style={{ marginTop: '15px' }}>
                <button className="btn-back" onClick={prevStep}>{t('btn_corregir')}</button>
                <button className="btn-primary" onClick={handleSaveToFirestore} disabled={saving}>{saving ? t('btn_enviando') : t('btn_enviar')}</button>
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="step-content center-v">
              <div className="success-check">✅</div>
              <h4 className="title">{t('paso8_titulo')}</h4>
              <p style={{ color: '#666', marginTop: '10px' }}>{t('paso8_desc')}</p>
              <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => window.location.reload()}>{t('btn_nuevo')}</button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* ================= PANEL DEL MÉDICO ======================== */}
      {/* ========================================================= */}
      {modo === 'medico' && (
        <div className="medico-panel" style={{ display: 'flex', width: '100%', height: '90vh', background: '#fff', borderRadius: '15px', overflow: 'hidden', boxShadow:'0 10px 30px rgba(0,0,0,0.05)' }}>
          
          {/* LOGIN DEL DOCTOR */}
          {!usuarioMedico ? (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafd' }}>
              <div style={{ background: '#fff', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', width: '100%', maxWidth: '400px', border: '1px solid #e1e9f4' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <div style={{ fontSize: '40px' }}>👨‍⚕️</div>
                  <h2 style={{ color: '#1a73e8', margin: '10px 0 0 0' }}>Acceso Médico</h2>
                  <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>Ingrese sus credenciales</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontSize: '14px', fontWeight: 'bold' }}>Correo Electrónico</label>
                    <input type="email" required value={emailLogin} onChange={(e) => setEmailLogin(e.target.value)} 
style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#333' }} 
placeholder=""  />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontSize: '14px', fontWeight: 'bold' }}>Contraseña</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input type={mostrarPass ? "text" : "password"} required value={passLogin} onChange={(e) => setPassLogin(e.target.value)} 
style={{ width: '100%', padding: '12px', paddingRight: '45px', borderRadius: '10px', border: '1px solid #ddd', outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#333' }} 
placeholder="" />
                      <button type="button" onClick={() => setMostrarPass(!mostrarPass)}
                        style={{ position: 'absolute', right: '10px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {mostrarPass ? (
                          <svg viewBox="0 0 24 24" width="20" height="20" stroke="#666" strokeWidth="2" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" width="20" height="20" stroke="#666" strokeWidth="2" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right', marginTop: '-10px' }}>
                    <button type="button" onClick={() => { setModoRecuperar(!modoRecuperar); setErrorLogin(''); setMensajeExito(''); }} style={{ background: 'none', border: 'none', color: '#1a73e8', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}>
                      {modoRecuperar ? 'Volver al inicio de sesión' : '¿Olvidaste tu contraseña?'}
                    </button>
                  </div>
                  
                  {errorLogin && <p style={{ color: '#ff5252', fontSize: '13px', margin: 0, textAlign: 'center', fontWeight: 'bold' }}>{errorLogin}</p>}
                  {mensajeExito && <p style={{ color: '#4caf50', fontSize: '13px', margin: 0, textAlign: 'center', fontWeight: 'bold' }}>{mensajeExito}</p>}

                  {!modoRecuperar ? (
                    <button type="submit" style={{ background: '#1a73e8', color: 'white', padding: '15px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '5px' }}>Iniciar Sesión</button>
                  ) : (
                    <button type="button" onClick={handleRecuperarPassword} style={{ background: '#ffb300', color: '#333', padding: '15px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '5px' }}>Enviar enlace al correo</button>
                  )}
                </form>
              </div>
            </div>
          ) : (
            
            /* DOCTOR LOGUEADO: PANEL MÉDICO */
            <React.Fragment>
              <div className="sidebar" style={{ width: '320px', borderRight: '1px solid #e1e9f4', display: 'flex', flexDirection: 'column', background: '#fff' }}>
                <div style={{ padding: '25px 20px', background: 'linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{margin:0, fontSize: '20px'}}>Panel Médico</h3>
                  <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid #fff', color: 'white', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Salir</button>
                </div>
                
                <div style={{ padding: '15px' }}>
                  <input type="text" placeholder="🔍 Buscar paciente..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} 
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', background: '#f8fafd', color:'#333', outline:'none', boxSizing: 'border-box' }} />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                  <p style={{fontSize:'12px', color:'#1a73e8', fontWeight:'bold', marginLeft:'5px', textTransform: 'uppercase'}}>EVALUACIONES</p>
                  {pacientesFiltrados.map(evaluacion => (
                    <div key={evaluacion.id} onClick={() => { setPacienteSeleccionado(evaluacion); setNotasTemporales(evaluacion.notasDoctor || ''); }} 
                      style={{ padding: '15px', marginBottom: '8px', borderRadius: '12px', cursor: 'pointer', background: pacienteSeleccionado?.id === evaluacion.id ? '#e8f0fe' : '#fff', border: pacienteSeleccionado?.id === evaluacion.id ? '1px solid #1a73e8' : '1px solid #e1e9f4' }}>
                      <strong style={{ color: '#333', display: 'block', fontSize: '15px' }}>{evaluacion.nombre}</strong>
                      <span style={{ fontSize: '11px', color: '#888' }}>{formatFecha(evaluacion.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="main-content" style={{ flex: 1, padding: '30px', overflowY: 'auto', background: '#eef2f5' }}>
                {!pacienteSeleccionado ? (
                  <div>
                    <h2 style={{color:'#1a73e8', marginBottom:'20px', fontSize: '28px'}}>📊 Dashboard de Clínica</h2>
                    <div style={{display:'grid', gridTemplateColumns:'1fr', gap:'20px'}}>
                      <div style={{background:'#fff', padding:'30px', borderRadius:'15px', border:'1px solid #e1e9f4', textAlign:'center', boxShadow: '0 2px 10px rgba(0,0,0,0.03)'}}>
                         <h4 style={{color:'#888', margin:0, fontSize: '16px'}}>Total de pacientes</h4>
                         <h1 style={{fontSize:'60px', color:'#1a73e8', margin:'10px 0', fontWeight: '700'}}>{listaEvaluaciones.length}</h1>
                      </div>
                      
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
                        <div style={{background:'#fff', padding:'20px', borderRadius:'15px', border:'1px solid #e1e9f4', boxShadow: '0 2px 10px rgba(0,0,0,0.03)'}}>
                          <h4 style={{textAlign:'center', color:'#1a73e8', marginBottom: '15px'}}>Síntomas Frecuentes</h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie data={dataSintomas} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {dataSintomas.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS_VIBRANT[index % COLORS_VIBRANT.length]} />)}
                              </Pie>
                              <Tooltip contentStyle={{background: '#fff', border: '1px solid #e1e9f4', borderRadius: '8px', color: '#333'}}/>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div style={{background:'#fff', padding:'20px', borderRadius:'15px', border:'1px solid #e1e9f4', boxShadow: '0 2px 10px rgba(0,0,0,0.03)'}}>
                          <h4 style={{textAlign:'center', color:'#1a73e8', marginBottom: '15px'}}>Distribución por Edades</h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={dataEdades}>
                              <XAxis dataKey="name" fontSize={12} tick={{fill: '#666'}} />
                              <YAxis tick={{fill: '#666'}}/>
                              <Tooltip contentStyle={{background: '#fff', border: '1px solid #e1e9f4', borderRadius: '8px', color: '#333'}} cursor={{fill: 'rgba(26, 115, 232, 0.05)'}}/>
                              <Bar dataKey="value" fill="#1a73e8" radius={[5, 5, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div ref={expedienteRef} style={{ background: '#fff', padding: '20px' }}>
                    
                    {/* =============================================================== */}
                    {/* CABECERA ESTÉTICA, COMPACTA Y CENTRADA PARA EVITAR SUPERPOSICIÓN */}
                    {/* =============================================================== */}
                    <div style={{
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '25px', 
                        borderBottom: '1px solid #e1e9f4', 
                        paddingBottom: '15px'
                    }}>
                       {/* Botón Volver (Izquierda) */}
                       <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
                           <button onClick={() => setPacienteSeleccionado(null)} style={{
                               background: '#eef2f8', border: 'none', padding: '8px 16px', borderRadius: '8px', 
                               cursor: 'pointer', fontWeight: '600', color: '#1a73e8', display: 'flex', 
                               alignItems: 'center', gap: '8px', fontSize: '14px'
                           }}>
                              <span style={{ fontSize: '16px' }}>⬅️</span> Volver
                           </button>
                       </div>

                       {/* Título (Centro) */}
                       <div style={{ flex: 1, textAlign: 'center' }}>
                           <h2 style={{
                               color: '#1a73e8', margin: 0, fontSize: '20px', fontWeight: '700',
                               textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap'
                           }}>
                               Expediente Clínico
                           </h2>
                       </div>
                       
                       {/* Botones de Acción (Derecha) */}
                       <div style={{ flex: 1, display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={descargarPDF} style={{
                                background: '#4caf50', color: '#fff', border: 'none', padding: '8px 16px', 
                                borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', 
                                alignItems: 'center', gap: '6px', fontSize: '14px',
                                boxShadow: '0 2px 4px rgba(76, 175, 80, 0.2)'
                            }}>
                              <span style={{ fontSize: '16px' }}>📄</span> Exportar PDF
                            </button>
                            <button onClick={() => handleEliminarPaciente(pacienteSeleccionado.id)} style={{
                                background: '#d32f2f', color: '#fff', border: 'none', padding: '8px 16px', 
                                borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', 
                                alignItems: 'center', gap: '6px', fontSize: '14px',
                                boxShadow: '0 2px 4px rgba(211, 47, 47, 0.2)'
                            }}>
                              <span style={{ fontSize: '16px' }}>🗑️</span> Eliminar
                            </button>
                       </div>
                    </div>
                    {/* =============================================================== */}

                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '28px', fontWeight: '700', marginBottom: '5px', fontFamily: "'Open Sans', sans-serif" }}>Voz y Visión de Salud</h2>
                        <p style={{ color: '#666', fontSize: '16px', margin: 0, fontFamily: "'Open Sans', sans-serif" }}>Informe de Evaluación del Paciente</p>
                    </div>

                    <div style={{background:'#f5f7f9', padding:'25px', borderRadius:'15px', border:'1px solid #e1e9f4', marginBottom:'20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)'}}>
                       <h3 style={{marginTop:0, color:'#333', textAlign:'center', fontSize: '20px', fontWeight: '600', marginBottom: '20px', fontFamily: "'Open Sans', sans-serif"}}>Mapa <span style={{ color: '#1a73e8' }}>Corporal</span></h3>
                       
                       <div style={{display:'flex', justifyContent:'center', gap:'40px', background:'#fff', padding:'20px', borderRadius:'15px', margin:'0 auto', border: '1px solid #e1e9f4', maxWidth: '500px'}}>
                          <div style={{width:'180px', textAlign:'center'}}>
                              <strong style={{color: '#666', fontSize: '17px', display: 'block', marginBottom: '10px', fontFamily: "'Open Sans', sans-serif"}}>Frontal</strong>
                              <Model type="anterior" data={[{muscles: pacienteSeleccionado.partesCuerpo}]} highlightedColors={['#ef5350']} />
                          </div>
                          <div style={{width:'180px', textAlign:'center'}}>
                              <strong style={{color: '#666', fontSize: '17px', display: 'block', marginBottom: '10px', fontFamily: "'Open Sans', sans-serif"}}>Posterior</strong>
                              <Model type="posterior" data={[{muscles: pacienteSeleccionado.partesCuerpo}]} highlightedColors={['#ef5350']} />
                          </div>
                       </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', color: '#333', fontFamily: "'Open Sans', sans-serif" }}>
                        <div style={{background:'#f5f7f9', padding:'20px', borderRadius:'12px', border:'1px solid #e1e9f4', display: 'flex', flexDirection: 'column', gap: '8px'}}>
                            <h5 style={{ margin: '0 0 10px 0', color: '#1a73e8', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '600' }}>
                                <span style={{ color: '#1a73e8' }}>👤</span> Datos del Paciente
                            </h5>
                            <p style={{ margin: '0', fontSize: '15px' }}><strong style={{ color: '#444' }}>Nombre:</strong> {pacienteSeleccionado.nombre}</p>
                            <p style={{ margin: '0', fontSize: '15px' }}><strong style={{ color: '#444' }}>Edad:</strong> {pacienteSeleccionado.edad} años</p>
                            <p style={{ margin: '0', fontSize: '15px', textTransform: 'capitalize' }}><strong style={{ color: '#444' }}>Áreas:</strong> {pacienteSeleccionado.partesCuerpo?.map(traducirMusculo).join(', ') || 'Ninguna'}</p>
                        </div>

                        <div style={{background:'#f5f7f9', padding:'20px', borderRadius:'12px', border:'1px solid #e1e9f4'}}>
                            <h5 style={{ margin: '0 0 10px 0', color: '#1a73e8', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '600' }}>
                                <span style={{ color: '#1a73e8' }}>🩺</span> Síntomas
                            </h5>
                            {pacienteSeleccionado.sintomas?.length > 0 ? (
                                <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '15px', color: '#444', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    {pacienteSeleccionado.sintomas.map(s => (
                                        <li key={s} style={{ margin: '0' }}>
                                            <strong>{s} :</strong> <span style={{color:'#f9a825', fontWeight:'bold', fontSize: '16px'}}>{pacienteSeleccionado.intensidad?.[s === 'Inflamación' ? 'Inflamacion' : s] || 'N/A'}/10</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p style={{ margin: '0', fontSize: '15px', color: '#666' }}>Sin síntomas registrados</p>}
                        </div>

                        <div style={{background:'#fff', padding:'25px', borderRadius:'15px', border:'1px solid #e1e9f4', boxShadow: '0 4px 6px rgba(0,0,0,0.02)'}}>
                            <h4 style={{marginTop:0, color:'#1a73e8', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '19px', fontWeight: '600'}}>
                                <span>👩‍⚕️</span> Notas Médicas y Diagnóstico
                            </h4>
                            <textarea style={{width:'100%', height:'150px', padding:'15px', borderRadius:'12px', border:'1px solid #ccc', fontSize:'14px', color:'#333', background:'#f8fafd', outline:'none', boxSizing:'border-box', fontFamily: 'inherit'}} 
                                value={notasTemporales} onChange={(e) => setNotasTemporales(e.target.value)} placeholder="Escriba aquí el diagnóstico o tratamiento sugerido..." />
                            <button onClick={handleGuardarNotas} className="btn-primary" style={{marginTop:'15px', width:'200px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', fontSize: '15px', background: '#1a73e8'}}>
                                <span>💾</span> Guardar Notas
                            </button>
                        </div>
                    </div>
                  </div>
                )}
              </div>
            </React.Fragment>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
// =============================================
// VARIABLES GLOBALES Y DICCIONARIO
// =============================================
const mapaIdsRegiones = {
    "PE-AMA": "Amazonas", "PE-ANC": "Áncash", "PE-APU": "Apurímac", "PE-ARE": "Arequipa",
    "PE-AYA": "Ayacucho", "PE-CAJ": "Cajamarca", "PE-CAL": "Callao", "PE-CUS": "Cusco",
    "PE-HUV": "Huancavelica", "PE-HUC": "Huánuco", "PE-ICA": "Ica", "PE-JUN": "Junín",
    "PE-LAL": "La Libertad", "PE-LAM": "Lambayeque", "PE-LIM": "Lima Provincias",
    "PE-LMA": "Lima Metropolitana", "PE-LOR": "Loreto", "PE-MDD": "Madre de Dios",
    "PE-MOQ": "Moquegua", "PE-PAS": "Pasco", "PE-PIU": "Piura", "PE-PUN": "Puno",
    "PE-SAM": "San Martín", "PE-TAC": "Tacna", "PE-TUM": "Tumbes", "PE-UCA": "Ucayali"
};

let regionActiva = "Nacional";
let etapaActiva = "UGEL"; 
let globalData = {}; 

const colorDark = '#005A7C';   
const colorAccent = '#00B3CD'; 
const colorBrand = '#B4BD0E';  
const paletaPasteles = ['#005A7C', '#B4BD0E', '#00B3CD', '#FCE300', '#001a26', '#e2e8f0'];

const coloresGenero = {
    'Masculino': '#005A7C', 
    'Femenino': '#00B3CD',
    'Sin datos': '#94a3b8' 
};

const coloresEquipo = {
    'Individual': '#00B3CD',    
    'En Pareja': '#B4BD0E',     
    'Atípico (3+)': '#94a3b8'   
};

// =============================================
// INICIO Y EVENTOS
// =============================================
window.onload = function() {
    if (typeof inyectarMapa === 'function') {
        inyectarMapa();
        configurarEventosMapa();
    }
    poblarSelectorRegiones();
    
    document.getElementById("etapa").addEventListener("change", (e) => {
        const nuevaEtapa = e.target.value;
        const subtitulo = document.getElementById("subtitle-years");
        
        if (etapaActiva === "UGEL") purgaGraficasUgel();
        if (etapaActiva === "DRE") purgaGraficasDre();
        
        etapaActiva = nuevaEtapa;
        
        document.getElementById("contenedor-etapa-ugel").style.display = "none";
        document.getElementById("contenedor-etapa-dre").style.display = "none";
        document.getElementById("contenedor-etapa-nacional").style.display = "none";
        document.getElementById("contenedor-etapa-ganadores").style.display = "none";
        
        if (etapaActiva === "UGEL") {
            document.getElementById("contenedor-etapa-ugel").style.display = "block";
            subtitulo.textContent = "Desde 2018 al 2025";
            cargarDataRegion(regionActiva); 
        } else if (etapaActiva === "DRE") {
            document.getElementById("contenedor-etapa-dre").style.display = "block";
            subtitulo.textContent = "Desde 2019 al 2025";
            cargarDataRegion(regionActiva); 
        } else if (etapaActiva === "Nacional") {
            document.getElementById("contenedor-etapa-nacional").style.display = "block";
            subtitulo.textContent = "Desde 2019 al 2025";
        } else if (etapaActiva === "Ganadores") {
            document.getElementById("contenedor-etapa-ganadores").style.display = "block";
            subtitulo.textContent = "Desde 2019 al 2025";
        }
    });

    document.getElementById("nivel").addEventListener("change", () => {
        if (etapaActiva === "UGEL" || etapaActiva === "DRE") {
            cargarDataRegion(regionActiva);
        }
    });

    document.getElementById("select-anio-composicion_ugel").addEventListener("change", (e) => {
        renderizarComposicion(globalData.composicion, parseInt(e.target.value), 'grafica_composicion_ugel');
    });

    document.getElementById("select-anio-genero_ugel").addEventListener("change", (e) => {
        const anio = parseInt(e.target.value);
        renderizarGeneroGrado(globalData.genero_grado, anio, 'grafica_genero_grado_ugel');
        renderizarGeneroCategoria(globalData.genero_cat, anio, 'grafica_genero_cat_ugel');
        renderizarGeneroArea(globalData.genero_area, anio, 'grafica_genero_area_ugel');
    });

    document.getElementById("select-anio-equipo_ugel").addEventListener("change", (e) => {
        const anio = parseInt(e.target.value);
        renderizarEquipoGrado(globalData.equipo_grado, anio, 'grafica_equipo_grado_ugel');
        renderizarEquipoCategoria(globalData.equipo_cat, anio, 'grafica_equipo_cat_ugel');
        renderizarEquipoArea(globalData.equipo_area, anio, 'grafica_equipo_area_ugel');
    });

    document.getElementById("select-anio-temas_ugel").addEventListener("change", (e) => {
        const anio = parseInt(e.target.value);
        renderizarTemasGeneral(globalData.temas_general, anio, 'grafica_temas_general_ugel');
        renderizarTemasSubplots(globalData.temas_grado, anio, 'Grado', 'grafica_temas_grado_ugel', true, colorBrand);
        renderizarTemasSubplots(globalData.temas_cat, anio, 'Categoria', 'grafica_temas_cat_ugel', false, colorAccent);
        renderizarTemasSubplots(globalData.temas_area, anio, 'Area', 'grafica_temas_area_ugel', false, colorBrand);
    });

    document.getElementById("select-anio-comprobacion_dre").addEventListener("change", (e) => {
        renderizarComprobacion(globalData.comprobacion, parseInt(e.target.value), 'tabla_comprobacion_dre');
    });

    document.getElementById("select-anio-genero_dre").addEventListener("change", (e) => {
        const anio = parseInt(e.target.value);
        renderizarGeneroGrado(globalData.genero_grado, anio, 'grafica_genero_grado_dre');
        renderizarGeneroCategoria(globalData.genero_cat, anio, 'grafica_genero_cat_dre');
        renderizarGeneroArea(globalData.genero_area, anio, 'grafica_genero_area_dre');
    });

    document.getElementById("select-anio-equipo_dre").addEventListener("change", (e) => {
        const anio = parseInt(e.target.value);
        renderizarEquipoGrado(globalData.equipo_grado, anio, 'grafica_equipo_grado_dre');
        renderizarEquipoCategoria(globalData.equipo_cat, anio, 'grafica_equipo_cat_dre');
        renderizarEquipoArea(globalData.equipo_area, anio, 'grafica_equipo_area_dre');
    });

    document.getElementById("select-anio-temas_dre").addEventListener("change", (e) => {
        const anio = parseInt(e.target.value);
        renderizarTemasGeneral(globalData.temas_general, anio, 'grafica_temas_general_dre');
        renderizarTemasSubplots(globalData.temas_grado, anio, 'Grado', 'grafica_temas_grado_dre', true, colorBrand);
        renderizarTemasSubplots(globalData.temas_cat, anio, 'Categoria', 'grafica_temas_cat_dre', false, colorAccent);
        renderizarTemasSubplots(globalData.temas_area, anio, 'Area', 'grafica_temas_area_dre', false, colorBrand);
    });

    cargarDataRegion("Nacional");
};

function configurarEventosMapa() {
    const mapaSvg = document.getElementById("peru-map");
    const selReg = document.getElementById("select-region");

    if (mapaSvg) {
        mapaSvg.addEventListener("click", (e) => {
            const path = e.target.closest("path");
            if (path && path.id && mapaIdsRegiones[path.id]) {
                const nombre = mapaIdsRegiones[path.id];
                document.querySelectorAll(".region-path").forEach(p => p.classList.remove("region-active"));
                path.classList.add("region-active");
                if (selReg) selReg.value = nombre;
                
                if (etapaActiva === "UGEL" || etapaActiva === "DRE") {
                    cargarDataRegion(nombre);
                } else {
                    regionActiva = nombre;
                }
            }
        });
    }

    if (selReg) {
        selReg.addEventListener("change", (e) => {
            const nombre = e.target.value;
            document.querySelectorAll(".region-path").forEach(p => p.classList.remove("region-active"));
            if (nombre !== "Nacional") {
                const idMapa = Object.keys(mapaIdsRegiones).find(key => mapaIdsRegiones[key] === nombre);
                const path = document.getElementById(idMapa);
                if (path) path.classList.add("region-active");
            }
            if (etapaActiva === "UGEL" || etapaActiva === "DRE") {
                cargarDataRegion(nombre);
            } else {
                regionActiva = nombre;
            }
        });
    }
}

function poblarSelectorRegiones() {
    const select = document.getElementById("select-region");
    if (!select) return;
    const nombresRegiones = Object.values(mapaIdsRegiones).sort((a, b) => a.localeCompare(b, 'es'));
    nombresRegiones.forEach(nombre => {
        const option = document.createElement("option");
        option.value = nombre;
        option.textContent = nombre;
        select.appendChild(option);
    });
}

// =============================================
// LÓGICA DE CARGA DINÁMICA
// =============================================
function limpiarNombreCarpeta(nombre) {
    return nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "_");
}

async function cargarDataRegion(nombreRegion) {
    regionActiva = nombreRegion;
    const nombreLimpio = limpiarNombreCarpeta(nombreRegion);
    const carpetaDestino = `${etapaActiva}/JSON_${nombreLimpio}`;
    const nivelSeleccionado = document.getElementById("nivel").value.toLowerCase();
    
    const indicador = document.getElementById("titulo_region_actual");
    if (indicador) indicador.textContent = `Seleccionado: ${nombreRegion}`;

    const esNacional = nombreRegion === "Nacional";
    
    // ORQUESTACIÓN ETAPA UGEL
    if (etapaActiva === "UGEL") {
        const sufijoMulti = esNacional ? "dre" : "ugel";

        document.getElementById("titulo_multi_general_ugel").textContent = esNacional ? "Evolución de Participación de las Instituciones Educativas por DRE" : "Evolución de Participación de las Instituciones Educativas por UGEL";
        document.getElementById("titulo_multi_publica_ugel").textContent = esNacional ? "DRE - Gestión Pública" : "UGEL - Gestión Pública";
        document.getElementById("titulo_multi_privada_ugel").textContent = esNacional ? "DRE - Gestión Privada" : "UGEL - Gestión Privada";

        const contenedorMapa = document.getElementById("contenedor_mapa_calor");
        if (contenedorMapa) {
            contenedorMapa.style.display = esNacional ? "block" : "none";
        }

        const archivos = [
            { key: "general", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_general.json` },
            { key: "publica", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_publica.json` },
            { key: "privada", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_privada.json` },
            { key: "multi_general", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_${sufijoMulti}.json` },
            { key: "multi_publica", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_${sufijoMulti}_publica.json` },
            { key: "multi_privada", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_${sufijoMulti}_privada.json` },
            { key: "distribucion", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_distribucion.json` },
            { key: "top20", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_top20.json` },
            { key: "rep_gestion", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_rep_gestion.json` },
            { key: "rep_area", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_rep_area.json` },
            { key: "vigencia", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_vigencia.json` },
            { key: "composicion", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_composicion.json` },
            { key: "genero_hist", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_genero_hist.json` },
            { key: "genero_cat", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_genero_cat.json` },
            { key: "genero_area", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_genero_area.json` },
            { key: "genero_grado", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_genero_grado.json` }, 
            { key: "grado", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_grado.json` },
            { key: "equipo_hist", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_equipo_hist.json` },
            { key: "equipo_cat", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_equipo_cat.json` },
            { key: "equipo_area", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_equipo_area.json` },
            { key: "equipo_grado", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_equipo_grado.json` },
            { key: "permanencia_est", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_permanencia_est.json` },
            { key: "permanencia_grado", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_permanencia_grado.json` },
            { key: "temas_general", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_temas_general.json` },
            { key: "temas_grado", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_temas_grado.json` },
            { key: "temas_cat", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_temas_cat.json` },
            { key: "temas_area", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_temas_area.json` }
        ];

        if (esNacional) {
            archivos.push({ key: "mapa", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_mapa.json` });
        }

        try {
            const promises = archivos.map(a => fetch(a.file).then(r => r.ok ? r.json() : null));
            const resultados = await Promise.all(promises);
            globalData = {}; 
            archivos.forEach((a, index) => { globalData[a.key] = resultados[index]; });
            actualizarGraficasUgel();
        } catch (error) {
            console.error("Error cargando archivos JSON UGEL:", error);
        }
    } 
    
    // ORQUESTACIÓN ETAPA DRE
    else if (etapaActiva === "DRE") {
        
        const sectionComprobacion = document.getElementById("section_comprobacion_dre");
        if (sectionComprobacion) {
            sectionComprobacion.style.display = esNacional ? "none" : "block";
        }
        
        const archivos_dre = [
            { key: "top20", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_top20.json` },
            { key: "rep_gestion", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_rep_gestion.json` },
            { key: "rep_area", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_rep_area.json` },
            { key: "genero_hist", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_genero_hist.json` },
            { key: "genero_cat", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_genero_cat.json` },
            { key: "genero_area", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_genero_area.json` },
            { key: "genero_grado", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_genero_grado.json` },
            { key: "equipo_hist", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_equipo_hist.json` },
            { key: "equipo_cat", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_equipo_cat.json` },
            { key: "equipo_area", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_equipo_area.json` },
            { key: "equipo_grado", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_equipo_grado.json` },
            { key: "temas_general", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_temas_general.json` },
            { key: "temas_grado", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_temas_grado.json` },
            { key: "temas_cat", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_temas_cat.json` },
            { key: "temas_area", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_temas_area.json` }
        ];

        if (!esNacional) {
            archivos_dre.push({ key: "comprobacion", file: `${carpetaDestino}/${nombreLimpio}_data_${nivelSeleccionado}_comprobacion.json` });
        }

        try {
            const promises = archivos_dre.map(a => fetch(a.file).then(r => r.ok ? r.json() : null));
            const resultados = await Promise.all(promises);
            globalData = {}; 
            archivos_dre.forEach((a, index) => { globalData[a.key] = resultados[index]; });
            actualizarGraficasDre();
        } catch (error) {
            console.error("Error cargando archivos JSON DRE:", error);
        }
    }
}

// =============================================
// GESTOR DE MEMORIA Y RENDERIZADO POR ETAPAS
// =============================================

function purgaGraficasUgel() {
    const listIds = [
        'grafica_part_general_ugel', 'grafica_part_publica_ugel', 'grafica_part_privada_ugel',
        'grafica_part_multi_general_ugel', 'grafica_part_multi_publica_ugel', 'grafica_part_multi_privada_ugel',
        'grafica_distribucion_ugel', 'grafica_rep_gestion_ugel', 'grafica_rep_area_ugel',
        'grafica_vigencia_ugel', 'grafica_permanencia_est_ugel', 'grafica_permanencia_grado_ugel',
        'grafica_composicion_ugel', 'grafica_grado_ugel', 'grafica_genero_hist_ugel',
        'grafica_genero_grado_ugel', 'grafica_genero_cat_ugel', 'grafica_genero_area_ugel',
        'grafica_equipo_hist_ugel', 'grafica_equipo_grado_ugel', 'grafica_equipo_cat_ugel',
        'grafica_equipo_area_ugel', 'grafica_temas_general_ugel', 'grafica_temas_grado_ugel',
        'grafica_temas_cat_ugel', 'grafica_temas_area_ugel', 'grafica_mapa_calor_ugel'
    ];
    listIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) Plotly.purge(id);
    });
}

function purgaGraficasDre() {
    const listIds = [
        'grafica_rep_gestion_dre', 'grafica_rep_area_dre',
        'grafica_genero_hist_dre', 'grafica_genero_grado_dre', 
        'grafica_genero_cat_dre', 'grafica_genero_area_dre', 'grafica_equipo_hist_dre', 
        'grafica_equipo_grado_dre', 'grafica_equipo_cat_dre', 'grafica_equipo_area_dre', 
        'grafica_temas_general_dre', 'grafica_temas_grado_dre', 'grafica_temas_cat_dre', 
        'grafica_temas_area_dre'
    ];
    listIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) Plotly.purge(id);
    });
    
    const tablaComp = document.getElementById('tabla_comprobacion_dre');
    if(tablaComp) tablaComp.innerHTML = "";
}

function actualizarGraficasUgel() {
    renderizarLineaUnica(globalData.general, 'grafica_part_general_ugel', 'Participación General', colorDark);
    renderizarLineaUnica(globalData.publica, 'grafica_part_publica_ugel', 'Gestión Pública', colorAccent);
    renderizarLineaUnica(globalData.privada, 'grafica_part_privada_ugel', 'Gestión Privada', colorBrand);
    
    renderizarLineasMultiples(globalData.multi_general, globalData.general, 'grafica_part_multi_general_ugel');
    renderizarLineasMultiples(globalData.multi_publica, globalData.publica, 'grafica_part_multi_publica_ugel');
    renderizarLineasMultiples(globalData.multi_privada, globalData.privada, 'grafica_part_multi_privada_ugel');

    renderizarDistribucion(globalData.distribucion, 'grafica_distribucion_ugel');
    renderizarTablaTop20(globalData.top20, 'tabla_top20_ugel');

    const tituloUniverso = (regionActiva === "Nacional") ? "Total Nacional" : "Total Regional";
    renderizarRepresentatividad(globalData.rep_gestion, 'grafica_rep_gestion_ugel', tituloUniverso);
    renderizarRepresentatividad(globalData.rep_area, 'grafica_rep_area_ugel', tituloUniverso);

    renderizarVigencia(globalData.vigencia, 'grafica_vigencia_ugel', 'titulo-rango-vigencia_ugel');
    renderizarPermanenciaEstudiante(globalData.permanencia_est, 'grafica_permanencia_est_ugel');
    renderizarPermanenciaGrado(globalData.permanencia_grado, 'grafica_permanencia_grado_ugel');

    const selectComp = document.getElementById("select-anio-composicion_ugel");
    const selectGen = document.getElementById("select-anio-genero_ugel");
    const selectEquipo = document.getElementById("select-anio-equipo_ugel");
    const selectTemas = document.getElementById("select-anio-temas_ugel");

    if (globalData.composicion && globalData.composicion.length > 0) {
        const anios = [...new Set(globalData.composicion.map(d => d.Año))].sort((a,b) => b - a);
        
        selectComp.innerHTML = ""; selectGen.innerHTML = ""; selectEquipo.innerHTML = ""; selectTemas.innerHTML = "";
        
        anios.forEach(a => {
            const opt1 = document.createElement("option"); opt1.value = a; opt1.textContent = a;
            const opt2 = document.createElement("option"); opt2.value = a; opt2.textContent = a;
            const opt3 = document.createElement("option"); opt3.value = a; opt3.textContent = a;
            const opt4 = document.createElement("option"); opt4.value = a; opt4.textContent = a;
            selectComp.appendChild(opt1); selectGen.appendChild(opt2); selectEquipo.appendChild(opt3); selectTemas.appendChild(opt4);
        });
        
        renderizarComposicion(globalData.composicion, anios[0], 'grafica_composicion_ugel');
        renderizarGrado(globalData.grado, 'grafica_grado_ugel');

        renderizarGeneroHistorico(globalData.genero_hist, 'grafica_genero_hist_ugel');
        renderizarGeneroGrado(globalData.genero_grado, anios[0], 'grafica_genero_grado_ugel');
        renderizarGeneroCategoria(globalData.genero_cat, anios[0], 'grafica_genero_cat_ugel');
        renderizarGeneroArea(globalData.genero_area, anios[0], 'grafica_genero_area_ugel');
        
        renderizarEquipoHistorico(globalData.equipo_hist, 'grafica_equipo_hist_ugel');
        renderizarEquipoGrado(globalData.equipo_grado, anios[0], 'grafica_equipo_grado_ugel');
        renderizarEquipoCategoria(globalData.equipo_cat, anios[0], 'grafica_equipo_cat_ugel');
        renderizarEquipoArea(globalData.equipo_area, anios[0], 'grafica_equipo_area_ugel');

        renderizarTemasGeneral(globalData.temas_general, anios[0], 'grafica_temas_general_ugel');
        renderizarTemasSubplots(globalData.temas_grado, anios[0], 'Grado', 'grafica_temas_grado_ugel', true, colorBrand);
        renderizarTemasSubplots(globalData.temas_cat, anios[0], 'Categoria', 'grafica_temas_cat_ugel', false, colorAccent);
        renderizarTemasSubplots(globalData.temas_area, anios[0], 'Area', 'grafica_temas_area_ugel', false, colorBrand);

    } else {
        selectComp.innerHTML = "<option>Sin datos</option>"; selectGen.innerHTML = "<option>Sin datos</option>";
        selectEquipo.innerHTML = "<option>Sin datos</option>"; selectTemas.innerHTML = "<option>Sin datos</option>";
        purgaGraficasUgel(); 
    }

    if (globalData.mapa && document.getElementById("grafica_mapa_calor_ugel")) {
        renderizarMapaCalor(globalData.mapa, 'grafica_mapa_calor_ugel');
    }
}

function actualizarGraficasDre() {
    const tituloUniverso = (regionActiva === "Nacional") ? "Total Nacional" : "Total Regional";
    renderizarRepresentatividadTriple(globalData.rep_gestion, 'grafica_rep_gestion_dre', tituloUniverso);
    renderizarRepresentatividadTriple(globalData.rep_area, 'grafica_rep_area_dre', tituloUniverso);

    renderizarTablaTop20(globalData.top20, 'tabla_top20_dre');

    const selectComp = document.getElementById("select-anio-comprobacion_dre");
    const selectGen = document.getElementById("select-anio-genero_dre");
    const selectEquipo = document.getElementById("select-anio-equipo_dre");
    const selectTemas = document.getElementById("select-anio-temas_dre");

    if (globalData.genero_hist && globalData.genero_hist.length > 0) {
        const anios = [...new Set(globalData.genero_hist.map(d => d.Año))].sort((a,b) => b - a);
        
        selectComp.innerHTML = ""; selectGen.innerHTML = ""; selectEquipo.innerHTML = ""; selectTemas.innerHTML = "";
        
        anios.forEach(a => {
            const opt1 = document.createElement("option"); opt1.value = a; opt1.textContent = a;
            const opt2 = document.createElement("option"); opt2.value = a; opt2.textContent = a;
            const opt3 = document.createElement("option"); opt3.value = a; opt3.textContent = a;
            const opt4 = document.createElement("option"); opt4.value = a; opt4.textContent = a;
            selectComp.appendChild(opt1); selectGen.appendChild(opt2); selectEquipo.appendChild(opt3); selectTemas.appendChild(opt4);
        });

        renderizarComprobacion(globalData.comprobacion, anios[0], 'tabla_comprobacion_dre');

        renderizarGeneroHistorico(globalData.genero_hist, 'grafica_genero_hist_dre');
        renderizarGeneroGrado(globalData.genero_grado, anios[0], 'grafica_genero_grado_dre');
        renderizarGeneroCategoria(globalData.genero_cat, anios[0], 'grafica_genero_cat_dre');
        renderizarGeneroArea(globalData.genero_area, anios[0], 'grafica_genero_area_dre');
        
        renderizarEquipoHistorico(globalData.equipo_hist, 'grafica_equipo_hist_dre');
        renderizarEquipoGrado(globalData.equipo_grado, anios[0], 'grafica_equipo_grado_dre');
        renderizarEquipoCategoria(globalData.equipo_cat, anios[0], 'grafica_equipo_cat_dre');
        renderizarEquipoArea(globalData.equipo_area, anios[0], 'grafica_equipo_area_dre');

        renderizarTemasGeneral(globalData.temas_general, anios[0], 'grafica_temas_general_dre');
        renderizarTemasSubplots(globalData.temas_grado, anios[0], 'Grado', 'grafica_temas_grado_dre', true, colorBrand);
        renderizarTemasSubplots(globalData.temas_cat, anios[0], 'Categoria', 'grafica_temas_cat_dre', false, colorAccent);
        renderizarTemasSubplots(globalData.temas_area, anios[0], 'Area', 'grafica_temas_area_dre', false, colorBrand);

    } else {
        selectComp.innerHTML = "<option>Sin datos</option>"; selectGen.innerHTML = "<option>Sin datos</option>";
        selectEquipo.innerHTML = "<option>Sin datos</option>"; selectTemas.innerHTML = "<option>Sin datos</option>";
        purgaGraficasDre();
    }
}

// =============================================
// FUNCIONES DE DIBUJADO (PLOTLY E HTML)
// =============================================

function renderizarRepresentatividadTriple(datos, divId, tituloUniverso) {
    const contenedor = document.getElementById(divId);
    if (!contenedor) return;
    if (!datos || datos.length === 0) { Plotly.purge(divId); contenedor.innerHTML = ""; return; }

    const categorias = datos.map(d => d.Categoria);
    const valUniverso = datos.map(d => d.Total_Universo || 0);
    const valFaseUgel = datos.map(d => d.Fase_UGEL || 0);
    const valFaseDre = datos.map(d => d.Fase_DRE || 0);

    const trace1 = {
        values: valUniverso, labels: categorias, type: 'pie', name: tituloUniverso,
        domain: { row: 0, column: 0 }, hole: .4, textinfo: 'label+percent', textfont: { size: 12 },
        marker: { colors: paletaPasteles },
        hovertemplate: `<b>%{label}</b><br>${tituloUniverso}<br>Total: %{value}<br>Porcentaje: %{percent}<extra></extra>`
    };

    const trace2 = {
        values: valFaseUgel, labels: categorias, type: 'pie', name: "Participantes - Etapa UGEL",
        domain: { row: 0, column: 1 }, hole: .4, textinfo: 'label+percent', textfont: { size: 12 },
        marker: { colors: paletaPasteles },
        hovertemplate: `<b>%{label}</b><br>Participantes - Etapa UGEL<br>Total: %{value}<br>Porcentaje: %{percent}<extra></extra>`
    };

    const trace3 = {
        values: valFaseDre, labels: categorias, type: 'pie', name: "Participantes - Etapa DRE",
        domain: { row: 0, column: 2 }, hole: .4, textinfo: 'label+percent', textfont: { size: 12 },
        marker: { colors: paletaPasteles },
        hovertemplate: `<b>%{label}</b><br>Participantes - Etapa DRE<br>Total: %{value}<br>Porcentaje: %{percent}<extra></extra>`
    };

    const layout = {
        paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: "#005A7C", family: "Inter" },
        margin: { t: 60, b: 20, l: 0, r: 0 }, showlegend: false,
        grid: { rows: 1, columns: 3 },
        annotations: [
            { text: tituloUniverso, font: { size: 14, color: "#005A7C", family: "Inter", weight: "bold" }, showarrow: false, x: 0.16, y: 1.15, xanchor: "center" },
            { text: "Participantes Etapa UGEL", font: { size: 14, color: "#005A7C", family: "Inter", weight: "bold" }, showarrow: false, x: 0.5, y: 1.15, xanchor: "center" },
            { text: "Participantes Etapa DRE", font: { size: 14, color: "#005A7C", family: "Inter", weight: "bold" }, showarrow: false, x: 0.84, y: 1.15, xanchor: "center" }
        ],
        hoverlabel: { bgcolor: "#ffffff", bordercolor: "#005A7C", font: { color: "#005A7C", size: 13 } }
    };

    Plotly.react(divId, [trace1, trace2, trace3], layout, { responsive: true, displayModeBar: false });
}

function renderizarComprobacion(datos, anio, divId) {
    const contenedor = document.getElementById(divId);
    if (!contenedor) return;

    if (!datos || datos.length === 0) {
        contenedor.innerHTML = "<p style='text-align:center; padding: 20px; color:#64748b;'>Esta auditoría solo está disponible al seleccionar una región específica en el panel izquierdo.</p>";
        return;
    }

    const datosAnio = datos.filter(d => d.Año === anio);
    if (datosAnio.length === 0) {
        contenedor.innerHTML = "<p style='text-align:center; padding: 20px; color:#64748b;'>No hay datos para este año.</p>";
        return;
    }

    const ugels = [...new Set(datosAnio.map(d => d['IE - UGEL']))].sort((a, b) => a.localeCompare(b, 'es'));
    const categoriasAreas = [...new Set(datosAnio.map(d => d.Cat_Area))].sort();

    let html = '<table class="data-table" style="text-align: center;"><thead><tr><th style="text-align: left; background-color: #001a26;">UGEL</th>';
    categoriasAreas.forEach(ca => {
        html += `<th>${ca}</th>`;
    });
    html += '</tr></thead><tbody>';

    ugels.forEach(ugel => {
        html += `<tr><td style="text-align: left; font-weight: bold; color: #005A7C;">${ugel}</td>`;
        
        categoriasAreas.forEach(ca => {
            const registro = datosAnio.find(d => d['IE - UGEL'] === ugel && d.Cat_Area === ca);
            const cant = registro ? registro.Cant : 0;
            let icono = '';
            let colorStr = '';

            if (cant === 1) {
                icono = '✅'; colorStr = '#16a34a'; 
            } else if (cant === 2) {
                icono = '⚠️'; colorStr = '#ea580c'; 
            } else {
                icono = '❌'; colorStr = '#dc2626'; 
            }

            html += `<td style="color: ${colorStr}; font-weight: 700;">${cant} ${icono}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    contenedor.innerHTML = html;
}

function renderizarEquipoHistorico(datos, divId) {
    const contenedor = document.getElementById(divId);
    if (!contenedor) return;
    if (!datos || datos.length === 0) { Plotly.purge(divId); return; }

    const años = [...new Set(datos.map(d => d.Año))].sort();
    const participaciones = ['Individual', 'En Pareja', 'Atípico (3+)'];

    const traces = participaciones.map(part => {
        const dataPart = datos.filter(d => d['Tipo_Participacion'] === part);
        const yVals = años.map(a => { const d = dataPart.find(x => x.Año === a); return d ? d.Porcentaje : 0; });
        const textVals = yVals.map(y => y > 0 ? `${y}%` : "");
        const hoverVals = años.map(a => { const d = dataPart.find(x => x.Año === a); return d ? d.Cant_Proyectos : 0; });

        return {
            x: años,
            y: yVals,
            name: part,
            type: 'bar',
            text: textVals,
            textposition: 'inside',
            marker: { color: coloresEquipo[part] },
            customdata: hoverVals,
            hovertemplate: `<b>${part}</b><br>Año: %{x}<br>Proyectos: %{customdata:,}<br>Porcentaje: %{y}%<extra></extra>`
        };
    });

    const layout = {
        barmode: 'stack',
        paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: "#005A7C", family: "Inter" },
        margin: { t: 20, b: 40, l: 50, r: 20 },
        xaxis: { type: 'category', showgrid: false, tickfont: { color: "#5c8496" } },
        yaxis: { title: "Porcentaje (%)", showgrid: true, gridcolor: '#dce6eb', range: [0, 100], tickfont: { color: "#5c8496" } },
        legend: { orientation: "h", x: 0.5, xanchor: "center", y: -0.15 },
        hoverlabel: { bgcolor: "#ffffff", font: { color: "#005A7C", size: 13 } }
    };

    Plotly.react(divId, traces, layout, { responsive: true, displayModeBar: false });
}

function renderizarEquipoCategoria(datos, anio, divId) {
    const contenedor = document.getElementById(divId);
    if (!contenedor) return;
    const datosAnio = datos.filter(d => d.Año === anio);
    if (datosAnio.length === 0) { Plotly.purge(divId); contenedor.innerHTML = "<p style='text-align:center'>No hay datos.</p>"; return; }

    const categorias = [...new Set(datosAnio.map(d => d['Proyecto - Categoria']))].sort();
    const participaciones = ['Individual', 'En Pareja', 'Atípico (3+)'];

    const traces = participaciones.map(part => {
        const yVals = categorias.map(c => {
            const d = datosAnio.find(x => x['Proyecto - Categoria'] === c && x['Tipo_Participacion'] === part);
            return d ? d.Porcentaje : 0;
        });
        const hoverVals = categorias.map(c => {
            const d = datosAnio.find(x => x['Proyecto - Categoria'] === c && x['Tipo_Participacion'] === part);
            return d ? d.Cant_Proyectos : 0;
        });

        return {
            x: categorias,
            y: yVals,
            name: part,
            type: 'bar',
            text: yVals.map(y => y > 0 ? `${y}%` : ""),
            textposition: 'outside',
            marker: { color: coloresEquipo[part] },
            customdata: hoverVals,
            hovertemplate: `<b>${part}</b><br>Categoría: %{x}<br>Proyectos: %{customdata:,}<br>Porcentaje: %{y}%<extra></extra>`
        };
    });

    const layout = {
        barmode: 'group',
        paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: "#005A7C", family: "Inter" },
        margin: { t: 70, b: 40, l: 50, r: 20 },
        xaxis: { showgrid: false, tickfont: { color: "#5c8496" } },
        yaxis: { title: "Porcentaje (%)", showgrid: true, gridcolor: '#dce6eb', tickfont: { color: "#5c8496" } },
        legend: { orientation: "h", x: 0.5, xanchor: "center", y: -0.15 },
        hoverlabel: { bgcolor: "#ffffff", font: { color: "#005A7C", size: 13 } }
    };

    Plotly.react(divId, traces, layout, { responsive: true, displayModeBar: false });
}

function renderizarEquipoArea(datos, anio, divId) {
    const contenedor = document.getElementById(divId);
    if (!contenedor) return;
    const datosAnio = datos.filter(d => d.Año === anio);
    if (datosAnio.length === 0) { Plotly.purge(divId); return; }

    const categorias = [...new Set(datosAnio.map(d => d['Proyecto - Categoria']))].sort();
    const numCats = categorias.length;
    const participaciones = ['Individual', 'En Pareja', 'Atípico (3+)'];

    const traces = [];
    const annotations = [];

    const layout = {
        barmode: 'group',
        paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: "#005A7C", family: "Inter" },
        margin: { t: 50, b: 40, l: 10, r: 10 }, 
        showlegend: true, 
        legend: { orientation: "h", x: 0.5, xanchor: "center", y: -0.15 },
        grid: { rows: 1, columns: numCats, pattern: 'independent' },
        hoverlabel: { bgcolor: "#ffffff", font: { color: "#005A7C", size: 13 } }
    };

    const wrapLabel = (label) => {
        if (label.length <= 20) return label;
        let words = label.split(' ');
        let lines = [];
        let currentLine = '';
        words.forEach(word => {
            if ((currentLine + word).length > 20) {
                lines.push(currentLine.trim());
                currentLine = word + ' ';
            } else {
                currentLine += word + ' ';
            }
        });
        if (currentLine) lines.push(currentLine.trim());
        return lines.join('<br>');
    };

    categorias.forEach((cat, i) => {
        const dataCat = datosAnio.filter(d => d['Proyecto - Categoria'] === cat);
        const areas = [...new Set(dataCat.map(d => d['Proyecto - Area']))].sort().reverse(); 
        const areasWrapped = areas.map(wrapLabel);
        
        const xRef = i === 0 ? 'x' : 'x' + (i + 1);
        const yRef = i === 0 ? 'y' : 'y' + (i + 1);
        const xaxisName = i === 0 ? 'xaxis' : 'xaxis' + (i + 1);
        const yaxisName = i === 0 ? 'yaxis' : 'yaxis' + (i + 1);

        participaciones.forEach(part => {
            const xVals = areas.map(a => {
                const d = dataCat.find(x => x['Proyecto - Area'] === a && x['Tipo_Participacion'] === part);
                return d ? d.Porcentaje : 0;
            });
            const hoverVals = areas.map(a => {
                const d = dataCat.find(x => x['Proyecto - Area'] === a && x['Tipo_Participacion'] === part);
                return d ? d.Cant_Proyectos : 0;
            });

            traces.push({
                y: areasWrapped, 
                x: xVals,
                name: part,
                type: 'bar',
                orientation: 'h', 
                xaxis: xRef,
                yaxis: yRef,
                text: xVals.map(x => x > 0 ? `${x}%` : ""),
                textposition: 'auto',
                textfont: { size: 10 },
                marker: { color: coloresEquipo[part] },
                customdata: hoverVals,
                showlegend: i === 0, 
                hovertemplate: `<b>${part}</b><br>Proyectos: %{customdata:,}<br>Porcentaje: %{x}%<extra></extra>`
            });
        });

        layout[xaxisName] = { 
            title: i === 0 ? "Porcentaje (%)" : "", 
            showgrid: true, gridcolor: '#dce6eb', tickfont: { color: "#5c8496" }, range: [0, 105] 
        };
        layout[yaxisName] = { 
            showgrid: false, tickfont: { color: "#5c8496", size: 10 }, automargin: true 
        };

        const posX = (i + 0.5) / numCats;
        annotations.push({
            text: `Categoría ${cat}`,
            x: posX,
            y: 1.05,
            xref: 'paper',
            yref: 'paper',
            showarrow: false,
            font: { size: 14, color: "#005A7C", family: "Inter", weight: "bold" },
            xanchor: 'center'
        });
    });

    layout.annotations = annotations;
    Plotly.react(divId, traces, layout, { responsive: true, displayModeBar: false });
}

function renderizarEquipoGrado(datos, anio, divId) {
    const contenedor = document.getElementById(divId);
    if (!contenedor) return;
    const datosAnio = datos.filter(d => d.Año === anio);
    if (datosAnio.length === 0) { Plotly.purge(divId); return; }

    const obtenerJerarquia = (grado) => {
        const g = String(grado).toLowerCase();
        if (g.includes('1') || g.includes('primer')) return 1;
        if (g.includes('2') || g.includes('segund')) return 2;
        if (g.includes('3') || g.includes('tercer')) return 3;
        if (g.includes('4') || g.includes('cuart')) return 4;
        if (g.includes('5') || g.includes('quint')) return 5;
        if (g.includes('6') || g.includes('sext')) return 6;
        return 99; 
    };

    const grados = [...new Set(datosAnio.map(d => d['Estudiante - Grado']))]
        .sort((a, b) => obtenerJerarquia(a) - obtenerJerarquia(b));
    const participaciones = ['Individual', 'En Pareja', 'Atípico (3+)'];

    const traces = participaciones.map(part => {
        const yVals = grados.map(g => {
            const d = datosAnio.find(x => x['Estudiante - Grado'] === g && x['Tipo_Participacion'] === part);
            return d ? d.Porcentaje : 0;
        });
        const hoverVals = grados.map(g => {
            const d = datosAnio.find(x => x['Estudiante - Grado'] === g && x['Tipo_Participacion'] === part);
            return d ? d.Cant_Proyectos : 0;
        });

        return {
            x: grados,
            y: yVals,
            name: part,
            type: 'bar',
            text: yVals.map(y => y > 0 ? `${y}%` : ""),
            textposition: 'outside',
            marker: { color: coloresEquipo[part] },
            customdata: hoverVals,
            hovertemplate: `<b>${part}</b><br>Grado: %{x}<br>Proyectos: %{customdata:,}<br>Porcentaje: %{y}%<extra></extra>`
        };
    });

    const layout = {
        barmode: 'group',
        paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: "#005A7C", family: "Inter" },
        margin: { t: 70, b: 40, l: 50, r: 20 },
        xaxis: { showgrid: false, tickfont: { color: "#5c8496" } },
        yaxis: { title: "Porcentaje (%)", showgrid: true, gridcolor: '#dce6eb', tickfont: { color: "#5c8496" } },
        legend: { orientation: "h", x: 0.5, xanchor: "center", y: -0.15 },
        hoverlabel: { bgcolor: "#ffffff", font: { color: "#005A7C", size: 13 } }
    };

    Plotly.react(divId, traces, layout, { responsive: true, displayModeBar: false });
}

function renderizarGrado(datos, divId) {
    const contenedor = document.getElementById(divId);
    if (!contenedor) return;
    if (!datos || datos.length === 0) { Plotly.purge(divId); return; }

    const años = [...new Set(datos.map(d => d.Año))].sort();
    
    const obtenerJerarquia = (grado) => {
        const g = String(grado).toLowerCase();
        if (g.includes('1') || g.includes('primer')) return 1;
        if (g.includes('2') || g.includes('segund')) return 2;
        if (g.includes('3') || g.includes('tercer')) return 3;
        if (g.includes('4') || g.includes('cuart')) return 4;
        if (g.includes('5') || g.includes('quint')) return 5;
        if (g.includes('6') || g.includes('sext')) return 6;
        return 99; 
    };

    const grados = [...new Set(datos.map(d => d['Estudiante - Grado']))]
        .sort((a, b) => obtenerJerarquia(a) - obtenerJerarquia(b));

    const paletaGrados = ['#001a26', '#005A7C', '#00B3CD', '#50C8D6', '#B4BD0E', '#FCE300'];

    const traces = grados.map((grado, index) => {
        const dataGrado = datos.filter(d => d['Estudiante - Grado'] === grado);
        const yVals = años.map(a => { const d = dataGrado.find(x => x.Año === a); return d ? d.Porcentaje : 0; });
        const textVals = yVals.map(y => y > 0 ? `${y}%` : "");
        const hoverVals = años.map(a => { const d = dataGrado.find(x => x.Año === a); return d ? d.Cant_Estudiantes : 0; });

        return {
            x: años,
            y: yVals,
            name: String(grado),
            type: 'bar',
            text: textVals,
            textposition: 'inside',
            marker: { color: paletaGrados[index % paletaGrados.length] },
            customdata: hoverVals,
            hovertemplate: `<b>${grado}</b><br>Año: %{x}<br>Estudiantes: %{customdata:,}<br>Porcentaje: %{y}%<extra></extra>`
        };
    });

    const layout = {
        barmode: 'stack', 
        paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: "#005A7C", family: "Inter" },
        margin: { t: 20, b: 40, l: 50, r: 20 },
        xaxis: { type: 'category', showgrid: false, tickfont: { color: "#5c8496" } },
        yaxis: { title: "Porcentaje (%)", showgrid: true, gridcolor: '#dce6eb', range: [0, 100], tickfont: { color: "#5c8496" } },
        legend: { orientation: "h", x: 0.5, xanchor: "center", y: -0.15 },
        hoverlabel: { bgcolor: "#ffffff", font: { color: "#005A7C", size: 13 } }
    };

    Plotly.react(divId, traces, layout, { responsive: true, displayModeBar: false });
}

function renderizarGeneroHistorico(datos, divId) {
    const contenedor = document.getElementById(divId);
    if (!contenedor) return;
    if (!datos || datos.length === 0) { Plotly.purge(divId); return; }

    const años = [...new Set(datos.map(d => d.Año))].sort();
    const generos = ['Femenino', 'Masculino', 'Sin datos']; 

    const traces = generos.map(gen => {
        const dataGen = datos.filter(d => d['Estudiante - Genero'] === gen);
        const yVals = años.map(a => { const d = dataGen.find(x => x.Año === a); return d ? d.Porcentaje : 0; });
        const textVals = yVals.map(y => y > 0 ? `${y}%` : "");
        const hoverVals = años.map(a => { const d = dataGen.find(x => x.Año === a); return d ? d.Cant_Estudiantes : 0; });

        return {
            x: años,
            y: yVals,
            name: gen,
            type: 'bar',
            text: textVals,
            textposition: 'inside',
            marker: { color: coloresGenero[gen] },
            customdata: hoverVals,
            hovertemplate: `<b>${gen}</b><br>Año: %{x}<br>Estudiantes: %{customdata:,}<br>Porcentaje: %{y}%<extra></extra>`
        };
    });

    const layout = {
        barmode: 'stack',
        paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: "#005A7C", family: "Inter" },
        margin: { t: 20, b: 40, l: 50, r: 20 },
        xaxis: { type: 'category', showgrid: false, tickfont: { color: "#5c8496" } },
        yaxis: { title: "Porcentaje (%)", showgrid: true, gridcolor: '#dce6eb', range: [0, 100], tickfont: { color: "#5c8496" } },
        legend: { orientation: "h", x: 0.5, xanchor: "center", y: -0.15 },
        hoverlabel: { bgcolor: "#ffffff", font: { color: "#005A7C", size: 13 } }
    };

    Plotly.react(divId, traces, layout, { responsive: true, displayModeBar: false });
}

function renderizarGeneroCategoria(datos, anio, divId) {
    const contenedor = document.getElementById(divId);
    if (!contenedor) return;
    
    const datosAnio = datos.filter(d => d.Año === anio);
    if (datosAnio.length === 0) { Plotly.purge(divId); contenedor.innerHTML = "<p style='text-align:center'>No hay datos.</p>"; return; }

    const categorias = [...new Set(datosAnio.map(d => d['Proyecto - Categoria']))].sort();
    const generos = ['Femenino', 'Masculino', 'Sin datos'];

    const traces = generos.map(gen => {
        const yVals = categorias.map(c => {
            const d = datosAnio.find(x => x['Proyecto - Categoria'] === c && x['Estudiante - Genero'] === gen);
            return d ? d.Porcentaje : 0;
        });
        const hoverVals = categorias.map(c => {
            const d = datosAnio.find(x => x['Proyecto - Categoria'] === c && x['Estudiante - Genero'] === gen);
            return d ? d.Cant_Estudiantes : 0;
        });

        return {
            x: categorias,
            y: yVals,
            name: gen,
            type: 'bar',
            text: yVals.map(y => y > 0 ? `${y}%` : ""),
            textposition: 'outside',
            marker: { color: coloresGenero[gen] },
            customdata: hoverVals,
            hovertemplate: `<b>${gen}</b><br>Categoría: %{x}<br>Estudiantes: %{customdata:,}<br>Porcentaje: %{y}%<extra></extra>`
        };
    });

    const layout = {
        barmode: 'group',
        paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: "#005A7C", family: "Inter" },
        margin: { t: 70, b: 40, l: 50, r: 20 },
        xaxis: { showgrid: false, tickfont: { color: "#5c8496" } },
        yaxis: { title: "Porcentaje (%)", showgrid: true, gridcolor: '#dce6eb', tickfont: { color: "#5c8496" } },
        legend: { orientation: "h", x: 0.5, xanchor: "center", y: -0.15 },
        hoverlabel: { bgcolor: "#ffffff", font: { color: "#005A7C", size: 13 } }
    };

    Plotly.react(divId, traces, layout, { responsive: true, displayModeBar: false });
}

function renderizarGeneroGrado(datos, anio, divId) {
    const contenedor = document.getElementById(divId);
    if (!contenedor) return;
    const datosAnio = datos.filter(d => d.Año === anio);
    if (datosAnio.length === 0) { Plotly.purge(divId); contenedor.innerHTML = "<p style='text-align:center'>No hay datos.</p>"; return; }

    const obtenerJerarquia = (grado) => {
        const g = String(grado).toLowerCase();
        if (g.includes('1') || g.includes('primer')) return 1;
        if (g.includes('2') || g.includes('segund')) return 2;
        if (g.includes('3') || g.includes('tercer')) return 3;
        if (g.includes('4') || g.includes('cuart')) return 4;
        if (g.includes('5') || g.includes('quint')) return 5;
        if (g.includes('6') || g.includes('sext')) return 6;
        return 99; 
    };

    const grados = [...new Set(datosAnio.map(d => d['Estudiante - Grado']))]
        .sort((a, b) => obtenerJerarquia(a) - obtenerJerarquia(b));
    const generos = ['Femenino', 'Masculino', 'Sin datos'];

    const traces = generos.map(gen => {
        const yVals = grados.map(g => {
            const d = datosAnio.find(x => x['Estudiante - Grado'] === g && x['Estudiante - Genero'] === gen);
            return d ? d.Porcentaje : 0;
        });
        const hoverVals = grados.map(g => {
            const d = datosAnio.find(x => x['Estudiante - Grado'] === g && x['Estudiante - Genero'] === gen);
            return d ? d.Cant_Estudiantes : 0;
        });

        return {
            x: grados,
            y: yVals,
            name: gen,
            type: 'bar',
            text: yVals.map(y => y > 0 ? `${y}%` : ""),
            textposition: 'outside',
            marker: { color: coloresGenero[gen] },
            customdata: hoverVals,
            hovertemplate: `<b>${gen}</b><br>Grado: %{x}<br>Estudiantes: %{customdata:,}<br>Porcentaje: %{y}%<extra></extra>`
        };
    });

    const layout = {
        barmode: 'group',
        paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: "#005A7C", family: "Inter" },
        margin: { t: 70, b: 40, l: 50, r: 20 },
        xaxis: { showgrid: false, tickfont: { color: "#5c8496" } },
        yaxis: { title: "Porcentaje (%)", showgrid: true, gridcolor: '#dce6eb', tickfont: { color: "#5c8496" } },
        legend: { orientation: "h", x: 0.5, xanchor: "center", y: -0.15 },
        hoverlabel: { bgcolor: "#ffffff", font: { color: "#005A7C", size: 13 } }
    };

    Plotly.react(divId, traces, layout, { responsive: true, displayModeBar: false });
}

function renderizarGeneroArea(datos, anio, divId) {
    const contenedor = document.getElementById(divId);
    if (!contenedor) return;
    
    const datosAnio = datos.filter(d => d.Año === anio);
    if (datosAnio.length === 0) { Plotly.purge(divId); return; }

    const categorias = [...new Set(datosAnio.map(d => d['Proyecto - Categoria']))].sort();
    const numCats = categorias.length;
    const generos = ['Femenino', 'Masculino', 'Sin datos'];

    const traces = [];
    const annotations = [];

    const layout = {
        barmode: 'group',
        paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: "#005A7C", family: "Inter" },
        margin: { t: 50, b: 40, l: 10, r: 10 }, 
        showlegend: true, 
        legend: { orientation: "h", x: 0.5, xanchor: "center", y: -0.15 },
        grid: { rows: 1, columns: numCats, pattern: 'independent' },
        hoverlabel: { bgcolor: "#ffffff", font: { color: "#005A7C", size: 13 } }
    };

    const wrapLabel = (label) => {
        if (label.length <= 20) return label;
        let words = label.split(' ');
        let lines = [];
        let currentLine = '';
        words.forEach(word => {
            if ((currentLine + word).length > 20) {
                lines.push(currentLine.trim());
                currentLine = word + ' ';
            } else {
                currentLine += word + ' ';
            }
        });
        if (currentLine) lines.push(currentLine.trim());
        return lines.join('<br>');
    };

    categorias.forEach((cat, i) => {
        const dataCat = datosAnio.filter(d => d['Proyecto - Categoria'] === cat);
        const areas = [...new Set(dataCat.map(d => d['Proyecto - Area']))].sort().reverse(); 
        const areasWrapped = areas.map(wrapLabel);
        
        const xRef = i === 0 ? 'x' : 'x' + (i + 1);
        const yRef = i === 0 ? 'y' : 'y' + (i + 1);
        const xaxisName = i === 0 ? 'xaxis' : 'xaxis' + (i + 1);
        const yaxisName = i === 0 ? 'yaxis' : 'yaxis' + (i + 1);

        generos.forEach(gen => {
            const xVals = areas.map(a => {
                const d = dataCat.find(x => x['Proyecto - Area'] === a && x['Estudiante - Genero'] === gen);
                return d ? d.Porcentaje : 0;
            });
            const hoverVals = areas.map(a => {
                const d = dataCat.find(x => x['Proyecto - Area'] === a && x['Estudiante - Genero'] === gen);
                return d ? d.Cant_Estudiantes : 0;
            });

            traces.push({
                y: areasWrapped, 
                x: xVals,
                name: gen,
                type: 'bar',
                orientation: 'h', 
                xaxis: xRef,
                yaxis: yRef,
                text: xVals.map(x => x > 0 ? `${x}%` : ""),
                textposition: 'auto',
                textfont: { size: 10 },
                marker: { color: coloresGenero[gen] },
                customdata: hoverVals,
                showlegend: i === 0, 
                hovertemplate: `<b>${gen}</b><br>Estudiantes: %{customdata:,}<br>Porcentaje: %{x}%<extra></extra>`
            });
        });

        layout[xaxisName] = { 
            title: i === 0 ? "Porcentaje (%)" : "", 
            showgrid: true, gridcolor: '#dce6eb', tickfont: { color: "#5c8496" }, range: [0, 105] 
        };
        layout[yaxisName] = { 
            showgrid: false, tickfont: { color: "#5c8496", size: 10 }, automargin: true 
        };

        const posX = (i + 0.5) / numCats;
        annotations.push({
            text: `Categoría ${cat}`,
            x: posX,
            y: 1.05,
            xref: 'paper',
            yref: 'paper',
            showarrow: false,
            font: { size: 14, color: "#005A7C", family: "Inter", weight: "bold" },
            xanchor: 'center'
        });
    });

    layout.annotations = annotations;
    Plotly.react(divId, traces, layout, { responsive: true, displayModeBar: false });
}

function renderizarVigencia(datos, divId, textSpanId) {
    const contenedor = document.getElementById(divId);
    if (!contenedor) return;
    if (!datos || datos.length === 0) { Plotly.purge(divId); contenedor.innerHTML = ""; return; }

    const rangoAnios = datos[0].Rango_Anios;
    document.getElementById(textSpanId).innerText = rangoAnios;

    const ordenPerfiles = [
        'Iniciación / Intermitente (1-2 años)',
        'Trayectoria en Desarrollo (3-4 años)',
        'Presencia Sostenida (5-6 años)',
        'Liderazgo Consolidado (7-8 años)'
    ];
    datos.sort((a, b) => ordenPerfiles.indexOf(a.Perfil) - ordenPerfiles.indexOf(b.Perfil));

    const trace = {
        labels: datos.map(d => d.Perfil),
        values: datos.map(d => d.Cantidad_IEs),
        type: 'pie',
        hole: 0.4,
        marker: { colors: paletaPasteles },
        textinfo: 'label+percent',
        textposition: 'outside', 
        hovertemplate: `<b>%{label}</b><br>Instituciones: %{value}<br>Porcentaje: %{percent}<extra></extra>`
    };

    const layout = {
        paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: "#005A7C", family: "Inter" },
        margin: { t: 40, b: 40, l: 140, r: 140 },
        showlegend: false,
        hoverlabel: { bgcolor: "#ffffff", bordercolor: "#005A7C", font: { color: "#005A7C", size: 13 } }
    };

    Plotly.react(divId, [trace], layout, { responsive: true, displayModeBar: false });
}

function renderizarComposicion(datos, anio, divId) {
    const contenedor = document.getElementById(divId);
    if (!contenedor) return;
    
    const datosAnio = datos.filter(d => d.Año === anio);
    if (datosAnio.length === 0) {
        Plotly.purge(divId); contenedor.innerHTML = "<p>No hay datos para este año.</p>"; return;
    }

    const categorias = [...new Set(datosAnio.map(d => d['Proyecto - Categoria']))].sort();
    const numCats = categorias.length;

    const traces = [];
    const layout = {
        paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: "#005A7C", family: "Inter" },
        margin: { t: 80, b: 180, l: 10, r: 10 }, 
        grid: { rows: 1, columns: numCats },
        annotations: [],
        hoverlabel: { bgcolor: "#ffffff", bordercolor: "#005A7C", font: { color: "#005A7C", size: 13 } }
    };

    categorias.forEach((cat, i) => {
        const dataCat = datosAnio.filter(d => d['Proyecto - Categoria'] === cat);
        const legendName = i === 0 ? 'legend' : `legend${i + 1}`;
        const posX = (i + 0.5) / numCats;
        const labelsUnicos = dataCat.map(d => d['Proyecto - Area'].toUpperCase() + '\u200B'.repeat(i));

        traces.push({
            type: 'pie',
            labels: labelsUnicos,
            values: dataCat.map(d => d.Cant_Proyectos),
            name: cat,
            domain: { row: 0, column: i },
            hole: 0.4,
            textinfo: 'percent',
            textposition: 'inside',
            textfont: { size: 14 }, 
            marker: { colors: paletaPasteles },
            showlegend: true, 
            legend: legendName, 
            hovertemplate: `<b>%{label}</b><br>${cat}<br>Proyectos: %{value}<br>Porcentaje: %{percent}<extra></extra>`
        });

        layout[legendName] = { x: posX, y: -0.15, xanchor: 'center', yanchor: 'top', font: { size: 12 }, bgcolor: "rgba(255,255,255,0.6)" };
        layout.annotations.push({ text: cat, x: posX, y: 1.15, xref: 'paper', yref: 'paper', showarrow: false, font: { size: 15, color: "#005A7C", family: "Inter", weight: "bold" }, xanchor: 'center' });
    });

    Plotly.react(divId, traces, layout, { responsive: true, displayModeBar: false });
}

function renderizarLineaUnica(datos, divId, tituloTooltip, colorLinea) {
    const contenedor = document.getElementById(divId);
    if (!contenedor) return;
    if (!datos || datos.length === 0) { Plotly.purge(divId); contenedor.innerHTML = ""; return; }

    const años = datos.map(d => d.Año);
    const porcentajes = datos.map(d => d['Porcentaje (%)']);
    const participantes = datos.map(d => d.Participantes_Eureka);
    const totales = datos.map(d => d.Total_Escale);

    const trace = {
        x: años, y: porcentajes, mode: 'lines+markers', name: tituloTooltip,
        customdata: participantes.map((p, i) => [p, totales[i]]),
        line: { color: colorLinea, width: 3 }, marker: { size: 8, color: colorLinea },
        hovertemplate: `<b>${tituloTooltip}</b><br>Año: %{x}<br>Participación: <b>%{y}%</b><br>IE en Eureka: %{customdata[0]:,}<br>IE totales: %{customdata[1]:,}<extra></extra>`
    };

    const layout = {
        paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: "#005A7C", family: "Inter" },
        margin: { t: 20, b: 40, l: 50, r: 20 }, hovermode: "closest",
        xaxis: { type: 'category', showgrid: false, linecolor: '#aed1dc', tickfont: { color: "#5c8496" } },
        yaxis: { title: "Porcentaje de IE participantes (%)", gridcolor: '#dce6eb', zerolinecolor: '#aed1dc', linecolor: '#aed1dc', range: [0, Math.max(...porcentajes) * 1.2], tickfont: { color: "#5c8496" } },
        hoverlabel: { bgcolor: "#ffffff", bordercolor: colorLinea, font: { color: "#005A7C", size: 13 } }
    };

    Plotly.react(divId, [trace], layout, { responsive: true, displayModeBar: false });
}

function renderizarLineasMultiples(datosMultiples, datosPromedio, divId) {
    const contenedor = document.getElementById(divId);
    if (!contenedor) return;
    if (!datosMultiples || datosMultiples.length === 0) { Plotly.purge(divId); contenedor.innerHTML = ""; return; }

    const campoEtiqueta = (datosMultiples[0] && datosMultiples[0]['IE - UGEL']) ? 'IE - UGEL' : 'IE - DRE';
    const tituloLeyenda = campoEtiqueta === 'IE - UGEL' ? 'UGEL' : 'DRE';
    const elementosUnicos = [...new Set(datosMultiples.map(d => d[campoEtiqueta]))].sort((a, b) => a.localeCompare(b, 'es'));
    
    const traces = elementosUnicos.map(item => {
        const dataItem = datosMultiples.filter(d => d[campoEtiqueta] === item);
        return {
            x: dataItem.map(d => d.Año), 
            y: dataItem.map(d => d['Porcentaje (%)']), 
            mode: 'lines+markers', 
            name: item,
            customdata: dataItem.map(d => [d.Participantes_Eureka, d.Total_Escale]),
            line: { width: 1.5 }, 
            marker: { size: 4 },
            opacity: 0.5,
            hovertemplate: `<b>${item}</b><br>Año: %{x}<br>Participación: <b>%{y}%</b><br>IE en Eureka: %{customdata[0]:,}<br>IE totales: %{customdata[1]:,}<extra></extra>`
        };
    });

    if (datosPromedio && datosPromedio.length > 0) {
        traces.push({
            x: datosPromedio.map(d => d.Año),
            y: datosPromedio.map(d => d['Porcentaje (%)']),
            mode: 'lines+markers',
            name: '<b>PROMEDIO</b>',
            customdata: datosPromedio.map(d => [d.Participantes_Eureka, d.Total_Escale]),
            line: { color: '#001a26', width: 4 }, 
            marker: { size: 8, color: '#001a26' },
            opacity: 1, 
            hovertemplate: `<b>PROMEDIO</b><br>Año: %{x}<br>Participación: <b>%{y}%</b><br>IE en Eureka: %{customdata[0]:,}<br>IE totales: %{customdata[1]:,}<extra></extra>`
        });
    }

    const maxPorcentajeMulti = Math.max(...datosMultiples.map(d => d['Porcentaje (%)']));
    const maxPorcentajeProm = datosPromedio ? Math.max(...datosPromedio.map(d => d['Porcentaje (%)'])) : 0;
    const maxPorcentaje = Math.max(maxPorcentajeMulti, maxPorcentajeProm);

    const layout = {
        paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: "#005A7C", family: "Inter" },
        margin: { t: 20, b: 40, l: 50, r: 150 }, hovermode: "closest", showlegend: true,
        legend: { y: 0.5, font: { size: 10 }, title: { text: tituloLeyenda } },
        xaxis: { type: 'category', showgrid: false, linecolor: '#aed1dc', tickfont: { color: "#5c8496" } },
        yaxis: { title: "Porcentaje de IE participantes (%)", gridcolor: '#dce6eb', zerolinecolor: '#aed1dc', linecolor: '#aed1dc', range: [0, maxPorcentaje * 1.1], tickfont: { color: "#5c8496" } },
        hoverlabel: { bgcolor: "#ffffff", font: { color: "#005A7C", size: 13 } }
    };

    Plotly.react(divId, traces, layout, { responsive: true, displayModeBar: false });
}

function renderizarRepresentatividad(datos, divId, tituloUniverso) {
    const contenedor = document.getElementById(divId);
    if (!contenedor) return;
    if (!datos || datos.length === 0) { Plotly.purge(divId); contenedor.innerHTML = ""; return; }

    const categorias = datos.map(d => d.Categoria);
    const valUniverso = datos.map(d => d.Total_Universo || 0);
    const valFaseUgel = datos.map(d => d.Fase_UGEL || 0);

    const trace1 = {
        values: valUniverso, labels: categorias, type: 'pie', name: tituloUniverso,
        domain: { row: 0, column: 0 }, hole: .4, textinfo: 'label+percent', textfont: { size: 14 },
        marker: { colors: paletaPasteles },
        hovertemplate: `<b>%{label}</b><br>${tituloUniverso}<br>Total: %{value}<br>Porcentaje: %{percent}<extra></extra>`
    };

    const trace2 = {
        values: valFaseUgel, labels: categorias, type: 'pie', name: "Participantes en Eureka",
        domain: { row: 0, column: 1 }, hole: .4, textinfo: 'label+percent', textfont: { size: 14 },
        marker: { colors: paletaPasteles },
        hovertemplate: `<b>%{label}</b><br>Participantes en Eureka<br>Total: %{value}<br>Porcentaje: %{percent}<extra></extra>`
    };

    const layout = {
        paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: "#005A7C", family: "Inter" },
        margin: { t: 60, b: 20, l: 0, r: 0 }, showlegend: false,
        grid: { rows: 1, columns: 2 },
        annotations: [
            { text: tituloUniverso, font: { size: 15, color: "#005A7C", family: "Inter", weight: "bold" }, showarrow: false, x: 0.22, y: 1.15, xanchor: "center" },
            { text: "Participantes en Eureka", font: { size: 15, color: "#005A7C", family: "Inter", weight: "bold" }, showarrow: false, x: 0.78, y: 1.15, xanchor: "center" }
        ],
        hoverlabel: { bgcolor: "#ffffff", bordercolor: "#005A7C", font: { color: "#005A7C", size: 13 } }
    };

    Plotly.react(divId, [trace1, trace2], layout, { responsive: true, displayModeBar: false });
}

function renderizarDistribucion(datos, divId) {
    const contenedor = document.getElementById(divId);
    if (!contenedor) return;
    if (!datos || datos.length === 0) { Plotly.purge(divId); contenedor.innerHTML = ""; return; }

    const trace = {
        x: datos.map(d => d['Cant_Proyectos']), y: datos.map(d => d['Cantidad_IEs']), type: 'bar',
        text: datos.map(d => d['Cantidad_IEs']), textposition: 'outside', marker: { color: '#005A7C' },
        hovertemplate: `<b>%{x} Proyectos</b><br>Alcanzado por: %{y} Instituciones<extra></extra>`
    };

    const layout = {
        paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: "#005A7C", family: "Inter" },
        margin: { t: 20, b: 40, l: 50, r: 20 }, hovermode: "closest",
        xaxis: { title: "Cantidad de Proyectos Clasificados por Año", tickmode: 'linear', showgrid: false, linecolor: '#aed1dc', tickfont: { color: "#5c8496" } },
        yaxis: { title: "Número de Instituciones", gridcolor: '#dce6eb', zerolinecolor: '#aed1dc', linecolor: '#aed1dc', tickfont: { color: "#5c8496" } },
        hoverlabel: { bgcolor: "#ffffff", bordercolor: "#005A7C", font: { color: "#005A7C", size: 13 } }
    };

    Plotly.react(divId, [trace], layout, { responsive: true, displayModeBar: false });
}

function renderizarTablaTop20(datos, divId) {
    const contenedor = document.getElementById(divId);
    if (!contenedor) return;
    if (!datos || datos.length === 0) { contenedor.innerHTML = "<p style='text-align:center; padding: 20px;'>No hay datos disponibles.</p>"; return; }

    let html = `
        <table class="data-table">
            <thead>
                <tr><th class="col-center">Rank</th><th>DRE</th><th>UGEL</th><th class="col-center">Cód. Modular</th><th>Institución Educativa</th><th class="col-center">Total Proyectos</th></tr>
            </thead><tbody>`;

    datos.forEach((row, idx) => {
        html += `<tr><td class="col-center text-bold">${idx + 1}</td><td>${row['IE - DRE']}</td><td>${row['IE - UGEL']}</td><td class="col-center">${row['IE - Codigo modular']}</td><td>${row['IE - Nombre']}</td><td class="col-center text-bold">${row['Cant_Proyectos']}</td></tr>`;
    });

    html += `</tbody></table>`;
    contenedor.innerHTML = html;
}

function renderizarMapaCalor(datos, divId) {
    const contenedor = document.getElementById(divId);
    if (!contenedor) return;
    if (!datos || datos.length === 0) { Plotly.purge(divId); contenedor.innerHTML = ""; return; }

    const latData = datos.map(d => d['IE - Latitud']);
    const lonData = datos.map(d => d['IE - Longitud']);
    const zData = datos.map(d => d['Cantidad_Proyectos']);
    const textData = datos.map(d => d['IE - Nombre']);
    const dreData = datos.map(d => d['IE - DRE']); 

    const trace = {
        type: 'densitymapbox', lon: lonData, lat: latData, z: zData, radius: 15, customdata: dreData, text: textData,
        hovertemplate: `<b>%{text}</b><br>DRE: %{customdata}<br>N° de Proyectos: %{z}<extra></extra>`, 
        colorscale: [[0, "rgba(0,0,0,0)"], [0.2, "#00B3CD"], [0.5, "#005A7C"], [0.8, "#D81B60"], [1, "#880E4F"]],
        colorbar: {
            title: "N° de Proyectos", titlefont: { color: "#005A7C", size: 14 }, titleside: "top", thickness: 12, len: 250, lenmode: "pixels",
            yanchor: "top", y: 0.95, xanchor: "left", x: 0.02, tickfont: { size: 12, color: "#333333" }, bgcolor: "rgba(255,255,255,0.8)", bordercolor: "#aed1dc", borderwidth: 1
        }
    };

    const layout = {
        paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", margin: { t: 0, b: 0, l: 0, r: 0 },
        mapbox: { style: "carto-positron", center: { lat: -9.189967, lon: -75.015152 }, zoom: 4.8 },
        hoverlabel: { bgcolor: "#005A7C", font: { color: "#ffffff", size: 13 } }
    };

    Plotly.react(divId, [trace], layout, { responsive: true, displayModeBar: false });
}

function renderizarPermanenciaEstudiante(datos, divId) {
    const contenedor = document.getElementById(divId);
    if (!contenedor) return;
    if (!datos || datos.length === 0) { Plotly.purge(divId); contenedor.innerHTML = ""; return; }

    const trace = {
        x: datos.map(d => d['Cant_Anios'] + (d['Cant_Anios'] === 1 ? ' Año' : ' Años')),
        y: datos.map(d => d['Cantidad_Estudiantes']),
        type: 'bar',
        text: datos.map(d => d['Cantidad_Estudiantes']),
        textposition: 'outside',
        marker: { color: colorAccent }, 
        hovertemplate: `<b>Participó %{x}</b><br>Número de Estudiantes: %{y:,}<extra></extra>`
    };

    const layout = {
        paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: "#005A7C", family: "Inter" },
        margin: { t: 20, b: 40, l: 60, r: 20 }, hovermode: "closest",
        xaxis: { title: "Años Totales de Participación", type: 'category', showgrid: false, linecolor: '#aed1dc', tickfont: { color: "#5c8496" } },
        yaxis: { title: "Cantidad de Estudiantes", gridcolor: '#dce6eb', zerolinecolor: '#aed1dc', linecolor: '#aed1dc', tickfont: { color: "#5c8496" } },
        hoverlabel: { bgcolor: "#ffffff", bordercolor: colorAccent, font: { color: "#005A7C", size: 13 } }
    };

    Plotly.react(divId, [trace], layout, { responsive: true, displayModeBar: false });
}

function renderizarPermanenciaGrado(datos, divId) {
    const contenedor = document.getElementById(divId);
    if (!contenedor) return;
    if (!datos || datos.length === 0) { Plotly.purge(divId); contenedor.innerHTML = ""; return; }

    const grupos = ['1 Año', '2 Años', '3 a más Años'];
    const traces = [];
    const annotations = [];

    const obtenerJerarquia = (grado) => {
        const g = String(grado).toLowerCase();
        if (g.includes('1') || g.includes('primer')) return 1;
        if (g.includes('2') || g.includes('segund')) return 2;
        if (g.includes('3') || g.includes('tercer')) return 3;
        if (g.includes('4') || g.includes('cuart')) return 4;
        if (g.includes('5') || g.includes('quint')) return 5;
        if (g.includes('6') || g.includes('sext')) return 6;
        return 99; 
    };

    const gradosUnicos = [...new Set(datos.map(d => d.Grado_Inicio))].sort((a,b) => obtenerJerarquia(a) - obtenerJerarquia(b));
    const paletaGrados = ['#001a26', '#005A7C', '#00B3CD', '#50C8D6', '#B4BD0E', '#FCE300'];
    
    const colorMap = {};
    gradosUnicos.forEach((g, i) => colorMap[g] = paletaGrados[i % paletaGrados.length]);

    grupos.forEach((grupo, i) => {
        const dataGrupo = datos.filter(d => d.Grupo_Permanencia === grupo);
        if (dataGrupo.length === 0) return;

        dataGrupo.sort((a,b) => obtenerJerarquia(a.Grado_Inicio) - obtenerJerarquia(b.Grado_Inicio));

        const posX = (i + 0.5) / 3;

        traces.push({
            type: 'pie',
            labels: dataGrupo.map(d => d.Grado_Inicio),
            values: dataGrupo.map(d => d.Cant_Estudiantes),
            name: grupo,
            domain: { row: 0, column: i },
            hole: 0.4,
            textinfo: 'percent',
            textposition: 'inside',
            marker: { colors: dataGrupo.map(d => colorMap[d.Grado_Inicio]) },
            showlegend: i === 0, 
            hovertemplate: `<b>%{label}</b><br>Estudiantes: %{value:,}<br>Porcentaje: %{percent}<extra></extra>`
        });

        annotations.push({
            text: grupo,
            x: posX,
            y: 1.15,
            xref: 'paper',
            yref: 'paper',
            showarrow: false,
            font: { size: 15, color: "#005A7C", family: "Inter", weight: "bold" },
            xanchor: 'center'
        });
    });

    const layout = {
        paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: "#005A7C", family: "Inter" },
        margin: { t: 60, b: 20, l: 10, r: 10 },
        grid: { rows: 1, columns: 3 },
        annotations: annotations,
        legend: { orientation: "h", x: 0.5, xanchor: "center", y: -0.1 },
        hoverlabel: { bgcolor: "#ffffff", bordercolor: "#005A7C", font: { color: "#005A7C", size: 13 } }
    };

    Plotly.react(divId, traces, layout, { responsive: true, displayModeBar: false });
}

function renderizarTemasGeneral(datos, anio, divId) {
    const contenedor = document.getElementById(divId);
    if (!contenedor) return;
    
    if (!datos || datos.length === 0) {
        Plotly.purge(divId);
        contenedor.innerHTML = "<p style='text-align:center; padding-top: 20px; color:#5c8496;'>No hay datos de palabras clave para este año.</p>"; 
        return;
    }

    const datosAnio = datos.filter(d => d.Año === anio);
    if (datosAnio.length === 0) { 
        Plotly.purge(divId); 
        contenedor.innerHTML = "<p style='text-align:center; padding-top: 20px; color:#5c8496;'>No hay datos de palabras clave para este año.</p>"; 
        return; 
    }

    const datosOrdenados = datosAnio.sort((a, b) => a.Frecuencia - b.Frecuencia);

    const trace = {
        x: datosOrdenados.map(d => d.Frecuencia),
        y: datosOrdenados.map(d => d.Tema.toUpperCase()),
        type: 'bar',
        orientation: 'h',
        marker: { color: colorAccent },
        text: datosOrdenados.map(d => String(d.Frecuencia)),
        textposition: 'outside',
        hovertemplate: `<b>%{y}</b><br>Menciones en títulos: %{x}<extra></extra>`
    };

    const layout = {
        paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: "#005A7C", family: "Inter" },
        margin: { t: 20, b: 40, l: 250, r: 40 }, 
        xaxis: { showgrid: true, gridcolor: '#dce6eb', tickfont: { color: "#5c8496" } },
        yaxis: { showgrid: false, tickfont: { color: "#005A7C", size: 12, weight: "bold" } },
        hoverlabel: { bgcolor: "#ffffff", bordercolor: colorAccent, font: { color: "#005A7C", size: 13 } },
        bargap: 0.3
    };

    Plotly.react(divId, [trace], layout, { responsive: true, displayModeBar: false });
}

function renderizarTemasSubplots(datos, anio, agrupacion, divId, ordenarNumerico, colorBarras) {
    const contenedor = document.getElementById(divId);
    if (!contenedor) return;
    
    const datosAnio = datos.filter(d => d.Año === anio);
    if (datosAnio.length === 0) { 
        Plotly.purge(divId); 
        contenedor.innerHTML = "<p style='text-align:center; padding-top: 20px; color:#5c8496;'>No hay datos suficientes para este año.</p>"; 
        return; 
    }

    let grupos = [...new Set(datosAnio.map(d => d[agrupacion]))];
    
    if (ordenarNumerico) {
        const obtenerJerarquia = (g) => {
            const str = String(g).toLowerCase();
            if (str.includes('1') || str.includes('primer')) return 1;
            if (str.includes('2') || str.includes('segund')) return 2;
            if (str.includes('3') || str.includes('tercer')) return 3;
            if (str.includes('4') || str.includes('cuart')) return 4;
            if (str.includes('5') || str.includes('quint')) return 5;
            if (str.includes('6') || str.includes('sext')) return 6;
            return 99; 
        };
        grupos.sort((a, b) => obtenerJerarquia(a) - obtenerJerarquia(b));
    } else {
        grupos.sort();
    }

    const numGrupos = grupos.length;
    const traces = [];
    const annotations = [];

    const layout = {
        paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", font: { color: "#005A7C", family: "Inter" },
        margin: { t: 50, b: 20, l: 10, r: 10 }, 
        showlegend: false, 
        grid: { rows: 1, columns: numGrupos, pattern: 'independent' },
        hoverlabel: { bgcolor: "#ffffff", bordercolor: colorBarras, font: { color: "#005A7C", size: 13 } },
        bargap: 0.4
    };

    grupos.forEach((grupo, i) => {
        const dataGrupo = datosAnio.filter(d => d[agrupacion] === grupo);
        dataGrupo.sort((a, b) => a.Frecuencia - b.Frecuencia);

        const xaxisName = i === 0 ? 'xaxis' : 'xaxis' + (i + 1);
        const yaxisName = i === 0 ? 'yaxis' : 'yaxis' + (i + 1);

        traces.push({
            x: dataGrupo.map(d => d.Frecuencia),
            y: dataGrupo.map(d => d.Tema),
            type: 'bar',
            orientation: 'h', 
            xaxis: xaxisName.replace('axis', ''),
            yaxis: yaxisName.replace('axis', ''),
            text: dataGrupo.map(d => ` ${d.Tema.toUpperCase()} (${d.Frecuencia}) `),
            textposition: 'auto',
            insidetextanchor: 'start',
            textfont: { size: 10 },
            marker: { color: colorBarras },
            hovertemplate: `<b>%{y}</b><br>Menciones: %{x}<extra></extra>`
        });

        const maxFreq = Math.max(...dataGrupo.map(d => d.Frecuencia));

        layout[xaxisName] = { 
            showgrid: true, gridcolor: '#dce6eb', tickfont: { color: "#5c8496", size: 10 }, range: [0, maxFreq * 1.4] 
        };
        layout[yaxisName] = { 
            showgrid: false, 
            showticklabels: false,
            automargin: true 
        };

        const posX = (i + 0.5) / numGrupos;
        annotations.push({
            text: String(grupo),
            x: posX,
            y: 1.05,
            xref: 'paper',
            yref: 'paper',
            showarrow: false,
            font: { size: 12, color: "#005A7C", family: "Inter", weight: "bold" },
            xanchor: 'center'
        });
    });

    layout.annotations = annotations;
    Plotly.react(divId, traces, layout, { responsive: true, displayModeBar: false });
}
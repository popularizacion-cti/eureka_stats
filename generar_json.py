import pandas as pd
import numpy as np
import os
import unicodedata
import re
import nltk
import itertools
from unidecode import unidecode
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import CountVectorizer

# Preparación para Procesamiento de Lenguaje Natural (NLP)
nltk.download('stopwords', quiet=True)
stop_words = set(stopwords.words('spanish'))

def limpiar_nombre(nombre):
    s = ''.join(c for c in unicodedata.normalize('NFD', str(nombre)) if unicodedata.category(c) != 'Mn')
    return s.lower().strip().replace(" ", "_")

def categorizar_vigencia(anios):
    if 1 <= anios <= 2: return 'Iniciación / Intermitente (1-2 años)'
    elif 3 <= anios <= 4: return 'Trayectoria en Desarrollo (3-4 años)'
    elif 5 <= anios <= 6: return 'Presencia Sostenida (5-6 años)'
    else: return 'Liderazgo Consolidado (7-8 años)'

def limpiar_titulo(texto):
    if pd.isna(texto): return ""
    texto = str(texto)
    texto = unidecode(texto.lower())
    texto = re.sub(r'[^a-z\s]', '', texto)
    palabras = [palabra for palabra in texto.split() if len(palabra) > 2 and palabra not in stop_words]
    return ' '.join(palabras)

def hallar_frecuencias(df, top_n=5):
    corpus = df["titulo_limpio"].dropna().tolist()
    corpus = [c for c in corpus if c.strip() != ""]
    if not corpus:
        return pd.DataFrame(columns=['Tema', 'Frecuencia'])
    try:
        vectorizer = CountVectorizer(ngram_range=(2, 3), max_features=top_n)
        X = vectorizer.fit_transform(corpus)
        frecuencias = X.sum(axis=0)
        ngramas = vectorizer.get_feature_names_out()
        frecuencias_df = pd.DataFrame({'Tema': ngramas, 'Frecuencia': frecuencias.A1})
        frecuencias_df = frecuencias_df.sort_values(by='Frecuencia', ascending=False).reset_index(drop=True)
        return frecuencias_df
    except ValueError:
        return pd.DataFrame(columns=['Tema', 'Frecuencia'])

# =========================================================
# ORQUESTADOR ETAPA UGEL
# =========================================================
def exportar_lote_ugel(etapa, nombre_region, df_single_gen, df_single_gest, df_multi_gen, df_multi_gest, sufijo_multi, df_pro_anual, df_escale_region, df_eureka_region, col_titulo):
    prefijo = limpiar_nombre(nombre_region)
    carpeta = os.path.join(etapa, f"JSON_{prefijo}")
    os.makedirs(carpeta, exist_ok=True)
    
    for nivel in ['Secundaria', 'Primaria']:
        niv_low = nivel.lower()
        
        df_single_gen[df_single_gen['IE - Nivel'] == nivel].to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_general.json"), orient='records', force_ascii=False)
        df_single_gest[(df_single_gest['IE - Nivel'] == nivel) & (df_single_gest['IE - Gestion'] == 'Pública')].to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_publica.json"), orient='records', force_ascii=False)
        df_single_gest[(df_single_gest['IE - Nivel'] == nivel) & (df_single_gest['IE - Gestion'] == 'Privada')].to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_privada.json"), orient='records', force_ascii=False)
        df_multi_gen[df_multi_gen['IE - Nivel'] == nivel].to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_{sufijo_multi}.json"), orient='records', force_ascii=False)
        df_multi_gest[(df_multi_gest['IE - Nivel'] == nivel) & (df_multi_gest['IE - Gestion'] == 'Pública')].to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_{sufijo_multi}_publica.json"), orient='records', force_ascii=False)
        df_multi_gest[(df_multi_gest['IE - Nivel'] == nivel) & (df_multi_gest['IE - Gestion'] == 'Privada')].to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_{sufijo_multi}_privada.json"), orient='records', force_ascii=False)

        df_p = df_pro_anual[df_pro_anual['IE - Nivel'] == nivel]
        dist = df_p.groupby('Cant_Proyectos')['IE - Codigo modular'].count().reset_index()
        dist.rename(columns={'IE - Codigo modular': 'Cantidad_IEs'}, inplace=True)
        dist.to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_distribucion.json"), orient='records', force_ascii=False)
        
        top20 = df_p.groupby(['IE - DRE', 'IE - UGEL', 'IE - Codigo modular', 'IE - Nombre'])['Cant_Proyectos'].sum().reset_index()
        top20 = top20.sort_values(by='Cant_Proyectos', ascending=False).head(20)
        top20.to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_top20.json"), orient='records', force_ascii=False)

        esc_niv = df_escale_region[df_escale_region['IE - Nivel'] == nivel]
        eu_niv_unicos = df_eureka_region[df_eureka_region['Estudiante - Nivel'] == nivel].drop_duplicates(subset=['IE - Codigo modular'])

        esc_gest = esc_niv['IE - Gestion'].value_counts().reset_index()
        esc_gest.columns = ['Categoria', 'Total_Universo']
        eu_gest = eu_niv_unicos['IE - Gestion'].value_counts().reset_index()
        eu_gest.columns = ['Categoria', 'Fase_UGEL']
        pd.merge(esc_gest, eu_gest, on='Categoria', how='outer').fillna(0).to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_rep_gestion.json"), orient='records', force_ascii=False)

        esc_area = esc_niv['IE - Area geografica'].value_counts().reset_index()
        esc_area.columns = ['Categoria', 'Total_Universo']
        eu_area = eu_niv_unicos['IE - Area geografica'].value_counts().reset_index()
        eu_area.columns = ['Categoria', 'Fase_UGEL']
        pd.merge(esc_area, eu_area, on='Categoria', how='outer').fillna(0).to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_rep_area.json"), orient='records', force_ascii=False)

        eu_niv_all = df_eureka_region[df_eureka_region['Estudiante - Nivel'] == nivel]
        comp_data = eu_niv_all.groupby(['Año', 'Proyecto - Categoria', 'Proyecto - Area'])['Proyecto - Codigo'].nunique().reset_index()
        comp_data.rename(columns={'Proyecto - Codigo': 'Cant_Proyectos'}, inplace=True)
        comp_data.to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_composicion.json"), orient='records', force_ascii=False)

        fidelidad = eu_niv_all.groupby('IE - Codigo modular')['Año'].nunique().reset_index()
        fidelidad.rename(columns={'Año': 'Anios_Activos'}, inplace=True)
        fidelidad['Perfil'] = fidelidad['Anios_Activos'].apply(categorizar_vigencia)
        resumen_fidelidad = fidelidad['Perfil'].value_counts().reset_index()
        resumen_fidelidad.columns = ['Perfil', 'Cantidad_IEs']
        anio_minimo = eu_niv_all['Año'].min() if not eu_niv_all.empty else 0
        anio_maximo = eu_niv_all['Año'].max() if not eu_niv_all.empty else 0
        resumen_fidelidad['Rango_Anios'] = f"{int(anio_minimo)} - {int(anio_maximo)}" if anio_minimo > 0 else "Sin datos"
        resumen_fidelidad.to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_vigencia.json"), orient='records', force_ascii=False)

        df_gen = eu_niv_all.dropna(subset=['Estudiante - Numero de documento', 'Proyecto - Area', 'Proyecto - Categoria']).copy()
        df_gen['Estudiante - Genero'] = df_gen['Estudiante - Genero'].apply(lambda x: x if pd.notna(x) and x in ['Femenino', 'Masculino'] else 'Sin datos')
        
        gen_hist = df_gen.groupby(['Año', 'Estudiante - Genero'])['Estudiante - Numero de documento'].nunique().reset_index()
        gen_hist.rename(columns={'Estudiante - Numero de documento': 'Cant_Estudiantes'}, inplace=True)
        gen_hist['Porcentaje'] = gen_hist.groupby('Año')['Cant_Estudiantes'].transform(lambda x: (x / x.sum()) * 100).round(1)
        gen_hist.to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_genero_hist.json"), orient='records', force_ascii=False)

        gen_cat = df_gen.groupby(['Año', 'Proyecto - Categoria', 'Estudiante - Genero'])['Estudiante - Numero de documento'].nunique().reset_index()
        gen_cat.rename(columns={'Estudiante - Numero de documento': 'Cant_Estudiantes'}, inplace=True)
        gen_cat['Porcentaje'] = gen_cat.groupby(['Año', 'Proyecto - Categoria'])['Cant_Estudiantes'].transform(lambda x: (x / x.sum()) * 100).round(1)
        gen_cat.to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_genero_cat.json"), orient='records', force_ascii=False)

        gen_area = df_gen.groupby(['Año', 'Proyecto - Categoria', 'Proyecto - Area', 'Estudiante - Genero'])['Estudiante - Numero de documento'].nunique().reset_index()
        gen_area.rename(columns={'Estudiante - Numero de documento': 'Cant_Estudiantes'}, inplace=True)
        gen_area['Porcentaje'] = gen_area.groupby(['Año', 'Proyecto - Categoria', 'Proyecto - Area'])['Cant_Estudiantes'].transform(lambda x: (x / x.sum()) * 100).round(1)
        gen_area.to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_genero_area.json"), orient='records', force_ascii=False)
        
        df_gen_grado_filtro = df_gen.dropna(subset=['Estudiante - Grado'])
        gen_grado = df_gen_grado_filtro.groupby(['Año', 'Estudiante - Grado', 'Estudiante - Genero'])['Estudiante - Numero de documento'].nunique().reset_index()
        gen_grado.rename(columns={'Estudiante - Numero de documento': 'Cant_Estudiantes'}, inplace=True)
        gen_grado['Porcentaje'] = gen_grado.groupby(['Año', 'Estudiante - Grado'])['Cant_Estudiantes'].transform(lambda x: (x / x.sum()) * 100).round(1)
        gen_grado.to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_genero_grado.json"), orient='records', force_ascii=False)

        df_grado = eu_niv_all.dropna(subset=['Estudiante - Numero de documento', 'Estudiante - Grado'])
        grado_data = df_grado.groupby(['Año', 'Estudiante - Grado'])['Estudiante - Numero de documento'].nunique().reset_index()
        grado_data.rename(columns={'Estudiante - Numero de documento': 'Cant_Estudiantes'}, inplace=True)
        grado_data['Porcentaje'] = grado_data.groupby('Año')['Cant_Estudiantes'].transform(lambda x: (x / x.sum()) * 100).round(1)
        grado_data.to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_grado.json"), orient='records', force_ascii=False)

        alumnos_por_proy = eu_niv_all.groupby('Proyecto - Codigo')['Estudiante - Numero de documento'].nunique().reset_index()
        alumnos_por_proy.rename(columns={'Estudiante - Numero de documento': 'Cant_Participantes'}, inplace=True)
        alumnos_por_proy['Tipo_Participacion'] = alumnos_por_proy['Cant_Participantes'].apply(lambda x: 'Individual' if x==1 else ('En Pareja' if x==2 else 'Atípico (3+)'))

        meta_proy = eu_niv_all.dropna(subset=['Proyecto - Codigo', 'Año', 'Proyecto - Categoria', 'Proyecto - Area', 'Estudiante - Grado'])[['Proyecto - Codigo', 'Año', 'Proyecto - Categoria', 'Proyecto - Area', 'Estudiante - Grado']].drop_duplicates(subset=['Proyecto - Codigo'])
        df_equipo = pd.merge(meta_proy, alumnos_por_proy, on='Proyecto - Codigo')

        eq_hist = df_equipo.groupby(['Año', 'Tipo_Participacion'])['Proyecto - Codigo'].nunique().reset_index()
        eq_hist.rename(columns={'Proyecto - Codigo': 'Cant_Proyectos'}, inplace=True)
        eq_hist['Porcentaje'] = eq_hist.groupby('Año')['Cant_Proyectos'].transform(lambda x: (x / x.sum()) * 100).round(1)
        eq_hist.to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_equipo_hist.json"), orient='records', force_ascii=False)

        eq_cat = df_equipo.groupby(['Año', 'Proyecto - Categoria', 'Tipo_Participacion'])['Proyecto - Codigo'].nunique().reset_index()
        eq_cat.rename(columns={'Proyecto - Codigo': 'Cant_Proyectos'}, inplace=True)
        eq_cat['Porcentaje'] = eq_cat.groupby(['Año', 'Proyecto - Categoria'])['Cant_Proyectos'].transform(lambda x: (x / x.sum()) * 100).round(1)
        eq_cat.to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_equipo_cat.json"), orient='records', force_ascii=False)

        eq_area = df_equipo.groupby(['Año', 'Proyecto - Categoria', 'Proyecto - Area', 'Tipo_Participacion'])['Proyecto - Codigo'].nunique().reset_index()
        eq_area.rename(columns={'Proyecto - Codigo': 'Cant_Proyectos'}, inplace=True)
        eq_area['Porcentaje'] = eq_area.groupby(['Año', 'Proyecto - Categoria', 'Proyecto - Area'])['Cant_Proyectos'].transform(lambda x: (x / x.sum()) * 100).round(1)
        eq_area.to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_equipo_area.json"), orient='records', force_ascii=False)

        eq_grado = df_equipo.groupby(['Año', 'Estudiante - Grado', 'Tipo_Participacion'])['Proyecto - Codigo'].nunique().reset_index()
        eq_grado.rename(columns={'Proyecto - Codigo': 'Cant_Proyectos'}, inplace=True)
        eq_grado['Porcentaje'] = eq_grado.groupby(['Año', 'Estudiante - Grado'])['Cant_Proyectos'].transform(lambda x: (x / x.sum()) * 100).round(1)
        eq_grado.to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_equipo_grado.json"), orient='records', force_ascii=False)

        df_est = eu_niv_all.dropna(subset=['Estudiante - Numero de documento', 'Año'])
        anios_por_estudiante = df_est.groupby('Estudiante - Numero de documento')['Año'].nunique().reset_index()
        dist_estudiantes = anios_por_estudiante.groupby('Año')['Estudiante - Numero de documento'].count().reset_index()
        dist_estudiantes.rename(columns={'Año': 'Cant_Anios', 'Estudiante - Numero de documento': 'Cantidad_Estudiantes'}, inplace=True)
        dist_estudiantes.to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_permanencia_est.json"), orient='records', force_ascii=False)

        df_est_grado = eu_niv_all.dropna(subset=['Estudiante - Numero de documento', 'Año', 'Estudiante - Grado'])
        anios_totales = df_est_grado.groupby('Estudiante - Numero de documento')['Año'].nunique().reset_index()
        anios_totales.rename(columns={'Año': 'Total_Anios'}, inplace=True)
        anios_totales['Grupo_Permanencia'] = anios_totales['Total_Anios'].apply(lambda x: '1 Año' if x==1 else ('2 Años' if x==2 else '3 a más Años'))
        
        primer_ingreso = df_est_grado.sort_values('Año').drop_duplicates(subset=['Estudiante - Numero de documento'], keep='first')[['Estudiante - Numero de documento', 'Estudiante - Grado']].rename(columns={'Estudiante - Grado': 'Grado_Inicio'})
        resumen_perm_grado = pd.merge(anios_totales, primer_ingreso, on='Estudiante - Numero de documento').groupby(['Grupo_Permanencia', 'Grado_Inicio'])['Estudiante - Numero de documento'].count().reset_index().rename(columns={'Estudiante - Numero de documento': 'Cant_Estudiantes'})
        resumen_perm_grado['Porcentaje'] = resumen_perm_grado.groupby('Grupo_Permanencia')['Cant_Estudiantes'].transform(lambda x: (x / x.sum()) * 100).round(1)
        resumen_perm_grado.to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_permanencia_grado.json"), orient='records', force_ascii=False)

        temas_general, temas_grado, temas_cat, temas_area = [], [], [], []
        if col_titulo and 'titulo_limpio' in eu_niv_all.columns:
            for a in sorted(eu_niv_all['Año'].unique()):
                filtro_a = eu_niv_all[eu_niv_all['Año'] == a].drop_duplicates(subset=['Proyecto - Codigo'])
                f_gen = hallar_frecuencias(filtro_a, top_n=5)
                if not f_gen.empty: f_gen['Año'] = a; temas_general.append(f_gen)
                    
                for g in filtro_a['Estudiante - Grado'].dropna().unique():
                    f_g = hallar_frecuencias(filtro_a[filtro_a['Estudiante - Grado'] == g], top_n=3)
                    if not f_g.empty: f_g['Año'] = a; f_g['Grado'] = g; temas_grado.append(f_g)
                        
                for c in filtro_a['Proyecto - Categoria'].dropna().unique():
                    f_c = hallar_frecuencias(filtro_a[filtro_a['Proyecto - Categoria'] == c], top_n=3)
                    if not f_c.empty: f_c['Año'] = a; f_c['Categoria'] = c; temas_cat.append(f_c)
                        
                for ar in filtro_a['Proyecto - Area'].dropna().unique():
                    f_ar = hallar_frecuencias(filtro_a[filtro_a['Proyecto - Area'] == ar], top_n=3)
                    if not f_ar.empty:
                        f_ar['Año'] = a; f_ar['Categoria'] = filtro_a[filtro_a['Proyecto - Area'] == ar]['Proyecto - Categoria'].iloc[0]; f_ar['Area'] = ar
                        temas_area.append(f_ar)

        if temas_general: pd.concat(temas_general, ignore_index=True).to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_temas_general.json"), orient='records', force_ascii=False)
        else: pd.DataFrame(columns=['Año', 'Tema', 'Frecuencia']).to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_temas_general.json"), orient='records', force_ascii=False)
        if temas_grado: pd.concat(temas_grado, ignore_index=True).to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_temas_grado.json"), orient='records', force_ascii=False)
        else: pd.DataFrame(columns=['Año', 'Grado', 'Tema', 'Frecuencia']).to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_temas_grado.json"), orient='records', force_ascii=False)
        if temas_cat: pd.concat(temas_cat, ignore_index=True).to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_temas_cat.json"), orient='records', force_ascii=False)
        else: pd.DataFrame(columns=['Año', 'Categoria', 'Tema', 'Frecuencia']).to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_temas_cat.json"), orient='records', force_ascii=False)
        if temas_area: pd.concat(temas_area, ignore_index=True).to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_temas_area.json"), orient='records', force_ascii=False)
        else: pd.DataFrame(columns=['Año', 'Categoria', 'Area', 'Tema', 'Frecuencia']).to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_temas_area.json"), orient='records', force_ascii=False)

def procesar_metrica_ugel(eureka_df, escale_df, col_titulo, orden_dre, años_concurso):
    print("\n--- INICIANDO PROCESAMIENTO: ETAPA UGEL ---")
    
    tot_nac_list, tot_dre_list, tot_ugel_list = [], [], []
    for año in años_concurso:
        df_esc = escale_df[escale_df['IE - Registro_num'] <= año]
        t_nac = df_esc.groupby(['IE - Nivel', 'IE - Gestion'])['IE - Codigo modular'].nunique().reset_index()
        t_nac['Año'] = año
        tot_nac_list.append(t_nac)
        t_dre = df_esc.groupby(['IE - DRE', 'IE - Nivel', 'IE - Gestion'])['IE - Codigo modular'].nunique().reset_index()
        t_dre['Año'] = año
        tot_dre_list.append(t_dre)
        t_ugel = df_esc.groupby(['IE - DRE', 'IE - UGEL', 'IE - Nivel', 'IE - Gestion'])['IE - Codigo modular'].nunique().reset_index()
        t_ugel['Año'] = año
        tot_ugel_list.append(t_ugel)

    esc_nac = pd.concat(tot_nac_list, ignore_index=True).rename(columns={'IE - Codigo modular': 'Total_Escale'})
    esc_dre = pd.concat(tot_dre_list, ignore_index=True).rename(columns={'IE - Codigo modular': 'Total_Escale'})
    esc_ugel = pd.concat(tot_ugel_list, ignore_index=True).rename(columns={'IE - Codigo modular': 'Total_Escale'})

    eu_nac = eureka_df.groupby(['Año', 'Estudiante - Nivel', 'IE - Gestion'])['IE - Codigo modular'].nunique().reset_index().rename(columns={'IE - Codigo modular': 'Participantes_Eureka', 'Estudiante - Nivel': 'IE - Nivel'})
    eu_dre = eureka_df.groupby(['Año', 'IE - DRE', 'Estudiante - Nivel', 'IE - Gestion'])['IE - Codigo modular'].nunique().reset_index().rename(columns={'IE - Codigo modular': 'Participantes_Eureka', 'Estudiante - Nivel': 'IE - Nivel'})
    eu_ugel = eureka_df.groupby(['Año', 'IE - DRE', 'IE - UGEL', 'Estudiante - Nivel', 'IE - Gestion'])['IE - Codigo modular'].nunique().reset_index().rename(columns={'IE - Codigo modular': 'Participantes_Eureka', 'Estudiante - Nivel': 'IE - Nivel'})

    df_nac = pd.merge(eu_nac, esc_nac, on=['Año', 'IE - Nivel', 'IE - Gestion'], how='right')
    df_dre = pd.merge(eu_dre, esc_dre, on=['Año', 'IE - DRE', 'IE - Nivel', 'IE - Gestion'], how='right')
    df_ugel_merge = pd.merge(eu_ugel, esc_ugel, on=['Año', 'IE - DRE', 'IE - UGEL', 'IE - Nivel', 'IE - Gestion'], how='right')

    def limpiar_y_calcular(df):
        df['Participantes_Eureka'] = df['Participantes_Eureka'].fillna(0).astype(int)
        df['Total_Escale'] = df['Total_Escale'].fillna(0).astype(int)
        df['Porcentaje (%)'] = 0.0
        mask = df['Total_Escale'] > 0
        df.loc[mask, 'Porcentaje (%)'] = ((df.loc[mask, 'Participantes_Eureka'] / df.loc[mask, 'Total_Escale']) * 100).round(1)
        return df

    df_nac, df_dre, df_ugel_merge = map(limpiar_y_calcular, [df_nac, df_dre, df_ugel_merge])

    def derivar_general(df, col_agrupacion):
        return limpiar_y_calcular(df.groupby(col_agrupacion)[['Participantes_Eureka', 'Total_Escale']].sum().reset_index())

    df_nac_gen = derivar_general(df_nac, ['Año', 'IE - Nivel'])
    df_dre_gen = derivar_general(df_dre, ['Año', 'IE - DRE', 'IE - Nivel'])
    df_ugel_gen = derivar_general(df_ugel_merge, ['Año', 'IE - DRE', 'IE - UGEL', 'IE - Nivel'])

    proyectos_por_ie = eureka_df.groupby(['IE - Codigo modular', 'Estudiante - Nivel'])['Proyecto - Codigo'].nunique().reset_index().rename(columns={'Proyecto - Codigo': 'Cantidad_Proyectos', 'Estudiante - Nivel': 'IE - Nivel'})
    coords_escale = escale_df[['IE - Codigo modular', 'IE - Nombre', 'IE - DRE', 'IE - Latitud', 'IE - Longitud']].drop_duplicates(subset=['IE - Codigo modular'])
    df_mapa = pd.merge(proyectos_por_ie, coords_escale, on='IE - Codigo modular', how='inner')
    df_mapa['IE - Latitud'] = pd.to_numeric(df_mapa['IE - Latitud'], errors='coerce')
    df_mapa['IE - Longitud'] = pd.to_numeric(df_mapa['IE - Longitud'], errors='coerce')
    df_mapa = df_mapa.dropna(subset=['IE - Latitud', 'IE - Longitud'])

    pro_anual = eureka_df.groupby(['Año', 'Estudiante - Nivel', 'IE - DRE', 'IE - UGEL', 'IE - Codigo modular', 'IE - Nombre'])['Proyecto - Codigo'].nunique().reset_index().rename(columns={'Proyecto - Codigo': 'Cant_Proyectos', 'Estudiante - Nivel': 'IE - Nivel'})

    print("Exportando Nacional UGEL...")
    exportar_lote_ugel("UGEL", "Nacional", df_nac_gen, df_nac, df_dre_gen, df_dre, "dre", pro_anual, escale_df, eureka_df, col_titulo)

    for nivel in ['Secundaria', 'Primaria']:
        ruta_mapa = os.path.join("UGEL", "JSON_nacional")
        os.makedirs(ruta_mapa, exist_ok=True)
        df_mapa[df_mapa['IE - Nivel'] == nivel].to_json(os.path.join(ruta_mapa, f"nacional_data_{nivel.lower()}_mapa.json"), orient='records', force_ascii=False)

    print("Exportando las 26 Regiones UGEL...")
    for dre in orden_dre:
        exportar_lote_ugel("UGEL", dre, df_dre_gen[df_dre_gen['IE - DRE'] == dre], df_dre[df_dre['IE - DRE'] == dre], df_ugel_gen[df_ugel_gen['IE - DRE'] == dre], df_ugel_merge[df_ugel_merge['IE - DRE'] == dre], "ugel", pro_anual[pro_anual['IE - DRE'] == dre], escale_df[escale_df['IE - DRE'] == dre], eureka_df[eureka_df['IE - DRE'] == dre], col_titulo)


# =========================================================
# ORQUESTADOR ETAPA DRE
# =========================================================
def exportar_lote_dre_json(etapa, nombre_region, df_region, prefijo, col_titulo, df_escale_region, df_eureka_ugel_region):
    carpeta = os.path.join(etapa, f"JSON_{prefijo}")
    os.makedirs(carpeta, exist_ok=True)
    
    for nivel in ['Secundaria', 'Primaria']:
        niv_low = nivel.lower()
        df_niv = df_region[df_region['Estudiante - Nivel'] == nivel]
        
        if df_niv.empty:
            continue
            
        # 1. Excelencia Institucional (Top 20 Clasificados)
        top20 = df_niv.groupby(['IE - DRE', 'IE - UGEL', 'IE - Codigo modular', 'IE - Nombre'])['Proyecto - Codigo'].nunique().reset_index()
        top20.rename(columns={'Proyecto - Codigo': 'Cant_Proyectos'}, inplace=True)
        top20 = top20.sort_values(by='Cant_Proyectos', ascending=False).head(20)
        top20.to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_top20.json"), orient='records', force_ascii=False)

        # 1.5 Representatividad (Gestión y Área Geográfica) - Comparativa Triple
        if df_escale_region is not None and df_eureka_ugel_region is not None:
            esc_niv = df_escale_region[df_escale_region['IE - Nivel'] == nivel]
            eu_ugel_niv_unicos = df_eureka_ugel_region[df_eureka_ugel_region['Estudiante - Nivel'] == nivel].drop_duplicates(subset=['IE - Codigo modular'])
            eu_dre_niv_unicos = df_niv.drop_duplicates(subset=['IE - Codigo modular'])

            # Para Gestión
            esc_gest = esc_niv['IE - Gestion'].value_counts().reset_index(); esc_gest.columns = ['Categoria', 'Total_Universo']
            eu_u_gest = eu_ugel_niv_unicos['IE - Gestion'].value_counts().reset_index(); eu_u_gest.columns = ['Categoria', 'Fase_UGEL']
            eu_d_gest = eu_dre_niv_unicos['IE - Gestion'].value_counts().reset_index(); eu_d_gest.columns = ['Categoria', 'Fase_DRE']
            
            rep_gest = pd.merge(esc_gest, eu_u_gest, on='Categoria', how='outer')
            rep_gest = pd.merge(rep_gest, eu_d_gest, on='Categoria', how='outer').fillna(0)
            rep_gest.to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_rep_gestion.json"), orient='records', force_ascii=False)

            # Para Área Geográfica
            esc_area = esc_niv['IE - Area geografica'].value_counts().reset_index(); esc_area.columns = ['Categoria', 'Total_Universo']
            eu_u_area = eu_ugel_niv_unicos['IE - Area geografica'].value_counts().reset_index(); eu_u_area.columns = ['Categoria', 'Fase_UGEL']
            eu_d_area = eu_dre_niv_unicos['IE - Area geografica'].value_counts().reset_index(); eu_d_area.columns = ['Categoria', 'Fase_DRE']
            
            rep_area = pd.merge(esc_area, eu_u_area, on='Categoria', how='outer')
            rep_area = pd.merge(rep_area, eu_d_area, on='Categoria', how='outer').fillna(0)
            rep_area.to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_rep_area.json"), orient='records', force_ascii=False)
        
        # 2. Matriz de Comprobación (Solo aplica a nivel Regional)
        if nombre_region != "Nacional" and df_escale_region is not None:
            # Extraemos todas las UGELs de la región, incluso si enviaron 0 proyectos
            ugels_region = df_escale_region['IE - UGEL'].dropna().unique()
            comprobacion_list = []
            
            for anio in sorted(df_niv['Año'].unique()):
                df_anio = df_niv[df_niv['Año'] == anio].copy()
                if df_anio.empty: continue
                
                df_anio['Cat_Area'] = df_anio['Proyecto - Categoria'] + " | " + df_anio['Proyecto - Area']
                cats_areas = df_anio['Cat_Area'].unique()
                
                conteo = df_anio.groupby(['IE - UGEL', 'Cat_Area'])['Proyecto - Codigo'].nunique().reset_index()
                conteo.rename(columns={'Proyecto - Codigo': 'Cant'}, inplace=True)
                
                # Relleno artificial: Matriz de UGELs x Categorías/Áreas
                combinaciones = pd.DataFrame(list(itertools.product(ugels_region, cats_areas)), columns=['IE - UGEL', 'Cat_Area'])
                
                matriz = pd.merge(combinaciones, conteo, on=['IE - UGEL', 'Cat_Area'], how='left').fillna(0)
                matriz['Cant'] = matriz['Cant'].astype(int)
                matriz['Año'] = int(anio)
                
                comprobacion_list.append(matriz)
                
            if comprobacion_list:
                pd.concat(comprobacion_list, ignore_index=True).to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_comprobacion.json"), orient='records', force_ascii=False)
        
        # 3. Brechas de Género
        df_gen = df_niv.dropna(subset=['Estudiante - Numero de documento', 'Proyecto - Area', 'Proyecto - Categoria']).copy()
        df_gen['Estudiante - Genero'] = df_gen['Estudiante - Genero'].apply(lambda x: x if pd.notna(x) and x in ['Femenino', 'Masculino'] else 'Sin datos')
        
        gen_hist = df_gen.groupby(['Año', 'Estudiante - Genero'])['Estudiante - Numero de documento'].nunique().reset_index()
        gen_hist.rename(columns={'Estudiante - Numero de documento': 'Cant_Estudiantes'}, inplace=True)
        gen_hist['Porcentaje'] = gen_hist.groupby('Año')['Cant_Estudiantes'].transform(lambda x: (x / x.sum()) * 100).round(1)
        gen_hist.to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_genero_hist.json"), orient='records', force_ascii=False)

        gen_cat = df_gen.groupby(['Año', 'Proyecto - Categoria', 'Estudiante - Genero'])['Estudiante - Numero de documento'].nunique().reset_index()
        gen_cat.rename(columns={'Estudiante - Numero de documento': 'Cant_Estudiantes'}, inplace=True)
        gen_cat['Porcentaje'] = gen_cat.groupby(['Año', 'Proyecto - Categoria'])['Cant_Estudiantes'].transform(lambda x: (x / x.sum()) * 100).round(1)
        gen_cat.to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_genero_cat.json"), orient='records', force_ascii=False)

        gen_area = df_gen.groupby(['Año', 'Proyecto - Categoria', 'Proyecto - Area', 'Estudiante - Genero'])['Estudiante - Numero de documento'].nunique().reset_index()
        gen_area.rename(columns={'Estudiante - Numero de documento': 'Cant_Estudiantes'}, inplace=True)
        gen_area['Porcentaje'] = gen_area.groupby(['Año', 'Proyecto - Categoria', 'Proyecto - Area'])['Cant_Estudiantes'].transform(lambda x: (x / x.sum()) * 100).round(1)
        gen_area.to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_genero_area.json"), orient='records', force_ascii=False)
        
        df_gen_grado_filtro = df_gen.dropna(subset=['Estudiante - Grado'])
        gen_grado = df_gen_grado_filtro.groupby(['Año', 'Estudiante - Grado', 'Estudiante - Genero'])['Estudiante - Numero de documento'].nunique().reset_index()
        gen_grado.rename(columns={'Estudiante - Numero de documento': 'Cant_Estudiantes'}, inplace=True)
        gen_grado['Porcentaje'] = gen_grado.groupby(['Año', 'Estudiante - Grado'])['Cant_Estudiantes'].transform(lambda x: (x / x.sum()) * 100).round(1)
        gen_grado.to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_genero_grado.json"), orient='records', force_ascii=False)

        # 4. Dinámica de Trabajo
        alumnos_por_proy = df_niv.groupby('Proyecto - Codigo')['Estudiante - Numero de documento'].nunique().reset_index()
        alumnos_por_proy.rename(columns={'Estudiante - Numero de documento': 'Cant_Participantes'}, inplace=True)
        alumnos_por_proy['Tipo_Participacion'] = alumnos_por_proy['Cant_Participantes'].apply(lambda x: 'Individual' if x==1 else ('En Pareja' if x==2 else 'Atípico (3+)'))

        meta_proy = df_niv.dropna(subset=['Proyecto - Codigo', 'Año', 'Proyecto - Categoria', 'Proyecto - Area', 'Estudiante - Grado'])[['Proyecto - Codigo', 'Año', 'Proyecto - Categoria', 'Proyecto - Area', 'Estudiante - Grado']].drop_duplicates(subset=['Proyecto - Codigo'])
        df_equipo = pd.merge(meta_proy, alumnos_por_proy, on='Proyecto - Codigo')

        eq_hist = df_equipo.groupby(['Año', 'Tipo_Participacion'])['Proyecto - Codigo'].nunique().reset_index()
        eq_hist.rename(columns={'Proyecto - Codigo': 'Cant_Proyectos'}, inplace=True)
        eq_hist['Porcentaje'] = eq_hist.groupby('Año')['Cant_Proyectos'].transform(lambda x: (x / x.sum()) * 100).round(1)
        eq_hist.to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_equipo_hist.json"), orient='records', force_ascii=False)

        eq_cat = df_equipo.groupby(['Año', 'Proyecto - Categoria', 'Tipo_Participacion'])['Proyecto - Codigo'].nunique().reset_index()
        eq_cat.rename(columns={'Proyecto - Codigo': 'Cant_Proyectos'}, inplace=True)
        eq_cat['Porcentaje'] = eq_cat.groupby(['Año', 'Proyecto - Categoria'])['Cant_Proyectos'].transform(lambda x: (x / x.sum()) * 100).round(1)
        eq_cat.to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_equipo_cat.json"), orient='records', force_ascii=False)

        eq_area = df_equipo.groupby(['Año', 'Proyecto - Categoria', 'Proyecto - Area', 'Tipo_Participacion'])['Proyecto - Codigo'].nunique().reset_index()
        eq_area.rename(columns={'Proyecto - Codigo': 'Cant_Proyectos'}, inplace=True)
        eq_area['Porcentaje'] = eq_area.groupby(['Año', 'Proyecto - Categoria', 'Proyecto - Area'])['Cant_Proyectos'].transform(lambda x: (x / x.sum()) * 100).round(1)
        eq_area.to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_equipo_area.json"), orient='records', force_ascii=False)

        eq_grado = df_equipo.groupby(['Año', 'Estudiante - Grado', 'Tipo_Participacion'])['Proyecto - Codigo'].nunique().reset_index()
        eq_grado.rename(columns={'Proyecto - Codigo': 'Cant_Proyectos'}, inplace=True)
        eq_grado['Porcentaje'] = eq_grado.groupby(['Año', 'Estudiante - Grado'])['Cant_Proyectos'].transform(lambda x: (x / x.sum()) * 100).round(1)
        eq_grado.to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_equipo_grado.json"), orient='records', force_ascii=False)

        # 5. Temas NLP
        temas_general, temas_grado, temas_cat, temas_area = [], [], [], []
        if col_titulo and 'titulo_limpio' in df_niv.columns:
            for a in sorted(df_niv['Año'].unique()):
                filtro_a = df_niv[df_niv['Año'] == a].drop_duplicates(subset=['Proyecto - Codigo'])
                
                f_gen = hallar_frecuencias(filtro_a, top_n=5)
                if not f_gen.empty: f_gen['Año'] = a; temas_general.append(f_gen)
                    
                for g in filtro_a['Estudiante - Grado'].dropna().unique():
                    f_g = hallar_frecuencias(filtro_a[filtro_a['Estudiante - Grado'] == g], top_n=3)
                    if not f_g.empty: f_g['Año'] = a; f_g['Grado'] = g; temas_grado.append(f_g)
                        
                for c in filtro_a['Proyecto - Categoria'].dropna().unique():
                    f_c = hallar_frecuencias(filtro_a[filtro_a['Proyecto - Categoria'] == c], top_n=3)
                    if not f_c.empty: f_c['Año'] = a; f_c['Categoria'] = c; temas_cat.append(f_c)
                        
                for ar in filtro_a['Proyecto - Area'].dropna().unique():
                    f_ar = hallar_frecuencias(filtro_a[filtro_a['Proyecto - Area'] == ar], top_n=3)
                    if not f_ar.empty:
                        f_ar['Año'] = a; f_ar['Categoria'] = filtro_a[filtro_a['Proyecto - Area'] == ar]['Proyecto - Categoria'].iloc[0]; f_ar['Area'] = ar
                        temas_area.append(f_ar)

        if temas_general: pd.concat(temas_general, ignore_index=True).to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_temas_general.json"), orient='records', force_ascii=False)
        else: pd.DataFrame(columns=['Año', 'Tema', 'Frecuencia']).to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_temas_general.json"), orient='records', force_ascii=False)
        
        if temas_grado: pd.concat(temas_grado, ignore_index=True).to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_temas_grado.json"), orient='records', force_ascii=False)
        else: pd.DataFrame(columns=['Año', 'Grado', 'Tema', 'Frecuencia']).to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_temas_grado.json"), orient='records', force_ascii=False)
        
        if temas_cat: pd.concat(temas_cat, ignore_index=True).to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_temas_cat.json"), orient='records', force_ascii=False)
        else: pd.DataFrame(columns=['Año', 'Categoria', 'Tema', 'Frecuencia']).to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_temas_cat.json"), orient='records', force_ascii=False)
        
        if temas_area: pd.concat(temas_area, ignore_index=True).to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_temas_area.json"), orient='records', force_ascii=False)
        else: pd.DataFrame(columns=['Año', 'Categoria', 'Area', 'Tema', 'Frecuencia']).to_json(os.path.join(carpeta, f"{prefijo}_data_{niv_low}_temas_area.json"), orient='records', force_ascii=False)

def procesar_metrica_dre(eureka_dre, col_titulo, orden_dre, escale_data, eureka_ugel):
    print("\n--- INICIANDO PROCESAMIENTO: ETAPA DRE ---")
    print("Exportando Nacional DRE...")
    exportar_lote_dre_json("DRE", "Nacional", eureka_dre, "nacional", col_titulo, escale_data, eureka_ugel)
    
    print("Exportando las 26 Regiones DRE...")
    for dre in orden_dre:
        df_dre_filtrado = eureka_dre[eureka_dre['IE - DRE'] == dre]
        df_escale_filtrado = escale_data[escale_data['IE - DRE'] == dre]
        df_ugel_filtrado = eureka_ugel[eureka_ugel['IE - DRE'] == dre]
        if not df_dre_filtrado.empty:
            exportar_lote_dre_json("DRE", dre, df_dre_filtrado, limpiar_nombre(dre), col_titulo, df_escale_filtrado, df_ugel_filtrado)

# =========================================================
# 1. CARGA Y LIMPIEZA MAESTRA DE DATOS
# =========================================================
ruta_eureka = 'data/eureka_ugel.parquet'
ruta_escale = 'data/escale.parquet'
ruta_eureka_dre = 'data/eureka_dre.parquet'

eureka_data = pd.read_parquet(ruta_eureka)
escale_data = pd.read_parquet(ruta_escale)

print("Datos cargados. Estandarizando regiones y procesando denominadores...")
for df in [escale_data, eureka_data]:
    if 'IE - DRE' in df.columns:
        df['IE - DRE'] = df['IE - DRE'].str.replace(r'^(DRE|GRE)\s+', '', regex=True, flags=re.IGNORECASE).str.strip()

escale_data['IE - Registro'] = escale_data['IE - Registro'].replace(['2055', 2055, 2055.0], 0)
escale_data['IE - Registro_num'] = pd.to_numeric(escale_data['IE - Registro'], errors='coerce').fillna(0).astype(int)

años_concurso = sorted(eureka_data['Año'].dropna().unique())
orden_dre = sorted(escale_data['IE - DRE'].dropna().unique()) 

col_titulo_val = None
if 'Proyecto - Titulo' in eureka_data.columns: col_titulo_val = 'Proyecto - Titulo'
elif 'Título del trabajo' in eureka_data.columns: col_titulo_val = 'Título del trabajo'

if col_titulo_val:
    print("Aplicando limpieza NLP a los títulos de los proyectos...")
    eureka_data['titulo_limpio'] = eureka_data[col_titulo_val].apply(limpiar_titulo)

# =========================================================
# EJECUCIÓN POR ETAPAS
# =========================================================
# Ejecutar lógica de Etapa UGEL
procesar_metrica_ugel(eureka_data, escale_data, col_titulo_val, orden_dre, años_concurso)

# Ejecutar lógica de Etapa DRE
if os.path.exists(ruta_eureka_dre):
    eureka_dre_data = pd.read_parquet(ruta_eureka_dre)
    
    if 'IE - DRE' in eureka_dre_data.columns:
        eureka_dre_data['IE - DRE'] = eureka_dre_data['IE - DRE'].str.replace(r'^(DRE|GRE)\s+', '', regex=True, flags=re.IGNORECASE).str.strip()
        eureka_dre_data['IE - DRE'] = eureka_dre_data['IE - DRE'].replace({'La libertad': 'La Libertad', 'Ancash': 'Áncash'})

    if col_titulo_val and col_titulo_val in eureka_dre_data.columns:
        eureka_dre_data['titulo_limpio'] = eureka_dre_data[col_titulo_val].apply(limpiar_titulo)
        
    procesar_metrica_dre(eureka_dre_data, col_titulo_val, orden_dre, escale_data, eureka_data)
else:
    print(f"No se encontró el archivo DRE en {ruta_eureka_dre}. Omitiendo etapa DRE.")

print("\n¡Éxito absoluto! Todos los archivos JSON están listos.")
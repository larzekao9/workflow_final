"""
Script de poblado para Viva - Workflow Manager
Crea: formularios en nodos, trámites de ejemplo, workflow nuevo, docs Word/Excel
"""
import requests, json, os, sys, time
from datetime import datetime

BASE = "http://localhost/api"

# ── IDs existentes ────────────────────────────────────────────────────────────
COMPANY_ID   = "6a29bf47519cfc072fd2f2ab"
DEPT_ATENCION = "6a2ae51f2593e12cddbe3166"   # Atención al Cliente
DEPT_SOPORTE  = "6a2ae59d2593e12cddbe3167"   # Soporte Técnico
ROLE_RECEP    = "6a2ae5aa2593e12cddbe3168"   # Recepcionista
ROLE_TEC      = "6a2ae5b92593e12cddbe3169"   # Técnico de Soporte
USER_ADMIN    = "6a29bf1d519cfc072fd2f2aa"   # Admin Viva
USER_JUAN     = "6a2ae5da2593e12cddbe316a"   # Juan Pérez (Recepcionista)
USER_CARLOS   = "6a2ae5f22593e12cddbe316b"   # Carlos López (Técnico)
WF_INCIDENCIA = "6a2a2181519cfc072fd2f2ac"   # Workflow existente

# Nodos del workflow de incidencia
N_INICIO   = "6a2a218a519cfc072fd2f2ad"
N_RECEP    = "6a2a2191519cfc072fd2f2ae"
N_DIAG     = "6a2ae7bc2593e12cddbe316d"
N_DECISION = "6a2ae8622593e12cddbe3170"
N_CIERRE   = "6a2ae8db2593e12cddbe3172"
N_PROG     = "6a2aea4d0c92b72197936abc"

# Transiciones
T_INICIO_TO_RECEP   = "6a2a219e519cfc072fd2f2b0"
T_RECEP_TO_DIAG     = "6a2ae7c42593e12cddbe316e"
T_DIAG_TO_DEC       = "6a2ae86c2593e12cddbe3171"
T_DEC_ACEPTAR       = "6a2ae9d30c92b72197936ab8"
T_DEC_RECHAZAR      = "6a2aea520c92b72197936abd"
T_CIERRE_TO_FIN     = "6a2aea3f0c92b72197936abb"
T_PROG_TO_FIN       = "6a2aea9d0c92b72197936abf"

# ── Auth ──────────────────────────────────────────────────────────────────────
def login(email, password):
    r = requests.post(f"{BASE}/auth/login", json={"email": email, "password": password})
    r.raise_for_status()
    return r.json()["accessToken"]

def h(token):
    return {"Authorization": f"Bearer {token}"}

def post(url, token, body):
    r = requests.post(url, json=body, headers=h(token))
    if not r.ok:
        print(f"  ERROR {r.status_code}: {r.text[:200]}")
        return None
    return r.json()

def put(url, token, body):
    r = requests.put(url, json=body, headers=h(token))
    if not r.ok:
        print(f"  ERROR {r.status_code}: {r.text[:200]}")
        return None
    return r.json()

# ── Generar documentos de ejemplo ────────────────────────────────────────────
def gen_docs(out_dir="/tmp/viva_docs"):
    os.makedirs(out_dir, exist_ok=True)

    # Word - Reporte de Incidencia
    from docx import Document
    from docx.shared import Pt, RGBColor
    doc = Document()
    doc.add_heading("Reporte de Incidencia de Internet", 0)
    doc.add_paragraph(f"Fecha: {datetime.now().strftime('%d/%m/%Y')}")
    doc.add_heading("Datos del Cliente", 1)
    tabla = doc.add_table(rows=5, cols=2)
    tabla.style = "Table Grid"
    datos = [("Nombre","Juan García"),("Teléfono","71234567"),
             ("Dirección","Av. Arce 1234"),("Tipo de falla","Sin señal"),
             ("Plan","Fibra 100 Mbps")]
    for i,(k,v) in enumerate(datos):
        tabla.rows[i].cells[0].text = k
        tabla.rows[i].cells[1].text = v
    doc.add_heading("Descripción del Problema", 1)
    doc.add_paragraph("El cliente reporta pérdida total de conexión desde las 08:00 hrs. "
                      "Se verificó que el equipo enciende pero no conecta al servidor.")
    path_word = f"{out_dir}/reporte_incidencia.docx"
    doc.save(path_word)
    print(f"  Word: {path_word}")

    # Word - Contrato de Servicio
    doc2 = Document()
    doc2.add_heading("Contrato de Servicio de Internet", 0)
    doc2.add_paragraph("CONTRATO N° VS-2026-001")
    doc2.add_paragraph(f"Fecha de firma: {datetime.now().strftime('%d/%m/%Y')}")
    doc2.add_heading("Partes", 1)
    doc2.add_paragraph("PROVEEDOR: Viva S.A.\nCLIENTE: María López\nCI: 5678901")
    doc2.add_heading("Objeto del Contrato", 1)
    doc2.add_paragraph("Prestación del servicio de internet de banda ancha con velocidad "
                       "de 50 Mbps por un período de 12 meses.")
    doc2.add_heading("Cláusulas", 1)
    for i,c in enumerate([
        "El servicio será instalado en un plazo máximo de 5 días hábiles.",
        "El pago mensual es de Bs. 189 a realizarse los primeros 5 días de cada mes.",
        "Cualquier incumplimiento será notificado con 30 días de anticipación.",
    ],1):
        doc2.add_paragraph(f"{i}. {c}")
    path_contrato = f"{out_dir}/contrato_servicio.docx"
    doc2.save(path_contrato)
    print(f"  Word: {path_contrato}")

    # Excel - Reporte de Diagnóstico
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Diagnóstico Técnico"
    ws.column_dimensions["A"].width = 30
    ws.column_dimensions["B"].width = 40

    header_fill = PatternFill("solid", fgColor="6366F1")
    header_font = Font(bold=True, color="FFFFFF")
    ws["A1"] = "Reporte de Diagnóstico Técnico"
    ws.merge_cells("A1:B1")
    ws["A1"].font = Font(bold=True, size=14)
    ws["A1"].alignment = Alignment(horizontal="center")

    ws["A3"] = "Campo"; ws["B3"] = "Valor"
    ws["A3"].font = header_font; ws["A3"].fill = header_fill
    ws["B3"].font = header_font; ws["B3"].fill = header_fill

    rows = [
        ("Técnico asignado","Carlos López"),
        ("Fecha diagnóstico", datetime.now().strftime('%d/%m/%Y %H:%M')),
        ("Tipo de falla","Pérdida de señal ONT"),
        ("Equipo afectado","Router ZTE F660"),
        ("Número de serie","ZTE2024ABC123"),
        ("Resultado diagnóstico","Falla en splitter de distribución"),
        ("Solución aplicada","Reemplazo de splitter y reconfiguración"),
        ("Tiempo de atención (min)","45"),
        ("¿Requiere visita técnica?","No"),
        ("Estado final","Resuelto"),
    ]
    for i,(k,v) in enumerate(rows, 4):
        ws[f"A{i}"] = k
        ws[f"B{i}"] = v

    path_excel = f"{out_dir}/diagnostico_tecnico.xlsx"
    wb.save(path_excel)
    print(f"  Excel: {path_excel}")

    # Excel - Listado de trámites
    wb2 = openpyxl.Workbook()
    ws2 = wb2.active
    ws2.title = "Trámites"
    headers = ["Código","Título","Estado","Workflow","Responsable","Fecha"]
    for col, h_text in enumerate(headers, 1):
        cell = ws2.cell(1, col, h_text)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill("solid", fgColor="6366F1")
    tramites_data = [
        ("TR-001","Falla internet edificio Norte","EN_PROGRESO","Atención de Incidencia","Juan Pérez","11/06/2026"),
        ("TR-002","Sin señal en oficina central","PENDIENTE","Atención de Incidencia","Juan Pérez","11/06/2026"),
        ("TR-003","Velocidad muy baja - piso 3","COMPLETADO","Atención de Incidencia","Carlos López","10/06/2026"),
    ]
    for row, data in enumerate(tramites_data, 2):
        for col, val in enumerate(data, 1):
            ws2.cell(row, col, val)
    for col in range(1,7):
        ws2.column_dimensions[openpyxl.utils.get_column_letter(col)].width = 25
    path_excel2 = f"{out_dir}/listado_tramites.xlsx"
    wb2.save(path_excel2)
    print(f"  Excel: {path_excel2}")

    return path_word, path_contrato, path_excel, path_excel2

# ── 1. Crear formularios en los nodos existentes ─────────────────────────────
def crear_formularios(token):
    print("\n[1] Creando formularios en nodos del workflow de incidencia...")

    forms = [
        {
            "nodoId": N_RECEP,
            "workflowId": WF_INCIDENCIA,
            "title": "Recepción de Incidencia",
            "fields": [
                {"name": "Nombre del cliente",     "type": "text",     "order": 1},
                {"name": "Teléfono",               "type": "text",     "order": 2},
                {"name": "Dirección",              "type": "text",     "order": 3},
                {"name": "Tipo de falla",          "type": "text",     "order": 4},
                {"name": "Descripción del problema","type": "TEXT",     "order": 5},
                {"name": "Adjuntar evidencia",     "type": "file",     "order": 6},
            ]
        },
        {
            "nodoId": N_DIAG,
            "workflowId": WF_INCIDENCIA,
            "title": "Diagnóstico Técnico",
            "fields": [
                {"name": "Tipo de falla técnica",     "type": "text",     "order": 1},
                {"name": "Equipo afectado",           "type": "text",     "order": 2},
                {"name": "Número de serie",           "type": "text",     "order": 3},
                {"name": "Resultado del diagnóstico", "type": "TEXT", "order": 4},
                {"name": "¿Requiere visita técnica?", "type": "text",     "order": 5},
                {"name": "Reporte técnico",           "type": "file",     "order": 6},
            ]
        },
        {
            "nodoId": N_CIERRE,
            "workflowId": WF_INCIDENCIA,
            "title": "Cierre de Incidencia",
            "fields": [
                {"name": "Solución aplicada",        "type": "TEXT", "order": 1},
                {"name": "Tiempo de resolución (min)","type": "text",    "order": 2},
                {"name": "Observaciones finales",    "type": "TEXT", "order": 3},
                {"name": "Satisfacción del cliente", "type": "text",     "order": 4},
            ]
        },
        {
            "nodoId": N_PROG,
            "workflowId": WF_INCIDENCIA,
            "title": "Programación de Visita Técnica",
            "fields": [
                {"name": "Fecha de visita",           "type": "text", "order": 1},
                {"name": "Hora de visita",            "type": "text", "order": 2},
                {"name": "Técnico asignado",          "type": "text", "order": 3},
                {"name": "Materiales requeridos",     "type": "TEXT", "order": 4},
                {"name": "Observaciones",             "type": "TEXT", "order": 5},
            ]
        },
    ]

    for f in forms:
        r = post(f"{BASE}/forms", token, f)
        status = "OK" if r else "ERROR"
        print(f"  {status}: Form '{f['title']}'")
    return True

# ── 2. Crear trámites de ejemplo ──────────────────────────────────────────────
def crear_tramites(token):
    print("\n[2] Creando trámites de ejemplo...")

    tramites = [
        # Trámite 1: queda en Recepción (PENDIENTE)
        {
            "workflowId": WF_INCIDENCIA,
            "title": "Sin internet - Edificio Norte piso 2",
            "description": "Cliente reporta pérdida total de conexión",
            "formData": {
                "Nombre del cliente": "Roberto Mamani",
                "Teléfono": "71234567",
                "Dirección": "Av. Arce 1234 Piso 2",
                "Tipo de falla": "Sin señal",
                "Descripción del problema": "Sin internet desde las 8am, equipo con luz roja",
            },
            "autoTransitionIds": [T_INICIO_TO_RECEP],
        },
        # Trámite 2: avanza a Diagnóstico Técnico (EN_PROGRESO)
        {
            "workflowId": WF_INCIDENCIA,
            "title": "Velocidad muy baja - Oficina Central",
            "description": "Velocidad bajó de 100 a 2 Mbps",
            "formData": {
                "Nombre del cliente": "Ana Quispe",
                "Teléfono": "79876543",
                "Dirección": "Calle Loayza 456",
                "Tipo de falla": "Velocidad baja",
                "Descripción del problema": "La velocidad bajó drásticamente ayer en la tarde",
            },
            "autoTransitionIds": [T_INICIO_TO_RECEP, T_RECEP_TO_DIAG],
        },
        # Trámite 3: avanza a Diagnóstico Técnico
        {
            "workflowId": WF_INCIDENCIA,
            "title": "Corte intermitente - Zona Sur",
            "description": "El servicio se corta cada 30 minutos",
            "formData": {
                "Nombre del cliente": "Carlos Flores",
                "Teléfono": "76543210",
                "Dirección": "Zona Sur Calle 5 #89",
                "Tipo de falla": "Intermitencia",
                "Descripción del problema": "Corte cada 30 min aproximadamente, se reinicia solo",
            },
            "autoTransitionIds": [T_INICIO_TO_RECEP, T_RECEP_TO_DIAG],
        },
        # Trámite 4: llega a Cierre (resuelto)
        {
            "workflowId": WF_INCIDENCIA,
            "title": "Sin internet - Edificio Sur",
            "description": "Falla en splitter de distribución",
            "formData": {
                "Nombre del cliente": "María López",
                "Teléfono": "72345678",
                "Dirección": "Edificio Sur Torre B",
                "Tipo de falla": "Sin señal",
                "Descripción del problema": "Falla total desde ayer",
            },
            "autoTransitionIds": [T_INICIO_TO_RECEP, T_RECEP_TO_DIAG, f"{T_DIAG_TO_DEC}>>{T_DEC_ACEPTAR}"],
        },
        # Trámite 5: programación de visita
        {
            "workflowId": WF_INCIDENCIA,
            "title": "Requiere visita técnica - Zona Norte",
            "description": "Falla física, requiere intervención en campo",
            "formData": {
                "Nombre del cliente": "Pedro Chávez",
                "Teléfono": "78901234",
                "Dirección": "Zona Norte Av. 6 de Agosto",
                "Tipo de falla": "Falla física",
                "Descripción del problema": "Cable dañado visible desde la calle",
            },
            "autoTransitionIds": [T_INICIO_TO_RECEP, T_RECEP_TO_DIAG, f"{T_DIAG_TO_DEC}>>{T_DEC_RECHAZAR}"],
        },
    ]

    created = []
    for t in tramites:
        r = post(f"{BASE}/tramites/submit", token, t)
        if r:
            tid = r.get("id","?")
            code = r.get("code","?")
            status = r.get("status","?")
            nodo = r.get("currentNodoName","?")
            print(f"  OK: [{code}] '{t['title']}' → {status} / {nodo}")
            created.append(r)
        time.sleep(0.3)
    return created

# ── 3. Crear nuevo workflow "Gestión de Contratos" ───────────────────────────
def crear_workflow_contratos(token):
    print("\n[3] Creando workflow 'Gestión de Contratos de Servicio'...")

    # Crear workflow
    wf = post(f"{BASE}/workflows", token, {
        "name": "Gestión de Contratos de Servicio",
        "description": "Proceso para la contratación de planes de internet: desde la solicitud "
                       "del cliente hasta la activación del servicio, incluyendo verificación "
                       "de cobertura, firma de contrato y habilitación técnica.",
        "companyId": COMPANY_ID,
    })
    if not wf: return None
    WF_ID = wf["id"]
    print(f"  Workflow creado: {WF_ID}")

    # Crear nodos (con posiciones para el diagrama visual)
    def nodo(name, ntype, dept=None, role=None, order=1, avg=30, x=0.0, y=0.0):
        return post(f"{BASE}/workflow-nodos", token, {
            "workflowId": WF_ID,
            "name": name, "nodeType": ntype, "order": order,
            "responsibleDepartmentId": dept, "responsibleJobRoleId": role,
            "avgMinutes": avg, "requiresForm": ntype == "proceso",
            "posX": x, "posY": y,
        })

    n_inicio  = nodo("Inicio",                    "inicio",   order=1,  x=100,  y=250)
    n_sol     = nodo("Solicitud de Contrato",      "proceso",  DEPT_ATENCION, ROLE_RECEP,  2, 30,  x=280,  y=250)
    n_ver     = nodo("Verificación de Cobertura",  "proceso",  DEPT_SOPORTE,  ROLE_TEC,    3, 60,  x=500,  y=250)
    n_dec     = nodo("¿Tiene cobertura?",          "decision", order=4,  x=720,  y=250)
    n_firma   = nodo("Firma de Contrato",          "proceso",  DEPT_ATENCION, ROLE_RECEP,  5, 20,  x=940,  y=130)
    n_activ   = nodo("Activación del Servicio",    "proceso",  DEPT_SOPORTE,  ROLE_TEC,    6, 90,  x=1160, y=130)
    n_fin_ok  = nodo("Servicio Activado",          "fin",      order=7,  x=1380, y=130)
    n_notif   = nodo("Notificación Sin Cobertura", "proceso",  DEPT_ATENCION, ROLE_RECEP,  8, 15,  x=940,  y=380)
    n_fin_no  = nodo("Sin Cobertura - Cerrado",    "fin",      order=9,  x=1160, y=380)

    nodes = {k:v for k,v in {
        "inicio":n_inicio,"solicitud":n_sol,"verificacion":n_ver,
        "decision":n_dec,"firma":n_firma,"activacion":n_activ,
        "fin_ok":n_fin_ok,"notif":n_notif,"fin_no":n_fin_no
    }.items() if v}
    print(f"  Nodos creados: {len(nodes)}/9")

    # Crear transiciones
    def trans(from_id, to_id, name=""):
        return post(f"{BASE}/workflow-transitions", token, {
            "workflowId": WF_ID,
            "fromNodoId": from_id, "toNodoId": to_id, "name": name
        })

    req = ["inicio","solicitud","verificacion","decision","firma","activacion","fin_ok","notif","fin_no"]
    if all(k in nodes for k in req):
        trans(nodes["inicio"]["id"],       nodes["solicitud"]["id"])
        trans(nodes["solicitud"]["id"],    nodes["verificacion"]["id"])
        trans(nodes["verificacion"]["id"], nodes["decision"]["id"])
        trans(nodes["decision"]["id"],     nodes["firma"]["id"],    "Tiene cobertura")
        trans(nodes["decision"]["id"],     nodes["notif"]["id"],    "Sin cobertura")
        trans(nodes["firma"]["id"],        nodes["activacion"]["id"])
        trans(nodes["activacion"]["id"],   nodes["fin_ok"]["id"])
        trans(nodes["notif"]["id"],        nodes["fin_no"]["id"])
        print("  Transiciones creadas: 8")

    # Crear formularios para cada nodo proceso
    if "solicitud" in nodes:
        post(f"{BASE}/forms", token, {
            "nodoId": nodes["solicitud"]["id"], "workflowId": WF_ID,
            "title": "Solicitud de Contrato",
            "fields": [
                {"name": "Nombre del cliente",    "type": "text",     "order": 1},
                {"name": "CI / RUT",              "type": "text",     "order": 2},
                {"name": "Teléfono de contacto",  "type": "text",     "order": 3},
                {"name": "Dirección de instalación","type": "text",   "order": 4},
                {"name": "Plan solicitado",        "type": "text",     "order": 5},
                {"name": "Fecha requerida",        "type": "text",     "order": 6},
                {"name": "Observaciones",          "type": "TEXT", "order": 7},
            ]
        })
    if "verificacion" in nodes:
        post(f"{BASE}/forms", token, {
            "nodoId": nodes["verificacion"]["id"], "workflowId": WF_ID,
            "title": "Verificación de Cobertura",
            "fields": [
                {"name": "¿Tiene cobertura?",          "type": "text",     "order": 1},
                {"name": "Tipo de infraestructura",    "type": "text",     "order": 2},
                {"name": "Velocidad máxima disponible","type": "text",     "order": 3},
                {"name": "Distancia a nodo más cercano","type": "text",    "order": 4},
                {"name": "Observaciones técnicas",     "type": "TEXT", "order": 5},
                {"name": "Informe de cobertura",       "type": "file",     "order": 6},
            ]
        })
    if "firma" in nodes:
        post(f"{BASE}/forms", token, {
            "nodoId": nodes["firma"]["id"], "workflowId": WF_ID,
            "title": "Firma de Contrato",
            "fields": [
                {"name": "Número de contrato",  "type": "text",  "order": 1},
                {"name": "Plan contratado",     "type": "text",  "order": 2},
                {"name": "Monto mensual (Bs.)", "type": "text",  "order": 3},
                {"name": "Fecha de firma",      "type": "text",  "order": 4},
                {"name": "Duración (meses)",    "type": "text",  "order": 5},
                {"name": "Contrato firmado",    "type": "file",  "order": 6},
            ]
        })
    if "activacion" in nodes:
        post(f"{BASE}/forms", token, {
            "nodoId": nodes["activacion"]["id"], "workflowId": WF_ID,
            "title": "Activación del Servicio",
            "fields": [
                {"name": "Fecha de activación",   "type": "text", "order": 1},
                {"name": "IP asignada",           "type": "text", "order": 2},
                {"name": "Equipo instalado",      "type": "text", "order": 3},
                {"name": "Número de serie",       "type": "text", "order": 4},
                {"name": "Velocidad medida (Mbps)","type": "text","order": 5},
                {"name": "Prueba de conexión OK", "type": "text", "order": 6},
            ]
        })
    # Formulario para nodo notificación
    if "notif" in nodes:
        post(f"{BASE}/forms", token, {
            "nodoId": nodes["notif"]["id"], "workflowId": WF_ID,
            "title": "Notificación Sin Cobertura",
            "fields": [
                {"name": "Motivo de rechazo",       "type": "TEXT", "order": 1},
                {"name": "Alternativas ofrecidas",  "type": "TEXT", "order": 2},
                {"name": "Fecha de notificación",   "type": "DATE", "order": 3},
            ]
        })
    print("  Formularios creados: 5")
    return WF_ID

# ── MAIN ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-docs",     action="store_true")
    parser.add_argument("--skip-forms",    action="store_true")
    parser.add_argument("--skip-tramites", action="store_true")
    parser.add_argument("--skip-workflow", action="store_true")
    parser.add_argument("--delete-wf",    default=None, help="Delete orphaned workflow before creating")
    args = parser.parse_args()

    print("=" * 60)
    print("SEED VIVA - Workflow Manager")
    print("=" * 60)

    token = login("admin@viva.com", "12345")
    print(f"Login OK: admin@viva.com")

    if args.delete_wf:
        r = requests.delete(f"{BASE}/workflows/{args.delete_wf}", headers=h(token))
        print(f"  Deleted orphaned workflow {args.delete_wf}: {r.status_code}")

    if not args.skip_docs:
        print("\n[0] Generando documentos Word/Excel...")
        docs = gen_docs()
    else:
        print("\n[0] Documentos: omitido")
        docs = []

    if not args.skip_forms:
        crear_formularios(token)
    else:
        print("\n[1] Formularios: omitido")

    tramites = []
    if not args.skip_tramites:
        tramites = crear_tramites(token)
    else:
        print("\n[2] Trámites: omitido")

    wf_id = None
    if not args.skip_workflow:
        wf_id = crear_workflow_contratos(token)
    else:
        print("\n[3] Workflow contratos: omitido")

    print("\n" + "=" * 60)
    print("RESUMEN")
    print("=" * 60)
    print(f"  Documentos generados: 4 (en /tmp/viva_docs/)")
    print(f"  Formularios creados:  4 (workflow de incidencia)")
    print(f"  Trámites creados:     {len(tramites)}")
    print(f"  Workflow nuevo:       Gestión de Contratos ({wf_id})")
    print("\nListo! Recargá la app.")

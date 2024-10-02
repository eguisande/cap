namespace com.aysa.pgo;

using {
    cuid,
    managed
} from '@sap/cds/common';

@Core.AutoExpand
entity Obras : cuid, managed {
    p3                                     : Composition of many P3
                                                 on p3.obra = $self;
    nombre                                 : String;
    estado                                 : Association to EstadosGeneral;
    estado_original                        : Association to EstadosGeneral;
    nro_contrato                           : String;
    representante                          : String;
    telefono                               : String;
    correo                                 : String;
    representante_tecnico                  : String;
    nro_matricula                          : String;
    apoderado                              : String;
    incremento_maximo                      : Decimal;
    descuento_monto_contrato               : Decimal;
    monto_original_contrato                : Decimal;
    responsables                           : Composition of many Responsables
                                                 on responsables.obra = $self;
    plazo_ejecucion                        : Integer;
    um_plazo                               : Association to UMGeneral;
    maximo_plazo_extension                 : Integer;
    um_plazo_maximo                        : Association to UMGeneral;
    fondo_reparo                           : Decimal;
    financiamiento_obra                    : Association to Financiamientos;
    nro_poliza                             : String;
    extendida_por                          : String;
    porcentaje_cobertura                   : Decimal;
    proyecto_inversion                     : String;
    ordenes_compra                         : Composition of many OrdenesCompra
                                                 on ordenes_compra.obra = $self;
    estado_datos_contratista               : Association to EstadosGeneral;
    contratista                            : Composition of many ContratistaObra
                                                 on contratista.obra = $self;

    oferta                                 : Composition of many Ofertas
                                                 on oferta.obra = $self;
    preconstruccion                        : Association to Preconstrucciones;
    fecha_firma                            : Date;

    certificado_poliza                     : Composition of many CertificadosPolizas
                                                 on certificado_poliza.obra = $self;

    moneda                                 : Association to Monedas;
    plan_trabajo                           : Composition of many PlanesTrabajo
                                                 on plan_trabajo.obra = $self;

    certificados_control_polizas           : Composition of many CertificadosControlPolizas
                                                 on certificados_control_polizas.obra = $self;
    vtv                                    : Composition of many VTV
                                                 on vtv.obra = $self;
    licencias_conducir                     : Composition of many LicenciasConducir
                                                 on licencias_conducir.obra = $self;
    cedulas                                : Composition of many Cedulas
                                                 on cedulas.obra = $self;
    registros_especiales                   : Composition of many RegistrosEspeciales
                                                 on registros_especiales.obra = $self;


    controles_personal                     : Composition of many ControlesPersonal
                                                 on controles_personal.obra = $self;


    presentacionesSH                       : Composition of many PresentacionesSH
                                                 on presentacionesSH.obra = $self;
    fecha_inicio_contractual               : Date;
    fecha_inicio_fisico                    : Date;
    fecha_fin_obra_fisico_anterior         : Date;
    fecha_fin_contractual_original         : Date;
    fecha_fin_contractual_original_vigente : Date;
    fecha_fin_contractual_vigente_anterior : Date;
    fecha_fin_obra_fisico                  : Date;
    fecha_recepcion_provisoria             : Date;
    fecha_recepcion_definitiva             : Date;
    fecha_puesta_servicio                  : Date;
    fecha_cao_visita_cliente               : Date;
    fecha_transferencia                    : Date;
    fecha_habilitacion                     : Date;
    fecha_recision                         : Date;
}

entity P3 : cuid, managed {
    nombre              : String;
    codigo              : String;
    tipo_obra           : Association to TiposObras;
    tipo_contrato       : Association to TiposContratos;
    fluido              : Association to Fluidos;
    partido             : Association to Partidos;
    sistema             : Association to Sistemas;
    obra                : Association to Obras;
    acumar              : Boolean default false;
    acopio_materiales   : Boolean default false;
    anticipo_financiero : Decimal;
    importes            : Composition of many ImportesP3
                              on importes.p3 = $self;
    notas_minuta        : Composition of many NotasMinuta
                              on notas_minuta.p3 = $self;
    nota_pedido         : Composition of many NotasPedido
                              on nota_pedido.p3 = $self;
    orden_servicio      : Composition of many OrdenesServicio
                              on orden_servicio.p3 = $self;
    pi                  : Composition of many ObraPI
                              on pi.p3 = $self;
}

entity OrdenesCompra : cuid {
    obra              : Association to Obras;
    nro_oc            : String;
    moneda            : Association to Monedas;
    tipo_cambio       : Decimal;
    no_redetermina    : Boolean default false;
    revision          : Integer;
    fecha             : Date;
    fecha_vencimiento : Date;
}

entity ImportesP3 : cuid {
    p3                     : Association to P3;
    moneda                 : Association to Monedas;
    tipo_cambio            : Decimal;
    importe                : Decimal;
    porcentaje_ponderacion : Decimal;
    importe_ars            : Decimal
}


entity ResponsablesPI : cuid {
    pi           : Association to ObraPI;
    responsables : Association to Responsables;
}

entity Responsables : cuid {
    obra        : Association to Obras;
    direccion   : Association to Direcciones;
    gerencia    : Association to Gerencias;
    inspectores : Composition of many InspectoresResponsables
                      on inspectores.responsable = $self;
}

entity PlanosInterferencias : cuid, managed {
    pi            : Association to ObraPI;
    nro_plano     : Integer;
    documento     : String;
    fecha_carga   : Date;
    estado        : Association to EstadosGeneral;
    observaciones : String;
}


entity ProgramasCateos : cuid, managed {
    pi            : Association to ObraPI;
    nro_programa  : Integer;
    documento     : String;
    fecha_carga   : Date;
    estado        : Association to EstadosGeneral;
    observaciones : String;

}

entity InformesCateo : cuid, managed {
    pi                   : Association to ObraPI;
    programa_cateo       : Association to ProgramasCateos;
    tramo                : Association to Tramos;
    nro_informe          : Integer;
    estado               : Association to EstadosGeneral;
    fecha_carga          : Date;
    fecha_cateo          : Date;
    fecha_apertura       : Date;
    fecha_relleno        : Date;
    diametro             : Decimal;
    um_diametro          : Association to UMInterferencias;
    longitud             : Decimal;
    um_longitud          : Association to UMInterferencias;
    material_encontrado  : String;
    diametro_exterior    : Decimal;
    um_diametro_exterior : Association to UMInterferencias;
    servicio             : Association to ServiciosInterferencias;
    nivel_napa           : Decimal;
    um_nivel_napa        : Association to UMInterferencias;
    calidad_tipo_suelo   : String;
    canieria             : String;
    edad                 : String;
    empalme              : String;
    nudo                 : String;
    croquis_pdf          : String;
    observaciones        : String;
    adjuntos             : Composition of many InformesCateoAdjuntos
                               on adjuntos.informe_cateo = $self;
}

entity InformesCateoAdjuntos : cuid, managed {
    informe_cateo : Association to InformesCateo;
    adjunto       : String;
}

entity DocumentacionesAdicionales : cuid, managed {
    pi            : Association to ObraPI;
    documento     : String;
    fecha_carga   : Date;
    estado        : Association to EstadosGeneral;
    observaciones : String;
}

entity PermisosTramo : cuid, DatosPermisosEstructura {
    pi                                    : Association to ObraPI;
    direccion                             : String;
    /*
    documentos                            : Composition of many PermisosDocumentos
                                                on documentos.permiso = $self;
    */


    nro_expediente_ID                     : String;
    permiso_contingencia_ID               : String;
    permiso_emergencia_ID                 : String;
    nro_apliacion_ID                      : String;
    permiso_programado_ID                 : String;
    carga_cierre_ID                       : String;
    fecha_generacion_expediente           : Date;
    fecha_generacion_permiso_contingencia : Date;
    fecha_generacion_nro_apliacion        : Date;
    fecha_generacion_permiso_emergencia   : Date;
    fecha_generacion_carga_cierre         : Date;
    fecha_generacion_permiso_programado   : Date;
    permisos_tramo_documento              : Composition of many PermisosTramoDocumentos
                                                on permisos_tramo_documento.permiso_tramo = $self;

}

entity PermisosMunicipales : cuid, DatosPermisosEstructura {
    pi                           : Association to ObraPI;
    permisos_municipal_documento : Composition of many PermisosMunicipalesDocumentos
                                       on permisos_municipal_documento.permiso_municipal = $self;
}

entity PermisosEspeciales : cuid, DatosPermisosEstructura {
    pi                          : Association to ObraPI;
    permisos_especial_documento : Composition of many PermisosEspecialesDocumentos
                                      on permisos_especial_documento.permiso_especial = $self;
}

entity PermisosTramoDocumentos : cuid, PermisosDocumentoEstructura {
    permiso_tramo      : Association to PermisosTramo;
    estado_subsanacion : Association to EstadosGeneral;
    motivo_rechazo     : String;
}

entity PermisosMunicipalesDocumentos : cuid, PermisosDocumentoEstructura {
    permiso_municipal  : Association to PermisosMunicipales;
    estado_subsanacion : Association to EstadosGeneral;
}

entity PermisosEspecialesDocumentos : cuid, PermisosDocumentoEstructura {
    permiso_especial   : Association to PermisosEspeciales;
    estado_subsanacion : Association to EstadosGeneral;
}

/*
entity PermisosDocumentos : cuid {
    obra      : Association to Obras;
    permiso   : Association to PermisosTramo;
    documento : Association to PermisosCatalogoDocumentos;
    archivo   : String;
    estado    : Association to EstadosGeneral;
}
*/
entity PermisosCatalogoDocumentos : cuid, managed {
    tipo_permiso : Association to TiposPermiso;
    ente         : Association to Entes;
    documento    : String;
    responsable  : Association to Entregas;
}

entity Presentaciones : cuid, managed {
    pi               : Association to ObraPI;
    nro_presentacion : Integer;
    cantidad_planos  : Integer;
    descripcion      : String;
    fecha_envio      : Date;
    observaciones    : String;
    estado           : Association to EstadosGeneral;
    informe          : String;
    planos           : Composition of many Planos
                           on planos.presentacion = $self;
    ordenes          : Composition of many OrdenPresentacion
                           on ordenes.presentacion = $self;
    notas            : Composition of many NotaPresentacion
                           on notas.presentacion = $self;
}

entity PresentacionesSH : cuid, managed {
    obra               : Association to Obras;
    nro_presentacion   : Integer;
    grupo              : Association to GrupoArea;
    descripcion        : String;
    fecha_vencimiento  : Date;
    estado_vencimiento : Association to EstadosGeneral;
    estado             : Association to EstadosGeneral;
    archivo_permiso    : String;
    observaciones      : String;
    permiso_pdf        : String;
    documentos         : Composition of many DocumentosSH
                             on documentos.presentacion = $self;
    permiso            : Composition of many PermisosSH
                             on permiso.presentacion = $self;
}

entity DocumentosSH : cuid, managed {
    presentacion      : Association to PresentacionesSH;
    nombre_archivo    : String;
    descripcion       : String;
    pi                : Association to ObraPI;
    fecha_entrega     : Date;
    fecha_vencimiento : Date;
    estado            : Association to EstadosGeneral;
    observaciones     : String;
    documento         : Association to CatalogoDocumentos;
    aprobadores       : Composition of many AprobadoresDocumentoSH
                            on aprobadores.documentossh = $self;
}

entity PermisosSH : cuid, managed {
    presentacion        : Association to PresentacionesSH;
    descripcion         : String;
    fecha_presentacion  : Date;
    fecha_desde         : Date;
    fecha_hasta         : Date;
    fecha_vencimiento   : Date;
    ley_19587           : Boolean default false;
    ley_24557           : Boolean default false;
    dec_911             : Boolean default false;
    espacios_confinados : Boolean default false;
    resol_051           : Boolean default false;
    resol_035           : Boolean default false;
    resol_319           : Boolean default false;
    legajo_tecnico      : Boolean default false;
    envelopeId          : UUID;
}

entity Planos : cuid, managed {
    presentacion   : Association to Presentaciones;
    p3             : String;
    especialidad   : Association to Especialidades;
    tipo           : Association to TipoDocumentosPlano;
    contratista    : Association to Contratistas;
    orden          : Integer;
    revision       : Integer;
    descripcion    : String;
    calificacion   : Association to Calificaciones;
    calificado_por : String;
    observaciones  : String;
    adjunto        : String;
    plano_original : Association to Planos;
    ruta           : String;
}

entity NotaDocumentoAdjunto : cuid, managed {
    nota_pedido : Association to NotasPedido;
    documento   : Association to DocumentosAdjunto;
}

entity OrdenDocumentoAdjunto : cuid, managed {
    orden_servicio : Association to OrdenesServicio;
    documento      : Association to DocumentosAdjunto;
}

entity NotaPresentacion : cuid, managed {
    nota_pedido  : Association to NotasPedido;
    presentacion : Association to Presentaciones;
}

entity OrdenPresentacion : cuid, managed {
    orden_servicio : Association to OrdenesServicio;
    presentacion   : Association to Presentaciones;
}

entity NotaPartidimetro : cuid, managed {
    nota_pedido  : Association to NotasPedido;
    partidimetro : Association to Partidimetros;
}

entity OrdenPartidimetro : cuid, managed {
    orden_servicio : Association to OrdenesServicio;
    partidimetro   : Association to Partidimetros;
}

entity NotaPlanTrabajo : cuid, managed {
    nota_pedido  : Association to NotasPedido;
    plan_trabajo : Association to PlanesTrabajo;
}

entity OrdenPlanTrabajo : cuid, managed {
    orden_servicio : Association to OrdenesServicio;
    plan_trabajo   : Association to PlanesTrabajo;
}


entity PlanesTrabajo : cuid, managed {
    obra               : Association to Obras;
    nro_plan           : Integer;
    subnro             : Integer;
    estado             : Association to EstadosGeneral;
    estado_original    : Association to EstadosGeneral;
    fecha_creacion     : Date;
    cantidad_tareas    : Integer;
    fecha_inicio       : Date;
    fecha_fin          : Date;
    fecha_fin_anterior : Date;
    fecha_envio        : Date;
    observaciones      : String;
    codigo             : Association to CodigosPDT;
    tareas             : Composition of many TareasPlanTrabajo
                             on tareas.plan_trabajo = $self;
    aprobadores        : Composition of many AprobadoresPlanDeTrabajo
                             on aprobadores.plan_trabajo = $self;
}

entity CodigosPDT : IdDescripcion {}

entity TareasPlanTrabajo : cuid, managed {
    acta_suspension          : Composition of many ActasSuspensionTarea
                                   on acta_suspension.tarea = $self;
    suspendida               : Boolean default false;
    plan_trabajo             : Association to PlanesTrabajo;
    padre                    : String;
    partidimetro             : Association to Partidimetros;
    nro                      : String;
    nombre_tarea             : String;
    cantidad                 : Integer;
    cantidadpartida          : Integer;
    unidad_medida            : Association to UnidadesMedidaMateriales;
    unidad_medida_partida    : String;
    duracion_planificada     : Integer;
    comienzo_planificado     : Date;
    fin_planificado          : Date;
    fin_planificado_anterior : Date;
    comienzo_real            : Date;
    fin_real                 : Date;
    duracion_real            : Integer;
    desviacion_duracion      : Integer;
    avance_planificado       : Integer;
    avance_real              : Integer;
    estado_tarea             : String;
    desempenio_tarea         : Association to DesempenioTareaPlanTrabajo;
    partidimetros            : Association to ObraPI;
    cantidad_plan_trabajo    : Integer;
    codigo                   : String;
    subcodigo                : Association to SubcodigosTareaPlanTrabajo;
    pi                       : Association to ObraPI;
    predecesora              : String;
    inspector                : Association to Inspectores;
    estado_aprobacion        : Association to EstadosGeneral;
    estado_suspension        : Association to EstadosGeneral;
    estado_original          : Association to EstadosGeneral;
    tramo                    : Association to Tramos;
}

entity SubcodigosTareaPlanTrabajo : IdDescripcion {}

entity DesempenioTareaPlanTrabajo : IdDescripcion {
    desde : Integer;
    hasta : Integer;
    color : String;
}

entity CertificadosPolizas : cuid, managed {
    obra              : Association to Obras;
    estado            : Association to EstadosGeneral;
    fecha_emision     : Date;
    fecha_vencimiento : Date;
    adjunto           : String;
}

entity NotasPedido : cuid, managed {
    pi                 : Association to ObraPI;
    p3                 : Association to P3;
    orden_servicio     : Association to OrdenesServicio;
    respuestas         : Composition of many OrdenesServicio
                             on respuestas.respuesta = $self;
    nro_nota_pedido    : Integer;
    fecha_creacion     : Date;
    estado             : Association to EstadosGeneral;
    referencia         : Association to Referencias;
    responsable        : String;
    asunto             : String;
    descripcion        : String;
    fecha_envio        : Date;
    requiere_respuesta : Boolean default false;
    anexos             : Composition of many AnexosNotasPedido
                             on anexos.nota_pedido = $self;

    presentacion       : Composition of many NotaPresentacion
                             on presentacion.nota_pedido = $self;

    documento_adjunto  : Composition of many NotaDocumentoAdjunto
                             on documento_adjunto.nota_pedido = $self;

    nota_partidimetro  : Composition of many NotaPartidimetro
                             on nota_partidimetro.nota_pedido = $self;

    nota_plan_trabajo  : Composition of many NotaPlanTrabajo
                             on nota_plan_trabajo.nota_pedido = $self;

    area               : Association to Areas;
    envelopeId         : UUID;
}

entity AnexosNotasPedido : cuid, managed {
    nota_pedido    : Association to NotasPedido;
    nombre_archivo : String;
}

entity OrdenesServicio : cuid, managed {
    pi                        : Association to ObraPI;
    p3                        : Association to P3;
    nro_orden_servicio        : Integer;
    estado                    : Association to EstadosGeneral;
    fecha_creacion            : Date;
    referencia                : Association to Referencias;
    asunto                    : String;
    fecha_envio               : Date;
    descripcion               : String;
    requiere_respuesta        : Boolean default false;
    requiere_plazo            : Boolean default false;
    plazo_respuesta           : Date;
    firma_digital             : String;
    firma_digital_contratista : String;
    fecha_recepcion           : Date;
    emisor                    : String;
    anexo                     : Composition of many AnexosOrdenes
                                    on anexo.orden_servicio = $self;
    respuesta                 : Association to NotasPedido;
    nota_pedido               : Composition of many NotasPedido
                                    on nota_pedido.orden_servicio = $self;
    presentacion              : Composition of many OrdenPresentacion
                                    on presentacion.orden_servicio = $self;
    documento_adjunto         : Composition of many OrdenDocumentoAdjunto
                                    on documento_adjunto.orden_servicio = $self;
    orden_partidimetro        : Composition of many OrdenPartidimetro
                                    on orden_partidimetro.orden_servicio = $self;
    orden_plan_trabajo        : Composition of many OrdenPlanTrabajo
                                    on orden_plan_trabajo.orden_servicio = $self;
    area                      : Association to Areas;
    envelopeId                : UUID;
    fecha_inicio_contractual  : Date;
    fecha_inicio_fisico       : Date;
}

entity AnexosOrdenes : cuid, managed {
    orden_servicio : Association to OrdenesServicio;
    nombre_archivo : String;
}

entity ObraPI : cuid, managed {
    permisos                              : Composition of many PermisosTramo
                                                on permisos.pi = $self;
    pi                                    : String;
    p3                                    : Association to P3;
    monto                                 : Decimal;
    moneda                                : Association to Monedas;
    tareas_plan_trabajo                   : Composition of many TareasPlanTrabajo
                                                on tareas_plan_trabajo.pi = $self;
    permisos_municipales                  : Composition of many PermisosMunicipales
                                                on permisos_municipales.pi = $self;
    permisos_especiales                   : Composition of many PermisosEspeciales
                                                on permisos_especiales.pi = $self;
    aprobadores_documento_preconstruccion : Composition of many AprobadoresDocumentoPreconstruccion
                                                on aprobadores_documento_preconstruccion.pi = $self;
    aprobadores_documento_sh              : Composition of many AprobadoresDocumentoSH
                                                on aprobadores_documento_sh.pi = $self;
    tipo_pi                               : Association to TiposPI;
    gasto_pi                              : Composition of one GastosPI
                                                on gasto_pi.pi = $self;
    ensayos                               : Composition of many Ensayos
                                                on ensayos.pi = $self;
    pruebas_hidraulicas                   : Composition of many PruebasHidraulicas
                                                on pruebas_hidraulicas.pi = $self;
    inspecciones_electro                  : Composition of many InspeccionesElectro
                                                on inspecciones_electro.pi = $self;
    inspecciones_civil                    : Composition of many InspeccionesCI
                                                on inspecciones_civil.pi = $self;
    sistema_contratacion                  : Association to SistemasContratacion;
    partidimetros                         : Composition of many Partidimetros
                                                on partidimetros.pi = $self;
    memoria_calculo                       : Composition of many MemoriaCalculo
                                                on memoria_calculo.obra = $self;
    memoria_calculooce                    : Composition of many MemoriaCalculoOCE
                                                on memoria_calculooce.pi = $self;
    memoria_calculoci                     : Composition of many MemoriaCalculoCI
                                                on memoria_calculoci.pi = $self;
    memoria_partidas                      : Composition of many MemoriaPartidas
                                                on memoria_partidas.pi = $self;
    acopio_materiales                     : Composition of many AcopiosMateriales
                                                on acopio_materiales.pi = $self;
    inspecciones_seguridad_higiente       : Composition of many InspeccionesSeguridadHigiene
                                                on inspecciones_seguridad_higiente.pi = $self;
    partes_diario                         : Composition of many PartesDiarios
                                                on partes_diario.pi = $self;
    controles_sostenimiento               : Composition of many ControlesSostenimiento
                                                on controles_sostenimiento.pi = $self;
    nota_pedido                           : Composition of many NotasPedido
                                                on nota_pedido.pi = $self;
    orden_servicio                        : Composition of many OrdenesServicio
                                                on orden_servicio.pi = $self;
    documentosSH                          : Composition of many DocumentosSH
                                                on documentosSH.pi = $self;

    presentaciones                        : Composition of many Presentaciones
                                                on presentaciones.pi = $self;
    documentacion_adicional               : Composition of many DocumentacionesAdicionales
                                                on documentacion_adicional.pi = $self;
    programas_cateos                      : Composition of many ProgramasCateos
                                                on programas_cateos.pi = $self;
    planos_interferencias                 : Composition of many PlanosInterferencias
                                                on planos_interferencias.pi = $self;

    informes_cateos                       : Composition of many InformesCateo
                                                on informes_cateos.pi = $self;
    tramos                                : Composition of many Tramos
                                                on tramos.pi = $self;
    responsables                          : Composition of one ResponsablesPI
                                                on responsables.pi = $self;
    actas                                 : Composition of many Actas
                                                on actas.pi = $self;
    inspecciones_ambiente                 : Composition of many InspeccionesMedioambiente
                                                on inspecciones_ambiente.pi = $self;
    adendas                               : Composition of many Adendas
                                                on adendas.pi = $self;
    anexos                                : Composition of many Anexos
                                                on anexos.pi = $self;
}

entity Adendas : cuid, managed {
    pi                        : Association to ObraPI;
    nro_adenda                : Integer;
    estado                    : Association to EstadosGeneral;
    fecha_solicitud           : Date;
    fecha_aprobacion          : Date;
    notas_pedido              : Composition of many AdendaNotasPedido
                                    on notas_pedido.adenda = $self;
    ordenes_servicio          : Composition of many AdendaOrdenesServicio
                                    on ordenes_servicio.adenda = $self;
    actas_excedidas           : Composition of many AdendaActasExcedidas
                                    on actas_excedidas.adenda = $self;
    actas_adicionales         : Composition of many AdendaActasAdicionales
                                    on actas_adicionales.adenda = $self;
    actas_apliaciones         : Composition of many AdendaActasAmpliaciones
                                    on actas_apliaciones.adenda = $self;
    actas_prorrogas           : Composition of many AdendaActasProrrogas
                                    on actas_prorrogas.adenda = $self;
    nuevo_plan_trabajo        : Association to PlanesTrabajo;
    nuevo_partidimetro        : Association to Partidimetros;
    curva_inversion_actual    : String;
    curva_inversion_propuesta : String;
    documentos                : Composition of many DocumentosAdendas
                                    on documentos.adenda = $self;

    aprobadores               : Composition of many AprobadoresAdenda
                                    on aprobadores.adenda = $self;
}

entity AprobadoresAdenda : cuid, managed {
    adenda           : Association to Adendas;
    rol              : Association to Roles;
    usuario          : String;
    decision         : Association to Decisiones;
    observaciones    : String;
    correo           : String;
    nombre_apellido  : String;
    nivel_aprobacion : Integer;
}

entity AdendaNotasPedido {
    key adenda      : Association to Adendas;
    key nota_pedido : Association to NotasPedido;
}

entity AdendaOrdenesServicio {
    key adenda         : Association to Adendas;
    key orden_servicio : Association to OrdenesServicio;
}

entity AdendaActasExcedidas {
    key adenda : Association to Adendas;
    key acta   : Association to ActasExcedidas;
}

entity AdendaActasAdicionales {
    key adenda : Association to Adendas;
    key acta   : Association to ActasAdicionales;
}

entity AdendaActasAmpliaciones {
    key adenda : Association to Adendas;
    key acta   : Association to ActasAmpliaciones;
}

entity AdendaActasProrrogas {
    key adenda : Association to Adendas;
    key acta   : Association to ActasProrrogaPlazos;
}

entity DocumentosAdendas : cuid {
    adenda        : Association to Adendas;
    fecha_entrega : Date;
    nombre        : String;
    adjunto       : String;
    comentarios   : String;
    ruta          : String;
}

entity AprobadoresDocumentoSH : cuid {
    documentossh     : Association to DocumentosSH;
    usuario          : String;
    correo           : String;
    decision         : Association to Decisiones;
    observaciones    : String;
    nombre_apellido  : String;
    nivel_aprobacion : Integer;
    rol              : Association to Roles;
    pi               : Association to ObraPI;
}

entity AprobadoresPlanDeTrabajo : cuid {
    plan_trabajo    : Association to PlanesTrabajo;
    usuario         : String;
    correo          : String;
    decision        : Association to Decisiones;
    observaciones   : String;
    nombre_apellido : String;
    inspector       : Association to Inspectores;
}

entity Partidimetros : cuid, managed {
    pi                   : Association to ObraPI;
    estado               : Association to EstadosGeneral;
    estado_original      : Association to EstadosGeneral;
    nro_partidimetro     : Integer;
    fecha_carga          : Date;
    cantidad_partidas    : Integer;
    monto_total          : Decimal;
    observaciones        : String;
    copia_de             : Association to Partidimetros;
    detalle_partidimetro : Composition of many DetallePartidimetro
                               on detalle_partidimetro.partidimetro = $self;
    tareas_plan_trabajo  : Composition of many TareasPlanTrabajo
                               on tareas_plan_trabajo.partidimetro = $self;
}

entity DetallePartidimetro : cuid, managed {
    item_partida        : Association to ItemPartidimetro;
    subitem_partida     : Association to SubitemPartidimetro;
    tipo_partida        : Association to TiposPartidas;
    unidad_partida      : Association to UMGeneral;
    partidimetro        : Association to Partidimetros;
    codigo1             : String;
    codigo2             : String;
    codigo3             : String;
    codigo4             : String;
    codigo5             : String;
    item                : String;
    subitem             : String;
    designacion         : String;
    nombre_archivo_oc   : String;
    ruta_oc             : String;
    unidad              : String;
    cantidad            : Integer;
    precio_unitario     : Decimal;
    analisis_precio     : Composition of many AnalisisPrecios
                              on analisis_precio.partida = $self;
    porc_avance_taller  : Decimal;
    fecha_pie_obra      : Date;
    fecha_puesta_marcha : Date;
    fecha_montaje       : Date;
    fecha_orden_compra  : Date;
    actas               : Composition of many ActasPartida
                              on actas.partida = $self;
    cantidad_original   : Decimal;
}

entity PonderacionesDetallePartidimetro : cuid {
    apu                    : Association to AnalisisPrecios;
    moneda                 : Association to Monedas;
    porcentaje_ponderacion : Decimal;
}

entity PonderacionesAdicionales : cuid {
    apu                    : Association to AnalisisPreciosPartidaAdicional;
    moneda                 : Association to Monedas;
    porcentaje_ponderacion : Decimal;
}

entity PonderacionesAmpliacion : cuid {
    apu                    : Association to AnalisisPreciosPartidaAmpliacion;
    moneda                 : Association to Monedas;
    porcentaje_ponderacion : Decimal;
}

entity PonderacionesMedicion : cuid {
    apu                    : Association to AnalisisPreciosPartidaMedicion;
    moneda                 : Association to Monedas;
    porcentaje_ponderacion : Decimal;
}

entity GastosPI : cuid {
    pi                  : Association to ObraPI;
    gastos_indirectos   : Decimal;
    gastos_generales    : Decimal;
    costo_financiero    : Decimal;
    beneficios          : Decimal;
    impuestos_ganancias : Decimal;
    impuestos_credito   : Decimal;
    impuestos_ingresos  : Decimal;
}

entity ActasPartida {
    key partida             : Association to DetallePartidimetro;
    key acta                : Association to Actas;
        cantidad_original   : Integer;
        cantidad_excedida   : Integer;
        cantidad_adicional  : Integer;
        cantidad_economia   : Integer;
        cantidad_ampliacion : Integer;
}

entity AnalisisPrecios : cuid, managed {
    partida             : Association to DetallePartidimetro;
    nro_apu             : Integer;
    ponderaciones       : Composition of many PonderacionesDetallePartidimetro
                              on ponderaciones.apu = $self;
    estado              : Association to EstadosGeneral;
    materiales          : Composition of many MaterialesPartida
                              on materiales.partida = $self;
    equipos             : Composition of many EquiposPartida
                              on equipos.partida = $self;
    combustibles        : Composition of many CombustiblesPartida
                              on combustibles.partida = $self;
    mano_obra           : Composition of many ManoObraPartida
                              on mano_obra.partida = $self;

    gastos_indirectos   : Decimal;
    gastos_generales    : Decimal;
    costo_financiero    : Decimal;
    beneficios          : Decimal;
    impuestos_ganancias : Decimal;
    impuestos_credito   : Decimal;
    impuestos_ingresos  : Decimal;
    total               : Decimal;
    fecha               : Date;
}

entity OrdenesCompraOracle : cuid, managed {
    proveedor            : String;
    nro_proveedor        : String;
    activo               : String;
    cuit                 : String;
    origen               : String;
    domicilio_legal      : String;
    sucursal             : String;
    domicilio            : String;
    ciudad               : String;
    codigo_postal        : String;
    oc                   : String;
    proyecto_inversion   : String;
    quantity             : Decimal;
    tipo_oc              : String;
    descripcion_oc       : String;
    moneda               : String;
    p3                   : String;
    nro_contrato         : String;
    direccion            : String;
    nro_linea            : String;
    item_description     : String;
    udm                  : String;
    precio_unitario      : String;
    combinacion_contable : String;
    fecha_oc             : Date;
    tasa_cambio          : String;
}

entity Ofertas : cuid, managed {
    obra          : Association to Obras;
    fecha         : Date;
    descripcion   : String;
    archivo       : String;
    observaciones : String;
    estado        : Association to EstadosGeneral;
    ruta          : String;
}

entity Preconstrucciones : cuid, managed {
    nro_acta         : String;
    obra             : Association to Obras;
    fecha_generacion : Date;
    estado           : Association to EstadosGeneral;
    contacto         : Composition of many Contactos
                           on contacto.preconstruccion = $self;
    participante     : Composition of many Participantes
                           on participante.preconstruccion = $self;
    documento        : Composition of many DocumentosPreconstruccion
                           on documento.preconstruccion = $self;
}

entity Contactos : cuid, managed {
    preconstruccion : Association to Preconstrucciones;
    nombre          : String;
    apellido        : String;
    telefono        : String;
    email           : String;
}

entity Participantes : cuid, managed {
    preconstruccion : Association to Preconstrucciones;
    nombre          : String;
    apellido        : String;
    funcion         : String;
    representa      : Association to Entregas;
}

entity DocumentosPreconstruccion : cuid, managed {
    preconstruccion     : Association to Preconstrucciones;
    estado              : Association to EstadosGeneral;
    pi                  : Association to ObraPI;
    requerido           : Boolean default false;
    unificado           : Boolean default false;
    fecha_limite        : Date;
    comentarios         : String;
    responsable         : Association to Entregas;
    catalogo_documentos : Association to CatalogoDocumentos;
    documento           : Composition of one DocumentosAdjunto
                              on documento.documento_preconstruccion = $self;
    borrado             : Boolean default false;
    aprobadores         : Composition of AprobadoresDocumentoPreconstruccion
                              on aprobadores.documento_preconstruccion = $self;
}

entity AprobadoresDocumentoPreconstruccion : cuid {
    documento_preconstruccion : Association to DocumentosPreconstruccion;
    usuario                   : String;
    correo                    : String;
    decision                  : Association to Decisiones;
    observaciones             : String;
    nombre_apellido           : String;
    nivel_aprobacion          : Integer;
    rol                       : Association to Roles;
    pi                        : Association to ObraPI;
}

entity DocumentosAdjunto : cuid, managed {
    documento_preconstruccion : Association to DocumentosPreconstruccion;
    fecha_entrega             : Date;
    nombre                    : String;
    adjunto                   : String;
    comentarios               : String;
    ruta                      : String;
}

entity GrupoDocumento : managed {
    key grupo     : Association to GrupoArea;
    key documento : Association to CatalogoDocumentos;
}

entity GrupoArea : managed {
    key ID          : String;
        area        : Association to Areas;
        descripcion : String;
}

entity CatalogoDocumentos : cuid, managed {
    area              : Association to Areas;
    documento         : String;
    borrado           : Boolean default false;
    tiene_vencimiento : Boolean default false;
}

entity DocumentosAysa : cuid, managed {
    area           : Association to Areas;
    documento      : String;
    nombre_archivo : String;
    codigo         : String;
}

entity InspectoresResponsables : cuid {
    responsable : Association to Responsables;
    inspector   : Association to Inspectores;
}

entity Inspectores : cuid, managed {
    nombre                   : String;
    tipo_inspector           : Association to TiposInspectores;
    direccion                : Association to Direcciones;
    usuario                  : String;
    correo                   : String;
    borrado                  : Boolean default false;
    jefe_inspeccion          : Association to Inspectores;
    jefe_area                : Association to JefesArea;
    inspectores_responsables : Composition of many InspectoresResponsables
                                   on inspectores_responsables.inspector = $self;
}

entity Usuarios : cuid, managed {
    contratista : Composition of many UsuarioContratistas
                      on contratista.usuario = $self;
}

entity UsuarioContratistas : managed {
    key usuario     : Association to Usuarios;
    key contratista : Association to Contratistas;
}

/*
entity DireccionGerencias {
    key direccion : Association to Direcciones;
    key gerencia  : Association to Gerencias;
}
*/

entity Personal : cuid, managed {
    area     : Association to Areas;
    rol      : Association to RolArea;
    nombre   : String;
    apellido : String;
    usuario  : String;
}

entity ContratistaObra : cuid {
    obra           : Association to Obras;
    contratista    : Association to Contratistas;
    vigencia_desde : Date;
    vigencia_hasta : Date;
}

entity Contratistas : cuid, managed {
    tipo_contratista   : Association to TiposContratistas;
    razonsocial        : String;
    contratistas_obra  : Composition of many ContratistaObra
                             on contratistas_obra.contratista = $self;
    registro_proveedor : String;
    tipo_documento     : Association to TiposDocumentos;
    nro_documento      : String;
    telefono           : String;
    email              : String;
    pais               : Association to Paises;
    domicilio_legal    : String;
    representantes     : Composition of many Representantes
                             on representantes.contratista = $self;
    integrantesute     : Composition of many IntegrantesUTE
                             on integrantesute.contratista = $self;
    abreviatura        : String;
    borrado            : Boolean default false;
}

entity Partidos : cuid, managed {
    descripcion : String;
};

entity Representantes : cuid, managed {
    contratista : Association to Contratistas;
    nombre      : String;
    apellido    : String;
    usuario     : String;
};

entity IntegrantesUTE : cuid, managed {
    contratista        : Association to Contratistas;
    porcentaje         : Integer;
    razonsocial        : String;
    registro_proveedor : String;
    cuit               : String;
    email              : String;
    telefono           : String;
    domicilio_legal    : String;
};

entity Areas : IdDescripcion {
    ins_aprueba_doc  : Boolean default false;
    area_aprueba_doc : Boolean default false;
    personal         : Composition of many Personal
                           on personal.area = $self;
};


entity Gerencias : IdDescripcion {
    direccion    : Association to Direcciones;
    gerente      : Composition of one Gerentes
                       on gerente.gerencia = $self;
    nombre       : String;
    responsables : Composition of many Responsables
                       on responsables.gerencia = $self;
};

entity TiposObras : IdDescripcion {}
entity TiposInspectores : IdDescripcion {}
entity TiposContratos : IdDescripcion {}
entity Fluidos : IdDescripcion {};
entity Sistemas : IdDescripcion {};
entity Entregas : IdDescripcion {};
entity TiposContratistas : IdDescripcion {};
entity TiposDocumentos : IdDescripcion {};
entity Referencias : IdDescripcion {};
entity Monedas : IdDescripcion {};
entity TipoUM : IdDescripcion {};
entity UnidadesMedidaMateriales : IdDescripcion {};
entity UMInterferencias : IdDescripcion {};
entity ServiciosInterferencias : IdDescripcion {};
entity SistemasContratacion : IdDescripcion {};
entity Financiamientos : IdDescripcion {};
entity Especialidades : IdDescripcion {}
entity TipoDocumentosPlano : IdDescripcion {}
entity Entes : IdDescripcion {}
entity TiposPermiso : IdDescripcion {}
entity RolArea : IdDescripcion {};
entity AccionesLog : IdDescripcion {};
entity TiposCedula : IdDescripcion {};
entity TipoAsignacion : IdDescripcion {};

entity Tramos : cuid, managed {
    pi                : Association to ObraPI;
    codigo            : String;
    direccion         : String;
    diagramas_cuadra  : Composition of many DiagramasCuadra
                            on diagramas_cuadra.tramo = $self;
    prueba_hidraulica : Composition of many PHTramos
                            on prueba_hidraulica.tramo = $self;
    frentes           : Composition of many FrentesTrabajo
                            on frentes.tramo = $self;
}

entity Paises : cuid, managed {
    iso         : String;
    descripcion : String;
};

entity Direcciones : IdDescripcion {
    director     : Composition of one Directores
                       on director.direccion = $self;
    nombre       : String;
    responsables : Composition of many Responsables
                       on responsables.direccion = $self;
};

entity EstadosGeneral : color {};
entity Calificaciones : color {}

entity IdDescripcion : managed {
    key ID          : String;
        descripcion : String;
}

entity color : IdDescripcion {
    color : String;
}


entity ItemsPartida : cuid, managed {
    partida       : Association to AnalisisPrecios;
    descripcion   : String;
    unidad_medida : Association to UMGeneral;
}

entity DocumentoModificacionCabecera : cuid, managed {
    tabla        : String;
    clave_objeto : String;
    accion       : Association to AccionesLog;
    posicion     : Composition of many DocumentoModificacionPosicion
                       on posicion.cabecera = $self;
}

entity DocumentoModificacionPosicion : cuid, managed {
    cabecera       : Association to DocumentoModificacionCabecera;
    campo          : String;
    valor_anterior : String;
    valor_nuevo    : String;
}

entity CertificadosControlPolizas : cuid, managed {
    obra              : Association to Obras;
    nro_control       : Integer;
    fecha_emision     : Date;
    fecha_vencimiento : Date;
    nombre_documento  : String;
    adjunto           : String;
    estado            : Association to EstadosGeneral;
}

entity VTV : cuid, managed {
    obra              : Association to Obras;
    dominio           : String;
    nombre_documento  : String;
    marca             : String;
    modelo            : String;
    fecha_vencimiento : Date;
    adjunto           : String;
    estado            : Association to EstadosGeneral;
    reemplazado       : Boolean default false;
}

entity LicenciasConducir : cuid, managed {
    obra              : Association to Obras;
    nombre            : String;
    apellido          : String;
    adjunto           : String;
    fecha_vencimiento : Date;
    estado            : Association to EstadosGeneral;
    reemplazado       : Boolean default false;

}

entity Cedulas : cuid, managed {
    obra              : Association to Obras;
    adjunto           : String;
    tipo_cedula       : Association to TiposCedula;
    nombre            : String;
    apellido          : String;
    marca             : String;
    modelo            : String;
    dominio           : String;
    fecha_vencimiento : Date;
    estado            : Association to EstadosGeneral;
    reemplazado       : Boolean default false;

}

entity RegistrosEspeciales : cuid, managed {
    obra              : Association to Obras;
    nombre_documento  : String;
    adjunto           : String;
    marca             : String;
    modelo            : String;
    fecha_vencimiento : Date;
    dominio           : String;
    nombre_titular    : String;
    apellido_titular  : String;
    estado            : Association to EstadosGeneral;
    reemplazado       : Boolean default false;
}

entity PermisosDocumentoEstructura : managed {
    documento                 : Association to PermisosCatalogoDocumentos;
    archivo                   : String;
    estado                    : Association to EstadosGeneral;
    fecha_pedido_subsanacion  : Date;
    documento_subsanacion     : String;
    observaciones_subsanacion : String;
    observaciones             : String;
}

entity DatosPermisosEstructura : managed {
    constancia_inicio_tramite : String;
    fecha_inicio_tramite      : Date;
    fecha_posible_otorgacion  : Date;
    fecha_otorgacion_permiso  : Date;
    expediente_ente           : String;
    fecha_rechazo             : Date;
    evidencia_rechazo         : String;
    comentarios               : String;
    fecha_vencimiento_permiso : Date;
    permiso_otorgado          : String;
}

entity DiagramasCuadra : cuid, managed {
    pi                : Association to ObraPI;
    tramo             : Association to Tramos;
    estado            : Association to EstadosGeneral;
    observaciones     : String;
    fecha_envio       : Date;
    nro_diagrama      : Integer;
    planimetria       : Composition of one Planimetrias
                            on planimetria.diagrama = $self;
    altimetria        : Composition of one Altimetrias
                            on altimetria.diagrama = $self;
    memoria_calculo   : Association to MemoriaCalculo;

    consumos_partida  : Composition of many ConsumosPartida
                            on consumos_partida.diagrama_cuadra = $self;
    diagrama_original : Association to DiagramasCuadra;
}

entity Planimetrias : cuid, managed {
    diagrama          : Association to DiagramasCuadra;
    plano             : Association to Planos;
    grupos_conexiones : Composition of many GruposConexiones
                            on grupos_conexiones.planimetria = $self;
    /*
    consumos_partida  : Composition of many ConsumosPartida
                            on consumos_partida.planimetria = $self;
    */
    fecha             : Composition of one Fechas
                            on fecha.planimetria = $self;
    referencia        : Composition of one ReferenciasPlanimetria
                            on referencia.planimetria = $self;
    macisos_anclaje   : Composition of many MacisosAnclaje
                            on macisos_anclaje.planimetria = $self;
    material          : Composition of one Materiales
                            on material.planimetria = $self;
    refaccion         : Composition of many Refacciones
                            on refaccion.planimetria = $self;
}

entity GruposConexiones : cuid, managed {
    planimetria        : Association to Planimetrias;
    tipo_conexion      : Association to TiposConexion;
    proyecto_inversion : Association to ObraPI;
    codigo1            : String;
    codigo2            : String;
    codigo3            : String;
    codigo4            : String;
    codigo5            : String;
    conexiones         : Composition of many Conexiones
                             on conexiones.grupos_conexiones = $self;
}

entity UMGeneral : IdDescripcion {
    tipo_um : Association to TipoUM;
};

entity Conexiones : cuid, managed {
    grupos_conexiones : Association to GruposConexiones;
    progresiva        : Decimal;
    es_boca_registro  : Boolean default false;
    nro_propiedad     : String;
    nro_boca_registro : String;
    cota_tn           : Decimal;
    cota_inv          : Decimal;
}

entity TiposConexion : IdDescripcion {}

entity ConsumosPartida : cuid, managed {
    diagrama_cuadra    : Association to DiagramasCuadra;
    planimetria        : Association to Planimetrias;
    proyecto_inversion : Association to ObraPI;
    tipo_asignacion    : Association to TipoAsignacion;
    codigo1            : String;
    codigo2            : String;
    codigo3            : String;
    codigo4            : String;
    codigo5            : String;
    cantidad           : Decimal;
    item               : Association to ItemPartidimetro;
    subitem            : Association to SubitemPartidimetro;

}

entity Fechas : cuid, managed {
    planimetria          : Association to Planimetrias;
    colocacion           : Date;
    prueba_hidraulica    : Date;
    anclajes             : Date;
    desinfeccion         : Date;
    reparacion_vereda    : Date;
    reparacion_pavimento : Date;
    aprobacion_municipal : Date;
    boca_registro        : Date;
}

entity ReferenciasPlanimetria : cuid, managed {
    planimetria         : Association to Planimetrias;
    dn                  : Decimal;
    boca_registro_s_inc : Decimal;
    boca_registro_l_inc : Decimal;
    ancho_z             : Decimal;
    longitud_e          : Decimal;
    pendiente           : Decimal;
}

entity MacisosAnclaje : cuid, managed {
    planimetria   : Association to Planimetrias;
    conexion      : Association to Conexiones;
    armadura      : Boolean default false;
    volumen       : Decimal;
    unidad_medida : Association to UMGeneral;
}

entity Materiales : cuid, managed {
    planimetria        : Association to Planimetrias;
    canieria           : Decimal;
    conexiones         : Decimal;
    diametro           : Decimal;
    ancho              : Decimal;
    boca_registro      : Decimal;
    tapa_boca_registro : Decimal;
}

entity Refacciones : cuid, managed {
    planimetria          : Association to Planimetrias;
    tipo_refaccion       : Association to TiposRefaccion;
    conexiones_refaccion : Composition of many ConexionesRefaccion
                               on conexiones_refaccion.refaccion = $self;
    proyecto_inversion   : Association to ObraPI;
    codigo1              : String;
    codigo2              : String;
    codigo3              : String;
    codigo4              : String;
    codigo5              : String;
}

entity TiposRefaccion : IdDescripcion {}

entity ConexionesRefaccion : cuid, managed {
    refaccion : Association to Refacciones;
    conexion  : Association to Conexiones;
    largo     : Decimal;
}

entity Altimetrias : cuid, managed {
    diagrama   : Association to DiagramasCuadra;
    plano      : Association to Planos;
    excavacion : Composition of one Excavaciones
                     on excavacion.altimetria = $self;
    deduccion  : Composition of many Deducciones
                     on deduccion.altimetria = $self;
}

entity Excavaciones : cuid, managed {
    altimetria           : Association to Altimetrias;
    lecho_apoyo          : Decimal;
    excavaciones_detalle : Composition of many ExcavacionesDetalle
                               on excavaciones_detalle.excavacion = $self;
    pi_dist_parcial      : Association to ObraPI;
    dist_parcial_codigo1 : String;
    dist_parcial_codigo2 : String;
    dist_parcial_codigo3 : String;
    dist_parcial_codigo4 : String;
    dist_parcial_codigo5 : String;
    pi_z_0_25            : Association to ObraPI;
    z_0_25_codigo1       : String;
    z_0_25_codigo2       : String;
    z_0_25_codigo3       : String;
    z_0_25_codigo4       : String;
    z_0_25_codigo5       : String;
    pi_z_25_4            : Association to ObraPI;
    z_25_4_codigo1       : String;
    z_25_4_codigo2       : String;
    z_25_4_codigo3       : String;
    z_25_4_codigo4       : String;
    z_25_4_codigo5       : String;
    pi_4_n               : Association to ObraPI;
    z_4_n_codigo1        : String;
    z_4_n_codigo2        : String;
    z_4_n_codigo3        : String;
    z_4_n_codigo4        : String;
    z_4_n_codigo5        : String;
}

entity ExcavacionesDetalle : cuid, managed {
    excavacion             : Association to Excavaciones;
    nro_orden              : Integer;
    cota_tn                : String;
    cota_intrados_extrados : String;
    progresiva             : String;
    ancho_zanja            : String;
}

entity Deducciones : cuid, managed {
    altimetria         : Association to Altimetrias;
    proyecto_inversion : Association to ObraPI;
    codigo1            : String;
    codigo2            : String;
    codigo3            : String;
    codigo4            : String;
    codigo5            : String;
    dn                 : Decimal;
    um_dn              : Association to UMGeneral;
    largo              : String;
    um_largo           : Association to UMGeneral;
    ancho              : Decimal;
    um_ancho           : Association to UMGeneral;
    profundidad        : Decimal;
    um_profundidad     : Association to UMGeneral;
}

entity Directores : cuid, managed {
    direccion : Association to Direcciones;
    nombre    : String;
    apellido  : String;
    usuario   : String;
    correo    : String;
}

entity Gerentes : cuid, managed {
    direccion : Association to Direcciones;
    gerencia  : Association to Gerencias;
    nombre    : String;
    apellido  : String;
    usuario   : String;
    correo    : String;
}

entity TiposSuspension : IdDescripcion {}
entity TiposActaSuspension : IdDescripcion {}
entity TiposActa : IdDescripcion {}
entity TiposPI : IdDescripcion {}

entity Actas : cuid, managed {
    pi                   : Association to ObraPI;
    partidimetros        : Composition of many ActasPartidimetro /* cambiar */
                               on partidimetros.acta = $self;
    notas_pedido         : Composition of many ActasNota
                               on notas_pedido.acta = $self;
    ordenes_servicio     : Composition of many ActasOrden
                               on ordenes_servicio.acta = $self;
    notas_minutas        : Composition of many ReferenciasNotaMinutaActas
                               on notas_minutas.acta = $self;
    presentaciones       : Composition of many ActasPresentacion
                               on presentaciones.acta = $self;
    planes_trabajo       : Composition of many ActasPlanTrabajo
                               on planes_trabajo.acta = $self;
    acta_suspension      : Composition of one ActasSuspension
                               on acta_suspension.acta = $self;
    documento_adjunto    : Composition of many ActasDocumentoAdjunto
                               on documento_adjunto.acta = $self;
    tipo_acta            : Association to TiposActa;
    acta_prorroga_plazos : Composition of one ActasProrrogaPlazos
                               on acta_prorroga_plazos.acta = $self;
    aprobadores          : Composition of many AprobadoresActa
                               on aprobadores.acta = $self;
    acta_tradicion       : Composition of many ActasTradicion
                               on acta_tradicion.acta = $self;
    acta_adicional       : Composition of many ActasAdicionales
                               on acta_adicional.acta = $self;
    acta_economia        : Composition of many ActasEconomias
                               on acta_economia.acta = $self;
    acta_excedida        : Composition of many ActasExcedidas
                               on acta_excedida.acta = $self;
    acta_ampliacion      : Composition of many ActasAmpliaciones
                               on acta_ampliacion.acta = $self;
    acta_sancion         : Composition of many ActasSanciones
                               on acta_sancion.acta = $self;
    actas_ref_actas      : Composition of many ActasRefActas
                               on actas_ref_actas.acta = $self;
    actas_medicion       : Composition of many ActasMedicion
                               on actas_medicion.acta = $self;
}

entity ActasSanciones : cuid, managed {
    acta                 : Association to Actas;
    estado               : Association to EstadosGeneral;
    articulos            : Composition of many ActasArticulos
                               on articulos.acta = $self;
    porcentaje_sancion   : Decimal;
    valoracion_economica : Decimal;
    texto_referencia_ods : String;
    nro_acta             : Integer;
    fecha_acta           : Date;
    fecha_aprobacion     : Date;
    referencia           : String;
    justificacion        : String;
    descripcion          : String;
    documentacion        : Composition of many DocumentacionSanciones
                               on documentacion.acta_sancion = $self;
    envelopeId           : UUID;
}

entity ActasArticulos : cuid {
    acta     : Association to ActasSanciones;
    articulo : Association to Articulos;
}

entity Articulos : IdDescripcion {
    actas : Composition of many ActasArticulos
                on actas.articulo = $self;
}

entity Multas : cuid, managed {
    obra            : Association to Obras;
    p3              : Association to P3;
    pi              : Association to ObraPI;
    multa_pendiente : Boolean;
    acta            : Association to Actas;
}

entity ActasPartidasNegativas : cuid, managed {
    acta             : Association to Actas;
    pi               : Association to ObraPI;
    estado           : Association to EstadosGeneral;
    nro_acta         : Integer;
    fecha_acta       : Date;
    referencia       : String;
    observaciones    : String;
    justificacion    : String;
    partidas         : Composition of many PartidasNegativas
                           on partidas.acta_partida_negativa = $self;
    ordenes_servicio : Composition of many PartidasOrdenServicio
                           on ordenes_servicio.acta_partida_negativa = $self;
    notas_pedido     : Composition of many PartidasNotasPedido
                           on notas_pedido.acta_partida_negativa = $self;
    documentacion    : Composition of many DocumentacionPartidasNegativas
                           on documentacion.acta_partida_negativa = $self;
    envelopeId       : String;
}

entity PartidasNegativas {
    key acta_partida_negativa : Association to ActasPartidasNegativas;
    key partida               : Association to DetallePartidimetro;
}

entity PartidasOrdenServicio {
    key acta_partida_negativa : Association to ActasPartidasNegativas;
    key orden_servicio        : Association to OrdenesServicio;
}

entity PartidasNotasPedido {
    key acta_partida_negativa : Association to ActasPartidasNegativas;
    key nota_pedido           : Association to NotasPedido;
}

entity DocumentacionPartidasNegativas : cuid, managed {
    acta_partida_negativa : Association to ActasPartidasNegativas;
    nombre                : String;
    tipo_archivo          : String;
    ruta                  : String;
}

entity ActasMedicion : cuid, managed {
    acta                : Association to Actas;
    pi                  : Association to ObraPI;
    estado              : Association to EstadosGeneral;
    memoria             : Association to MemoriaCalculo;
    memoriaoce          : Association to MemoriaCalculoOCE;
    memoriaci           : Association to MemoriaCalculoCI;
    nro_acta            : Integer;
    fecha_acta          : Date;
    referencia          : String;
    observaciones       : String;
    documentacion       : Composition of many DocumentacionMedicion
                              on documentacion.acta_medicion = $self;
    partidas_mediciones : Composition of many PartidasMediciones
                              on partidas_mediciones.acta_medicion = $self;
    envelopeId          : String;
}

entity PartidasMediciones : cuid {
    acta_medicion        : Association to ActasMedicion;
    codigo1              : String;
    codigo2              : String;
    codigo3              : String;
    codigo4              : String;
    codigo5              : String;
    item                 : Association to ItemPartidimetro;
    subitem              : Association to SubitemPartidimetro;
    descripcion          : String;
    observacion          : String;
    cantidad_contractual : Integer;
    cantidad_certificar  : Integer;
    um                   : Association to UMGeneral;
    tipo_partida         : Association to TiposPartidas;
    precio_unitario      : Decimal;
    analisis_precio      : Composition of many AnalisisPreciosPartidaMedicion
                               on analisis_precio.partida_ampliacion = $self;
}

entity DocumentacionMedicion : cuid, managed {
    acta_medicion : Association to ActasMedicion;
    nombre        : String;
    tipo_archivo  : String;
    ruta          : String;
}

entity ActasAmpliaciones : cuid, managed {
    acta                            : Association to Actas;
    estado                          : Association to EstadosGeneral;
    porcentaje_exceso               : Decimal;
    porcentaje_acta                 : Decimal;
    porcentaje_acumulado            : Decimal;
    ampliacion_dias                 : Decimal;
    valoracion_economica            : Decimal;
    fecha_inicio_trabajos           : Date;
    nro_acta                        : Integer;
    fecha_acta                      : Date;
    fecha_aprobacion                : Date;
    monto                           : Decimal;
    referencia                      : String;
    prorrogas_asociadas             : Boolean default false;
    justificacion                   : String;
    descripcion                     : String;
    partidas_ampliaciones           : Composition of many PartidasAmpliaciones
                                          on partidas_ampliaciones.acta_ampliacion = $self;
    partidas_ampliaciones_excedidas : Composition of many PartidasAmpliacionesExcedidas
                                          on partidas_ampliaciones_excedidas.acta_ampliacion = $self;
    documentacion                   : Composition of many DocumentacionAmpliaciones
                                          on documentacion.acta_ampliacion = $self;
    envelopeId                      : String;
}

entity DocumentacionAmpliaciones : cuid, managed {
    acta_ampliacion : Association to ActasAmpliaciones;
    nombre          : String;
    tipo_archivo    : String;
    ruta            : String;
}

entity DocumentacionAdicionales : cuid, managed {
    acta_adicional : Association to ActasAdicionales;
    nombre         : String;
    tipo_archivo   : String;
    ruta           : String;
}

entity DocumentacionSanciones : cuid, managed {
    acta_sancion : Association to ActasSanciones;
    nombre       : String;
    tipo_archivo : String;
    ruta         : String;
}

entity ActasSuspension : cuid, managed {
    acta                        : Association to Actas;
    estado                      : Association to EstadosGeneral;
    tipo_acta                   : Association to TiposActaSuspension;
    tipo_suspension             : Association to TiposSuspension;
    acta_suspension_inicio      : Association to ActasSuspension;
    acta_suspension_fin         : Association to ActasSuspension;
    nro_acta                    : Integer;
    fecha_acta                  : Date;
    fecha_envio                 : Date;
    fecha_inicio_suspension     : Date;
    fecha_fin_suspension        : Date;
    cantidad_dias_suspension    : Integer;
    responsabilidad_contratista : Boolean default false;
    nueva_fecha_finalizacion    : Date;
    fundamentos                 : String;
    plan_suspendido             : Association to PlanesTrabajo;
    tareas                      : Composition of many ActasSuspensionTarea
                                      on tareas.acta_suspension = $self;
    documentacion               : Composition of many DocumentacionSuspension
                                      on documentacion.acta_suspension = $self;
    envelopeId                  : String;
}

entity ActasProrrogaPlazos : cuid, managed {
    nro_acta                      : Integer;
    acta                          : Association to Actas;
    estado                        : Association to EstadosGeneral;
    mes                           : String;
    anio                          : String;
    plazo_prorroga                : Integer;
    um_plazo                      : Association to UMGeneral;
    fecha_acta                    : Date;
    fecha_envio                   : Date;
    porcentaje_prorroga_acumulado : Integer;
    plazo_prorroga_acumulado      : Integer;
    fecha_fin_contractual         : Date;
    nueva_fecha_finalizacion      : Date;
    descripcion                   : String;
    envelopeId                    : String;
}

entity ActasSuspensionTarea : cuid, managed {
    tarea           : Association to TareasPlanTrabajo;
    acta_suspension : Association to ActasSuspension;
}

entity ActasPartidimetro : cuid, managed {
    acta         : Association to Actas;
    partidimetro : Association to Partidimetros;
}

entity ActasRefActas : cuid, managed {
    acta            : Association to Actas;
    acta_referencia : Association to Actas;
}

entity ActasNota : cuid, managed {
    acta        : Association to Actas;
    nota_pedido : Association to NotasPedido;
}

entity ActasOrden : cuid, managed {
    acta           : Association to Actas;
    orden_servicio : Association to OrdenesServicio;
}

entity ActasPlanTrabajo : cuid, managed {
    acta         : Association to Actas;
    plan_trabajo : Association to PlanesTrabajo;
}

entity ActasPresentacion : cuid, managed {
    acta         : Association to Actas;
    presentacion : Association to Presentaciones;
}

entity ActasDocumentoAdjunto : cuid, managed {
    acta              : Association to Actas;
    documento_adjunto : Association to DocumentosAdjunto;
}

entity TiposPartidas : managed {
    key ID          : String;
        descripcion : String;
        borrado     : Boolean default false;
}

entity ItemPartidimetro : managed {
    key ID          : String;
        descripcion : String;
        borrado     : Boolean default false;
}

entity SubitemPartidimetro : managed {
    key ID          : String;
        item        : Association to ItemPartidimetro;
        descripcion : String;
        borrado     : Boolean default false;
}

entity MemoriaCriterios : cuid, managed {
    subitem              : Association to SubitemPartidimetro;
    colocacion           : Boolean default false;
    prueba_hidraulica    : Boolean default false;
    reparacion_vereda    : Boolean default false;
    aprobacion_municipal : Boolean default false;
    reparacion_pavimento : Boolean default false;
    porcentaje           : Decimal;
}

entity MemoriaCalculo : cuid, managed {
    obra                   : Association to ObraPI;
    nro_memoria_calculo    : Integer;
    mes                    : String(2);
    anio                   : String(4);
    partidas_contractuales : Decimal;
    partidas_excedidas     : Decimal;
    partidas_adicionales   : Decimal;
    partidas_ampliaciones  : Decimal;
    economias              : Decimal;
    total                  : Decimal;
    estado                 : Association to EstadosGeneral;
    //acta_medicion: Association to
    //certificado: Association to
    observaciones          : String;
    diagramas_cuadra       : Composition of many DiagramasCuadra
                                 on diagramas_cuadra.memoria_calculo = $self;
    tramos                 : Composition of many MemoriaTramos
                                 on tramos.memoria_calculo = $self;
    partidas_acumuladas    : Composition of many PartidasAcumuladas
                                 on partidas_acumuladas.memoria_calculo = $self;
}

entity TiposNotaMinuta : IdDescripcion {
    contratista     : Boolean default false;
    inspector       : Boolean default false;
    jefe_inspeccion : Boolean default false;
}

entity ReferenciasNotaMinuta : cuid {
    nota_minutas : Association to NotasMinuta;
    area         : Association to Areas;
}

entity ReferenciasNotaMinutaActas : cuid {
    nota_minutas : Association to NotasMinuta;
    acta         : Association to Actas;
}

entity NotasMinuta : cuid, managed {
    p3             : Association to P3;
    fecha          : Date;
    emisor         : String;
    receptor       : String;
    tipo_documento : Association to TiposNotaMinuta;
    referencia     : Composition of many ReferenciasNotaMinuta
                         on referencia.nota_minutas = $self;
    asunto         : String;
    ruta           : String;
}

entity MemoriaPartidas : cuid, managed {
    tramo_memoria            : Association to MemoriaTramos;
    pi                       : Association to ObraPI;
    codigo1                  : String;
    codigo2                  : String;
    codigo3                  : String;
    codigo4                  : String;
    codigo5                  : String;
    cantidad_ultimo_diagrama : Decimal;
    porcentaje_certificacion : Decimal;
    cantidad_certificar      : Decimal;
    monto_certificar         : Decimal;
    moneda                   : Association to Monedas;
}

entity PartidasAcumuladas : cuid, managed {
    memoria_calculo      : Association to MemoriaCalculo;
    pi                   : Association to ObraPI;
    codigo1              : String;
    codigo2              : String;
    codigo3              : String;
    codigo4              : String;
    codigo5              : String;
    item                 : Association to ItemPartidimetro;
    subitem              : Association to SubitemPartidimetro;
    cantidad_certificar  : Decimal;
    descripcion          : String;
    um                   : Association to UMGeneral;
    cantidad_contractual : Decimal;
    precio_unitario      : Decimal;
    tipo_partida         : Association to TiposPartidas;
    monto_certificar     : Decimal;
    moneda               : Association to Monedas;
}

entity MemoriaTramos : cuid, managed {
    tramo                : Association to Tramos;
    partidas             : Composition of many MemoriaPartidas
                               on partidas.tramo_memoria = $self;
    memoria_calculo      : Association to MemoriaCalculo;
    colocacion           : Boolean default false;
    prueba_hidraulica    : Boolean default false;
    reparacion_vereda    : Boolean default false;
    aprobacion_municipal : Boolean default false;
    reparacion_pavimento : Boolean default false;
}

entity PartesDiarios : cuid, managed {
    pi                         : Association to ObraPI;
    nro_parte                  : Integer;
    estado                     : Association to EstadosGeneral;
    fecha_generacion           : Date;
    fecha_desde                : Date;
    fecha_hasta                : Date;
    referencia                 : String;
    jornada_laboral            : Boolean default false;
    feriado                    : Boolean default false;
    lluvia                     : Boolean default false;
    suspension                 : Boolean default false;
    otro                       : Boolean default false;
    plantel_equipos            : String;
    cantidad_frentes           : String;
    equipos                    : String;
    operarios                  : String;
    capataces                  : String;
    observaciones              : String;
    actividades_contruccion    : String;
    condiciones_sh             : String;
    eventos_extraordinarios    : String;
    visitas                    : String;
    responsable_sh_presente    : Boolean default false;
    excavaciones_sup_120       : Boolean default false;
    ensayos                    : Boolean default false;
    listado_diario_personal    : Composition of many ListadosPersonalParteDiario
                                     on listado_diario_personal.parteDiario = $self;
    contratista_subcontratista : String;
    registro_fotografico       : Composition of many RegistrosFotoParteDiario
                                     on registro_fotografico.parteDiario = $self;
    tiempo                     : Composition of many TiempoParteDiario
                                     on tiempo.parteDiario = $self;
}

entity RegistrosFotoParteDiario : cuid, managed {
    parteDiario  : Association to PartesDiarios;
    ruta         : String;
    nombre       : String;
    tipo_archivo : String;
}

entity ListadosPersonalParteDiario : cuid, managed {
    parteDiario : Association to PartesDiarios;
    ruta        : String;
    nombre      : String;
}

entity TiempoParteDiario : cuid {
    parteDiario : Association to PartesDiarios;
    fecha       : Date;
    dia         : String;
    tiempo      : String;
    temp_min    : Decimal;
    temp_max    : Decimal;
    viento      : String;
    humedad     : Decimal;
}

entity InspeccionesElectro : cuid, managed {
    pi                        : Association to ObraPI;
    nro_acta                  : Integer;
    fecha_envio               : Date;
    estado                    : Association to EstadosGeneral;
    fecha_desde               : Date;
    fecha_hasta               : Date;
    referencia                : String;
    representante_contratista : String;
    representante_aysa        : String;
    empresa_duenia_taller     : String;
    direccion_taller          : String;
    partidas                  : Composition of many PartidasInspeccionElectro
                                    on partidas.inspeccion_electro = $self;
    registros                 : Composition of many RegistrosFotoInspeccionElectro
                                    on registros.inspeccion_electro = $self;
    acta_tradicion            : Composition of many ActasTradicion
                                    on acta_tradicion.inspeccion_electro = $self;
}

entity PartidasInspeccionElectro : cuid {
    inspeccion_electro  : Association to InspeccionesElectro;
    pi                  : Association to ObraPI;
    partida             : Association to DetallePartidimetro;
    codigo1             : String;
    codigo2             : String;
    codigo3             : String;
    codigo4             : String;
    codigo5             : String;
    cantidad            : Integer;
    precio_unitario     : Decimal;
    porc_avance_taller  : Decimal;
    fecha_montaje       : Date;
    fecha_pie_obra      : Date;
    fecha_orden_compra  : Date;
    nombre_archivo_oc   : String;
    orden_compra        : Decimal;
    pie_obra            : Decimal;
    puesta_marcha       : Decimal;
    montaje             : Decimal;
    ruta                : String;
    tipo_partida        : Association to TiposPartidas;
    fecha_puesta_marcha : Date;
    materiales          : Composition of many MaterialesInspeccionElectro
                              on materiales.partida_inspeccion_electro = $self;
}

entity MaterialesInspeccionElectro : cuid {
    partida_inspeccion_electro : Association to PartidasInspeccionElectro;
    nro_item                   : Integer;
    descripcion                : String;
    item                       : Association to ItemPartidimetro;
    subitem                    : Association to SubitemPartidimetro;
    cantidad                   : Decimal;
    um                         : Association to UnidadesMedidaMateriales;
}

entity RegistrosFotoInspeccionElectro : cuid, managed {
    inspeccion_electro : Association to InspeccionesElectro;
    nombre             : String;
    tipo_archivo       : String;
    ruta               : String;
}

entity InspeccionesCI : cuid, managed {
    pi                        : Association to ObraPI;
    nro_acta                  : Integer;
    fecha_envio               : Date;
    estado                    : Association to EstadosGeneral;
    fecha_desde               : Date;
    fecha_hasta               : Date;
    referencia                : String;
    representante_contratista : String;
    representante_aysa        : String;
    empresa_duenia_taller     : String;
    direccion_taller          : String;
    partidas                  : Composition of many PartidasInspeccionCI
                                    on partidas.inspeccion_civil = $self;
    registros                 : Composition of many RegistrosFotoInspeccionCI
                                    on registros.inspeccion_civil = $self;
    acta_tradicion            : Composition of many ActasTradicion
                                    on acta_tradicion.inspeccion_civil = $self;
}

entity PartidasInspeccionCI : cuid {
    inspeccion_civil    : Association to InspeccionesCI;
    pi                  : Association to ObraPI;
    partida             : Association to DetallePartidimetro;
    codigo1             : String;
    codigo2             : String;
    codigo3             : String;
    codigo4             : String;
    codigo5             : String;
    cantidad            : Integer;
    precio_unitario     : Decimal;
    porc_avance_taller  : Decimal;
    fecha_montaje       : Date;
    fecha_pie_obra      : Date;
    fecha_orden_compra  : Date;
    nombre_archivo_oc   : String;
    orden_compra        : Decimal;
    pie_obra            : Decimal;
    puesta_marcha       : Decimal;
    montaje             : Decimal;
    ruta                : String;
    tipo_partida        : Association to TiposPartidas;
    fecha_puesta_marcha : Date;
    materiales          : Composition of many MaterialesInspeccionCI
                              on materiales.partida_inspeccion_civil = $self;
}

entity MaterialesInspeccionCI : cuid {
    partida_inspeccion_civil : Association to PartidasInspeccionCI;
    nro_item                 : Integer;
    descripcion              : String;
    item                     : Association to ItemPartidimetro;
    subitem                  : Association to SubitemPartidimetro;
    cantidad                 : Decimal;
    um                       : Association to UnidadesMedidaMateriales;
}

entity RegistrosFotoInspeccionCI : cuid, managed {
    inspeccion_civil : Association to InspeccionesCI;
    nombre           : String;
    tipo_archivo     : String;
    ruta             : String;
}

entity AcopiosMateriales : cuid, managed {
    pi                       : Association to ObraPI;
    nro_acopio               : Integer;
    mes                      : String;
    anio                     : String;
    fecha_envio              : Date;
    estado                   : Association to EstadosGeneral;
    monto                    : Decimal;
    monto_acumulado          : Decimal;
    porcentaje_acopio        : Decimal;
    porcentaje_acumulado     : Decimal;
    certificado_disponible   : Boolean default false;
    fecha_certificado        : Date;
    ruta_recibo              : String;
    fecha_recibo             : Date;
    partidas_acopio          : Composition of many PartidasAcopio
                                   on partidas_acopio.acopio_material = $self;
    ruta_factura_proveedor   : String;
    ruta_declaracion_jurada  : String;
    ruta_orden_compra        : String;
    ruta_copia_poderes       : String;
    observaciones            : String;
    documentacion_solicitada : Boolean default false;
    constata_fisicamente     : Boolean default false;
    actas_constatacion       : Composition of many ActasConstatacion
                                   on actas_constatacion.acopio_material = $self;
/*
-	Acta_constatación (asociación a Actas) Pendiente de desarrollo
*/
}

entity Anexos : cuid, managed {
    pi            : Association to ObraPI;
    nro_anexo     : Integer;
    tipo_anexo    : String;
    descripcion   : String;
    obligatorio   : Boolean;
    estado        : Association to EstadosGeneral;
    ruta          : String;
    observaciones : String;
}

entity PartidasAcopio : cuid, managed {
    acopio_material                            : Association to AcopiosMateriales;
    pi                                         : Association to ObraPI;
    codigo1                                    : String;
    codigo2                                    : String;
    codigo3                                    : String;
    codigo4                                    : String;
    codigo5                                    : String;
    descripcion                                : String;
    cantidad                                   : Integer;
    unidad                                     : String;
    unidad_partida                             : Association to UMGeneral;
    precio_unitario                            : Decimal;
    descripcion_factura                        : String;
    cantidad_factura                           : Integer;
    unidad_factura                             : String;
    precio_unitario_factura                    : Decimal;
    cantidad_factura_segun_partidimetro        : Integer;
    precio_unitario_factura_segun_partidimetro : Decimal;
    total_acopiar                              : Decimal;
    observaciones                              : String;
    item                                       : Association to ItemPartidimetro;
    subitem                                    : Association to SubitemPartidimetro;
    moneda                                     : Association to Monedas;
}

entity JefesArea : cuid, managed {
    direccion : Association to Direcciones;
    nombre    : String;
    apellido  : String;
    usuario   : String;
    correo    : String;
}

entity AprobadoresActa : cuid, managed {
    acta             : Association to Actas;
    rol              : Association to Roles;
    usuario          : String;
    decision         : Association to Decisiones;
    observaciones    : String;
    correo           : String;
    nombre_apellido  : String;
    nivel_aprobacion : Integer;
}

entity Roles : IdDescripcion {}
entity Decisiones : IdDescripcion {}

entity ActasTradicion : cuid, managed {
    acta                   : Association to Actas;
    estado                 : Association to EstadosGeneral;
    nro_acta               : Integer;
    fecha_envio            : Date;
    fecha_desde            : Date;
    fecha_hasta            : Date;
    referencias            : String;
    confirmacion           : Boolean default false;
    observaciones          : String;
    inspeccion_electro     : Association to InspeccionesElectro;
    inspeccion_civil       : Association to InspeccionesCI;
    partidas               : Composition of many PartidasActaTradicion
                                 on partidas.acta_tradicion = $self;
    registros_fotograficos : Composition of many RegistrosFotoActaTradicion
                                 on registros_fotograficos.acta_tradicion = $self;
}

entity PartidasActaTradicion : cuid {
    acta_tradicion      : Association to ActasTradicion;
    pi                  : Association to ObraPI;
    partida             : Association to DetallePartidimetro;
    codigo1             : String;
    codigo2             : String;
    codigo3             : String;
    codigo4             : String;
    codigo5             : String;
    ruta_oc             : String;
    nombre_archivo_oc   : String;
    fecha_orden_compra  : Date;
    porc_avance_taller  : Decimal;
    fecha_pie_obra      : Date;
    fecha_puesta_marcha : Date;
    fecha_colocacion    : Date;
    materiales          : Composition of many MaterialesActaTradicion
                              on materiales.partida_acta_tradicion = $self;
}

entity MaterialesActaTradicion : cuid {
    partida_acta_tradicion : Association to PartidasActaTradicion;
    nro_item               : Integer;
    descripcion            : String;
    cantidad               : Decimal;
    item                   : Association to ItemPartidimetro;
    subitem                : Association to SubitemPartidimetro;
    um                     : Association to UnidadesMedidaMateriales;
}

entity RegistrosFotoActaTradicion : cuid, managed {
    acta_tradicion : Association to ActasTradicion;
    nombre         : String;
    tipo_archivo   : String;
    ruta           : String;
}

entity ControlesPersonal : cuid, managed {
    nro_control              : Integer;
    fecha_envio              : Date;
    obra                     : Association to Obras;
    estado                   : Association to EstadosGeneral;
    fecha_desde              : Date;
    fecha_hasta              : Date;
    referencia               : String;
    control_a_contratista    : Boolean default false;
    control_a_subcontratista : Boolean default false;
    observaciones            : String;
    empleados                : Composition of many EmpleadosControlPersonal
                                   on empleados.control_personal = $self;
}

entity EmpleadosControlPersonal : cuid, managed {
    nro_empleado     : Integer;
    nombre           : String;
    apellido         : String;
    cuit_dni         : String;
    respuesta1       : Boolean default false;
    respuesta2       : Boolean default false;
    control_personal : Association to ControlesPersonal;
}

entity ActasAdicionales : cuid, managed {
    acta                   : Association to Actas;
    pi                     : Association to ObraPI;
    estado                 : Association to EstadosGeneral;
    nro_acta               : Integer;
    fecha_acta             : Date;
    fecha_envio            : Date;
    monto                  : Decimal;
    porcentaje_adicionales : Decimal;
    porcentaje_acumulado   : Decimal;
    Justificacion          : String;
    descripcion            : String;
    envelopeId             : String;
    partidas_adicionales   : Composition of many PartidasAdicionales
                                 on partidas_adicionales.acta_adicional = $self;
    documentacion          : Composition of many DocumentacionAdicionales
                                 on documentacion.acta_adicional = $self;
}

entity PartidasAdicionales : cuid {
    acta_adicional  : Association to ActasAdicionales;
    codigo1         : String;
    codigo2         : String;
    codigo3         : String;
    codigo4         : String;
    codigo5         : String;
    item            : Association to ItemPartidimetro;
    subitem         : Association to SubitemPartidimetro;
    descripcion     : String;
    observacion     : String;
    cantidad        : Integer;
    um              : Association to UMGeneral;
    precio_unitario : Decimal;
    analisis_precio : Composition of many AnalisisPreciosPartidaAdicional
                          on analisis_precio.partida_adicional = $self;
}

entity PartidasAmpliaciones : cuid {
    acta_ampliacion   : Association to ActasAmpliaciones;
    codigo1           : String;
    codigo2           : String;
    codigo3           : String;
    codigo4           : String;
    codigo5           : String;
    item              : Association to ItemPartidimetro;
    subitem           : Association to SubitemPartidimetro;
    descripcion       : String;
    observacion       : String;
    cantidad          : Integer;
    cantidad_excedida : Integer;
    um                : Association to UMGeneral;
    precio_unitario   : Decimal;
    analisis_precio   : Composition of many AnalisisPreciosPartidaAmpliacion
                            on analisis_precio.partida_ampliacion = $self;
}

entity ItemsPartidaAdicional : cuid, managed {
    partida       : Association to AnalisisPreciosPartidaAdicional;
    descripcion   : String;
    unidad_medida : Association to UnidadesMedidaMateriales;
    cantidad      : Decimal;
    precio        : Decimal;
}

entity ItemsPartidaAmpliacion : cuid, managed {
    partida       : Association to AnalisisPreciosPartidaAmpliacion;
    descripcion   : String;
    unidad_medida : Association to UnidadesMedidaMateriales;
    cantidad      : Decimal;
    precio        : Decimal;
}

entity ItemsPartidaMedicion : cuid, managed {
    partida       : Association to AnalisisPreciosPartidaMedicion;
    descripcion   : String;
    unidad_medida : Association to UnidadesMedidaMateriales;
    cantidad      : Decimal;
    precio        : Decimal;
}

entity MaterialesPartida : ItemsPartida {
    importes : Composition of many ImportesMateriales
                   on importes.material = $self;
}

entity EquiposPartida : ItemsPartida {
    importes : Composition of many ImportesEquipos
                   on importes.equipo = $self;
}

entity CombustiblesPartida : ItemsPartida {
    importes : Composition of many ImportesCombustibles
                   on importes.combustible = $self;
}

entity ManoObraPartida : ItemsPartida {
    importes : Composition of many ImportesManoObra
                   on importes.mano_obra = $self;
}

entity ImportesMateriales : cuid {
    material    : Association to MaterialesPartida;
    moneda      : Association to Monedas;
    precio      : Decimal;
    cantidad    : Decimal;
    total       : Decimal;
    tipo_cambio : Decimal;
}

entity ImportesEquipos : cuid {
    equipo      : Association to EquiposPartida;
    moneda      : Association to Monedas;
    precio      : Decimal;
    cantidad    : Decimal;
    total       : Decimal;
    tipo_cambio : Decimal;
}

entity ImportesCombustibles : cuid {
    combustible : Association to CombustiblesPartida;
    moneda      : Association to Monedas;
    precio      : Decimal;
    cantidad    : Decimal;
    total       : Decimal;
    tipo_cambio : Decimal;
}

entity ImportesManoObra : cuid {
    mano_obra   : Association to ManoObraPartida;
    moneda      : Association to Monedas;
    precio      : Decimal;
    cantidad    : Decimal;
    total       : Decimal;
    tipo_cambio : Decimal;
}

entity MaterialesPartidaAdicional : ItemsPartidaAdicional {
    importes : Composition of many ImportesMaterialesAdicional
                   on importes.material = $self;
}

entity EquiposPartidaAdicional : ItemsPartidaAdicional {
    importes : Composition of many ImportesEquiposAdicional
                   on importes.equipo = $self;
}

entity CombustiblesPartidaAdicional : ItemsPartidaAdicional {
    importes : Composition of many ImportesCombustiblesAdicional
                   on importes.combustible = $self;
}

entity ManoObraPartidaAdicional : ItemsPartidaAdicional {
    importes : Composition of many ImportesManoObraAdicional
                   on importes.mano_obra = $self;
}

entity ImportesMaterialesAdicional : cuid {
    material    : Association to MaterialesPartidaAdicional;
    moneda      : Association to Monedas;
    precio      : Decimal;
    cantidad    : Decimal;
    total       : Decimal;
    tipo_cambio : Decimal;
}

entity ImportesEquiposAdicional : cuid {
    equipo      : Association to EquiposPartidaAdicional;
    moneda      : Association to Monedas;
    precio      : Decimal;
    cantidad    : Decimal;
    total       : Decimal;
    tipo_cambio : Decimal;
}

entity ImportesCombustiblesAdicional : cuid {
    combustible : Association to CombustiblesPartidaAdicional;
    moneda      : Association to Monedas;
    precio      : Decimal;
    cantidad    : Decimal;
    total       : Decimal;
    tipo_cambio : Decimal;
}

entity ImportesManoObraAdicional : cuid {
    mano_obra   : Association to ManoObraPartidaAdicional;
    moneda      : Association to Monedas;
    precio      : Decimal;
    cantidad    : Decimal;
    total       : Decimal;
    tipo_cambio : Decimal;
}

entity MaterialesPartidaAmpliacion : ItemsPartidaAmpliacion {
    importes : Composition of many ImportesMaterialesAmpliacion
                   on importes.material = $self;
}

entity EquiposPartidaAmpliacion : ItemsPartidaAmpliacion {
    importes : Composition of many ImportesEquiposAmpliacion
                   on importes.equipo = $self;
}

entity CombustiblesPartidaAmpliacion : ItemsPartidaAmpliacion {
    importes : Composition of many ImportesCombustiblesAmpliacion
                   on importes.combustible = $self;
}

entity ManoObraPartidaAmpliacion : ItemsPartidaAmpliacion {
    importes : Composition of many ImportesManoObraAmpliacion
                   on importes.mano_obra = $self;
}

entity ImportesMaterialesAmpliacion : cuid {
    material    : Association to MaterialesPartidaAmpliacion;
    moneda      : Association to Monedas;
    precio      : Decimal;
    cantidad    : Decimal;
    total       : Decimal;
    tipo_cambio : Decimal;
}

entity ImportesEquiposAmpliacion : cuid {
    equipo      : Association to EquiposPartidaAmpliacion;
    moneda      : Association to Monedas;
    precio      : Decimal;
    cantidad    : Decimal;
    total       : Decimal;
    tipo_cambio : Decimal;
}

entity ImportesCombustiblesAmpliacion : cuid {
    combustible : Association to CombustiblesPartidaAmpliacion;
    moneda      : Association to Monedas;
    precio      : Decimal;
    cantidad    : Decimal;
    total       : Decimal;
    tipo_cambio : Decimal;
}

entity ImportesManoObraAmpliacion : cuid {
    mano_obra   : Association to ManoObraPartidaAmpliacion;
    moneda      : Association to Monedas;
    precio      : Decimal;
    cantidad    : Decimal;
    total       : Decimal;
    tipo_cambio : Decimal;
}

entity MaterialesPartidaMedicion : ItemsPartidaMedicion {
    importes : Composition of many ImportesMaterialesMedicion
                   on importes.material = $self;
}

entity EquiposPartidaMedicion : ItemsPartidaMedicion {
    importes : Composition of many ImportesEquiposMedicion
                   on importes.equipo = $self;
}

entity CombustiblesPartidaMedicion : ItemsPartidaMedicion {
    importes : Composition of many ImportesCombustiblesMedicion
                   on importes.combustible = $self;
}

entity ManoObraPartidaMedicion : ItemsPartidaMedicion {
    importes : Composition of many ImportesManoObraMedicion
                   on importes.mano_obra = $self;
}

entity ImportesMaterialesMedicion : cuid {
    material    : Association to MaterialesPartidaMedicion;
    moneda      : Association to Monedas;
    precio      : Decimal;
    cantidad    : Decimal;
    total       : Decimal;
    tipo_cambio : Decimal;
}

entity ImportesEquiposMedicion : cuid {
    equipo      : Association to EquiposPartidaMedicion;
    moneda      : Association to Monedas;
    precio      : Decimal;
    cantidad    : Decimal;
    total       : Decimal;
    tipo_cambio : Decimal;
}

entity ImportesCombustiblesMedicion : cuid {
    combustible : Association to CombustiblesPartidaMedicion;
    moneda      : Association to Monedas;
    precio      : Decimal;
    cantidad    : Decimal;
    total       : Decimal;
    tipo_cambio : Decimal;
}

entity ImportesManoObraMedicion : cuid {
    mano_obra : Association to ManoObraPartidaMedicion;
    moneda    : Association to Monedas;
    precio    : Decimal;
    cantidad  : Decimal;
    total     : Decimal;
}

entity AnalisisPreciosPartidaAdicional : cuid, managed {
    partida_adicional   : Association to PartidasAdicionales;
    nro_apu             : Integer;
    ponderaciones       : Composition of many PonderacionesAdicionales
                              on ponderaciones.apu = $self;
    estado              : Association to EstadosGeneral;
    materiales          : Composition of many MaterialesPartidaAdicional
                              on materiales.partida = $self;
    equipos             : Composition of many EquiposPartidaAdicional
                              on equipos.partida = $self;
    combustibles        : Composition of many CombustiblesPartidaAdicional
                              on combustibles.partida = $self;
    mano_obra           : Composition of many ManoObraPartidaAdicional
                              on mano_obra.partida = $self;

    gastos_indirectos   : Decimal;
    gastos_generales    : Decimal;
    costo_financiero    : Decimal;
    beneficios          : Decimal;
    impuestos_ganancias : Decimal;
    impuestos_credito   : Decimal;
    impuestos_ingresos  : Decimal;
    total               : Decimal;
    fecha               : Date;
}

entity AnalisisPreciosPartidaAmpliacion : cuid, managed {
    partida_ampliacion  : Association to PartidasAmpliaciones;
    nro_apu             : Integer;
    ponderaciones       : Composition of many PonderacionesAmpliacion
                              on ponderaciones.apu = $self;
    estado              : Association to EstadosGeneral;
    materiales          : Composition of many MaterialesPartidaAmpliacion
                              on materiales.partida = $self;
    equipos             : Composition of many EquiposPartidaAmpliacion
                              on equipos.partida = $self;
    combustibles        : Composition of many CombustiblesPartidaAmpliacion
                              on combustibles.partida = $self;
    mano_obra           : Composition of many ManoObraPartidaAmpliacion
                              on mano_obra.partida = $self;

    gastos_indirectos   : Decimal;
    gastos_generales    : Decimal;
    costo_financiero    : Decimal;
    beneficios          : Decimal;
    impuestos_ganancias : Decimal;
    impuestos_credito   : Decimal;
    impuestos_ingresos  : Decimal;
    total               : Decimal;
    fecha               : Date;
}

entity AnalisisPreciosPartidaMedicion : cuid, managed {
    partida_ampliacion  : Association to PartidasMediciones;
    nro_apu             : Integer;
    ponderaciones       : Composition of many PonderacionesMedicion
                              on ponderaciones.apu = $self;
    estado              : Association to EstadosGeneral;
    materiales          : Composition of many MaterialesPartidaMedicion
                              on materiales.partida = $self;
    equipos             : Composition of many EquiposPartidaMedicion
                              on equipos.partida = $self;
    combustibles        : Composition of many CombustiblesPartidaMedicion
                              on combustibles.partida = $self;
    mano_obra           : Composition of many ManoObraPartidaMedicion
                              on mano_obra.partida = $self;

    gastos_indirectos   : Decimal;
    gastos_generales    : Decimal;
    costo_financiero    : Decimal;
    beneficios          : Decimal;
    impuestos_ganancias : Decimal;
    impuestos_credito   : Decimal;
    impuestos_ingresos  : Decimal;
    total               : Decimal;
    fecha               : Date;
}

entity ActasConstatacion : cuid, managed {
    pi                        : Association to ObraPI;
    acopio_material           : Association to AcopiosMateriales;
    nro_acta                  : Integer;
    estado                    : Association to EstadosGeneral;
    mes                       : String;
    anio                      : String;
    fecha_envio               : Date;
    referencia                : String;
    inspector                 : String;
    representante_contratista : String;
    representante_adicional   : String;
    direccion_representada    : String;
    direccion_acopio          : String;
    observaciones             : String;
    partidas                  : Composition of many PartidasActaConstatacion
                                    on partidas.acta_constatacion = $self;
    documentacion             : Composition of many DocumentacionActaConstatacion
                                    on documentacion.acta_constatacion = $self;
}

entity PartidasActaConstatacion : cuid, managed {
    acta_constatacion                   : Association to ActasConstatacion;
    pi                                  : Association to ObraPI;
    codigo1                             : String;
    codigo2                             : String;
    codigo3                             : String;
    codigo4                             : String;
    codigo5                             : String;
    descripcion_partidimetro            : String;
    cantidad_partidimetro               : Integer;
    um_partidimetro                     : String;
    cantidad_factura_segun_partidimetro : Integer;
    numero_serie                        : String;
    modelo                              : String;
    datos_adicionales                   : String;
    item                                : Association to ItemPartidimetro;
    subitem                             : Association to SubitemPartidimetro;
}

entity DocumentacionActaConstatacion : cuid, managed {
    acta_constatacion : Association to ActasConstatacion;
    ruta              : String;
    nombre            : String;
}

entity MemoriaCriteriosEL : cuid, managed {
    subitem       : Association to SubitemPartidimetro;
    montaje       : Boolean default false;
    orden_compra  : Boolean default false;
    pie_obra      : Boolean default false;
    puesta_marcha : Boolean default false;
    avance_taller : Boolean default false;
    proporcional  : Boolean default false;
    porcentaje    : Decimal;
}

entity MemoriaCriteriosCI : cuid, managed {
    subitem       : Association to SubitemPartidimetro;
    montaje       : Boolean default false;
    orden_compra  : Boolean default false;
    pie_obra      : Boolean default false;
    puesta_marcha : Boolean default false;
    avance_taller : Boolean default false;
    proporcional  : Boolean default false;
    porcentaje    : Decimal;
}

entity TiposBomba : IdDescripcion {}
entity RespuestasGeneral : IdDescripcion {}

entity PruebasHidraulicas : cuid, managed {
    pi                              : Association to ObraPI;
    nro_ph                          : Integer;
    estado                          : Association to EstadosGeneral;
    fecha_envio                     : Date;
    fecha_ejecucion                 : Date;
    tramos                          : Composition of many PHTramos
                                          on tramos.prueba_hidraulica = $self;
    fluido                          : Association to Fluidos;
    diametro                        : Decimal;
    um_diametro                     : Association to UMGeneral;
    material                        : String;
    longitud                        : Decimal;
    um_longitud                     : Association to UMGeneral;
    equipamiento                    : String;
    manometro                       : String;
    nro_serie                       : String;
    nro_cert_calibracion            : String;
    fecha_vencimiento               : Date;
    tipo_bomba                      : Association to TiposBomba;
    presion_requerida               : Decimal;
    um_presion_requerida            : Association to UMGeneral;
    presion_alcanzada               : Decimal;
    um_presion_alcanzada            : Association to UMGeneral;
    perdida_admisible               : Decimal;
    perdida_existente               : Decimal;
    um_perdida_admisible            : Association to UMGeneral;
    um_perdida_existente            : Association to UMGeneral;
    nro_calibre                     : String;
    hora_comienzo                   : Time;
    hora_finalizacion               : Time;
    tiempo_requerido                : Time;
    mandrilado                      : Association to RespuestasGeneral;
    fecha_mandrilado                : Date;
    ensayo_luz                      : Association to RespuestasGeneral;
    fecha_ensayo_luz                : Date;
    comentarios                     : String;
    conexion_corta                  : Integer;
    conexion_larga                  : Integer;
    documentacion_prueba_hidraulica : Composition of many DocumentacionPruebaHidraulica
                                          on documentacion_prueba_hidraulica.prueba_hidraulica = $self;
}

entity DocumentacionPruebaHidraulica : cuid, managed {
    prueba_hidraulica : Association to PruebasHidraulicas;
    nombre            : String;
    tipo_archivo      : String;
    ruta              : String;
}

entity Ensayos : cuid, managed {
    pi              : Association to ObraPI;
    nombre          : String;
    ruta            : String;
    fecha_ejecucion : Date;
    fecha_envio     : Date;
    observaciones   : String;
    estado          : Association to EstadosGeneral;
    test            : String;
}

entity MemoriaCalculoOCE : cuid, managed {
    pi                     : Association to ObraPI;
    nro_memoria_calculo    : Integer;
    dia                    : String(2);
    mes                    : String(2);
    anio                   : String(4);
    partidas_contractuales : Decimal;
    partidas_excedidas     : Decimal;
    partidas_adicionales   : Decimal;
    partidas_ampliaciones  : Decimal;
    economias              : Decimal;
    total                  : Decimal;
    estado                 : Association to EstadosGeneral;
    acta_medicion          : Association to ActasMedicion;
    //certificado: Association to
    observaciones          : String;

    partidas_acumuladas    : Composition of many MemoriaPartidasOCE
                                 on partidas_acumuladas.memoria_calculo = $self;
}

entity MemoriaCalculoCI : cuid, managed {
    pi                     : Association to ObraPI;
    nro_memoria_calculo    : Integer;
    dia                    : String(2);
    mes                    : String(2);
    anio                   : String(4);
    partidas_contractuales : Decimal;
    partidas_excedidas     : Decimal;
    partidas_adicionales   : Decimal;
    partidas_ampliaciones  : Decimal;
    economias              : Decimal;
    total                  : Decimal;
    estado                 : Association to EstadosGeneral;
    acta_medicion          : Association to ActasMedicion;
    //certificado: Association to
    observaciones          : String;

    partidas_acumuladas    : Composition of many MemoriaPartidasCI
                                 on partidas_acumuladas.memoria_calculo = $self;
}

entity PartidasAcumuladasOCE : cuid, managed {
    memoria_calculo     : Association to MemoriaCalculoOCE;
    pi                  : Association to ObraPI;
    codigo1             : String;
    codigo2             : String;
    codigo3             : String;
    codigo4             : String;
    codigo5             : String;
    cantidad_certificar : Decimal;
    monto_certificar    : Decimal;
    moneda              : Association to Monedas;
}

entity Certificaciones : cuid, managed {
    pi                        : Association to ObraPI;
    nro_certificado           : Integer;
    mes                       : String;
    anio                      : String;
    estado                    : Association to EstadosGeneral;
    partidas_contractuales    : Decimal;
    partidas_excedidas        : Decimal;
    partidas_adicionales      : Decimal;
    partidas_ampliaciones     : Decimal;
    economias                 : Decimal;
    acopio_materiales         : Decimal;
    redeterminacion           : Decimal;
    multas                    : Decimal;
    otros_recargos_gravado    : Decimal;
    otros_recargos_no_gravado : Decimal;
    total                     : Decimal;
    total_moneda_local        : Decimal;
    total_moneda_extranjera   : Decimal;
    memoria_calculo           : Association to MemoriaCalculo;
    acta_medicion             : Association to ActasMedicion;
    observaciones             : String;
    detalle_certificaciones   : Composition of many DetalleCertificaciones
                                    on detalle_certificaciones.certificacion = $self;
    otros_conceptos           : Composition of many OtrosConceptosCertificaciones
                                    on otros_conceptos.certificacion = $self;
}

entity DetalleCertificaciones : cuid, managed {
    certificacion : Association to Certificaciones;

}

entity OtrosConceptosCertificaciones : cuid, managed {
    certificacion   : Association to Certificaciones;
    tipo_concepto   : String; //Esto lleva una asociacion q hay q definir
    recibe_gravamen : Boolean;
    suma_resta      : String;
    descripcion     : String;
    monto           : Decimal;
    ruta_archivo    : String;
    nombre_archivo  : String;

}


entity MemoriaPartidasOCE : cuid, managed {
    memoria_calculo            : Association to MemoriaCalculoOCE;
    pi                         : Association to ObraPI;
    item                       : Association to ItemPartidimetro;
    subitem                    : Association to SubitemPartidimetro;
    codigo1                    : String;
    codigo2                    : String;
    codigo3                    : String;
    codigo4                    : String;
    codigo5                    : String;
    orden_compra               : Decimal;
    avance_taller              : Decimal;
    pie_obra                   : Decimal;
    puesta_marcha              : Decimal;
    montaje                    : Decimal;
    cantidad_partida           : Decimal;
    precio_unitario            : Decimal;
    porcentaje_certificacion   : Decimal;
    cantidad_certificar        : Decimal;
    monto_certificar           : Decimal;
    tipo_partida               : Association to TiposPartidas;
    cantidad_contractual       : Decimal;
    descripcion                : String;
    moneda                     : Association to Monedas;
    unidad_partida             : Association to UMGeneral;
    certificacion_mes_anterior : Decimal;
}

entity MemoriaPartidasCI : cuid, managed {
    memoria_calculo            : Association to MemoriaCalculoCI;
    pi                         : Association to ObraPI;
    item                       : Association to ItemPartidimetro;
    subitem                    : Association to SubitemPartidimetro;
    codigo1                    : String;
    codigo2                    : String;
    codigo3                    : String;
    codigo4                    : String;
    codigo5                    : String;
    cantidad_partida           : Decimal;
    precio_unitario            : Decimal;
    porcentaje_certificacion   : Decimal;
    cantidad_certificar        : Decimal;
    monto_certificar           : Decimal;
    tipo_partida               : Association to TiposPartidas;
    cantidad_contractual       : Decimal;
    descripcion                : String;
    moneda                     : Association to Monedas;
    unidad_partida             : Association to UMGeneral;
    certificacion_mes_anterior : Decimal;
}

entity ActasEconomias : cuid, managed {
    acta                 : Association to Actas;
    pi                   : Association to ObraPI;
    estado               : Association to EstadosGeneral;
    nro_acta             : Integer;
    fecha_acta           : Date;
    mes                  : String;
    anio                 : String;
    fecha_envio          : Date;
    monto                : Decimal;
    porcentaje_economias : Decimal;
    porcentaje_acumulado : Decimal;
    justificacion        : String;
    descripcion          : String;
    partidas_economias   : Composition of many PartidasEconomias
                               on partidas_economias.acta_economia = $self;
    envelopeId           : String;
}

entity PartidasEconomias : cuid {
    acta_economia     : Association to ActasEconomias;
    codigo1           : String;
    codigo2           : String;
    codigo3           : String;
    codigo4           : String;
    codigo5           : String;
    item              : Association to ItemPartidimetro;
    subitem           : Association to SubitemPartidimetro;
    descripcion       : String;
    Observaciones     : String;
    cantidad_original : Decimal;
    cantidad_deducir  : Decimal;
    um                : Association to UMGeneral;
    precio_unitario   : Decimal;
}

entity PHTramos : cuid {
    prueba_hidraulica : Association to PruebasHidraulicas;
    tramo             : Association to Tramos;
}

entity ActasExcedidas : cuid, managed {
    acta                 : Association to Actas;
    pi                   : Association to ObraPI;
    estado               : Association to EstadosGeneral;
    nro_acta             : Integer;
    fecha_acta           : Date;
    fecha_envio          : Date;
    monto                : Decimal;
    porcentaje_excedidas : Decimal;
    porcentaje_acumulado : Decimal;
    justificacion        : String;
    descripcion          : String;
    partidas_excedidas   : Composition of many PartidasExcedidas
                               on partidas_excedidas.acta_excedida = $self;
    documentacion        : Composition of many DocumentacionExcedidas
                               on documentacion.acta_excedida = $self;
    envelopeId           : String;
}

entity PartidasExcedidas : cuid {
    acta_excedida      : Association to ActasExcedidas;
    codigo1            : String;
    codigo2            : String;
    codigo3            : String;
    codigo4            : String;
    codigo5            : String;
    item               : Association to ItemPartidimetro;
    subitem            : Association to SubitemPartidimetro;
    descripcion        : String;
    cantidad           : Decimal;
    um                 : Association to UMGeneral;
    precio_unitario    : Decimal;
    cantidad_excedidas : Decimal;
    precio_excedidas   : Decimal;
}

entity PartidasAmpliacionesExcedidas : cuid {
    acta_ampliacion    : Association to ActasAmpliaciones;
    codigo1            : String;
    codigo2            : String;
    codigo3            : String;
    codigo4            : String;
    codigo5            : String;
    item               : Association to ItemPartidimetro;
    subitem            : Association to SubitemPartidimetro;
    descripcion        : String;
    cantidad           : Decimal;
    um                 : Association to UMGeneral;
    precio_unitario    : Decimal;
    cantidad_excedidas : Decimal;
    precio_excedidas   : Decimal;
}

entity DocumentacionExcedidas : cuid, managed {
    acta_excedida : Association to ActasExcedidas;
    nombre        : String;
    tipo_archivo  : String;
    ruta          : String;
}

entity DocumentacionSuspension : cuid, managed {
    acta_suspension : Association to ActasSuspension;
    nombre          : String;
    tipo_archivo    : String;
    ruta            : String;
}

entity ControlesSostenimiento : cuid, managed {
    pi          : Association to ObraPI;
    nro_control : Integer;
    fecha_envio : Date;
    estado      : Association to EstadosGeneral;
    fecha_desde : Date;
    fecha_hasta : Date;
    referencia  : String;
    frentes     : Composition of many FrentesTrabajo
                      on frentes.control_sostenimiento = $self;
}

entity FrentesTrabajo : cuid, managed {
    control_sostenimiento        : Association to ControlesSostenimiento;
    tramo                        : Association to Tramos;
    inspeccion_seguridad_higiene : Association to InspeccionesSeguridadHigiene;
    progresiva                   : Decimal;
    nro_propiedad                : String;
    camara                       : String;
    hora_llegada                 : Time;
    hora_salida                  : Time;
    sostenimiento_cumple         : Boolean default false;
    observaciones                : String;
}


entity InspeccionesSeguridadHigiene : cuid, managed {
    pi                            : Association to ObraPI;
    nro_inspeccion                : Integer;
    estado                        : Association to EstadosGeneral;
    fecha_envio                   : Date;
    fecha_desde                   : Date;
    fecha_hasta                   : Date;
    tramo                         : Association to Tramos;
    frentes                       : Composition of many InspeccionToFrentes
                                        on frentes.inspeccion_seguridad_higiene = $self;
    responsable_seguridad_higiene : String;
    responsable_contratista       : String;
    hora_entrada                  : Time;
    hora_salida                   : Time;
    duracion                      : Time;
    dominio                       : String;
    kilometraje                   : Decimal;
    tareas_realizadas             : String;
    catindad_personal             : Integer;
    catindad_accidentes           : Integer;
    elementos_proteccion          : String;
    delimitacion                  : String;
    instalacion_electrica         : String;
    almacenamiento_materiales     : String;
    equipos_viales                : String;
    escaleras_andamios            : String;
    excavaciones                  : String;
    espacios_confinados           : String;
    desvios_operativos            : String;
    observaciones                 : String;
    relevamiento_fotografico      : Composition of many FotografiasInspeccionSeguridadHigiene
                                        on relevamiento_fotografico.inspeccion_seguridad_higiene = $self;
    respuestas                    : Composition of one RespuestasSeguridadHigiene
                                        on respuestas.inspeccion_seguridad_higiene = $self;
}

entity InspeccionToFrentes {
    key inspeccion_seguridad_higiene : Association to InspeccionesSeguridadHigiene;
    key frente                       : Association to FrentesTrabajo;
}

entity FotografiasSeguridadHigiene : cuid, managed {
    nombre       : String;
    tipo_archivo : String;
    ruta         : String;
}

entity FotografiasInspeccionSeguridadHigiene : FotografiasSeguridadHigiene {
    inspeccion_seguridad_higiene : Association to InspeccionesSeguridadHigiene;

}

entity FotografiasRespuestaSeguridadHigiene : FotografiasSeguridadHigiene {
    respuestas_seguridad_higiene : Association to RespuestasSeguridadHigiene;
}


entity RespuestasSeguridadHigiene : cuid, managed {
    inspeccion_seguridad_higiene : Association to InspeccionesSeguridadHigiene;
    nro_respuesta                : Integer;
    fecha_envio                  : Date;
    fecha_desde                  : Date;
    fecha_hasta                  : Date;
    estado                       : Association to EstadosGeneral;
    orden_servicio               : Association to OrdenesServicio;
    elementos_proteccion         : String;
    delimitacion                 : String;
    instalacion_electrica        : String;
    almacenamiento_materiales    : String;
    equipos_viales               : String;
    escaleras_andamios           : String;
    excavaciones                 : String;
    espacios_confinados          : String;
    desvios_operativos           : String;
    observaciones                : String;
    relevamiento_fotografico     : Composition of many FotografiasRespuestaSeguridadHigiene
                                       on relevamiento_fotografico.respuestas_seguridad_higiene = $self;
}

entity InspeccionesMedioambiente : cuid, managed {
    pi                               : Association to ObraPI;
    nro_inspeccion                   : Integer;
    estado                           : Association to EstadosGeneral;
    fecha_envio                      : Date;
    fecha_desde                      : Date;
    fecha_hasta                      : Date;
    referencia                       : String;
    responsable_medioambiente        : String;
    responsable_contratista          : String;
    hora_entrada                     : Time;
    hora_salida                      : Time;
    duracion                         : Time;
    frente                           : Association to FrentesTrabajo;
    etapa_construccion               : String;
    instalacion_cielo_abierto        : Boolean default false;
    tuneleria_rigida                 : Boolean default false;
    metodologia_otro                 : Boolean default false;
    metodologia_otro_indique         : String;
    pala_minicargadora               : Boolean default false;
    retroexcavadora                  : Boolean default false;
    martillo_electrico               : Boolean default false;
    martillo_neumatico               : Boolean default false;
    aserradora_pavimento             : Boolean default false;
    tunelera                         : Boolean default false;
    compactadora                     : Boolean default false;
    moto_compresor                   : Boolean default false;
    grupo_electrogeno                : Boolean default false;
    bomba                            : Boolean default false;
    banio_quimico                    : Boolean default false;
    tuneleria_neumatica              : Boolean default false;
    tuneleria_mecanica               : Boolean default false;
    barreno_en_seco                  : Boolean default false;
    barreno_con_agua                 : Boolean default false;
    tablestacado_no_se_utiliza       : Boolean default false;
    aputalamiento_natural            : Boolean default false;
    por_vibracion                    : Boolean default false;
    por_impacto                      : Boolean default false;
    kit_antiderramos                 : Boolean default false;
    panios_absorbentes               : Boolean default false;
    arena                            : Boolean default false;
    otros                            : Boolean default false;
    bandeja_antiderrame              : Boolean default false;
    mantenimiento_maquinaria         : Boolean default false;
    trasvase_combustible             : Boolean default false;
    aire_ruidos                      : Boolean default false;
    aire_olores                      : Boolean default false;
    aire_polvo                       : Boolean default false;
    regadores                        : Boolean default false;
    coberturas_camiones              : Boolean default false;
    obra_delimitada                  : Boolean default false;
    balizamiento_a_bateria           : Boolean default false;
    balizamiento_material_reflectivo : Boolean default false;
    balizamiento_otros               : Boolean default false;
    balizamiento_otros_indique       : String;
    trabajo_en_vereda                : Boolean default false;
    corte_parcial_calzada            : Boolean default false;
    corte_total_calzada              : Boolean default false;
    control_en_tiempo                : Boolean default false;
    compensa_cochera                 : Boolean default false;
    chapon                           : Boolean default false;
    acceso_vehicular_otros           : Boolean default false;
    escurrimiento_no_se_genera       : Boolean default false;
    liquido_en_calzada               : Boolean default false;
    liquido_a_desague                : Boolean default false;
    sortea_arboles                   : Boolean default false;
    se_extrae_arbol                  : Boolean default false;
    no_afecta_arbol                  : Boolean default false;
    telefono_en_frente               : Boolean default false;
    telefono_fuera_frente            : Boolean default false;
    telefono_a_disposicion           : Boolean default false;
    deposito_no_se_observa           : Boolean default false;
    deposito_cestos                  : Boolean default false;
    deposito_marco_bolsa             : Boolean default false;
    deposito_otros                   : Boolean default false;
    separacion_residuos_madera       : Boolean default false;
    separacion_residuos_hierro       : Boolean default false;
    separacion_residuos_escombros    : Boolean default false;
    separacion_residuos_otros        : Boolean default false;
    reutilizacion_material           : String;
    lavado_hormigon_volcado          : Boolean default false;
    lavado_hormigon_reutilizado      : Boolean default false;
    lavado_hormigon_sitio            : Boolean default false;
    lavado_hormigon_no               : Boolean default false;
    acopio_bolsones                  : Boolean default false;
    acopio_encajonados               : Boolean default false;
    acopio_sin_contencion            : Boolean default false;
    acopio_otros                     : Boolean default false;
    observaciones                    : String;
    fotografias                      : Composition of many FotografiasInspeccionMedioambiente
                                           on fotografias.inspeccion_medioambiente = $self;
}

entity FotografiasInspeccionMedioambiente : cuid, managed {
    inspeccion_medioambiente : Association to InspeccionesMedioambiente;
    nombre                   : String;
    tipo_archivo             : String;
    ruta                     : String;
}

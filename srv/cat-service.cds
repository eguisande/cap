using {com.aysa.pgo as pgo} from '../db/data-model';

@cds.query.limit.max : 9999

service CatalogService {

    type CatalogoDocumentosNDSODP : {
        area_ID              : String;
        area_descripcion     : String;
        documento_adjunto_ID : UUID;
        documento_adjunto    : String;
        fecha_entrega        : Date;
        estado_ID            : String;
        estado_descripcion   : String;
        estado_color         : String;
    };

    type datosActasMemoriaCalculo : {
        memoria_calculo            : UUID;
        pi                         : Association to ObraPI;
        item                       : Association to ItemPartidimetro;
        subitem                    : Association to SubItemPartidimetro;
        codigo1                    : String;
        codigo2                    : String;
        codigo3                    : String;
        codigo4                    : String;
        codigo5                    : String;
        ID                         : UUID;
        orden_compra               : Boolean;
        avance_taller              : Decimal;
        pie_obra                   : Boolean;
        puesta_marcha              : Boolean;
        montaje                    : Boolean;
        cantidad_partida           : Decimal;
        precio_unitario            : Decimal;
        porcentaje_certificacion   : Decimal;
        cantidad_certificar        : Decimal;
        monto_certificar           : Decimal;
        tipo_partida               : String;
        cantidad_contractual       : Decimal;
        descripcion                : String;
        moneda                     : Association to Monedas;
        unidad_partida             : Association to UMGeneral;
        certificacion_mes_anterior : Decimal;
        cantidades_acopiadas       : Decimal;
        total_acum_anterior        : Decimal;
        total_acum_presente        : Decimal;
        cantidades_desacopiar      : Decimal;
        estimacion_mensual         : Decimal;
        total_mensual              : Decimal;
    }

    type AnexosList : {
        nro           : Integer;
        descripcion   : String;
        estado_ID     : String;
        obligatorio   : Boolean;
        observaciones : String;
        tipo_anexo    : String;
        acopio        : String;
        pi            : Association to ObraPI;
        nro_anexo     : Integer;
        estado        : String;
        ruta          : String;
    }

    type MaterialesToSend {
        descripcion : String;
        cantidad    : Integer;
        um          : String;
    }

    type TramosFormateados {
        tramo_ID      : UUID;
        nro_propiedad : String;
        progresiva    : Decimal;
        conexion_ID   : UUID;
    }

    type PartidasMateriales {
        ID                  : UUID;
        createdAt           : Date;
        createdBy           : String;
        modifiedAt          : Date;
        modifiedBy          : String;
        item_partida_ID     : UUID;
        subitem_partida_ID  : UUID;
        tipo_partida_ID     : UUID;
        partidimetro_ID     : UUID;
        codigo1             : String;
        codigo2             : String;
        codigo3             : String;
        codigo4             : String;
        codigo5             : String;
        item                : String;
        subitem             : String;
        designacion         : String;
        unidad              : String;
        ruta_oc             : String;
        nombre_archivo_oc   : String;
        cantidad            : Integer;
        precio_unitario     : Decimal;
        fecha_puesta_marcha : Date;
        fecha_pie_obra      : Date;
        fecha_orden_compra  : Date;
        fecha_montaje       : Date;
        fecha_colocacion    : Date;
        porc_avance_taller  : Decimal;
        materiales          : array of MaterialesToSend;
    }

    type DatosUltimoPartidimetro {
        obraPI_ID : UUID;
        partidas  : array of CodigosYIDDetallePartidimetro;
        items     : array of ItemsFuncion
    }

    type CodigosYIDDetallePartidimetro {
        ID                 : UUID;
        codigo1            : String;
        codigo2            : String;
        codigo3            : String;
        codigo4            : String;
        codigo5            : String;
        cantidad           : Integer;
        precio_unitario    : Integer;
        descripcion        : String;
        item               : String;
        item_partida_ID    : String;
        subitem            : String;
        subitem_partida_ID : String;
        unidad             : String;
        unidad_ID          : String;
    }

    type ItemsFuncion {
        ID          : String;
        descripcion : String;
        subitems    : array of SubitemsFuncion;
    }

    type SubitemsFuncion {
        ID          : String;
        descripcion : String;
    }

    type HistorialOdsNdp {
        tipo_comunicacion : String;
        nro               : String;
        fecha_envio       : Date;
        rta_nro           : String;
        envelopeId        : UUID;
        id                : UUID;
        responsable       : String;
    }

    entity Obras                                 as projection on pgo.Obras;

    entity Inspectores                           as projection on pgo.Inspectores order by
        nombre;

    entity TiposObras                            as projection on pgo.TiposObras order by
        descripcion;

    entity TiposInspectores                      as projection on pgo.TiposInspectores order by
        descripcion;

    entity TiposContratos                        as projection on pgo.TiposContratos order by
        descripcion;

    entity TiposPartidas                         as projection on pgo.TiposPartidas order by
        descripcion;

    entity TiposActa                             as projection on pgo.TiposActa order by
        descripcion;

    entity Fluidos                               as projection on pgo.Fluidos order by
        descripcion;

    entity EstadosGeneral                        as projection on pgo.EstadosGeneral order by
        descripcion;

    entity Partidos                              as projection on pgo.Partidos order by
        descripcion asc;

    entity Referencias                           as projection on pgo.Referencias order by
        descripcion asc;

    entity Sistemas                              as projection on pgo.Sistemas order by
        descripcion;

    entity Monedas                               as projection on pgo.Monedas order by
        descripcion;

    entity SistemasContratacion                  as projection on pgo.SistemasContratacion order by
        descripcion;

    entity Financiamientos                       as projection on pgo.Financiamientos order by
        descripcion;

    entity UnidadesMedidaMateriales              as projection on pgo.UnidadesMedidaMateriales order by
        descripcion;

    entity Direcciones                           as projection on pgo.Direcciones order by
        descripcion;

    entity Gerencias                             as projection on pgo.Gerencias order by
        descripcion;


    entity Usuarios                              as projection on pgo.Usuarios;
    entity Ofertas                               as projection on pgo.Ofertas;
    entity Preconstrucciones                     as projection on pgo.Preconstrucciones;
    entity Contactos                             as projection on pgo.Contactos;
    entity Participantes                         as projection on pgo.Participantes;
    entity DocumentosPreconstruccion             as projection on pgo.DocumentosPreconstruccion;
    entity Entregas                              as projection on pgo.Entregas;
    entity Areas                                 as projection on pgo.Areas;
    entity CatalogoDocumentos                    as projection on pgo.CatalogoDocumentos;
    entity DocumentosAdjunto                     as projection on pgo.DocumentosAdjunto;
    entity Contratistas                          as projection on pgo.Contratistas;
    entity TiposContratistas                     as projection on pgo.TiposContratistas;
    entity TiposDocumentos                       as projection on pgo.TiposDocumentos;
    entity TiposPI                               as projection on pgo.TiposPI;
    entity Anexos                                as projection on pgo.Anexos;

    entity Paises                                as projection on pgo.Paises order by
        descripcion;


    entity Representantes                        as projection on pgo.Representantes;
    entity OrdenesCompraOracle                   as projection on pgo.OrdenesCompraOracle;
    entity OrdenesCompra                         as projection on pgo.OrdenesCompra;
    entity IntegrantesUTE                        as projection on pgo.IntegrantesUTE;
    entity ObraPI                                as projection on pgo.ObraPI;


    entity OrdenesServicio                       as projection on pgo.OrdenesServicio order by
        nro_orden_servicio;


    entity AnexosOrdenes                         as projection on pgo.AnexosOrdenes;
    entity Partidimetros                         as projection on pgo.Partidimetros;
    entity AnalisisPrecios                       as projection on pgo.AnalisisPrecios;


    entity DetallePartidimetro                   as projection on pgo.DetallePartidimetro order by
        codigo1,
        codigo2,
        codigo3,
        codigo4,
        codigo5;

    entity ActasPartida                          as projection on pgo.ActasPartida;
    entity CertificadosPolizas                   as projection on pgo.CertificadosPolizas;


    entity PlanesTrabajo                         as projection on pgo.PlanesTrabajo order by
        nro_plan;


    entity TareasPlanTrabajo                     as projection on pgo.TareasPlanTrabajo order by
        nro;


    entity NotasPedido                           as projection on pgo.NotasPedido;
    entity AnexosNotasPedido                     as projection on pgo.AnexosNotasPedido;
    entity Personal                              as projection on pgo.Personal;
    entity RolArea                               as projection on pgo.RolArea;
    entity Presentaciones                        as projection on pgo.Presentaciones;
    entity Planos                                as projection on pgo.Planos;
    entity Especialidades                        as projection on pgo.Especialidades;
    entity TipoDocumentosPlano                   as projection on pgo.TipoDocumentosPlano;
    entity Calificaciones                        as projection on pgo.Calificaciones;
    entity NotaDocumentoAdjunto                  as projection on pgo.NotaDocumentoAdjunto;
    entity OrdenDocumentoAdjunto                 as projection on pgo.OrdenDocumentoAdjunto;
    entity NotaPartidimetro                      as projection on pgo.NotaPartidimetro;
    entity OrdenPartidimetro                     as projection on pgo.OrdenPartidimetro;
    entity NotaPlanTrabajo                       as projection on pgo.NotaPlanTrabajo;
    entity OrdenPlanTrabajo                      as projection on pgo.OrdenPlanTrabajo;
    entity NotaPresentacion                      as projection on pgo.NotaPresentacion;
    entity OrdenPresentacion                     as projection on pgo.OrdenPresentacion;
    entity PermisosCatalogoDocumentos            as projection on pgo.PermisosCatalogoDocumentos;
    entity Entes                                 as projection on pgo.Entes;
    entity TiposPermiso                          as projection on pgo.TiposPermiso;
    entity GrupoArea                             as projection on pgo.GrupoArea;
    entity GrupoDocumento                        as projection on pgo.GrupoDocumento;
    entity PermisosTramo                         as projection on pgo.PermisosTramo;
    //entity PermisosDocumentos            as projection on pgo.PermisosDocumentos;
    entity DocumentosAysa                        as projection on pgo.DocumentosAysa;
    entity AccionesLog                           as projection on pgo.AccionesLog;
    entity PresentacionesSH                      as projection on pgo.PresentacionesSH;
    entity DocumentosSH                          as projection on pgo.DocumentosSH;
    entity PermisosSH                            as projection on pgo.PermisosSH;
    entity TiposCedula                           as projection on pgo.TiposCedula;
    entity CertificadosControlPolizas            as projection on pgo.CertificadosControlPolizas;
    entity VTV                                   as projection on pgo.VTV;
    entity LicenciasConducir                     as projection on pgo.LicenciasConducir;
    entity Cedulas                               as projection on pgo.Cedulas;
    entity RegistrosEspeciales                   as projection on pgo.RegistrosEspeciales;
    entity PermisosMunicipales                   as projection on pgo.PermisosMunicipales;
    entity PermisosEspeciales                    as projection on pgo.PermisosEspeciales;
    entity PermisosTramoDocumentos               as projection on pgo.PermisosTramoDocumentos;
    entity ActasRefActas                         as projection on pgo.ActasRefActas;
    entity PermisosMunicipalesDocumentos         as projection on pgo.PermisosMunicipalesDocumentos;
    entity PermisosEspecialesDocumentos          as projection on pgo.PermisosEspecialesDocumentos;
    entity Tramos                                as projection on pgo.Tramos;
    entity PlanosInterferencias                  as projection on pgo.PlanosInterferencias;
    entity ProgramasCateos                       as projection on pgo.ProgramasCateos;
    entity InformesCateo                         as projection on pgo.InformesCateo;
    entity InformesCateoAdjuntos                 as projection on pgo.InformesCateoAdjuntos;
    entity DocumentacionesAdicionales            as projection on pgo.DocumentacionesAdicionales;
    entity UMInterferencias                      as projection on pgo.UMInterferencias;
    entity ServiciosInterferencias               as projection on pgo.ServiciosInterferencias;
    entity DocumentoModificacionCabecera         as projection on pgo.DocumentoModificacionCabecera;
    entity DocumentoModificacionPosicion         as projection on pgo.DocumentoModificacionPosicion;
    entity TipoUM                                as projection on pgo.TipoUM;
    entity UMGeneral                             as projection on pgo.UMGeneral;
    entity DiagramasCuadra                       as projection on pgo.DiagramasCuadra;
    entity Planimetrias                          as projection on pgo.Planimetrias;
    entity GruposConexiones                      as projection on pgo.GruposConexiones;
    entity Conexiones                            as projection on pgo.Conexiones;
    entity TiposConexion                         as projection on pgo.TiposConexion;
    entity ConsumosPartida                       as projection on pgo.ConsumosPartida;
    entity Fechas                                as projection on pgo.Fechas;
    entity ReferenciasPlanimetria                as projection on pgo.ReferenciasPlanimetria;
    entity MacisosAnclaje                        as projection on pgo.MacisosAnclaje;
    entity Materiales                            as projection on pgo.Materiales;
    entity Refacciones                           as projection on pgo.Refacciones;
    entity TiposRefaccion                        as projection on pgo.TiposRefaccion;
    entity ConexionesRefaccion                   as projection on pgo.ConexionesRefaccion;
    entity Altimetrias                           as projection on pgo.Altimetrias;
    entity ExcavacionesCabecera                  as projection on pgo.Excavaciones;

    entity ExcavacionesDetalle                   as projection on pgo.ExcavacionesDetalle order by
        nro_orden;

    entity Deducciones                           as projection on pgo.Deducciones;
    entity Directores                            as projection on pgo.Directores;
    entity Gerentes                              as projection on pgo.Gerentes;
    entity TiposSuspension                       as projection on pgo.TiposSuspension;
    entity TiposActaSuspension                   as projection on pgo.TiposActaSuspension;
    entity Actas                                 as projection on pgo.Actas;
    entity ActasSuspension                       as projection on pgo.ActasSuspension;
    entity ActasSuspensionTarea                  as projection on pgo.ActasSuspensionTarea;
    entity ActasPartidimetro                     as projection on pgo.ActasPartidimetro;
    entity ActasNota                             as projection on pgo.ActasNota;
    entity ActasOrden                            as projection on pgo.ActasOrden;
    entity ActasPlanTrabajo                      as projection on pgo.ActasPlanTrabajo;
    entity ActasPresentacion                     as projection on pgo.ActasPresentacion;
    entity ActasDocumentoAdjunto                 as projection on pgo.ActasDocumentoAdjunto;
    entity ItemPartidimetro                      as projection on pgo.ItemPartidimetro;
    entity SubItemPartidimetro                   as projection on pgo.SubitemPartidimetro;
    entity MemoriaCriterios                      as projection on pgo.MemoriaCriterios;
    entity MemoriaCalculo                        as projection on pgo.MemoriaCalculo;
    entity MemoriaCalculoEL                      as projection on pgo.MemoriaCalculoOCE;
    entity MemoriaPartidasEL                     as projection on pgo.MemoriaPartidasOCE;
    entity MemoriaPartidas                       as projection on pgo.MemoriaPartidas;
    entity MemoriaCalculoCI                      as projection on pgo.MemoriaCalculoCI;
    entity MemoriaPartidasCI                     as projection on pgo.MemoriaPartidasCI;
    entity MemoriaTramos                         as projection on pgo.MemoriaTramos;
    entity PartidasAcumuladas                    as projection on pgo.PartidasAcumuladas;
    entity PartidasAmpliacionesExcedidas         as projection on pgo.PartidasAmpliacionesExcedidas;
    entity TiposNotaMinuta                       as projection on pgo.TiposNotaMinuta;
    entity ReferenciasNotaMinuta                 as projection on pgo.ReferenciasNotaMinuta;
    entity NotasMinuta                           as projection on pgo.NotasMinuta;
    entity PartesDiarios                         as projection on pgo.PartesDiarios;
    entity RegistrosFotoParteDiario              as projection on pgo.RegistrosFotoParteDiario;
    entity ListadosPersonalParteDiario           as projection on pgo.ListadosPersonalParteDiario;
    entity TiempoParteDiario                     as projection on pgo.TiempoParteDiario;
    entity TipoAsignacion                        as projection on pgo.TipoAsignacion;
    entity InspeccionesElectro                   as projection on pgo.InspeccionesElectro;
    entity PartidasInspeccionElectro             as projection on pgo.PartidasInspeccionElectro;
    entity MaterialesInspeccionElectro           as projection on pgo.MaterialesInspeccionElectro;
    entity RegistrosFotoInspeccionElectro        as projection on pgo.RegistrosFotoInspeccionElectro;
    entity InspeccionesCI                        as projection on pgo.InspeccionesCI;
    entity PartidasInspeccionCI                  as projection on pgo.PartidasInspeccionCI;
    entity MemoriaCriteriosCI                    as projection on pgo.MemoriaCriteriosCI;
    entity MaterialesInspeccionCI                as projection on pgo.MaterialesInspeccionCI;
    entity RegistrosFotoInspeccionCI             as projection on pgo.RegistrosFotoInspeccionCI;
    entity AcopiosMateriales                     as projection on pgo.AcopiosMateriales;
    entity PartidasAcopio                        as projection on pgo.PartidasAcopio;
    entity ActasProrrogaPlazos                   as projection on pgo.ActasProrrogaPlazos;
    entity JefesArea                             as projection on pgo.JefesArea;
    entity AprobadoresActa                       as projection on pgo.AprobadoresActa;
    entity Roles                                 as projection on pgo.Roles;
    entity Decisiones                            as projection on pgo.Decisiones;
    entity ActasTradicion                        as projection on pgo.ActasTradicion;
    entity PartidasActaTradicion                 as projection on pgo.PartidasActaTradicion;
    entity MaterialesActaTradicion               as projection on pgo.MaterialesActaTradicion;
    entity RegistrosFotoActaTradicion            as projection on pgo.RegistrosFotoActaTradicion;
    entity ControlesPersonal                     as projection on pgo.ControlesPersonal;
    entity EmpleadosControlPersonal              as projection on pgo.EmpleadosControlPersonal;
    entity ActasAdicionales                      as projection on pgo.ActasAdicionales;
    entity ActasAmpliaciones                     as projection on pgo.ActasAmpliaciones;
    entity PartidasAdicionales                   as projection on pgo.PartidasAdicionales;
    entity AnalisisPreciosPartidaAdicional       as projection on pgo.AnalisisPreciosPartidaAdicional;
    entity MaterialesPartidaAdicional            as projection on pgo.MaterialesPartidaAdicional;
    entity EquiposPartidaAdicional               as projection on pgo.EquiposPartidaAdicional;
    entity ManoObraPartidaAdicional              as projection on pgo.ManoObraPartidaAdicional;
    entity CombustiblePartidaAdicional           as projection on pgo.CombustiblesPartidaAdicional;
    entity AnalisisPreciosPartidaAmpliacion      as projection on pgo.AnalisisPreciosPartidaAmpliacion;
    entity MaterialesPartidaAmpliacion           as projection on pgo.MaterialesPartidaAmpliacion;
    entity EquiposPartidaAmpliacion              as projection on pgo.EquiposPartidaAmpliacion;
    entity ManoObraPartidaAmpliacion             as projection on pgo.ManoObraPartidaAmpliacion;
    entity CombustiblePartidaAmpliacion          as projection on pgo.CombustiblesPartidaAmpliacion;
    entity ActasConstatacion                     as projection on pgo.ActasConstatacion;
    entity PartidasActaConstatacion              as projection on pgo.PartidasActaConstatacion;
    entity DocumentacionActaConstatacion         as projection on pgo.DocumentacionActaConstatacion;
    entity MemoriaCriteriosEL                    as projection on pgo.MemoriaCriteriosEL;
    entity PruebasHidraulicas                    as projection on pgo.PruebasHidraulicas;
    entity Ensayo                                as projection on pgo.Ensayos;
    entity GastosPI                              as projection on pgo.GastosPI;
    entity PonderacionesDetallePartidimetro      as projection on pgo.PonderacionesDetallePartidimetro;
    entity PonderacionesAdicionales              as projection on pgo.PonderacionesAdicionales;
    entity PonderacionesAmpliacion               as projection on pgo.PonderacionesAmpliacion;
    entity DocumentacionSuspension               as projection on pgo.DocumentacionSuspension;
    entity DocumentacionAmpliaciones             as projection on pgo.DocumentacionAmpliaciones;
    entity TiposBomba                            as projection on pgo.TiposBomba;
    entity RespuestasGeneral                     as projection on pgo.RespuestasGeneral;
    entity DocumentacionPruebaHidraulica         as projection on pgo.DocumentacionPruebaHidraulica;
    entity ActasEconomias                        as projection on pgo.ActasEconomias;
    entity MaterialesPartida                     as projection on pgo.MaterialesPartida;
    entity PartidasEconomias                     as projection on pgo.PartidasEconomias;
    entity ActasExcedidas                        as projection on pgo.ActasExcedidas;
    entity PartidasExcedidas                     as projection on pgo.PartidasExcedidas;
    entity PartidasAmpliaciones                  as projection on pgo.PartidasAmpliaciones;
    entity DocumentacionExcedidas                as projection on pgo.DocumentacionExcedidas;
    entity ControlesSostenimiento                as projection on pgo.ControlesSostenimiento;
    entity FrentesTrabajo                        as projection on pgo.FrentesTrabajo;
    entity FotografiasInspeccionMedioambiente    as projection on pgo.FotografiasInspeccionMedioambiente;
    entity InspeccionesMedioambiente             as projection on pgo.InspeccionesMedioambiente;
    entity InspeccionesSeguridadHigiene          as projection on pgo.InspeccionesSeguridadHigiene;
    entity FotografiasInspeccionSeguridadHigiene as projection on pgo.FotografiasInspeccionSeguridadHigiene;
    entity FotografiasRespuestaSeguridadHigiene  as projection on pgo.FotografiasRespuestaSeguridadHigiene;
    entity RespuestasSeguridadHigiene            as projection on pgo.RespuestasSeguridadHigiene;
    entity P3                                    as projection on pgo.P3;
    entity AprobadoresDocumentoSH                as projection on pgo.AprobadoresDocumentoSH;
    entity AprobadoresDocumentoPreconstruccion   as projection on pgo.AprobadoresDocumentoPreconstruccion;
    entity ImportesP3                            as projection on pgo.ImportesP3;
    entity ContratistaObra                       as projection on pgo.ContratistaObra;
    entity ResponsablesPI                        as projection on pgo.ResponsablesPI;
    entity Responsables                          as projection on pgo.Responsables;
    entity InspectoresResponsables               as projection on pgo.InspectoresResponsables;
    entity DesempenioTareaPlanTrabajo            as projection on pgo.DesempenioTareaPlanTrabajo;
    entity SubcodigosTareaPlanTrabajo            as projection on pgo.SubcodigosTareaPlanTrabajo;
    entity ActasSanciones                        as projection on pgo.ActasSanciones;
    entity ActasMedicion                         as projection on pgo.ActasMedicion;
    entity Multas                                as projection on pgo.Multas;
    entity DocumentacionSanciones                as projection on pgo.DocumentacionSanciones;
    entity Articulos                             as projection on pgo.Articulos;
    entity ActasArticulos                        as projection on pgo.ActasArticulos;
    entity Adendas                               as projection on pgo.Adendas;
    entity AdendaNotasPedido                     as projection on pgo.AdendaNotasPedido;
    entity AdendaOrdenesServicio                 as projection on pgo.AdendaOrdenesServicio;
    entity AdendaActasExcedidas                  as projection on pgo.AdendaActasExcedidas;
    entity AdendaActasAdicionales                as projection on pgo.AdendaActasAdicionales;
    entity AdendaActasAmpliaciones               as projection on pgo.AdendaActasAmpliaciones;
    entity AdendaActasProrrogas                  as projection on pgo.AdendaActasProrrogas;
    entity DocumentosAdendas                     as projection on pgo.DocumentosAdendas;
    entity ActasPartidasNegativas                as projection on pgo.ActasPartidasNegativas;
    entity PartidasNegativas                     as projection on pgo.PartidasNegativas;
    entity PartidasOrdenServicio                 as projection on pgo.PartidasOrdenServicio;
    entity PartidasNotasPedido                   as projection on pgo.PartidasNotasPedido;
    entity DocumentacionPartidasNegativas        as projection on pgo.DocumentacionPartidasNegativas;
    entity CodigosPDT                            as projection on pgo.CodigosPDT;
    entity AprobadoresPlanDeTrabajo              as projection on pgo.AprobadoresPlanDeTrabajo;
    entity Certificaciones                       as projection on pgo.Certificaciones;
    entity OtrosConceptosCertificaciones         as projection on pgo.OtrosConceptosCertificaciones;
    function getConexiones(pi_ID : String)                                                                                                            returns array of TramosFormateados;
    function getUltimosPartidimetros(obra_ID : String)                                                                                                returns array of DatosUltimoPartidimetro;
    function getUserData(id : String)                                                                                                                 returns array of Areas;

    action   changeStatusSend(ID : UUID)                                                                                                              returns {
        code : Integer;
        message : String;
    };

    action   actualizarDocsPre(p3 : UUID, documentoPreconstruccion : UUID, decision : String, rol : String, usuario : String, observaciones : String) returns {
        code : Integer;
        message : String;
    };

    action   aprobarDiagramaCuadra(ID : UUID)

    returns array of String;

    action   cierreMemoriaCalculo(ID : UUID, tipo_memoria : String)                                                                                   returns array of String;
    action   enviarInspeccionElectro(ID : UUID)                                                                                                       returns array of String;
    action   enviarInspeccionCivil(ID : UUID)                                                                                                         returns array of String;
    action   enviarActaConstatacion(actaConstatacion_ID : UUID);
    function getQuantity(proyecto_inversion : String)                                                                                                 returns Decimal;
    function getListadoAnexos(pi_ID : UUID, tipo_pi : String)                                                                                         returns array of AnexosList;
    function getContratista(registro_proveedor : String)                                                                                              returns Contratistas;
    function getObrasByInspector(usuario : String, tipo_inspector : String)                                                                           returns array of Obras;
    function getPIByInspector(usuario : String, tipo_inspector : String, obra_ID : UUID)                                                              returns array of ObraPI;
    function getObrasByUser(usuario : String)                                                                                                         returns array of Obras;
    function getObrasByUserLogged(usuario : String)                                                                                                   returns array of Obras;
    function getObrasByContratista(usuario : String)                                                                                                  returns array of Obras;
    function getObrasByUserID(usuario : String, ID : UUID)                                                                                            returns Obras;
    function getPartidimetroDetalleByObraPI(p3_ID : UUID, pi : String)                                                                                returns array of DetallePartidimetro;
    function validatePIPorveedor(proyecto_inversion : String, nro_proveedor : String)                                                                 returns OrdenesCompra;
    function getCatalogoDocumentos(obra_ID : UUID)                                                                                                    returns array of CatalogoDocumentosNDSODP;
    function getLastOrden(pi_ID : UUID, p3 : String, especialidad : String, tipo : String, contratista : String)                                      returns Integer;
    function getLastRevision(pi_ID : UUID, p3 : String, especialidad : String, tipo : String, contratista : String, orden : Integer)                  returns Integer;
    //@requires: 'authenticated-user'
    function getUserRoles()                                                                                                                           returns array of String;
    function getUUID()                                                                                                                                returns UUID;
    function getTareasPlanTrabajoObra(obra_ID : UUID)                                                                                                 returns array of TareasPlanTrabajo;
    function getPartidasMateriales(pi_ID : UUID)                                                                                                      returns array of PartidasMateriales;
    function obtenerHistorialNdpOds(ID : UUID, tipo_documento : String)                                                                               returns array of HistorialOdsNdp;
    function getDataMemoriaCalculo(pi_ID : UUID, tipo_pi : String, nro : Integer, memoria_calculo_ID : UUID)                                          returns array of datosActasMemoriaCalculo;

    function getControlDocumentacionData(obra_ID : UUID)                                                                                              returns array of {
        posicion : Integer;
        area : String;
        estado_ID : String;
        responsable_ID : String;
        fecha_limite : String;
        fecha_real_entrega : String;
        avance : Integer;
        estado_vencimiento : String;
    };

    function getOCQuantity(proyecto_inversion : String)                                                                                               returns array of {
        pi : String;
        oc : String;
        quantity : Decimal
    };

}

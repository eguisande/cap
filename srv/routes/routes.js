const cds = require("@sap/cds");
const parser = require("json-xml-parse");
const PDFMerger = require("pdf-merger-js");
var toUint8Array = require("base64-to-uint8array");
const tmp = require("tmp");
const { response, request, Router } = require("express");
const SapCfAxios = require("sap-cf-axios").default;

//const { Readable, PassThrough } = require("stream");
//const { readDestination } = require("sap-cf-destconn");
//const axios = require("axios");
//const FormData = require("form-data");
//const iconv = require('iconv-lite');
//const querystring = require('querystring');
//const { concatBuffers } = require('multipart-buffer-concat');

const { v4: uuidv4 } = require("uuid");

//const concat = require("concat-stream");
//const concat = require("concat-stream");

const router = Router();

const fs = require("fs");
const { sign } = require("crypto");

const {
  CertificadosControlPolizas,
  VTV,
  Actas,
  LicenciasConducir,
  Cedulas,
  RegistrosEspeciales,
  Obras,
  Representantes,
  ObraInspectores,
  Inspectores,
  NotasPedido,
  OrdenesServicio,
  PermisosSH,
  PresentacionesSH,
  PlanesTrabajo,
  TareasPlanTrabajo,
  MemoriaCalculo,
  MemoriaCalculoOCE,
  ObraPI,
  OrdenesCompra,
  ActasProrrogaPlazos,
  AprobadoresActa,
  ActasConstatacion,
  AcopiosMateriales,
  ActasEconomias,
  PartidasEconomias,
  DetallePartidimetro,
  ActasAdicionales,
  ActasExcedidas,
  Partidimetros,
  PartidasAdicionales,
  ActasPartida,
  DocumentosPreconstruccion,
  AprobadoresDocumentoPreconstruccion,
  Areas,
  CatalogoDocumentos,
  ContratistaObra,
  P3,
  Contratistas,
  Responsables,
  InspectoresResponsables,
  ActasSuspension,
  ActasSuspensionTarea,
  ActasAmpliaciones,
  ActasSanciones,
  Adendas,
  Multas,
} = cds.entities("CatalogService");

const notificacionVencimiento = async (req = request, res = response) => {
  try {
    const fecha = new Date();
    const dia = fecha.getDate();

    fecha.setDate(dia + 1);

    const fecha_vencimiento = fecha.toJSON().slice(0, 10);

    const [
      aCertificadosControlPolizas,
      aVTV,
      aLicenciasConducir,
      aCedulas,
      aRegistrosEspeciale,
    ] = await Promise.all([
      cds.run(
        SELECT.from(CertificadosControlPolizas).where({ fecha_vencimiento })
      ),
      cds.run(SELECT.from(VTV).where({ fecha_vencimiento })),
      cds.run(SELECT.from(LicenciasConducir).where({ fecha_vencimiento })),
      cds.run(SELECT.from(Cedulas).where({ fecha_vencimiento })),
      cds.run(SELECT.from(RegistrosEspeciales).where({ fecha_vencimiento })),
    ]);

    const aObrasID = [
      ...aCertificadosControlPolizas.map((item) => item.obra_ID),
      ...aVTV.map((item) => item.obra_ID),
      ...aLicenciasConducir.map((item) => item.obra_ID),
      ...aCedulas.map((item) => item.obra_ID),
      ...aRegistrosEspeciale.map((item) => item.obra_ID),
    ];

    if (!aObrasID.length) {
      return res.status(400).json({
        message: `No hay datos para informar`,
      });
    }

    const aObrasSelected = await cds.run(
      SELECT.from(Obras).where({ ID: { in: aObrasID } })
    );

    const aRepresentates = await getRepresentantes(aObrasSelected);
    const [aInspectoresID, aInspectores] = await getInspectores(aObrasSelected);

    const wfDestination = SapCfAxios("WORKFLOW");

    const aPromises = [
      //REPRESENTANTES
      ...aCertificadosControlPolizas.map((item) => {
        const { p3, contratista_ID } = aObrasSelected.find(
          (obra) => obra.ID === item.obra_ID
        );
        const recipients = aRepresentates
          .filter((recipient) => recipient.contratista_ID === contratista_ID)
          .map((recipient) => recipient.usuario);
        const recipients_correo = aRepresentates
          .filter((recipient) => recipient.contratista_ID === contratista_ID)
          .map((recipient) => recipient.usuario);
        return wfDestination({
          method: "POST",
          url: `/workflow-instances`,
          data: makePayloadContorlPolizas(
            recipients,
            recipients_correo,
            p3,
            item.nombre_documento
          ),
        });
      }),
      //INSPECTORES
      ...aCertificadosControlPolizas.map((item) => {
        const { ID, p3 } = aObrasSelected.find(
          (obra) => obra.ID === item.obra_ID
        );
        const aInspectoresFilter = aInspectoresID
          .filter((recipient) => recipient.obra_ID === ID)
          .map((inspector) => inspector.inspector_ID);

        const recipients = aInspectores
          .filter((recipient) => aInspectoresFilter.includes(recipient.ID))
          .map((recipient) => recipient.usuario);
        const recipients_correo = aInspectores
          .filter((recipient) => aInspectoresFilter.includes(recipient.ID))
          .map((recipient) => recipient.correo);

        return wfDestination({
          method: "POST",
          url: `/workflow-instances`,
          data: makePayloadContorlPolizas(
            recipients,
            recipients_correo,
            p3,
            item.nombre_documento,
            false
          ),
        });
      }),
      //REPRESENTANTES
      ...aVTV.map((item) => {
        const { p3, contratista_ID } = aObrasSelected.find(
          (obra) => obra.ID === item.obra_ID
        );
        const recipients = aRepresentates
          .filter((recipient) => recipient.contratista_ID === contratista_ID)
          .map((recipient) => recipient.usuario);
        const recipients_correo = aRepresentates
          .filter((recipient) => recipient.contratista_ID === contratista_ID)
          .map((recipient) => recipient.usuario);
        return wfDestination({
          method: "POST",
          url: `/workflow-instances`,
          data: makePayloadVTV(recipients, p3, item.dominio, recipients_correo),
        });
      }),
      //INSPECTORES
      ...aVTV.map((item) => {
        const { ID, p3 } = aObrasSelected.find(
          (obra) => obra.ID === item.obra_ID
        );
        const aInspectoresFilter = aInspectoresID
          .filter((recipient) => recipient.obra_ID === ID)
          .map((inspector) => inspector.inspector_ID);

        const recipients = aInspectores
          .filter((recipient) => aInspectoresFilter.includes(recipient.ID))
          .map((recipient) => recipient.usuario);
        const recipients_correo = aInspectores
          .filter((recipient) => aInspectoresFilter.includes(recipient.ID))
          .map((recipient) => recipient.correo);

        return wfDestination({
          method: "POST",
          url: `/workflow-instances`,
          data: makePayloadVTV(
            recipients,
            p3,
            item.dominio,
            false,
            recipients_correo
          ),
        });
      }),
      //REPRESENTATES
      ...aLicenciasConducir.map((item) => {
        const { p3, contratista_ID } = aObrasSelected.find(
          (obra) => obra.ID === item.obra_ID
        );
        const recipients = aRepresentates
          .filter((recipient) => recipient.contratista_ID === contratista_ID)
          .map((recipient) => recipient.usuario);
        const recipients_correo = aRepresentates
          .filter((recipient) => recipient.contratista_ID === contratista_ID)
          .map((recipient) => recipient.usuario);
        return wfDestination({
          method: "POST",
          url: `/workflow-instances`,
          data: makePayloadLicenciasConducir(
            recipients,
            recipients_correo,
            p3,
            item.nombre,
            item.apellido
          ),
        });
      }),
      //INSPECTORES
      ...aLicenciasConducir.map((item) => {
        const { ID, p3 } = aObrasSelected.find(
          (obra) => obra.ID === item.obra_ID
        );
        const aInspectoresFilter = aInspectoresID
          .filter((recipient) => recipient.obra_ID === ID)
          .map((inspector) => inspector.inspector_ID);

        const recipients = aInspectores
          .filter((recipient) => aInspectoresFilter.includes(recipient.ID))
          .map((recipient) => recipient.usuario);
        const recipients_correo = aInspectores
          .filter((recipient) => aInspectoresFilter.includes(recipient.ID))
          .map((recipient) => recipient.correo);

        return wfDestination({
          method: "POST",
          url: `/workflow-instances`,
          data: makePayloadLicenciasConducir(
            recipients,
            recipients_correo,
            p3,
            item.nombre,
            item.apellido,
            false
          ),
        });
      }),
      //REPRESENTANTES
      ...aCedulas.map((item) => {
        const { p3, contratista_ID } = aObrasSelected.find(
          (obra) => obra.ID === item.obra_ID
        );
        const recipients = aRepresentates
          .filter((recipient) => recipient.contratista_ID === contratista_ID)
          .map((recipient) => recipient.usuario);
        const recipients_correo = aRepresentates
          .filter((recipient) => recipient.contratista_ID === contratista_ID)
          .map((recipient) => recipient.usuario);
        return wfDestination({
          method: "POST",
          url: `/workflow-instances`,
          data: makePayloadCedulas(
            recipients,
            p3,
            item.dominio,
            recipients_correo
          ),
        });
      }),
      //INSPECTORES
      ...aCedulas.map((item) => {
        const { ID, p3 } = aObrasSelected.find(
          (obra) => obra.ID === item.obra_ID
        );
        const aInspectoresFilter = aInspectoresID
          .filter((recipient) => recipient.obra_ID === ID)
          .map((inspector) => inspector.inspector_ID);

        const recipients = aInspectores
          .filter((recipient) => aInspectoresFilter.includes(recipient.ID))
          .map((recipient) => recipient.usuario);
        const recipients_correo = aInspectores
          .filter((recipient) => aInspectoresFilter.includes(recipient.ID))
          .map((recipient) => recipient.correo);

        return wfDestination({
          method: "POST",
          url: `/workflow-instances`,
          data: makePayloadCedulas(
            recipients,
            p3,
            item.dominio,
            false,
            recipients_correo
          ),
        });
      }),
      //REPRESENTANTES
      ...aRegistrosEspeciale.map((item) => {
        const { p3, contratista_ID } = aObrasSelected.find(
          (obra) => obra.ID === item.obra_ID
        );
        const recipients = aRepresentates
          .filter((recipient) => recipient.contratista_ID === contratista_ID)
          .map((recipient) => recipient.usuario);
        const recipients_correo = aRepresentates
          .filter((recipient) => recipient.contratista_ID === contratista_ID)
          .map((recipient) => recipient.usuario);
        return wfDestination({
          method: "POST",
          url: `/workflow-instances`,
          data: makePayloadRegistrosEspeciales(
            recipients,
            p3,
            item.nombre_documento,
            recipients_correo
          ),
        });
      }),
      //INSPECTORES
      ...aRegistrosEspeciale.map((item) => {
        const { ID, p3 } = aObrasSelected.find(
          (obra) => obra.ID === item.obra_ID
        );
        const aInspectoresFilter = aInspectoresID
          .filter((recipient) => recipient.obra_ID === ID)
          .map((inspector) => inspector.inspector_ID);

        const recipients = aInspectores
          .filter((recipient) => aInspectoresFilter.includes(recipient.ID))
          .map((recipient) => recipient.usuario);
        const recipients_correo = aInspectores
          .filter((recipient) => aInspectoresFilter.includes(recipient.ID))
          .map((recipient) => recipient.correo);

        return wfDestination({
          method: "POST",
          url: `/workflow-instances`,
          data: makePayloadRegistrosEspeciales(
            recipients,
            p3,
            item.nombre_documento,
            false,
            recipients_correo
          ),
        });
      }),
    ];

    await Promise.all(aPromises);

    res.status(201).json({
      message: "Workflow creado",
    });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({
      message: "Error al crear workflow",
    });
  }
};

const getRepresentantes = async (aObra) => {
  let fechaHoy = new Date();
  let aContratistaObras = await cds.run(
    SELECT.from(ContratistaObra).where({
      obra_ID: {
        in: aObra.map((item) => item.ID),
      },
      vigencia_desde: {
        "<=": fechaHoy.toISOString(), // Fecha actual debe ser menor o igual a vigencia_desde
      },
      vigencia_hasta: {
        ">=": fechaHoy.toISOString(), // Fecha actual debe ser mayor o igual a vigencia_hasta
      },
    })
  );
  if (!aContratistaObras) {
    return "error";
  }
  let aContratistas = await cds.run(
    SELECT.from(Contratistas).where({
      ID: {
        in: aContratistaObras.map((item) => item.contratista_ID),
      },
    })
  );
  return await cds.run(
    SELECT.from(Representantes).where({
      contratista_ID: {
        in: aContratistas.map((item) => item.ID),
      },
    })
  );
};

const getInspectores = async (aObra) => {
  const aResponsables = await cds.run(
    SELECT.from(Responsables).where({
      obra_ID: {
        in: aObra.map((item) => item.ID),
      },
    })
  );

  const aInspectoresResponsables = await cds.run(
    SELECT.from(InspectoresResponsables).where({
      responsable_ID: {
        in: aResponsables.map((item) => item.ID),
      },
    })
  );
  const aInspectores = await cds.run(
    SELECT.from(Inspectores).where({
      ID: {
        in: aInspectoresResponsables.map((item) => item.inspector_ID),
      },
    })
  );
  return [aInspectoresResponsables, aInspectores];
};

const makePayloadContorlPolizas = (
  recipients,
  recipients_correo,
  p3,
  nombre,
  representante = true
) => {
  const sRepresentantes =
    "Puede reemplazar el documento desde Mis obras->Acciones->Pólizas";
  const sInspectores =
    "Puede acceder al documento desde Gestionar obras->Acciones->Pólizas";
  return {
    definitionId: "pgo.wfnotificacion",
    context: {
      subject: `${p3} - Documento próximo a vencer`,
      description: `Se emite esta notificación para informarle que está próximo a vencer el documento ${nombre}. ${
        representante ? sRepresentantes : sInspectores
      }`,
      recipients,
      recipients_correo,
    },
  };
};

const makePayloadVTV = (
  recipients,
  p3,
  patente,
  representante = true,
  recipients_correo
) => {
  const sRepresentantes =
    "Puede reemplazar el documento desde Mis obras->Acciones->Pólizas";
  const sInspectores =
    "Puede acceder al documento desde Gestionar obras->Acciones->Pólizas";
  return {
    definitionId: "pgo.wfnotificacion",
    context: {
      subject: `${p3} - Documento próximo a vencer`,
      description: `Se emite esta notificación para informarle que está próximo a vencer la VTV del vehículo ${patente}. ${
        representante ? sRepresentantes : sInspectores
      }`,
      recipients,
      recipients_correo,
    },
  };
};

const makePayloadLicenciasConducir = (
  recipients,
  recipients_correo,
  p3,
  nombre,
  apellido,
  representante = true
) => {
  const sRepresentantes =
    "Puede reemplazar el documento desde Mis obras->Acciones->Pólizas";
  const sInspectores =
    "Puede acceder al documento desde Gestionar obras->Acciones->Pólizas";
  return {
    definitionId: "pgo.wfnotificacion",
    context: {
      subject: `${p3} - Documento próximo a vencer`,
      description: `Se emite esta notificación para informarle que está próximo a vencer la licencia de conducir de ${nombre} ${apellido}. ${
        representante ? sRepresentantes : sInspectores
      }`,
      recipients,
      recipients_correo,
    },
  };
};

const makePayloadCedulas = (
  recipients,
  p3,
  patente,
  representante = true,
  recipients_correo
) => {
  const sRepresentantes =
    "Puede reemplazar el documento desde Mis obras->Acciones->Pólizas";
  const sInspectores =
    "Puede acceder al documento desde Gestionar obras->Acciones->Pólizas";
  return {
    definitionId: "pgo.wfnotificacion",
    context: {
      subject: `${p3} - Documento próximo a vencer`,
      description: `Se emite esta notificación para informarle que está próximo a vencer la cédula del vehículo ${patente}. ${
        representante ? sRepresentantes : sInspectores
      }`,
      recipients,
      recipients_correo,
    },
  };
};

const makePayloadRegistrosEspeciales = (
  recipients,
  p3,
  nombre,
  representante = true,
  recipients_correo
) => {
  const sRepresentantes =
    "Puede reemplazar el documento desde Mis obras->Acciones->Pólizas";
  const sInspectores =
    "Puede acceder al documento desde Gestionar obras->Acciones->Pólizas";
  return {
    definitionId: "pgo.wfnotificacion",
    context: {
      subject: `${p3} - Documento próximo a vencer`,
      description: `Se emite esta notificación para informarle que está próximo a vencer el registro especial ${nombre}. ${
        representante ? sRepresentantes : sInspectores
      }`,
      recipients,
      recipients_correo,
    },
  };
};

function calcularDiferenciaDeDias(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000;

  const startDate = new Date(date1);
  const endDate = new Date(date2);

  const diffInDays = Math.round(Math.abs((startDate - endDate) / oneDay));

  return diffInDays;
}

function agregarDias(date, daysToAdd) {
  const oneDay = 24 * 60 * 60 * 1000;
  const dateObj = new Date(date);

  const newDate = new Date(dateObj.getTime() + daysToAdd * oneDay);

  const formattedNewDate = newDate.toISOString().split("T")[0];

  return formattedNewDate;
}

const firmaElectronica = async (req = request, res = response) => {
  const {
    event,
    data: {
      envelopeId,
      envelopeSummary: {
        customFields: { listCustomFields },
      },
    },
  } = req.body;

  try {
    //const catalog = await cds.connect.to("CatalogService");
    //const { NotasPedido, OrdenesServicio, PermisosSH } = catalog.entities;
    const wfDestination = SapCfAxios("WORKFLOW");

    const oFindTipoDocumento = listCustomFields.find(
      (item) => item.name === "TipoDocumento"
    );

    // CASO ORDEN DE SERVICIO
    if (oFindTipoDocumento.value === "OrdenServicio") {
      if (event !== "envelope-completed") {
        return res.status(200).json({
          message: `Campo event: ${event}`,
        });
      }

      const oOrdenServicio = await cds.run(
        SELECT.one.from(OrdenesServicio).where({ envelopeId })
      );
      if (!oOrdenServicio) {
        return res.status(400).json({
          message: `No se encontro una orden de servicio para el envelopeId ${envelopeId}`,
        });
      }

      const oObraPI = await cds.run(
        SELECT.one.from(ObraPI).where({ ID: oOrdenServicio.pi_ID })
      );
      const oP3 = await cds.run(
        SELECT.one.from(P3).where({ ID: oObraPI.p3_ID })
      );
      const aObrasSelected = await cds.run(
        SELECT.from(Obras).where({ ID: oP3.obra_ID })
      );

      console.log("oOrdenServicio", oOrdenServicio);
      // SI ME LLEGA FECHA_INICIO_FISICO
      if (oOrdenServicio.fecha_inicio_fisico !== null) {
        await cds.run(
          UPDATE(Obras)
            .data(
              oOrdenServicio.fecha_inicio_contractual
                ? {
                    fecha_inicio_fisico: oOrdenServicio.fecha_inicio_fisico,
                    estado_ID: "EJ",
                  }
                : {
                    fecha_inicio_fisico: oOrdenServicio.fecha_inicio_fisico,
                  }
            )
            .where({ ID: oP3.obra_ID })
        );

        const [anio, mes] = new Date().toJSON().split("T").at(0).split("-");
        const aObraPI = await cds.run(
          SELECT.from(ObraPI).where({ p3_ID: oObraPI.p3_ID })
        );
        console.log(
          "************** INICIO FIRMA ELECTRONICA OBRA PI **************"
        );
        console.log(aObraPI.map((item) => JSON.stringify(item)));
        console.log(
          "************** FIN    FIRMA ELECTRONICA OBRA PI **************"
        );
        console.table(aObraPI);

        await Promise.all(
          aObraPI.map((item) =>
            item.tipo_pi_ID === "RE"
              ? cds.run(
                  INSERT.into(MemoriaCalculo).entries({
                    obra_ID: item.ID,
                    mes,
                    anio,
                  })
                )
              : cds.run(
                  INSERT.into(MemoriaCalculoOCE).entries({
                    obra_ID: item.ID,
                    mes,
                    anio,
                  })
                )
          )
        );

        const oPlanOriginal =
          await cds.run(`SELECT * FROM COM_AYSA_PGO_PLANESTRABAJO
              WHERE NRO_PLAN = (SELECT MAX(NRO_PLAN) FROM COM_AYSA_PGO_PLANESTRABAJO WHERE ESTADO_ID = 'AP' AND OBRA_ID = '${oP3.obra_ID}')
               AND ESTADO_ID = 'AP' AND OBRA_ID = '${oP3.obra_ID}'`);

        if (oPlanOriginal[0] != null) {
          const oTareaMenor =
            await cds.run(`SELECT * FROM COM_AYSA_PGO_TAREASPLANTRABAJO
            WHERE COMIENZO_PLANIFICADO = (SELECT MIN(COMIENZO_PLANIFICADO) FROM COM_AYSA_PGO_TAREASPLANTRABAJO WHERE PLAN_TRABAJO_ID = '${oPlanOriginal[0].ID}')
               AND PLAN_TRABAJO_ID = '${oPlanOriginal[0].ID}'`);

          const diferenciaDeDias = calcularDiferenciaDeDias(
            oOrdenServicio.fecha_inicio_fisico,
            oTareaMenor[0].COMIENZO_PLANIFICADO
          );
          const aTareasOriginales = await cds.run(
            SELECT.from(TareasPlanTrabajo).where({
              plan_trabajo_ID: oPlanOriginal[0].ID,
            })
          );

          const fechaMomento = new Date();
          const fecha_creacion = fechaMomento.toISOString().split("T")[0];
          const nuevoPlan = {
            ID: uuidv4(),
            estado_ID: "AP",
            obra_ID: oPlanOriginal[0].OBRA_ID,
            nro_plan: oPlanOriginal[0].NRO_PLAN,
            fecha_creacion,
            cantidad_tareas: oPlanOriginal[0].CANTIDAD_TAREAS,
            fecha_inicio: agregarDias(
              oPlanOriginal[0].FECHA_INICIO,
              diferenciaDeDias
            ),
            fecha_fin: agregarDias(
              oPlanOriginal[0].FECHA_FIN,
              diferenciaDeDias
            ),
            observaciones: oPlanOriginal[0].OBSERVACIONES,
          };
          let aPromises = [];

          for (const oTareaOriginal of aTareasOriginales) {
            let comienzo_planificado = agregarDias(
              oTareaOriginal.comienzo_planificado,
              diferenciaDeDias
            );
            let fin_planificado = agregarDias(
              oTareaOriginal.fin_planificado,
              diferenciaDeDias
            );

            const nuevaTarea = {
              ...oTareaOriginal,
              ID: uuidv4(),
              comienzo_planificado,
              fin_planificado,
              plan_trabajo_ID: nuevoPlan.ID,
            };
            aPromises.push(
              cds.run(INSERT.into(TareasPlanTrabajo).entries(nuevaTarea))
            );
          }
          Promise.all(aPromises);
          await cds.run(INSERT.into(PlanesTrabajo).entries(nuevoPlan));
        }
      }

      // SI ME LLEGA FECHA_INICIO_CONTRACTUAL
      if (oOrdenServicio.fecha_inicio_contractual !== null) {
        let diasASumar = aObrasSelected[0].plazo_ejecucion;
        let diaBase = new Date(oOrdenServicio.fecha_inicio_contractual);
        let fecha_fin_contractual_original = new Date(
          diaBase.setDate(diaBase.getDate() + diasASumar)
        );
        fecha_fin_contractual_original = fecha_fin_contractual_original
          .toISOString()
          .slice(0, 10);
        await cds.run(
          UPDATE(Obras)
            .data({
              fecha_inicio_contractual: oOrdenServicio.fecha_inicio_contractual,
              fecha_fin_contractual_original,
              fecha_fin_contractual_original_vigente:
                fecha_fin_contractual_original,
            })
            .where({ ID: oP3.obra_ID })
        );
      }

      const aRepresentantes = await getRepresentantes(aObrasSelected);
      if (aRepresentantes == "error") {
        return res.status(400).json({
          message: `No se encontro un representante activo para la orden de servicio con envelopeId ${envelopeId}`,
        });
      }

      const oPayload = {
        definitionId: "pgo.wfnotificacion",
        context: {
          subject: `${aObrasSelected[0].nombre} - ${oP3.codigo} - Orden de servicio N° ${oOrdenServicio.nro_orden_servicio} disponible`,
          description: `La inspección ha generado una orden de servicio y la misma está disponible en Mis obras → Acciones → Comunicaciones → Órdenes de servicio`,
          recipients: aRepresentantes.map((recipient) => recipient.usuario),
          recipients_correo: aRepresentantes.map(
            (recipient) => recipient.usuario
          ),
        },
      };

      await Promise.all([
        cds.run(
          UPDATE(OrdenesServicio)
            .data({
              estado_ID: oOrdenServicio.requiere_respuesta ? "PR" : "EN",
            })
            .where({ envelopeId })
        ),

        cds.run(
          UPDATE(NotasPedido)
            .data({ estado_ID: "RP" })
            .where({ orden_servicio_ID: oOrdenServicio.ID, estado_ID: "PR" })
        ),
        wfDestination({
          method: "POST",
          url: `/workflow-instances`,
          data: oPayload,
        }),
      ]);

      return res.status(201).json({
        message: `Orden de servicio actualizada`,
      });
    }

    // Si es nota de pedido
    if (oFindTipoDocumento.value === "NotaPedido") {
      if (event !== "envelope-completed") {
        return res.status(200).json({
          message: `Campo event: ${event}`,
        });
      }
      const oNotaPedido = await cds.run(
        SELECT.one.from(NotasPedido).where({ envelopeId })
      );

      if (!oNotaPedido) {
        return res.status(400).json({
          message: `No se encontro una nota de pedido para el envelopeId ${envelopeId}`,
        });
      }

      await cds.run(
        UPDATE(NotasPedido).data({ estado_ID: "PC" }).where({ envelopeId })
      );
      oNotaPedido.orden_servicio_ID &&
        (await cds.run(
          UPDATE(OrdenesServicio)
            .data({ estado_ID: "RP" })
            .where({ ID: oNotaPedido.orden_servicio_ID })
        ));

      const oObraPI = await cds.run(
        SELECT.one.from(ObraPI).where({ ID: oNotaPedido.pi_ID })
      );
      const oP3 = await cds.run(
        SELECT.one.from(P3).where({ ID: oObraPI.p3_ID })
      );
      const aObrasSelected = await cds.run(
        SELECT.from(Obras).where({ ID: oP3.obra_ID })
      );

      const [, aInspectores] = await getInspectores(aObrasSelected);

      const oPayload = {
        definitionId: "pgo.wfnotificacion",
        context: {
          subject: `${aObrasSelected[0].nombre} - ${oP3.codigo} -  Nota de pedido N° ${oNotaPedido.nro_nota_pedido} disponible`,
          description: `El contratista ha generado una nota de pedido y la misma está disponible en Gestionar obras → Acciones → Comunicaciones → Notas de pedido`,
          recipients: aInspectores.map((recipient) => recipient.usuario),
          recipients_correo: aInspectores.map((recipient) => recipient.correo),
        },
      };

      await wfDestination({
        method: "POST",
        url: `/workflow-instances`,
        data: oPayload,
      });

      return res.status(201).json({
        message: `Nota de pedido actualizada`,
      });
    }

    // Si es ActaProrrogaPLazos

    if (oFindTipoDocumento.value === "ActaProrrogaPlazos") {
      if (event !== "envelope-completed") {
        return res.status(200).json({
          message: `Campo event: ${event}`,
        });
      }

      let oActaProrrogaPlazos = await cds.run(
        SELECT.one.from(ActasProrrogaPlazos).where({ envelopeId })
      );

      if (!!oActaProrrogaPlazos) {
        let oActa = await cds.run(
          SELECT.one.from(Actas).where({ ID: oActaProrrogaPlazos.acta_ID })
        );
        const oPI = await cds.run(
          SELECT.one.from(ObraPI).where({ ID: oActa.pi_ID })
        );
        const oP3 = await cds.run(SELECT.one.from(P3).where({ ID: oPI.p3_ID }));
        let obra = await cds.run(
          UPDATE(Obras)
            .data({
              fecha_fin_contractual_original_vigente:
                oActaProrrogaPlazos.nueva_fecha_finalizacion,
            })
            .where({ ID: oP3.obra_ID })
        );

        let actaUpdate = await cds.run(
          UPDATE(ActasProrrogaPlazos)
            .data({
              estado_ID: "AP",
            })
            .where({ ID: oActaProrrogaPlazos.ID })
        );
        return res.status(200).json({
          message: `Acta de prorroga de plazos firmada`,
        });
      }
      return res.status(400).json({
        message: `No se encontro una acta de prorroga para el envelopeId ${envelopeId}`,
      });
    }
    if (oFindTipoDocumento.value === "ActaSanciones") {
      if (event !== "envelope-completed") {
        return res.status(200).json({
          message: `Campo event: ${event}`,
        });
      }

      let oActaSanciones = await cds.run(
        SELECT.one.from(ActasSanciones).where({ envelopeId })
      );

      if (!!oActaSanciones) {
        let oActa = await cds.run(
          SELECT.one.from(Actas).where({ ID: oActaSanciones.acta_ID })
        );
        const oPI = await cds.run(
          SELECT.one.from(ObraPI).where({ ID: oActa.pi_ID })
        );
        const oP3 = await cds.run(SELECT.one.from(P3).where({ ID: oPI.p3_ID }));

        let obra = await cds.run(
          INSERT.into(Multas).entries({
            pi_ID: oPI.ID,
            p3_ID: oP3.ID,
            obra_ID: oP3.obra_ID,
            multa_pendiente: true,
            acta_ID: oActa.ID,
          })
        );

        let actaUpdate = await cds.run(
          UPDATE(ActasSanciones)
            .data({
              estado_ID: "AP",
            })
            .where({ ID: oActaSanciones.ID })
        );
        return res.status(200).json({
          message: `Acta de sanciones de plazos firmada`,
        });
      }
      return res.status(400).json({
        message: `No se encontro una acta de sanción para el envelopeId ${envelopeId}`,
      });
    }

    if (oFindTipoDocumento.value === "ActaSuspension") {
      if (event !== "envelope-completed") {
        return res.status(200).json({
          message: `Campo event: ${event}`,
        });
      }

      let oActasSuspension = await cds.run(
        SELECT.one.from(ActasSuspension).where({ envelopeId })
      );

      if (!!oActasSuspension) {
        let oActa = await cds.run(
          SELECT.one.from(Actas).where({ ID: oActasSuspension.acta_ID })
        );
        const oPI = await cds.run(
          SELECT.one.from(ObraPI).where({ ID: oActa.pi_ID })
        );
        const oP3 = await cds.run(SELECT.one.from(P3).where({ ID: oPI.p3_ID }));
        const oObra = await cds.run(
          SELECT.one.from(Obras).where({ ID: oP3.obra_ID })
        );
        const oPlanTrabajo = await cds.run(
          SELECT.one
            .from(PlanesTrabajo)
            .where({ ID: oActasSuspension.plan_suspendido_ID })
        );

        let aPromises = [];
        let estado_suspension_ID =
          oActasSuspension.tipo_acta_ID == "IN"
            ? oActasSuspension.tipo_suspension_ID == "TO"
              ? "ST"
              : "SP"
            : null;
        if (oActasSuspension.tipo_suspension_ID == "TO") {
          let oTareasPlanTrabajo = await cds.run(
            SELECT.from(TareasPlanTrabajo).where({
              plan_trabajo_ID: oActasSuspension.plan_suspendido_ID,
            })
          );
          if (oActasSuspension.tipo_acta_ID == "IN") {
            aPromises.push(
              cds.run(
                UPDATE(PlanesTrabajo)
                  .data({
                    fecha_fin: sumarDias(
                      oPlanTrabajo.fecha_fin,
                      oActasSuspension.cantidad_dias_suspension
                    ),
                    estado_ID: "ST",
                    estado_original_ID: oPlanTrabajo.estado_ID,
                    fecha_fin_anterior: oPlanTrabajo.fecha_fin,
                  })
                  .where({ ID: oActasSuspension.plan_suspendido_ID })
              )
            );
            aPromises.push(
              cds.run(
                UPDATE(Obras)
                  .data({
                    fecha_fin_obra_fisico: sumarDias(
                      oObra.fecha_fin_obra_fisico,
                      oActasSuspension.cantidad_dias_suspension
                    ),
                    fecha_fin_obra_fisico_anterior: oObra.fecha_fin_obra_fisico,
                    fecha_fin_contractual_original_vigente: sumarDias(
                      oObra.fecha_fin_contractual_original_vigente,
                      oActasSuspension.cantidad_dias_suspension
                    ),
                    estado_ID: "ST",
                    estado_original_ID: oObra.estado_ID,
                    fecha_fin_contractual_vigente_anterior:
                      oObra.fecha_fin_contractual_original_vigente,
                  })
                  .where({ ID: oP3.obra_ID })
              )
            );
            for (let tarea of oTareasPlanTrabajo) {
              if (!tarea.fin_real) {
                var fin_planificado = sumarDias(
                  tarea.fin_planificado,
                  oActasSuspension.cantidad_dias_suspension
                );
              } else {
                var fin_planificado = tarea.fin_planificado;
              }
              if (!oActasSuspension.responsabilidad_contratista) {
                aPromises.push(
                  cds.run(
                    UPDATE(TareasPlanTrabajo)
                      .data({
                        fin_planificado,
                        estado_suspension_ID,
                        fin_planificado_anterior: tarea.fin_planificado,
                      })
                      .where({ ID: tarea.ID })
                  )
                );
              }
            }
          } else if (oActasSuspension.tipo_acta_ID == "FI") {
            aPromises.push(
              cds.run(
                UPDATE(PlanesTrabajo)
                  .data({
                    fecha_fin: sumarDias(
                      oPlanTrabajo.fecha_fin_anterior,
                      oActasSuspension.cantidad_dias_suspension
                    ),
                    estado_ID: oPlanTrabajo.estado_original_ID,
                  })
                  .where({ ID: oActasSuspension.plan_suspendido_ID })
              )
            );
            aPromises.push(
              cds.run(
                UPDATE(Obras)
                  .data({
                    fecha_fin_obra_fisico: sumarDias(
                      oObra.fecha_fin_obra_fisico_anterior,
                      oActasSuspension.cantidad_dias_suspension
                    ),
                    fecha_fin_contractual_original_vigente: sumarDias(
                      oObra.fecha_fin_contractual_vigente_anterior,
                      oActasSuspension.cantidad_dias_suspension
                    ),
                    estado_ID: oObra.estado_original_ID,
                  })
                  .where({ ID: oP3.obra_ID })
              )
            );
            for (let tarea of oTareasPlanTrabajo) {
              if (!tarea.fin_real) {
                var fin_planificado = sumarDias(
                  tarea.fin_planificado_anterior,
                  oActasSuspension.cantidad_dias_suspension
                );
              } else {
                var fin_planificado = tarea.fin_planificado;
              }
              if (!oActasSuspension.responsabilidad_contratista) {
                aPromises.push(
                  cds.run(
                    UPDATE(TareasPlanTrabajo)
                      .data({
                        fin_planificado,
                        estado_suspension_ID,
                      })
                      .where({ ID: tarea.ID })
                  )
                );
              }
            }
          }
        } else if (oActasSuspension.tipo_suspension_ID == "PA") {
          if (oActasSuspension.tipo_acta_ID == "IN") {
            let oTareasPlanTrabajoSuspendidas = await cds.run(
              SELECT.from(ActasSuspensionTarea).where({
                acta_suspension_ID: oActasSuspension.ID,
              })
            );
            aPromises.push(
              cds.run(
                UPDATE(PlanesTrabajo)
                  .data({
                    estado_ID: "SP",
                    estado_original_ID:
                      oPlanTrabajo.estado_ID !== "SP" &&
                      oPlanTrabajo.estado_ID !== "ST"
                        ? oPlanTrabajo.estado_ID
                        : oPlanTrabajo.estado_original_ID,
                  })
                  .where({ ID: oActasSuspension.plan_suspendido_ID })
              )
            );
            if (Obras.estado_ID !== "SP") {
              aPromises.push(
                cds.run(
                  UPDATE(Obras)
                    .data({
                      estado_ID: "SP",
                      estado_original_ID:
                        oObra.estado_ID !== "SP" && oObra.estado_ID !== "ST"
                          ? oObra.estado_ID
                          : oObra.estado_original_ID,
                    })
                    .where({ ID: oP3.obra_ID })
                )
              );
            }
            for (let tarea of oTareasPlanTrabajoSuspendidas) {
              aPromises.push(
                cds.run(
                  UPDATE(TareasPlanTrabajo)
                    .data({
                      estado_suspension_ID,
                    })
                    .where({ ID: tarea.tarea_ID })
                )
              );
            }
          } else if (oActasSuspension.tipo_acta_ID == "FI") {
            // Lógica buscar todas las actas de ese PI para el update del estado de PlanesTrabajo, después busco el p3, la obra y todos los P3 de la obra para
            // ver todas las actas ed suspensión de la obra para ver el estado final (buscar por SQL)
            const oActasPlanDeTrabajo = await cds.run(
              SELECT.from(ActasSuspension).where({
                plan_suspendido_ID: oActasSuspension.plan_suspendido_ID,
                tipo_suspension_ID: "PA",
              })
            );

            let inicioCount = 0;
            let finCount = 0;

            oActasPlanDeTrabajo.forEach((acta) => {
              if (acta.tipo_acta_ID === "IN") {
                inicioCount++;
              } else if (acta.tipo_acta_ID === "FI") {
                finCount++;
              }
            });

            if (inicioCount == finCount) {
              aPromises.push(
                cds.run(
                  UPDATE(PlanesTrabajo)
                    .data({
                      estado_ID: oPlanTrabajo.estado_original_ID,
                    })
                    .where({ ID: oActasSuspension.plan_suspendido_ID })
                )
              );
            }
            let oSuspensiones = await cds.run(
              `SELECT ACTASSUSP.* 
              FROM COM_AYSA_PGO_ACTASSUSPENSION AS ACTASSUSP
               JOIN COM_AYSA_PGO_ACTAS AS ACTAS
                ON ACTASSUSP.ACTA_ID = ACTAS.ID
               JOIN COM_AYSA_PGO_OBRAPI AS PI
                ON ACTAS.PI_ID = PI.ID
               JOIN COM_AYSA_PGO_P3 AS P3
                ON P3.ID = PI.P3_ID
              JOIN COM_AYSA_PGO_OBRAS AS OBRA
                ON OBRA.ID = P3.OBRA_ID
              WHERE OBRA.ID = '${oObra.ID}' AND ACTASSUSP.TIPO_SUSPENSION_ID = 'PA'`
            );

            inicioCount = 0;
            finCount = 0;
            oSuspensiones.forEach((acta) => {
              if (acta.TIPO_SUSPENSION_ID === "IN") {
                inicioCount++;
              } else if (acta.TIPO_SUSPENSION_ID === "FI") {
                finCount++;
              }
            });

            if (inicioCount == finCount) {
              aPromises.push(
                cds.run(
                  UPDATE(Obras)
                    .data({
                      estado_ID: oObra.estado_original_ID,
                    })
                    .where({ ID: oP3.obra_ID })
                )
              );
            }

            let oTareasPlanTrabajoSuspendidas = await cds.run(
              SELECT.from(ActasSuspensionTarea).where({
                acta_suspension_ID: oActasSuspension.ID,
              })
            );
            for (let tarea of oTareasPlanTrabajoSuspendidas) {
              aPromises.push(
                cds.run(
                  UPDATE(TareasPlanTrabajo)
                    .data({
                      estado_suspension_ID: null,
                    })
                    .where({ ID: tarea.tarea_ID })
                )
              );
            }
          }
        }

        /* const oPayload = {
          definitionId: "pgo.wfnotificacion",
          context: {
            subject: `${aObrasSelected[0].nombre} - ${oP3.codigo} - Actas de suspensión N° ${oActasSuspension.nro_acta
              } disponible`,
            description: `El director de área ha aprobado el Acta de Suspensión`,
            recipients: aRepresentantes.map((recipient) => recipient.usuario),
            recipients_correo: aRepresentantes.map(
              (recipient) => recipient.usuario
            ),
          },
        }; */
        /* await wfDestination({
          method: "POST",
          url: `/workflow-instances`,
          data: oPayload,
        }); */
        Promise.all(aPromises);
        let actaUpdate = await cds.run(
          UPDATE(ActasSuspension)
            .data({
              estado_ID: "AP",
            })
            .where({ ID: oActasSuspension.ID })
        );
        return res.status(200).json({
          message: `Acta de Suspensión de plazos firmada`,
        });
      }
      return res.status(400).json({
        message: `No se encontro una acta de suspensión para el envelopeId ${envelopeId}`,
      });
    }
    if (oFindTipoDocumento.value === "ActasAdicionales") {
      if (event !== "envelope-completed") {
        return res.status(200).json({
          message: `Campo event: ${event}`,
        });
      }

      const pgoDestination = SapCfAxios("PGO");
      let oActasAdicionales = await cds.run(
        SELECT.one.from(ActasAdicionales).where({ envelopeId })
      );

      if (!!oActasAdicionales) {
        let oActa = await cds.run(
          SELECT.one.from(Actas).where({ ID: oActasAdicionales.acta_ID })
        );

        const [ultimoPartidimetro] = await cds.run(
          `SELECT PARTIDIMETRO.ID FROM COM_AYSA_PGO_PARTIDIMETROS AS PARTIDIMETRO WHERE PI_ID = '${oActa.pi_ID}' AND ESTADO_ID = 'AP' AND NRO_PARTIDIMETRO = (SELECT MAX(NRO_PARTIDIMETRO) FROM COM_AYSA_PGO_PARTIDIMETROS WHERE PI_ID = '${oActa.pi_ID}' AND ESTADO_ID = 'AP')`
        );
        let msgUltimoPartidimetro = await pgoDestination({
          method: "GET",
          url: `/catalog/Partidimetros/${ultimoPartidimetro.ID}?$expand=detalle_partidimetro($expand=analisis_precio($expand=ponderaciones,materiales($expand=importes),equipos($expand=importes),mano_obra($expand=importes),combustibles($expand=importes)))`,
        });
        let msgNuevaData = await pgoDestination({
          method: "GET",
          url: `/catalog/ActasAdicionales/${oActasAdicionales.ID}?$expand=partidas_adicionales($expand=analisis_precio($expand=ponderaciones,materiales($expand=importes),equipos($expand=importes),mano_obra($expand=importes),combustibles($expand=importes)))`,
        });
        /* Formateo el body de la copia de partidimetro y de las adiciones a el */
        delete msgUltimoPartidimetro.data.ID;
        let partidimetro = msgUltimoPartidimetro.data;
        delete partidimetro["@odata.context"];
        delete partidimetro.copia_de_ID;
        partidimetro.createdAt = msgNuevaData.data.createdAt;
        partidimetro.createdBy = msgNuevaData.data.createdBy;
        partidimetro.nro_partidimetro = partidimetro.nro_partidimetro + 1;
        partidimetro.cantidad_partidas =
          partidimetro.cantidad_partidas +
          msgNuevaData.data.partidas_adicionales.length;
        partidimetro.copia_de_ID = ultimoPartidimetro.ID.toString();
        partidimetro.detalle_partidimetro.forEach((detalle) => {
          delete detalle.ID;
          delete detalle.createdAt;
          delete detalle.createdBy;
          delete detalle.modifiedBy;
          delete detalle.modifiedAt;
          if (detalle.analisis_precio.length) {
            detalle.analisis_precio.forEach((apu) => {
              delete apu.ID;
              delete apu.partida_ID;
              delete apu.createdAt;
              delete apu.createdBy;
              delete apu.modifiedAt;
              delete apu.modifiedBy;
              if (apu.ponderaciones.length) {
                apu.ponderaciones.forEach((ponderacion) => {
                  delete ponderacion.ID;
                  delete ponderacion.apu_ID;
                });
              }
              if (apu.combustibles.length) {
                apu.combustibles.forEach((combustible) => {
                  delete combustible.ID;
                  delete combustible.partida_ID;
                  delete combustible.createdAt;
                  delete combustible.createdBy;
                  delete combustible.modifiedAt;
                  delete combustible.modifiedBy;
                  if (combustible.importes.length) {
                    combustible.importes.forEach((importeCombustible) => {
                      delete importeCombustible.ID;
                      delete importeCombustible.combustible_ID;
                    });
                  }
                });
              }
              if (apu.mano_obra.length) {
                apu.mano_obra.forEach((mano_obra) => {
                  delete mano_obra.ID;
                  delete mano_obra.partida_ID;
                  delete mano_obra.createdAt;
                  delete mano_obra.createdBy;
                  delete mano_obra.modifiedAt;
                  delete mano_obra.modifiedBy;
                  if (mano_obra.importes.length) {
                    mano_obra.importes.forEach((importeManoObra) => {
                      delete importeManoObra.ID;
                      delete importeManoObra.mano_obra_ID;
                    });
                  }
                });
              }
              if (apu.materiales.length) {
                apu.materiales.forEach((material) => {
                  delete material.ID;
                  delete material.partida_ID;
                  delete material.createdAt;
                  delete material.createdBy;
                  delete material.modifiedAt;
                  delete material.modifiedBy;
                  if (material.importes.length) {
                    material.importes.forEach((importeMaterial) => {
                      delete importeMaterial.ID;
                      delete importeMaterial.material_ID;
                    });
                  }
                });
              }
              if (apu.equipos.length) {
                apu.equipos.forEach((equipo) => {
                  delete equipo.ID;
                  delete equipo.partida_ID;
                  delete equipo.createdAt;
                  delete equipo.createdBy;
                  delete equipo.modifiedAt;
                  delete equipo.modifiedBy;
                  if (equipo.importes.length) {
                    equipo.importes.forEach((importeEquipo) => {
                      delete importeEquipo.ID;
                      delete importeEquipo.equipo_ID;
                    });
                  }
                });
              }
            });
          }
        });
        if (msgNuevaData.data.partidas_adicionales.length) {
          msgNuevaData.data.partidas_adicionales.forEach((detalle) => {
            delete detalle.ID;
            delete detalle.acta_adicional_ID;
            detalle.tipo_partida_ID = "AD";
            if (detalle.analisis_precio.length) {
              detalle.analisis_precio.forEach((apu) => {
                delete apu.ID;
                delete apu.partida_ID;
                delete apu.createdAt;
                delete apu.createdBy;
                delete apu.modifiedAt;
                delete apu.modifiedBy;
                if (apu.ponderaciones.length) {
                  apu.ponderaciones.forEach((ponderacion) => {
                    delete ponderacion.ID;
                    delete ponderacion.apu_ID;
                  });
                }
                if (apu.combustibles.length) {
                  apu.combustibles.forEach((combustible) => {
                    delete combustible.ID;
                    delete combustible.partida_ID;
                    delete combustible.createdAt;
                    delete combustible.createdBy;
                    delete combustible.modifiedAt;
                    delete combustible.modifiedBy;
                    delete combustible.partida_ID;
                    if (combustible.importes.length) {
                      combustible.importes.forEach((importeCombustible) => {
                        delete importeCombustible.ID;
                        delete importeCombustible.combustible_ID;
                      });
                    }
                  });
                }
                if (apu.mano_obra.length) {
                  apu.mano_obra.forEach((mano_obra) => {
                    delete mano_obra.ID;
                    delete mano_obra.partida_ID;
                    delete mano_obra.createdAt;
                    delete mano_obra.createdBy;
                    delete mano_obra.modifiedAt;
                    delete mano_obra.modifiedBy;
                    delete mano_obra.partida_ID;
                    if (mano_obra.importes.length) {
                      mano_obra.importes.forEach((importeManoObra) => {
                        delete importeManoObra.ID;
                        delete importeManoObra.mano_obra_ID;
                      });
                    }
                  });
                }
                if (apu.materiales.length) {
                  apu.materiales.forEach((material) => {
                    delete material.ID;
                    delete material.partida_ID;
                    delete material.createdAt;
                    delete material.createdBy;
                    delete material.modifiedAt;
                    delete material.modifiedBy;
                    delete material.partida_ID;
                    if (material.importes.length) {
                      material.importes.forEach((importeMaterial) => {
                        delete importeMaterial.ID;
                        delete importeMaterial.material_ID;
                      });
                    }
                  });
                }
                if (apu.equipos.length) {
                  apu.equipos.forEach((equipo) => {
                    delete equipo.ID;
                    delete equipo.partida_ID;
                    delete equipo.createdAt;
                    delete equipo.createdBy;
                    delete equipo.modifiedAt;
                    delete equipo.modifiedBy;
                    delete equipo.partida_ID;
                    if (equipo.importes.length) {
                      equipo.importes.forEach((importeEquipo) => {
                        delete importeEquipo.ID;
                        delete importeEquipo.equipo_ID;
                      });
                    }
                  });
                }
                partidimetro.detalle_partidimetro.push(detalle);
              });
            }
          });
        }

        let createPartidimetro = await cds.run(
          INSERT.into(Partidimetros).entries({
            ...partidimetro,
          })
        );

        let promises = [];
        if (msgNuevaData.data.partidas_adicionales.length) {
          for (partida of msgNuevaData.data.partidas_adicionales) {
            let detalle_partidimetro = await cds.run(
              SELECT.from(DetallePartidimetro).where({
                codigo1: partida.codigo1,
                codigo2: partida.codigo2,
                codigo3: partida.codigo3,
                codigo4: partida.codigo4,
                codigo5: partida.codigo5,
              })
            );
            if (detalle_partidimetro)
              promises.push(
                cds.run(
                  INSERT.into(ActasPartida).entries({
                    acta_ID: msgNuevaData.data.acta_ID,
                    partida_ID: detalle_partidimetro.ID,
                  })
                )
              );
          }
        }
        let actaUpdate = await cds.run(
          UPDATE(ActasAdicionales)
            .data({
              estado_ID: "AP",
            })
            .where({ ID: oActasAdicionales.ID })
        );

        await Promise.all(promises);
        return res.status(200).json({
          message: `Acta de adicionales firmada`,
        });
      }
      return res.status(400).json({
        message: `No se encontro una acta de adicionales para el envelopeId ${envelopeId}`,
      });
    }
    if (oFindTipoDocumento.value === "ActaAmpliaciones") {
      if (event !== "envelope-completed") {
        return res.status(200).json({
          message: `Campo event: ${event}`,
        });
      }

      const pgoDestination = SapCfAxios("PGO");
      let oActasAmpliaciones = await cds.run(
        SELECT.one.from(ActasAmpliaciones).where({ envelopeId })
      );

      if (!!oActasAmpliaciones) {
        let oActa = await cds.run(
          SELECT.one.from(Actas).where({ ID: oActasAmpliaciones.acta_ID })
        );

        const [ultimoPartidimetro] = await cds.run(
          `SELECT PARTIDIMETRO.ID FROM COM_AYSA_PGO_PARTIDIMETROS AS PARTIDIMETRO WHERE PI_ID = '${oActa.pi_ID}' AND ESTADO_ID = 'AP' AND NRO_PARTIDIMETRO = (SELECT MAX(NRO_PARTIDIMETRO) FROM COM_AYSA_PGO_PARTIDIMETROS WHERE PI_ID = '${oActa.pi_ID}' AND ESTADO_ID = 'AP')`
        );
        let msgUltimoPartidimetro = await pgoDestination({
          method: "GET",
          url: `/catalog/Partidimetros/${ultimoPartidimetro.ID}?$expand=detalle_partidimetro($expand=analisis_precio($expand=ponderaciones,materiales($expand=importes),equipos($expand=importes),mano_obra($expand=importes),combustibles($expand=importes)))`,
        });
        let msgNuevaData = await pgoDestination({
          method: "GET",
          url: `/catalog/ActasAmpliaciones/${oActasAmpliaciones.ID}?$expand=partidas_ampliaciones($expand=analisis_precio($expand=ponderaciones,materiales($expand=importes),equipos($expand=importes),mano_obra($expand=importes),combustibles($expand=importes)))`,
        });
        /* Formateo el body de la copia de partidimetro y de las adiciones a el */
        delete msgUltimoPartidimetro.data.ID;
        let partidimetro = msgUltimoPartidimetro.data;
        delete partidimetro["@odata.context"];
        delete partidimetro.copia_de_ID;
        partidimetro.createdAt = msgNuevaData.data.createdAt;
        partidimetro.createdBy = msgNuevaData.data.createdBy;
        partidimetro.nro_partidimetro = partidimetro.nro_partidimetro + 1;
        partidimetro.cantidad_partidas =
          partidimetro.cantidad_partidas +
          msgNuevaData.data.partidas_ampliaciones.length;
        partidimetro.copia_de_ID = ultimoPartidimetro.ID.toString();
        partidimetro.detalle_partidimetro.forEach((detalle) => {
          if (msgNuevaData.data.partidas_ampliaciones.length) {
            const partidaAmpliacionCorrespondiente =
              msgNuevaData.data.partidas_ampliaciones.find(
                (partidaAmpliacion) =>
                  partidaAmpliacion.codigo1 === detalle.codigo1 &&
                  partidaAmpliacion.codigo2 === detalle.codigo2 &&
                  partidaAmpliacion.codigo3 === detalle.codigo3 &&
                  partidaAmpliacion.codigo4 === detalle.codigo4 &&
                  partidaAmpliacion.codigo5 === detalle.codigo5
              );
            if (partidaAmpliacionCorrespondiente) {
              promises.push(
                cds.run(
                  INSERT.into(ActasPartida).entries({
                    cantidad_original: detalle.cantidad,
                    acta_ID: msgNuevaData.data.acta_ID,
                    partida_ID: detalle.ID,
                    cantidad_ampliacion:
                      partidaAmpliacionCorrespondiente.cantidad_excedida,
                  })
                )
              );
              detalle.cantidad =
                detalle.cantidad +
                partidaAmpliacionCorrespondiente.cantidad_excedida;
            }
          }
          delete detalle.ID;
          delete detalle.createdAt;
          delete detalle.createdBy;
          delete detalle.modifiedBy;
          delete detalle.modifiedAt;
          if (detalle.analisis_precio.length) {
            detalle.analisis_precio.forEach((apu) => {
              delete apu.ID;
              delete apu.partida_ID;
              delete apu.createdAt;
              delete apu.createdBy;
              delete apu.modifiedAt;
              delete apu.modifiedBy;
              if (apu.ponderaciones.length) {
                apu.ponderaciones.forEach((ponderacion) => {
                  delete ponderacion.ID;
                  delete ponderacion.apu_ID;
                });
              }
              if (apu.combustibles.length) {
                apu.combustibles.forEach((combustible) => {
                  delete combustible.ID;
                  delete combustible.partida_ID;
                  delete combustible.createdAt;
                  delete combustible.createdBy;
                  delete combustible.modifiedAt;
                  delete combustible.modifiedBy;
                  if (combustible.importes.length) {
                    combustible.importes.forEach((importeCombustible) => {
                      delete importeCombustible.ID;
                      delete importeCombustible.combustible_ID;
                    });
                  }
                });
              }
              if (apu.mano_obra.length) {
                apu.mano_obra.forEach((mano_obra) => {
                  delete mano_obra.ID;
                  delete mano_obra.partida_ID;
                  delete mano_obra.createdAt;
                  delete mano_obra.createdBy;
                  delete mano_obra.modifiedAt;
                  delete mano_obra.modifiedBy;
                  if (mano_obra.importes.length) {
                    mano_obra.importes.forEach((importeManoObra) => {
                      delete importeManoObra.ID;
                      delete importeManoObra.mano_obra_ID;
                    });
                  }
                });
              }
              if (apu.materiales.length) {
                apu.materiales.forEach((material) => {
                  delete material.ID;
                  delete material.partida_ID;
                  delete material.createdAt;
                  delete material.createdBy;
                  delete material.modifiedAt;
                  delete material.modifiedBy;
                  if (material.importes.length) {
                    material.importes.forEach((importeMaterial) => {
                      delete importeMaterial.ID;
                      delete importeMaterial.material_ID;
                    });
                  }
                });
              }
              if (apu.equipos.length) {
                apu.equipos.forEach((equipo) => {
                  delete equipo.ID;
                  delete equipo.partida_ID;
                  delete equipo.createdAt;
                  delete equipo.createdBy;
                  delete equipo.modifiedAt;
                  delete equipo.modifiedBy;
                  if (equipo.importes.length) {
                    equipo.importes.forEach((importeEquipo) => {
                      delete importeEquipo.ID;
                      delete importeEquipo.equipo_ID;
                    });
                  }
                });
              }
            });
          }
        });
        if (msgNuevaData.data.partidas_ampliaciones.length) {
          msgNuevaData.data.partidas_ampliaciones.forEach((detalle) => {
            delete detalle.ID;
            delete detalle.acta_ampliacion_ID;
            detalle.tipo_partida_ID = "AM";
            if (detalle.analisis_precio.length) {
              detalle.analisis_precio.forEach((apu) => {
                delete apu.ID;
                delete apu.partida_ID;
                delete apu.createdAt;
                delete apu.createdBy;
                delete apu.modifiedAt;
                delete apu.modifiedBy;
                if (apu.ponderaciones.length) {
                  apu.ponderaciones.forEach((ponderacion) => {
                    delete ponderacion.ID;
                    delete ponderacion.apu_ID;
                  });
                }
                if (apu.combustibles.length) {
                  apu.combustibles.forEach((combustible) => {
                    delete combustible.ID;
                    delete combustible.partida_ID;
                    delete combustible.createdAt;
                    delete combustible.createdBy;
                    delete combustible.modifiedAt;
                    delete combustible.modifiedBy;
                    delete combustible.partida_ID;
                    if (combustible.importes.length) {
                      combustible.importes.forEach((importeCombustible) => {
                        delete importeCombustible.ID;
                        delete importeCombustible.combustible_ID;
                      });
                    }
                  });
                }
                if (apu.mano_obra.length) {
                  apu.mano_obra.forEach((mano_obra) => {
                    delete mano_obra.ID;
                    delete mano_obra.partida_ID;
                    delete mano_obra.createdAt;
                    delete mano_obra.createdBy;
                    delete mano_obra.modifiedAt;
                    delete mano_obra.modifiedBy;
                    delete mano_obra.partida_ID;
                    if (mano_obra.importes.length) {
                      mano_obra.importes.forEach((importeManoObra) => {
                        delete importeManoObra.ID;
                        delete importeManoObra.mano_obra_ID;
                      });
                    }
                  });
                }
                if (apu.materiales.length) {
                  apu.materiales.forEach((material) => {
                    delete material.ID;
                    delete material.partida_ID;
                    delete material.createdAt;
                    delete material.createdBy;
                    delete material.modifiedAt;
                    delete material.modifiedBy;
                    delete material.partida_ID;
                    if (material.importes.length) {
                      material.importes.forEach((importeMaterial) => {
                        delete importeMaterial.ID;
                        delete importeMaterial.material_ID;
                      });
                    }
                  });
                }
                if (apu.equipos.length) {
                  apu.equipos.forEach((equipo) => {
                    delete equipo.ID;
                    delete equipo.partida_ID;
                    delete equipo.createdAt;
                    delete equipo.createdBy;
                    delete equipo.modifiedAt;
                    delete equipo.modifiedBy;
                    delete equipo.partida_ID;
                    if (equipo.importes.length) {
                      equipo.importes.forEach((importeEquipo) => {
                        delete importeEquipo.ID;
                        delete importeEquipo.equipo_ID;
                      });
                    }
                  });
                }
                partidimetro.detalle_partidimetro.push(detalle);
              });
            }
          });
        }

        let createPartidimetro = await cds.run(
          INSERT.into(Partidimetros).entries({
            ...partidimetro,
          })
        );

        let actaUpdate = await cds.run(
          UPDATE(ActasAmpliaciones)
            .data({
              estado_ID: "AP",
            })
            .where({ ID: oActasAmpliaciones.ID })
        );

        return res.status(200).json({
          message: `Acta de adicionales firmada`,
        });
      }
      return res.status(400).json({
        message: `No se encontro una acta de adicionales para el envelopeId ${envelopeId}`,
      });
    }
    if (oFindTipoDocumento.value === "ActaExcedidas") {
      if (event !== "envelope-completed") {
        return res.status(200).json({
          message: `Campo event: ${event}`,
        });
      }

      const pgoDestination = SapCfAxios("PGO");
      let oActasExcedidas = await cds.run(
        SELECT.one.from(ActasExcedidas).where({ envelopeId })
      );

      if (!!oActasExcedidas) {
        let oActa = await cds.run(
          SELECT.one.from(Actas).where({ ID: oActasExcedidas.acta_ID })
        );
        const oPI = await cds.run(
          SELECT.one.from(ObraPI).where({ ID: oActa.pi_ID })
        );
        const oP3 = await cds.run(SELECT.one.from(P3).where({ ID: oPI.p3_ID }));

        const [aObraPIID] = await cds.run(
          `SELECT PI.ID FROM COM_AYSA_PGO_OBRAPI AS PI WHERE P3_ID = '${oP3.ID}'`
        );
        const [ultimoPartidimetro] = await cds.run(
          `SELECT PARTIDIMETRO.ID FROM COM_AYSA_PGO_PARTIDIMETROS AS PARTIDIMETRO WHERE PI_ID = '${aObraPIID.ID}' AND ESTADO_ID = 'AP' AND NRO_PARTIDIMETRO = (SELECT MAX(NRO_PARTIDIMETRO) FROM COM_AYSA_PGO_PARTIDIMETROS WHERE PI_ID = '${aObraPIID.ID}' AND ESTADO_ID = 'AP')`
        );
        let msgUltimoPartidimetro = await pgoDestination({
          method: "GET",
          url: `/catalog/Partidimetros/${ultimoPartidimetro.ID}?$expand=detalle_partidimetro($expand=analisis_precio($expand=materiales,equipos,mano_obra,combustibles))`,
        });
        let msgNuevaData = await pgoDestination({
          method: "GET",
          url: `/catalog/ActasExcedidas/${oActasExcedidas.ID}?$expand=partidas_excedidas`,
        });

        let partidimetro = msgUltimoPartidimetro.data;
        delete partidimetro["@odata.context"];
        delete partidimetro.copia_de_ID;
        partidimetro.createdAt = msgNuevaData.data.createdAt;
        partidimetro.createdBy = msgNuevaData.data.createdBy;
        partidimetro.nro_partidimetro = partidimetro.nro_partidimetro + 1;
        partidimetro.copia_de_ID = ultimoPartidimetro.ID.toString();

        let promises = [];
        partidimetro.detalle_partidimetro.forEach((detalle) => {
          if (msgNuevaData.data.partidas_excedidas.length) {
            const partidaExcedidaCorrespondiente =
              msgNuevaData.data.partidas_excedidas.find(
                (partidaExcedida) =>
                  partidaExcedida.codigo1 === detalle.codigo1 &&
                  partidaExcedida.codigo2 === detalle.codigo2 &&
                  partidaExcedida.codigo3 === detalle.codigo3 &&
                  partidaExcedida.codigo4 === detalle.codigo4 &&
                  partidaExcedida.codigo5 === detalle.codigo5
              );
            if (partidaExcedidaCorrespondiente) {
              promises.push(
                cds.run(
                  INSERT.into(ActasPartida).entries({
                    cantidad_original: detalle.cantidad,
                    acta_ID: msgNuevaData.data.acta_ID,
                    partida_ID: detalle.ID,
                    cantidad_excedida:
                      partidaExcedidaCorrespondiente.cantidad_excedidas,
                  })
                )
              );
              detalle.cantidad =
                detalle.cantidad +
                partidaExcedidaCorrespondiente.cantidad_excedidas;
            }
          }
          delete detalle.ID;
          delete detalle.createdAt;
          delete detalle.createdBy;
          delete detalle.modifiedBy;
          delete detalle.modifiedAt;
          delete partidimetro_ID;
          detalle.tipo_partida_ID = "EX";
          if (detalle.analisis_precio.length) {
            detalle.analisis_precio.forEach((apu) => {
              delete apu.ID;
              delete apu.partida_ID;
              delete apu.createdAt;
              delete apu.createdBy;
              delete apu.modifiedAt;
              delete apu.modifiedBy;
              if (apu.combustibles.length) {
                apu.combustibles.forEach((combustible) => {
                  delete combustible.ID;
                  delete combustible.partida_ID;
                  delete combustible.createdAt;
                  delete combustible.createdBy;
                  delete combustible.modifiedAt;
                  delete combustible.modifiedBy;
                });
              }
              if (apu.mano_obra.length) {
                apu.mano_obra.forEach((mano_obra) => {
                  delete mano_obra.ID;
                  delete mano_obra.partida_ID;
                  delete mano_obra.createdAt;
                  delete mano_obra.createdBy;
                  delete mano_obra.modifiedAt;
                  delete mano_obra.modifiedBy;
                });
              }
              if (apu.materiales.length) {
                apu.materiales.forEach((material) => {
                  delete material.ID;
                  delete material.partida_ID;
                  delete material.createdAt;
                  delete material.createdBy;
                  delete material.modifiedAt;
                  delete material.modifiedBy;
                });
              }
              if (apu.equipos.length) {
                apu.equipos.forEach((equipo) => {
                  delete equipo.ID;
                  delete equipo.partida_ID;
                  delete equipo.createdAt;
                  delete equipo.createdBy;
                  delete equipo.modifiedAt;
                  delete equipo.modifiedBy;
                });
              }
            });
          }
        });

        /* Formateo el body de la copia de partidimetro y de las adiciones a el */
        delete msgUltimoPartidimetro.data.ID;

        /* Falta filtrar los Ids de los objetos dependientes de ese partidimetro, se hace cuando pueda reconocer el Body */
        let createPartidimetro = await cds.run(
          INSERT.into(Partidimetros).entries({
            ...partidimetro,
          })
        );
        let actaUpdate = await cds.run(
          UPDATE(ActasExcedidas)
            .data({
              estado_ID: "AP",
            })
            .where({ ID: oActasExcedidas.ID })
        );
        await Promise.all(promises);
        return res.status(200).json({
          message: `Acta de excedidas firmada`,
        });
      }
      return res.status(400).json({
        message: `No se encontro una acta de excedidas para el envelopeId ${envelopeId}`,
      });
    }
    if (oFindTipoDocumento.value === "ActaEconomias") {
      if (event !== "envelope-completed") {
        return res.status(200).json({
          message: `Campo event: ${event}`,
        });
      }

      const pgoDestination = SapCfAxios("PGO");
      let oActasEconomias = await cds.run(
        SELECT.one.from(ActasEconomias).where({ envelopeId })
      );

      if (!!oActasEconomias) {
        let oActa = await cds.run(
          SELECT.one.from(Actas).where({ ID: oActasEconomias.acta_ID })
        );
        const oPI = await cds.run(
          SELECT.one.from(ObraPI).where({ ID: oActa.pi_ID })
        );
        const oP3 = await cds.run(SELECT.one.from(P3).where({ ID: oPI.p3_ID }));

        const [aObraPIID] = await cds.run(
          `SELECT PI.ID FROM COM_AYSA_PGO_OBRAPI AS PI WHERE P3_ID = '${oP3.ID}'`
        );
        const [ultimoPartidimetro] = await cds.run(
          `SELECT PARTIDIMETRO.ID FROM COM_AYSA_PGO_PARTIDIMETROS AS PARTIDIMETRO WHERE PI_ID = '${aObraPIID.ID}' AND ESTADO_ID = 'AP' AND NRO_PARTIDIMETRO = (SELECT MAX(NRO_PARTIDIMETRO) FROM COM_AYSA_PGO_PARTIDIMETROS WHERE PI_ID = '${aObraPIID.ID}' AND ESTADO_ID = 'AP')`
        );
        let msgUltimoPartidimetro = await pgoDestination({
          method: "GET",
          url: `/catalog/Partidimetros/${ultimoPartidimetro.ID}?$expand=detalle_partidimetro($expand=analisis_precio($expand=materiales,equipos,mano_obra,combustibles))`,
        });
        let msgNuevaData = await pgoDestination({
          method: "GET",
          url: `/catalog/ActasEconomias/${oActasEconomias.ID}?$expand=partidas_economias`,
        });

        let partidimetro = msgUltimoPartidimetro.data;

        delete partidimetro["@odata.context"];
        partidimetro.createdAt = msgNuevaData.data.createdAt;
        partidimetro.createdBy = msgNuevaData.data.createdBy;
        partidimetro.nro_partidimetro = partidimetro.nro_partidimetro + 1;
        partidimetro.copia_de_ID = ultimoPartidimetro.ID.toString();
        let promises = [];
        for (detalle of partidimetro.detalle_partidimetro) {
          /*  */ if (msgNuevaData.data.partidas_economias.length) {
            const partidaEconomiaCorrespondiente =
              msgNuevaData.data.partidas_economias.find(
                (partidaEconomia) =>
                  partidaEconomia.codigo1 === detalle.codigo1 &&
                  partidaEconomia.codigo2 === detalle.codigo2 &&
                  partidaEconomia.codigo3 === detalle.codigo3 &&
                  partidaEconomia.codigo4 === detalle.codigo4 &&
                  partidaEconomia.codigo5 === detalle.codigo5
              );
            if (partidaEconomiaCorrespondiente) {
              promises.push(
                cds.run(
                  INSERT.into(ActasPartida).entries({
                    cantidad_original: detalle.cantidad,
                    acta_ID: msgNuevaData.data.acta_ID,
                    partida_ID: detalle.ID,
                    cantidad_economia:
                      partidaEconomiaCorrespondiente.cantidad_deducir,
                  })
                )
              );
              detalle.cantidad =
                detalle.cantidad -
                partidaEconomiaCorrespondiente.cantidad_deducir;
            }
          }
          delete detalle.ID;
          delete detalle.createdAt;
          delete detalle.createdBy;
          delete detalle.modifiedBy;
          delete detalle.modifiedAt;
          delete detalle.partidimetro_ID;
          detalle.tipo_partida_ID = "EC";
          if (detalle.analisis_precio.length) {
            detalle.analisis_precio.forEach((apu) => {
              delete apu.ID;
              delete apu.partida_ID;
              delete apu.createdAt;
              delete apu.createdBy;
              delete apu.modifiedAt;
              delete apu.modifiedBy;
              if (apu.combustibles.length) {
                apu.combustibles.forEach((combustible) => {
                  delete combustible.ID;
                  delete combustible.partida_ID;
                  delete combustible.createdAt;
                  delete combustible.createdBy;
                  delete combustible.modifiedAt;
                  delete combustible.modifiedBy;
                });
              }
              if (apu.mano_obra.length) {
                apu.mano_obra.forEach((mano_obra) => {
                  delete mano_obra.ID;
                  delete mano_obra.partida_ID;
                  delete mano_obra.createdAt;
                  delete mano_obra.createdBy;
                  delete mano_obra.modifiedAt;
                  delete mano_obra.modifiedBy;
                });
              }
              if (apu.materiales.length) {
                apu.materiales.forEach((material) => {
                  delete material.ID;
                  delete material.partida_ID;
                  delete material.createdAt;
                  delete material.createdBy;
                  delete material.modifiedAt;
                  delete material.modifiedBy;
                });
              }
              if (apu.equipos.length) {
                apu.equipos.forEach((equipo) => {
                  delete equipo.ID;
                  delete equipo.partida_ID;
                  delete equipo.createdAt;
                  delete equipo.createdBy;
                  delete equipo.modifiedAt;
                  delete equipo.modifiedBy;
                });
              }
            });
          }
        }

        delete msgUltimoPartidimetro.data.ID;

        /* Falta filtrar los Ids de los objetos dependientes de ese partidimetro, se hace cuando pueda reconocer el Body */
        let createPartidimetro = await cds.run(
          INSERT.into(Partidimetros).entries({
            ...partidimetro,
          })
        );
        let actaUpdate = await cds.run(
          UPDATE(ActasEconomias)
            .data({
              estado_ID: "AP",
            })
            .where({ ID: oActasEconomias.ID })
        );
        await Promise.all(promises);
        return res.status(200).json({
          message: `Acta de economia firmada`,
        });
      }
      return res.status(400).json({
        message: `No se encontro una acta de economias para el envelopeId ${envelopeId}`,
      });
    }

    if (oFindTipoDocumento.value === "PermisoSeguridadHigiene") {
      const oPermisosSH = await cds.run(
        SELECT.one.from(PermisosSH).where({ envelopeId })
      );

      if (!oPermisosSH) {
        return res.status(200).json({
          message: `No se encontro un permiso para el envelopeId ${envelopeId}`,
        });
      }

      /* aca se hace la lógica */
      if (event === "envelope-completed") {
        const fileName = `PermisoSeguridadHigiene_${Date.now()}.pdf`;
        const oPresentacion = await cds.run(
          SELECT.one
            .from(PresentacionesSH)
            .where({ ID: oPermisosSH.presentacion_ID })
        );
        const oObra = await cds.run(
          SELECT.from(Obras).where({ ID: oPresentacion.obra_ID })
        );
        const aRepresentates = await getRepresentantes(oObra);
        const [aInspectoresID, aInspectores] = await getInspectores(oObra);

        const wfDestination = SapCfAxios("WORKFLOW");

        const oWorkflowPayload = {
          definitionId: "pgo.wfnotificacion",
          context: {
            subject: `${oObra[0].p3} - Permiso de seguridad e higiene generado`,
            description: `La dirección de Seguridad e Higiene ha generado el permiso de para la obra ${oObra[0].p3} - ${oObra[0].nombre}.
          Puede acceder a los mismos desde Gestionar obras -> Acciones -> Documentación -> Seguridad e Higiene.`,
            recipients: aInspectores.map((recipient) => recipient.usuario),
            recipients_correo: aInspectores.map(
              (recipient) => recipient.correo
            ),
          },
        };
        const oWorkflowPayloadContratista = {
          definitionId: "pgo.wfnotificacion",
          context: {
            subject: `${oObra[0].p3} - Permiso de seguridad e higiene generado`,
            description: `La dirección de Seguridad e Higiene ha generado el permiso de para la obra ${oObra[0].p3} - ${oObra[0].nombre}.
          Puede acceder a los mismos desde Mis obras -> Acciones -> Documentación -> Seguridad e Higiene.`,
            recipients: aRepresentates.map((recipient) => recipient.usuario),
          },
        };
        /*
        console.log(
          "LogTestBinario",
          req.body.data.envelopeSummary.envelopeDocuments[0]
        );
        */
        /* await postDMSFile(
          req.body.data.envelopeSummary.envelopeDocuments[0].PDFBytes,
          fileName
        );
 */ await wfDestination({
          method: "POST",
          url: `/workflow-instances`,
          data: oWorkflowPayload,
        }),
          await wfDestination({
            method: "POST",
            url: `/workflow-instances`,
            data: oWorkflowPayloadContratista,
          }),
          await cds.run(
            UPDATE(PresentacionesSH)
              .data({ estado_ID: "PO", permiso_pdf: fileName })
              .where({ ID: oPermisosSH.presentacion_ID })
          );

        return res.status(200).json({
          message: `Permiso firmado`,
        });
      }

      await cds.run(
        UPDATE(PresentacionesSH)
          .data({ estado_ID: "PH" })
          .where({ ID: oPermisosSH.presentacion_ID })
      );

      return res.status(200).json({
        message: `Permiso rechazado`,
      });
    }
  } catch (error) {
    console.log("---firmaElectronica---", error);
    res.status(400).json({ error, errorString: JSON.stringify(error) });
  }
};

const postDMSFile = async function (file, fileName) {
  return;
  const dmsDestination = SapCfAxios("DMS_ROOT_CLIENTCREDENTIALS");
  /* const oPermisosSH = await cds.run(
    SELECT.one.from(PermisosSH).where({ envelopeId })
  );
  const oPresentacionSH = await cds.run(
    SELECT.one.from(PresentacionesSH).where({ ID: oPermisosSH.presentacion_ID })
  );
  const oObra = await cds.run(
    SELECT.one.from(Obras).where({ ID: oPresentacionSH.obra_ID })
  );
  const oContratista = await cds.run(
    SELECT.one.from(Contratistas).where({ ID: oObra.contratista_ID })
  ); */
  const fileBuffer = Buffer.from(file, "base64");
  const oForm = new FormData();
  oForm.append("cmisaction", "createDocument");
  oForm.append("propertyId[0]", "cmis:name");
  oForm.append("propertyValue[0]", fileName);
  oForm.append("propertyId[1]", "cmis:objectTypeId");
  oForm.append("propertyValue[1]", "cmis:document");
  //oForm.append("filename", fileName);
  oForm.append("_charset_", "UTF-8");
  oForm.append("includeAllowableActions", true);
  oForm.append("succinct", true);
  oForm.append("media", file);
  return await dmsDestination({
    method: "POST",
    url: `/Obras`,
    headers: { "Content-Type": "multipart/form-data" },
    body: oForm,
  });
};
/*
const postDMSFile = async function (file, fileName) {
  const dmsDestination = SapCfAxios("DMS_ROOT_CLIENTCREDENTIALS");

  
  const pdfBuffer = Buffer.from(file, "base64");
  
  fs.writeFileSync(fileName, pdfBuffer);
  
  //const fileContent = fs.readFileSync(fileName, { encoding: 'base64' });
  const fileContent = fs.readFileSync(fileName);
  const fileData = new Uint8Array(fileContent);
  //const encodedData = iconv.decode(fileData, 'ansi')
  //const fileContentStream = fs.createReadStream(fileName);
  
  //fileContentStream.pipe(concatenate())
  //console.log(fileContent == pdfBuffer)
  //const base64Content = fileContent.toString('base64');

  const formData = {
    nombre: 'John Doe',
    email: 'johndoe@example.com',
    mensaje: '¡Hola desde Node.js!'
  };

  const postData = querystring.stringify(formData);

  
  const oForm = new FormData();
  oForm.append("cmisaction", "createDocument");
  oForm.append("propertyId[0]", "cmis:name");
  //oForm.append("propertyValue[0]", fileName);
  const CRLF = "\r\n";
  const options = {
    header:
      "--" +
      oForm.getBoundary() +
      CRLF +
      `Content-Disposition: form-data; name="propertyValue[0]"` +
      CRLF +
      `Content-Type: text/plain;charset=UTF-8` +
      CRLF +
      CRLF,
  };

  oForm.append("propertyValue[0]", fileName, options);

  oForm.append("propertyId[1]", "cmis:objectTypeId");
  oForm.append("propertyValue[1]", "cmis:document");
  //oForm.append("filename", fileName);
  oForm.append("_charset", "UTF-8");
  oForm.append("includeAllowableActions", true);
  oForm.append("succinct", true);

  const fileOptions = {
    header:
      "--" +
      oForm.getBoundary() +
      CRLF +
      `Content-Disposition: form-data; name="file"; filename*=UTF-8''${fileName}` +
      CRLF +
      `Content-Type: application/pdf` +
      CRLF +
      CRLF,
  };

  const readableStream = new Readable();
  readableStream.push(fileData);
  readableStream.push(null);

  oForm.append("media", Buffer.from(fileData), {
    filename: fileName,
    contentType: "application/pdf",
  });
  oForm.append("extractArchive", false);
  const destinationConfig = await readDestination("DMS_ROOT_CLIENTCREDENTIALS");
  const [token] = destinationConfig.authTokens;
  
  let formDataToBufferObject = formDataToBuffer( oForm );
  console.log(formDataToBufferObject)

  /* 
  axios
    .post(
      "https://api-sdm-di.cfapps.us10.hana.ondemand.com/browser/RepositorioPGO/root/Obras",
      oForm,
      {
        headers: {
          Authorization: `Bearer ${token.value}`,
          ...oForm.getHeaders(),
        },
      }
    )
    .then((response) => {
      console.log("Archivo enviado con éxito a SAP DMS BTP");
      // Procesar la respuesta, si es necesario
    })
    .catch((error) => {
      console.error("Error al enviar el archivo a SAP DMS BTP:", error);
    });

  return;
  readableStream.pipe(
    concat({ encoding: "uint8array" }, function (data) {
      // Agregar los datos concatenados al FormData
      oForm.append("media", Buffer.from(data), {
        filename: fileName,
        contentType: "application/pdf",
      });

      // Realizar la solicitud POST a SAP DMS BTP
      axios
        .post(
          "https://api-sdm-di.cfapps.us10.hana.ondemand.com/browser/RepositorioPGO/root/Obras",
          oForm,
          {
            headers: {
              ...oForm.getHeaders(),
              Authorization: `Bearer ${token.value}`,
            },
          }
        )
        .then((response) => {
          console.log("Archivo enviado con éxito a SAP DMS BTP");
          // Procesar la respuesta, si es necesario
        })
        .catch((error) => {
          console.error("Error al enviar el archivo a SAP DMS BTP:", error);
        });
    })
  );

  //const buf = pdfBuffer.buffer
  //oForm.append("media", fileContent, fileOptions);
  /*
  const oPayload = {
    method: "post",
    url: `/Obras`,
    data: oForm,
    headers: {
      Accept: "application/json",
      DataServiceVersion: "2.0",
      ...oForm.getHeaders(),
    },
  };
*/
//console.log(oPayload)
/*
  const destinationConfig = await readDestination("DMS_ROOT_CLIENTCREDENTIALS");
  const [token] = destinationConfig.authTokens;

  const resp = await axios({
    method: "POST",
    url: `https://api-sdm-di.cfapps.us10.hana.ondemand.com/browser/RepositorioPGO/root/Obras`,
    headers: {
      ...oForm.getHeaders(),
      Accept: "application/json",
      DataServiceVersion: "2.0",
      Authorization: `Bearer ${token.value}`,
    },
    oForm,
    maxRedirects: 20,
  });
*/
/*
  const resp = await dmsDestination(oPayload);
  console.log(resp)
  */
/*
  oForm.pipe(
    concat(async (form) => {
      try {
        const oPayload = {
          method: "post",
          url: `/Obras`,
          data: form.toString('utf-8'),
          headers: {
            Accept: "application/json",
            DataServiceVersion: "2.0",
            ...oForm.getHeaders(),
          },
        };
        
        //console.log(oPayload)
        
        await dmsDestination(oPayload);
      } catch (error) {
        console.log(error);
      }
    })
    );
  };
  */

const deleteTablas = async (req = request, res = response) => {
  try {
    const { tabla } = req.body;
    const catalog = await cds.connect.to("CatalogService");
    const { DocumentoModificacionCabecera, DocumentoModificacionPosicion } =
      catalog.entities;

    await cds.run(DELETE.from(DocumentoModificacionCabecera).where({ tabla }));
    //await cds.run(DELETE.from(DocumentoModificacionPosicion));

    res.status(201).json({
      ok: true,
    });
  } catch (error) {
    res.status(201).json({
      ok: false,
      error,
    });
  }
};

const getUUID = (req = request, res = response) => {
  try {
    res.status(201).json({
      uuid: uuidv4(),
    });
  } catch (error) {
    res.status(400).json({
      error,
    });
  }
};

const createOC = async (req = request, res = response) => {
  try {
    const aData = req.body;
    await Promise.all(
      aData.map((item) => cds.run(INSERT.into(OrdenesCompra).entries(item)))
    );
    res.status(201).json({
      ok: true,
    });
  } catch (error) {
    console.log("ERROR INSER ORDEN COMPRA-->", error);
    res.status(400).json({
      error,
    });
  }
};

const pasarActaProrrogaPlazos = async (req = request, res = response) => {
  try {
    const aData = req.body;
    let promises = [];
    promises.push(
      cds.run(
        UPDATE(ActasProrrogaPlazos)
          .data({
            estado_ID: aData.nuevo_estado,
          })
          .where({ ID: aData.actaProrrogaPlazos_ID })
      )
    );
    promises.push(
      cds.run(
        UPDATE(AprobadoresActa)
          .data({
            decision_ID: "PA",
            observaciones: aData.observaciones,
          })
          .where({ ID: aData.aprobadoresActa_ID })
      )
    );
    await Promise.all(promises);
    res.status(201).json({
      ok: true,
    });
  } catch (error) {
    console.log("ERROR UPDATE ACTAPRORROGAPLAZOS-->", error);
    res.status(400).json({
      error,
    });
  }
};

const rechazarActaProrrogaPlazos = async (req = request, res = response) => {
  try {
    const aData = req.body;
    let promises = [];
    promises.push(
      cds.run(
        UPDATE(ActasProrrogaPlazos)
          .data({
            estado_ID: "RE",
          })
          .where({ ID: aData.actaProrrogaPlazos_ID })
      )
    );
    promises.push(
      cds.run(
        UPDATE(AprobadoresActa)
          .data({
            decision_ID: "RE",
            observaciones: aData.observaciones,
          })
          .where({ ID: aData.aprobadoresActa_ID })
      )
    );
    await Promise.all(promises);
    res.status(201).json({
      ok: true,
    });
  } catch (error) {
    console.log("ERROR UPDATE ACTAPRORROGAPLAZOS-->", error);
    res.status(400).json({
      error,
    });
  }
};

const aprobarActaProrrogaPlazos = async (req = request, res = response) => {
  try {
    const aData = req.body;
    let promises = [];
    promises.push(
      cds.run(
        UPDATE(ActasProrrogaPlazos)
          .data({
            estado_ID: aData.nuevo_estado,
          })
          .where({ ID: aData.actaProrrogaPlazos_ID })
      )
    );
    promises.push(
      cds.run(
        UPDATE(AprobadoresActa)
          .data({
            decision_ID: "AP",
            observaciones: aData.observaciones,
          })
          .where({ ID: aData.aprobadoresActa_ID })
      )
    );
    if (aData.nueva_fecha_finalizacion !== null) {
      promises.push(
        cds.run(
          UPDATE(Obras)
            .data({
              fecha_fin_contractual_original_vigente:
                aData.fecha_fin_contractual_original_vigente,
            })
            .where({ ID: aData.obra_ID })
        )
      );
    }
    await Promise.all(promises);
    res.status(201).json({
      ok: true,
    });
  } catch (error) {
    console.log("ERROR UPDATE ACTAPRORROGAPLAZOS-->", error);
    res.status(400).json({
      error,
    });
  }
};

let docuSign = async function (oBase64, numActa, p3, signers) {
  try {
    const cpiDestination = SapCfAxios("CPI");

    const oDocuSignPayload = {
      documents: [
        {
          documentId: "1",
          name: "Acta de prórroga plazos N° " + numActa,
          documentBase64: oBase64,
        },
      ],
      emailSubject: p3 + " - Acta prórroga de plazos N° " + numActa,
      status: "sent",
      customFields: {
        listCustomFields: [
          {
            fieldId: "1",
            show: "true",
            required: "false",
            name: "TipoDocumento",
            value: "ActaProrrogaPlazos",
          },
        ],
      },
      recipients: {
        signers: signers,
      },
    };

    let msg = await cpiDestination({
      method: "POST",
      url: `/EnvelopeDocuSign`,
      data: oDocuSignPayload,
    });
    if (msg.status !== 201) {
      return res.status(400).json({
        error: `Hubo un error al enviar el pdf, intente nuevamente`,
      });
    }
    return msg.data.envelopeId;
  } catch (error) {
    console.log(error);
  }
};
let docuSignExcedidas = async function (oBase64, numActa, p3, signers) {
  try {
    const cpiDestination = SapCfAxios("CPI");

    const oDocuSignPayload = {
      documents: [
        {
          documentId: "1",
          name: "Acta de excedidas N° " + numActa,
          documentBase64: oBase64,
        },
      ],
      emailSubject: p3 + " - Acta de excedidas N° " + numActa,
      status: "sent",
      customFields: {
        listCustomFields: [
          {
            fieldId: "1",
            show: "true",
            required: "false",
            name: "TipoDocumento",
            value: "ActaExcedidas",
          },
        ],
      },
      recipients: {
        signers: signers,
      },
    };

    let msg = await cpiDestination({
      method: "POST",
      url: `/EnvelopeDocuSign`,
      data: oDocuSignPayload,
    });
    if (msg.status !== 201) {
      return res.status(400).json({
        error: `Hubo un error al enviar el pdf, intente nuevamente`,
      });
    }
    return msg.data.envelopeId;
  } catch (error) {
    console.log(error);
  }
};
let docuSignAmpliacion = async function (oBase64, numActa, p3, signers) {
  try {
    const cpiDestination = SapCfAxios("CPI");

    const oDocuSignPayload = {
      documents: [
        {
          documentId: "1",
          name: "Acta de ampliación N° " + numActa,
          documentBase64: oBase64,
        },
      ],
      emailSubject: p3 + " - Acta de ampliación N° " + numActa,
      status: "sent",
      customFields: {
        listCustomFields: [
          {
            fieldId: "1",
            show: "true",
            required: "false",
            name: "TipoDocumento",
            value: "ActaAmpliacion",
          },
        ],
      },
      recipients: {
        signers: signers,
      },
    };

    let msg = await cpiDestination({
      method: "POST",
      url: `/EnvelopeDocuSign`,
      data: oDocuSignPayload,
    });
    if (msg.status !== 201) {
      return res.status(400).json({
        error: `Hubo un error al enviar el pdf, intente nuevamente`,
      });
    }
    return msg.data.envelopeId;
  } catch (error) {
    console.log(error);
  }
};
let docuSignSancion = async function (oBase64, numActa, p3, signers) {
  try {
    const cpiDestination = SapCfAxios("CPI");

    const oDocuSignPayload = {
      documents: [
        {
          documentId: "1",
          name: "Acta de sanción N° " + numActa,
          documentBase64: oBase64,
        },
      ],
      emailSubject: p3 + " - Acta de sanción N° " + numActa,
      status: "sent",
      customFields: {
        listCustomFields: [
          {
            fieldId: "1",
            show: "true",
            required: "false",
            name: "TipoDocumento",
            value: "ActaSanciones",
          },
        ],
      },
      recipients: {
        signers: signers,
      },
    };

    let msg = await cpiDestination({
      method: "POST",
      url: `/EnvelopeDocuSign`,
      data: oDocuSignPayload,
    });
    if (msg.status !== 201) {
      return res.status(400).json({
        error: `Hubo un error al enviar el pdf, intente nuevamente`,
      });
    }
    return msg.data.envelopeId;
  } catch (error) {
    console.log(error);
  }
};
let docuSignSuspension = async function (oBase64, numActa, p3, signers) {
  try {
    const cpiDestination = SapCfAxios("CPI");

    const oDocuSignPayload = {
      documents: [
        {
          documentId: "1",
          name: "Acta de suspensión N° " + numActa,
          documentBase64: oBase64,
        },
      ],
      emailSubject: p3 + " - Acta de suspensión N° " + numActa,
      status: "sent",
      customFields: {
        listCustomFields: [
          {
            fieldId: "1",
            show: "true",
            required: "false",
            name: "TipoDocumento",
            value: "ActaSuspension",
          },
        ],
      },
      recipients: {
        signers: signers,
      },
    };

    let msg = await cpiDestination({
      method: "POST",
      url: `/EnvelopeDocuSign`,
      data: oDocuSignPayload,
    });
    if (msg.status !== 201) {
      return res.status(400).json({
        error: `Hubo un error al enviar el pdf, intente nuevamente`,
      });
    }
    return msg.data.envelopeId;
  } catch (error) {
    console.log(error);
  }
};
let docuSignAdicional = async function (oBase64, numActa, p3, signers) {
  try {
    const cpiDestination = SapCfAxios("CPI");

    const oDocuSignPayload = {
      documents: [
        {
          documentId: "1",
          name: "Acta de adicionales N° " + numActa,
          documentBase64: oBase64,
        },
      ],
      emailSubject: p3 + " - Acta adicionales N° " + numActa,
      status: "sent",
      customFields: {
        listCustomFields: [
          {
            fieldId: "1",
            show: "true",
            required: "false",
            name: "TipoDocumento",
            value: "ActasAdicionales",
          },
        ],
      },
      recipients: {
        signers: signers,
      },
    };

    let msg = await cpiDestination({
      method: "POST",
      url: `/EnvelopeDocuSign`,
      data: oDocuSignPayload,
    });
    if (msg.status !== 201) {
      return res.status(400).json({
        error: `Hubo un error al enviar el pdf, intente nuevamente`,
      });
    }
    return msg.data.envelopeId;
  } catch (error) {
    console.log(error);
  }
};
let docuSignEconomias = async function (oBase64, numActa, p3, signers) {
  try {
    const cpiDestination = SapCfAxios("CPI");

    const oDocuSignPayload = {
      documents: [
        {
          documentId: "1",
          name: "Acta de Economias N° " + numActa,
          documentBase64: oBase64,
        },
      ],
      emailSubject: p3 + " - Acta de Economias N° " + numActa,
      status: "sent",
      customFields: {
        listCustomFields: [
          {
            fieldId: "1",
            show: "true",
            required: "false",
            name: "TipoDocumento",
            value: "ActasEconomias",
          },
        ],
      },
      recipients: {
        signers: signers,
      },
    };

    let msg = await cpiDestination({
      method: "POST",
      url: `/EnvelopeDocuSign`,
      data: oDocuSignPayload,
    });
    if (msg.status !== 201) {
      return res.status(400).json({
        error: `Hubo un error al enviar el pdf, intente nuevamente`,
      });
    }
    return msg.data.envelopeId;
  } catch (error) {
    console.log(error);
  }
};

const actualizarActaProrrogaPlazos = async (req = request, res = response) => {
  try {
    const aData = req.body;
    let promises = [];
    //1 - Actualizar ActasProrrogaPlazos: Fijar “nuevo_estado” en ActaProrrogaPlazos.estado_ID
    const oActasProrrogaPlazos = await cds.run(
      SELECT.one
        .from(ActasProrrogaPlazos)
        .where({ ID: aData.actaProrrogaPlazos })
    );

    if (!oActasProrrogaPlazos) {
      return res.status(400).json({
        error: `Ne se encontró un Acta de prorroga plazos para el ID: ${aData.actaProrrogaPlazos}`,
      });
    }
    if (aData.nuevo_estado !== "PF") {
      promises.push(
        cds.run(
          UPDATE(ActasProrrogaPlazos)
            .data({
              estado_ID: aData.nuevo_estado,
            })
            .where({ ID: aData.actaProrrogaPlazos })
        )
      );
    }

    const oActas = await cds.run(
      SELECT.one.from(Actas).where({ ID: oActasProrrogaPlazos.acta_ID })
    );

    //2 - Actualizar AprobadoresActa Navegar de ActasProrrogaPlazos a Actas y luego a AprobadoresActa Buscar “rol” y “usuario” y actualizar “decision” y “observaciones”
    const oPI = await cds.run(
      SELECT.one.from(ObraPI).where({ ID: oActas.pi_ID })
    );
    const oP3 = await cds.run(SELECT.one.from(P3).where({ ID: oPI.p3_ID }));
    promises.push(
      cds.run(
        UPDATE(AprobadoresActa)
          .data({
            decision_ID: aData.decision,
            observaciones: aData.observaciones,
          })
          .where({
            acta_ID: oActas.ID,
            rol_ID: aData.rol,
            usuario: aData.usuario,
          })
      )
    );

    //4 - Si nueva fecha de finalización esta completa generar PDF y enviarlo a docuSign
    if (aData.nuevo_estado === "PF") {
      const aAprobadores = await cds.run(
        SELECT.from(AprobadoresActa).where({
          acta_ID: oActas.ID,
          decision_ID: "AP",
        })
      );
      let aActasProrroga = await cds.run(
        `SELECT ACTASPRORROGA.PLAZO_PRORROGA, ACTASPRORROGA.PLAZO_PRORROGA_ACUMULADO, ACTASPRORROGA.FECHA_ACTA FROM COM_AYSA_PGO_ACTAS AS ACTAS LEFT JOIN COM_AYSA_PGO_ACTASPRORROGAPLAZOS AS ACTASPRORROGA ON ACTAS.ID = ACTASPRORROGA.ACTA_ID WHERE ACTAS.TIPO_ACTA_ID = 'PR' AND ACTAS.PI_ID = '${oActas.pi_ID}' ORDER BY ACTASPRORROGA.FECHA_ACTA`
      );

      let oObra = await cds.run(
        `SELECT OBRAS.*, 
        PARTIDOS.DESCRIPCION AS PartDes, 
        FLUIDOS.DESCRIPCION AS FluDes, 
        SISTEMAS.DESCRIPCION AS SisDes, 
        FINANCIAMIENTOS.DESCRIPCION AS FinDes, 
        CONTRATISTAS.RAZONSOCIAL 
  FROM COM_AYSA_PGO_P3 AS P3
      INNER JOIN COM_AYSA_PGO_OBRAS AS OBRAS
          ON P3.OBRA_ID = OBRAS.ID
      INNER JOIN COM_AYSA_PGO_PARTIDOS AS PARTIDOS
          ON PARTIDOS.ID = P3.PARTIDO_ID
      JOIN COM_AYSA_PGO_FLUIDOS AS FLUIDOS
          ON FLUIDOS.ID = P3.FLUIDO_ID
      JOIN COM_AYSA_PGO_SISTEMAS AS SISTEMAS
          ON P3.SISTEMA_ID = SISTEMAS.ID
      JOIN COM_AYSA_PGO_CONTRATISTAOBRA AS CONTRATISTAOBRA
          ON CONTRATISTAOBRA.OBRA_ID = OBRAS.ID
      JOIN COM_AYSA_PGO_CONTRATISTAS AS CONTRATISTAS
          ON CONTRATISTAS.ID = CONTRATISTAOBRA.CONTRATISTA_ID
      JOIN COM_AYSA_PGO_FINANCIAMIENTOS AS FINANCIAMIENTOS
          ON FINANCIAMIENTOS.ID = OBRAS.FINANCIAMIENTO_OBRA_ID
  WHERE P3.ID = '${oP3.ID}' 
       AND OBRAS.ID = '${oP3.obra_ID}'`
      );

      //Genero el payload del pdf
      const currentDate = new Date();
      const day = currentDate.getDate().toString().padStart(2, "0");
      const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
      const year = currentDate.getFullYear();

      const formattedDate = `${day}/${month}/${year}`;
      oObra = oObra[0];
      let body = {
        nro_acta: oActasProrrogaPlazos.nro_acta,
        nrop3: oP3.codigo,
        obra: oObra.NOMBRE,
        partido: oObra.PARTDES,
        zona: oObra.SISDES,
        fecha: formattedDate,
        contratista: oObra.RAZONSOCIAL,
        referencia: "Acta Prorroga de plazos",
        financiador: oObra.FINDES,
        fecha_inicio_contractual: convertirFormatoFecha(
          oObra.FECHA_INICIO_CONTRACTUAL
        ),
        fecha_inicio_fisico: convertirFormatoFecha(oObra.FECHA_INICIO_FISICO),
        plazo_ejecucion_original: `${oObra.PLAZO_EJECUCION} días`,
        fecha_vencimiento_contractual: convertirFormatoFecha(
          oObra.FECHA_FIN_CONTRACTUAL_ORIGINAL
        ),
        fecha_vencimiento_vigente: convertirFormatoFecha(
          oObra.FECHA_FIN_CONTRACTUAL_ORIGINAL_VIGENTE
        ),
        plazo_propuesto: `${oActasProrrogaPlazos.plazo_prorroga} días`,
        porc_prorroga: `${oActasProrrogaPlazos.porcentaje_prorroga_acumulado}%`,
        prorrogas_anteriores: transformArray(aActasProrroga),
        descripcion: oActasProrrogaPlazos.descripcion,
        anexos: oActasProrrogaPlazos.nueva_fecha_finalizacion,
      };

      //genero el pdf
      const formsDestination = SapCfAxios("FORMSSERVICE");
      const options = {
        beautify: false,
        selfClosing: true,
        attrKey: "@",
        contentKey: "#",
        entityMap: {
          '"': "&#34;",
          "&": "&#38;",
        },
        declaration: {
          encoding: "UTF-8",
          standalone: "yes",
        },
      };
      let xdpTemplate = `actaprorroga/actaprorroga`;
      body = {
        form1: {
          ...body,
        },
      };
      const xml = parser.jsXml.toXmlString(options, body);
      const buffer = Buffer.from(xml, "utf8");
      const base64String = buffer.toString("base64");

      let payload = {
        changeNotAllowed: false,
        embedFont: 0,
        formLocale: "en_US",
        formType: "print",
        printNotAllowed: false,
        taggedPdf: 1,
        xdpTemplate: xdpTemplate,
        xmlData: base64String,
      };
      let msg = await formsDestination({
        method: "POST",
        url: `/v1/adsRender/pdf?templateSource=storageName&TraceLevel=2 `,
        data: payload,
      });

      if (msg.status !== 200) {
        return res.status(400).json({
          error: `Hubo un error al generar el pdf, intente nuevamente`,
        });
      }
      let base64 = msg.data.fileContent;

      //genero los firmantes
      let aSigners = aAprobadores.map((firmante, index) => {
        let cont = index + 1;
        return {
          recipientId: cont.toString(),
          name: firmante.nombre_apellido,
          email: firmante.correo,
          routingOrder: "1",
          emailNotification: {
            emailSubject: `${oP3.codigo} - Acta prorroga de plazos N° ${oActasProrrogaPlazos.nro_acta}`,
            emailBody:
              "La comunicación está pendiente de firma. Por favor, firme el documento para enviarla.",
            supportedLanguage: "es",
          },
          tabs: makePayloadSigners(firmante.rol_ID, cont),
        };
      });

      //envio el documento a docuSign
      let envelopeId = await docuSign(
        base64,
        oActasProrrogaPlazos.nro_acta,
        oP3.codigo,
        aSigners
      );

      promises.push(
        cds.run(
          UPDATE(ActasProrrogaPlazos)
            .data({
              envelopeId,
              estado_ID: aData.nuevo_estado,
            })
            .where({ ID: aData.actaProrrogaPlazos })
        )
      );
    }

    await Promise.all(promises);
    res.status(201).json({
      ok: true,
    });
  } catch (error) {
    console.log("ERROR UPDATE ACTUALIZAR ACTAPRORROGAPLAZOS-->", error);
    res.status(400).json({
      error,
    });
  }
};

const actualizarActaEconomias = async (req = request, res = response) => {
  try {
    const aData = req.body;
    let promises = [];
    const oActasEconomias = await cds.run(
      SELECT.one.from(ActasEconomias).where({ ID: aData.actaEconomias })
    );

    if (!oActasEconomias) {
      return res.status(400).json({
        error: `Ne se encontró un Acta de economía para el ID: ${aData.actaEconomias}`,
      });
    }
    if (aData.nuevo_estado !== "PF") {
      promises.push(
        cds.run(
          UPDATE(ActasEconomias)
            .data({
              estado_ID: aData.nuevo_estado,
            })
            .where({ ID: aData.actaEconomias })
        )
      );
    }

    const oActas = await cds.run(
      SELECT.one.from(Actas).where({ ID: oActasEconomias.acta_ID })
    );

    promises.push(
      cds.run(
        UPDATE(AprobadoresActa)
          .data({
            decision_ID: aData.decision,
            observaciones: aData.observaciones,
          })
          .where({
            acta_ID: oActas.ID,
            rol_ID: aData.rol,
            usuario: aData.usuario,
          })
      )
    );

    //4 - Si nueva fecha de finalización esta completa generar PDF y enviarlo a docuSign
    if (aData.nuevo_estado === "PF") {
      const aAprobadores = await cds.run(
        SELECT.from(AprobadoresActa).where({
          acta_ID: oActas.ID,
          decision_ID: "AP",
        })
      );
      const aPartidasEconomia = await cds.run(
        `SELECT PARTIDAS.*, ITEM.DESCRIPCION AS ITEMDES, SUBITEM.DESCRIPCION AS SUBITEMDES, UNIDADMEDIDA.DESCRIPCION AS UMDES FROM COM_AYSA_PGO_PARTIDASECONOMIAS AS PARTIDAS
        JOIN COM_AYSA_PGO_ITEMPARTIDIMETRO AS ITEM
            ON ITEM.ID = PARTIDAS.ITEM_ID
        JOIN COM_AYSA_PGO_SUBITEMPARTIDIMETRO AS SUBITEM
            ON PARTIDAS.SUBITEM_ID = SUBITEM.ID
        JOIN COM_AYSA_PGO_UMGENERAL AS UNIDADMEDIDA
            ON UNIDADMEDIDA.ID = PARTIDAS.UM_ID
        WHERE PARTIDAS.ACTA_ECONOMIA_ID = '${aData.actaEconomias}'`
      );
      const oPI = await cds.run(
        SELECT.one.from(ObraPI).where({ ID: oActas.pi_ID })
      );
      const oP3 = await cds.run(SELECT.one.from(P3).where({ ID: oPI.p3_ID }));

      let oObra = await cds.run(
        `SELECT OBRAS.*, 
        PARTIDOS.DESCRIPCION AS PartDes, 
        FLUIDOS.DESCRIPCION AS FluDes, 
        SISTEMAS.DESCRIPCION AS SisDes, 
        FINANCIAMIENTOS.DESCRIPCION AS FinDes, 
        CONTRATISTAS.RAZONSOCIAL 
  FROM COM_AYSA_PGO_P3 AS P3
      INNER JOIN COM_AYSA_PGO_OBRAS AS OBRAS
          ON P3.OBRA_ID = OBRAS.ID
      INNER JOIN COM_AYSA_PGO_PARTIDOS AS PARTIDOS
          ON PARTIDOS.ID = P3.PARTIDO_ID
      JOIN COM_AYSA_PGO_FLUIDOS AS FLUIDOS
          ON FLUIDOS.ID = P3.FLUIDO_ID
      JOIN COM_AYSA_PGO_SISTEMAS AS SISTEMAS
          ON P3.SISTEMA_ID = SISTEMAS.ID
      JOIN COM_AYSA_PGO_CONTRATISTAOBRA AS CONTRATISTAOBRA
          ON CONTRATISTAOBRA.OBRA_ID = OBRAS.ID
      JOIN COM_AYSA_PGO_CONTRATISTAS AS CONTRATISTAS
          ON CONTRATISTAS.ID = CONTRATISTAOBRA.CONTRATISTA_ID
      JOIN COM_AYSA_PGO_FINANCIAMIENTOS AS FINANCIAMIENTOS
          ON FINANCIAMIENTOS.ID = OBRAS.FINANCIAMIENTO_OBRA_ID
  WHERE P3.ID = '${oP3.ID}' 
       AND OBRAS.ID = '${oP3.obra_ID}'`
      );

      let partidas_economia = aPartidasEconomia.map((item) => {
        return {
          c1: item.CODIGO1 ? item.CODIGO1 : "",
          c2: item.CODIGO2 ? item.CODIGO2 : "",
          c3: item.CODIGO3 ? item.CODIGO3 : "",
          c4: item.CODIGO4 ? item.CODIGO4 : "",
          c5: item.CODIGO5 ? item.CODIGO5 : "",
          descripcion: item.DESCRIPCION ? item.DESCRIPCION : "",
          observaciones: item.OBSERVACION ? item.OBSERVACION : "",
          cantidad: item.CANTIDAD ? item.CANTIDAD : "",
          precio_unitario: parseFloat(item.PRECIO_UNITARIO)
            ? parseFloat(item.PRECIO_UNITARIO)
            : "", // Convert to number
          item: item.ITEMDES ? item.ITEMDES : "",
          subitem: item.SUBITEMDES ? item.SUBITEMDES : "",
          unidad: item.UMDES ? item.UMDES : "",
          subtotal:
            parseFloat(item.PRECIO_UNITARIO) * item.CANTIDAD
              ? parseFloat(item.PRECIO_UNITARIO) * item.CANTIDAD
              : "",
        };
      });

      //Genero el payload del pdf
      const currentDate = new Date();
      const day = currentDate.getDate().toString().padStart(2, "0");
      const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
      const year = currentDate.getFullYear();

      const formattedDate = `${day}/${month}/${year}`;
      oObra = oObra[0];
      let body = {
        nro_documento: oActasEconomias.nro_acta,
        nrop3: oP3.codigo,
        obra: oObra.NOMBRE,
        partido: oObra.PARTDES,
        sistema: oObra.SISDES,
        fecha: formattedDate,
        contratista: oObra.RAZONSOCIAL,
        referencia: "Acta de economías",
        financiada_por: oObra.FINDES,
        nro_PI: oActasEconomias.pi_ID,
        justificacion_partida: oActasEconomias.justificacion,
        documentacion_referencia: "testº",
        partidas_economia,
        monto_original_monetario: aData.monto_original,
        monto_original_porcentual: aData.monto_original_porcentual,
        contractuales_final_obra_monetario: aData.contractuales_monetario,
        contractuales_final_obra_porcentual: aData.contractuales_porcentual,
        excedidas_final_obra_monetario: aData.excedidas_monetario,
        excedidas_final_obra_porcentual: aData.excedidas_porcentual,
        adicionales_final_obra_monetario: aData.adicionales_monetario,
        adicionales_final_obra_porcentual: aData.adicionales_porcentual,
        ampliacion_final_obra_monetario: aData.ampliacion_monetario,
        ampliacion_final_obra_porcentual: aData.ampliacion_porcentual,
        certificacion_acumulada_obra_monetario: aData.certificacion_acumulada,
        certificacion_acumulada_obra_monetaria: aData.certificacion_acumulada,
        certificacion_acumulada_obra_porcecntual:
          aData.certificacion_acumulada_porcentual,
      };

      //genero el pdf
      const formsDestination = SapCfAxios("FORMSSERVICE");
      const options = {
        beautify: false,
        selfClosing: true,
        attrKey: "@",
        contentKey: "#",
        entityMap: {
          '"': "&#34;",
          "&": "&#38;",
        },
        declaration: {
          encoding: "UTF-8",
          standalone: "yes",
        },
      };
      let xdpTemplate = `actaeconomia/actaeconomia`;
      body = {
        form1: {
          ...body,
        },
      };
      const xml = parser.jsXml.toXmlString(options, body);
      const buffer = Buffer.from(xml, "utf8");
      const base64String = buffer.toString("base64");
      let payload = {
        changeNotAllowed: false,
        embedFont: 0,
        formLocale: "en_US",
        formType: "print",
        printNotAllowed: false,
        taggedPdf: 1,
        xdpTemplate: xdpTemplate,
        xmlData: base64String,
      };
      let msg = await formsDestination({
        method: "POST",
        url: `/v1/adsRender/pdf?templateSource=storageName&TraceLevel=2 `,
        data: payload,
      });

      if (msg.status !== 200) {
        return res.status(400).json({
          error: `Hubo un error al generar el pdf, intente nuevamente`,
        });
      }
      let base64 = msg.data.fileContent;

      //genero los firmantes
      let aSigners = aAprobadores.map((firmante, index) => {
        let cont = index + 1;
        return {
          recipientId: cont.toString(),
          name: firmante.nombre_apellido,
          email: firmante.correo,
          routingOrder: "1",
          emailNotification: {
            emailSubject: `${oP3.codigo} - Acta de economía N° ${oActasEconomias.nro_acta}`,
            emailBody:
              "La comunicación está pendiente de firma. Por favor, firme el documento para enviarla.",
            supportedLanguage: "es",
          },
          tabs: makePayloadSigners(firmante.rol_ID, cont),
        };
      });

      //envio el documento a docuSign
      let envelopeId = await docuSignEconomias(
        base64,
        oActasEconomias.nro_acta,
        oP3.codigo,
        aSigners
      );

      promises.push(
        cds.run(
          UPDATE(ActasEconomias)
            .data({
              envelopeId,
              estado_ID: aData.nuevo_estado,
            })
            .where({ ID: aData.actaEconomias })
        )
      );
    }

    await Promise.all(promises);
    res.status(201).json({
      ok: true,
    });
  } catch (error) {
    console.log("ERROR UPDATE ACTUALIZAR ACTAECONOMICAS-->", error);
    res.status(400).json({
      error,
    });
  }
};

const actualizarAdenda = async (req = request, res = response) => {
  try {
    const oData = req.body;
    let promises = [];
    const oAdenda = await cds.run(
      SELECT.one.from(Adendas).where({ ID: oData.adenda })
    );

    if (!oAdenda) {
      return res.status(400).json({
        error: `No se encontró una Adenda para el ID: ${oData.adenda}`,
      });
    }
    if (aData.nuevo_estado !== "PF") {
      promises.push(
        cds.run(
          UPDATE(Adendas)
            .data({
              estado_ID: oData.nuevo_estado,
            })
            .where({ ID: oData.adenda })
        )
      );
    }

    promises.push(
      cds.run(
        UPDATE(AprobadoresAdenda)
          .data({
            decision_ID: oData.decision,
            observaciones: oData.observaciones,
          })
          .where({
            adenda_ID: oData.adenda,
            rol_ID: oData.rol,
            usuario: oData.usuario,
          })
      )
    );

    //4 - Si nueva fecha de finalización esta completa generar PDF y enviarlo a docuSign
    if (aData.nuevo_estado === "PF") {
      const aAprobadores = await cds.run(
        SELECT.from(AprobadoresAdenda).where({
          adenda_ID: oData.adenda,
          decision_ID: "AP",
        })
      );

      //Genero el payload del pdf
      const currentDate = new Date();
      const day = currentDate.getDate().toString().padStart(2, "0");
      const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
      const year = currentDate.getFullYear();

      const formattedDate = `${day}/${month}/${year}`;
      oObra = oObra[0];
      let body = {
        nro_documento: oActasEconomias.nro_acta,
        nrop3: oP3.codigo,
        obra: oObra.NOMBRE,
        partido: oObra.PARTDES,
        sistema: oObra.SISDES,
        fecha: formattedDate,
        contratista: oObra.RAZONSOCIAL,
        referencia: "Acta de economías",
        financiada_por: oObra.FINDES,
        nro_PI: oActasEconomias.pi_ID,
        justificacion_partida: oActasEconomias.justificacion,
        documentacion_referencia: "testº",
        partidas_economia,
        monto_original_monetario: aData.monto_original,
        monto_original_porcentual: aData.monto_original_porcentual,
        contractuales_final_obra_monetario: aData.contractuales_monetario,
        contractuales_final_obra_porcentual: aData.contractuales_porcentual,
        excedidas_final_obra_monetario: aData.excedidas_monetario,
        excedidas_final_obra_porcentual: aData.excedidas_porcentual,
        adicionales_final_obra_monetario: aData.adicionales_monetario,
        adicionales_final_obra_porcentual: aData.adicionales_porcentual,
        ampliacion_final_obra_monetario: aData.ampliacion_monetario,
        ampliacion_final_obra_porcentual: aData.ampliacion_porcentual,
        certificacion_acumulada_obra_monetario: aData.certificacion_acumulada,
        certificacion_acumulada_obra_monetaria: aData.certificacion_acumulada,
        certificacion_acumulada_obra_porcecntual:
          aData.certificacion_acumulada_porcentual,
      };

      //genero el pdf
      const formsDestination = SapCfAxios("FORMSSERVICE");
      const options = {
        beautify: false,
        selfClosing: true,
        attrKey: "@",
        contentKey: "#",
        entityMap: {
          '"': "&#34;",
          "&": "&#38;",
        },
        declaration: {
          encoding: "UTF-8",
          standalone: "yes",
        },
      };
      let xdpTemplate = `actaeconomia/actaeconomia`;
      body = {
        form1: {
          ...body,
        },
      };
      const xml = parser.jsXml.toXmlString(options, body);
      const buffer = Buffer.from(xml, "utf8");
      const base64String = buffer.toString("base64");
      let payload = {
        changeNotAllowed: false,
        embedFont: 0,
        formLocale: "en_US",
        formType: "print",
        printNotAllowed: false,
        taggedPdf: 1,
        xdpTemplate: xdpTemplate,
        xmlData: base64String,
      };
      let msg = await formsDestination({
        method: "POST",
        url: `/v1/adsRender/pdf?templateSource=storageName&TraceLevel=2 `,
        data: payload,
      });

      if (msg.status !== 200) {
        return res.status(400).json({
          error: `Hubo un error al generar el pdf, intente nuevamente`,
        });
      }
      let base64 = msg.data.fileContent;

      //genero los firmantes
      let aSigners = aAprobadores.map((firmante, index) => {
        let cont = index + 1;
        return {
          recipientId: cont.toString(),
          name: firmante.nombre_apellido,
          email: firmante.correo,
          routingOrder: "1",
          emailNotification: {
            emailSubject: `${oP3.codigo} - Acta de economía N° ${oActasEconomias.nro_acta}`,
            emailBody:
              "La comunicación está pendiente de firma. Por favor, firme el documento para enviarla.",
            supportedLanguage: "es",
          },
          tabs: makePayloadSigners(firmante.rol_ID, cont),
        };
      });

      //envio el documento a docuSign
      let envelopeId = await docuSignEconomias(
        base64,
        oActasEconomias.nro_acta,
        oP3.codigo,
        aSigners
      );

      promises.push(
        cds.run(
          UPDATE(ActasEconomias)
            .data({
              envelopeId,
              estado_ID: aData.nuevo_estado,
            })
            .where({ ID: aData.actaEconomias })
        )
      );
    }

    await Promise.all(promises);
    res.status(201).json({
      ok: true,
    });
  } catch (error) {
    console.log("ERROR UPDATE ACTUALIZAR ACTAECONOMICAS-->", error);
    res.status(400).json({
      error,
    });
  }
};

const actualizarActasAdicionales = async (req = request, res = response) => {
  try {
    const aData = req.body;
    let promises = [];
    //1 - Actualizar ActasProrrogaPlazos: Fijar “nuevo_estado” en ActaProrrogaPlazos.estado_ID

    const oActasAdicionales = await cds.run(
      SELECT.one.from(ActasAdicionales).where({ ID: aData.actaAdicionales })
    );

    if (!oActasAdicionales) {
      return res.status(400).json({
        error: `Ne se encontró un Acta de adicionales para el ID: ${aData.actaAdicionales}`,
      });
    }
    if (aData.nuevo_estado !== "PF") {
      promises.push(
        cds.run(
          UPDATE(ActasAdicionales)
            .data({
              estado_ID: aData.nuevo_estado,
            })
            .where({ ID: aData.actaAdicionales })
        )
      );
    }

    const oActas = await cds.run(
      SELECT.one.from(Actas).where({ ID: oActasAdicionales.acta_ID })
    );

    promises.push(
      cds.run(
        UPDATE(AprobadoresActa)
          .data({
            decision_ID: aData.decision,
            observaciones: aData.observaciones,
          })
          .where({
            acta_ID: oActas.ID,
            rol_ID: aData.rol,
            usuario: aData.usuario,
          })
      )
    );

    //4 - Si nueva fecha de finalización esta completa generar PDF y enviarlo a docuSign
    if (aData.nuevo_estado === "PF") {
      const aAprobadores = await cds.run(
        SELECT.from(AprobadoresActa).where({
          acta_ID: oActas.ID,
          decision_ID: "AP",
        })
      );

      const aPartidasAdicionales = await cds.run(
        `SELECT PARTIDAS.*, ITEM.DESCRIPCION AS ITEMDES, SUBITEM.DESCRIPCION AS SUBITEMDES, UNIDADMEDIDA.DESCRIPCION AS UMDES FROM COM_AYSA_PGO_PARTIDASADICIONALES AS PARTIDAS
        JOIN COM_AYSA_PGO_ITEMPARTIDIMETRO AS ITEM
            ON ITEM.ID = PARTIDAS.ITEM_ID
        JOIN COM_AYSA_PGO_SUBITEMPARTIDIMETRO AS SUBITEM
            ON PARTIDAS.SUBITEM_ID = SUBITEM.ID
        JOIN COM_AYSA_PGO_UMGENERAL AS UNIDADMEDIDA
            ON UNIDADMEDIDA.ID = PARTIDAS.UM_ID
        WHERE PARTIDAS.ACTA_ADICIONAL_ID = '${aData.actaAdicionales}'`
      );
      let partidas_adicionales = aPartidasAdicionales.map((item) => {
        return {
          c1: item.CODIGO1 ? item.CODIGO1 : "",
          c2: item.CODIGO2 ? item.CODIGO2 : "",
          c3: item.CODIGO3 ? item.CODIGO3 : "",
          c4: item.CODIGO4 ? item.CODIGO4 : "",
          c5: item.CODIGO5 ? item.CODIGO5 : "",
          descripcion: item.DESCRIPCION ? item.DESCRIPCION : "",
          observaciones: item.OBSERVACION ? item.OBSERVACION : "",
          cantidad: item.CANTIDAD ? item.CANTIDAD : "",
          precio_unitario: item.PRECIO_UNITARIO
            ? parseFloat(item.PRECIO_UNITARIO)
            : 0, // Convert to number
          item: item.ITEMDES ? item.ITEMDES : "",
          subitem: item.SUBITEMDES ? item.SUBITEMDES : "",
          unidad: item.UMDES ? item.UMDES : "",
          subtotal: item.PRECIO_UNITARIO
            ? parseFloat(item.PRECIO_UNITARIO) * item.CANTIDAD
            : 0,
        };
      });
      /* a partir de  el obra_ID Buscar los PI y, por cada PI busco la ultima memoria calculo filtrando por mes/anio a partir de eso, otro join a memoriaTramos otro a memoriaPartidas de ese, saco la suma de cantidad_certificar para cert acum
      para contractuales necesito buscar, el ultimo partidimetro aprobado y por cada detalle de ese partidimetro, en tipo_partida CO y calculo el total, (cantidad * precio unitario)
      */
      const oPI = await cds.run(
        SELECT.one.from(ObraPI).where({ ID: oActas.pi_ID })
      );
      const oP3 = await cds.run(SELECT.one.from(P3).where({ ID: oPI.p3_ID }));
      let oObra = await cds.run(
        `SELECT OBRAS.*, 
        PARTIDOS.DESCRIPCION AS PartDes, 
        FLUIDOS.DESCRIPCION AS FluDes, 
        SISTEMAS.DESCRIPCION AS SisDes, 
        FINANCIAMIENTOS.DESCRIPCION AS FinDes, 
        CONTRATISTAS.RAZONSOCIAL 
  FROM COM_AYSA_PGO_P3 AS P3
      INNER JOIN COM_AYSA_PGO_OBRAS AS OBRAS
          ON P3.OBRA_ID = OBRAS.ID
      INNER JOIN COM_AYSA_PGO_PARTIDOS AS PARTIDOS
          ON PARTIDOS.ID = P3.PARTIDO_ID
      JOIN COM_AYSA_PGO_FLUIDOS AS FLUIDOS
          ON FLUIDOS.ID = P3.FLUIDO_ID
      JOIN COM_AYSA_PGO_SISTEMAS AS SISTEMAS
          ON P3.SISTEMA_ID = SISTEMAS.ID
      JOIN COM_AYSA_PGO_CONTRATISTAOBRA AS CONTRATISTAOBRA
          ON CONTRATISTAOBRA.OBRA_ID = OBRAS.ID
      JOIN COM_AYSA_PGO_CONTRATISTAS AS CONTRATISTAS
          ON CONTRATISTAS.ID = CONTRATISTAOBRA.CONTRATISTA_ID
      JOIN COM_AYSA_PGO_FINANCIAMIENTOS AS FINANCIAMIENTOS
          ON FINANCIAMIENTOS.ID = OBRAS.FINANCIAMIENTO_OBRA_ID
  WHERE P3.ID = '${oP3.ID}' 
       AND OBRAS.ID = '${oP3.obra_ID}'`
      );

      //Genero el payload del pdf
      const currentDate = new Date();
      const day = currentDate.getDate().toString().padStart(2, "0");
      const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
      const year = currentDate.getFullYear();

      const formattedDate = `${day}/${month}/${year}`;
      oObra = oObra[0];
      let body = {
        nro_acta: oActasAdicionales.nro_acta ? oActasAdicionales.nro_acta : "",
        nrop3: oP3.codigo ? oP3.codigo : "",
        obra: oObra.NOMBRE ? oObra.NOMBRE : "",
        partido: oObra.PARTDES ? oObra.PARTDES : "",
        sistema: oObra.SISDES ? oObra.SISDES : "",
        fecha: formattedDate,
        contratista: oObra.RAZONSOCIAL ? oObra.RAZONSOCIAL : "",
        referencia: "Acta Adicionales",
        financiada_por: oObra.FINDES ? oObra.FINDES : "",
        fecha_inicio_contractual: oObra.FECHA_INICIO_CONTRACTUAL
          ? convertirFormatoFecha(oObra.FECHA_INICIO_CONTRACTUAL)
          : "",
        nro_PI: oActasAdicionales.pi_ID ? oActasAdicionales.pi_ID : "",
        justificacion_partida: oActasAdicionales.Justificacion
          ? oActasAdicionales.Justificacion
          : "",
        descripcion_cantidad_alcance: oActasAdicionales.descripcion
          ? oActasAdicionales.descripcion
          : "",
        valoracion_economica: oActasAdicionales.monto
          ? oActasAdicionales.monto
          : "",
        monto_original_monetario: oObra.monto_original
          ? oObra.monto_original
          : "",
        monto_original_porcentual: oObra.monto_original_porcentual
          ? oObra.monto_original_porcentual
          : "",
        contractuales_final_obra_monetario: aData.contractuales__monetario
          ? aData.contractuales__monetario
          : "",
        contractuales_final_obra_porcentual: aData.contractuales_porcentual
          ? aData.contractuales_porcentual
          : "",
        excedidas_final_obra_monetario: aData.excedidas_monetario
          ? aData.excedidas_monetario
          : "",
        excedidas_final_obra_porcentual: aData.excedidas_porcentual
          ? aData.excedidas_porcentual
          : "",
        adicionales_final_obra_monetario: aData.adicionales_monetario
          ? aData.adicionales_monetario
          : "",
        adicionales_final_obra_porcentual: aData.adicionales_porcentual
          ? aData.adicionales_porcentual
          : "",
        ampliacion_final_obra_monetario: aData.ampliacion_monetario
          ? aData.ampliacion_monetario
          : "",
        ampliacion_final_obra_porcentual: aData.ampliacion_porcentual
          ? aData.ampliacion_porcentual
          : "",
        certificacion_acumulada_obra_monetario: aData.certificacion_acumulada
          ? aData.certificacion_acumulada
          : "",
        certificacion_acumulada_obra_porcentual: aData.certificacion_acumulada
          ? aData.certificacion_acumulada
          : "",
        partidas_adicionales,
      };

      //genero el pdf
      const formsDestination = SapCfAxios("FORMSSERVICE");
      const options = {
        beautify: false,
        selfClosing: true,
        attrKey: "@",
        contentKey: "#",
        entityMap: {
          '"': "&#34;",
          "&": "&#38;",
        },
        declaration: {
          encoding: "UTF-8",
          standalone: "yes",
        },
      };
      let xdpTemplate = `actaadicional/actaadicional`;
      body = {
        form1: {
          ...body,
        },
      };
      const xml = parser.jsXml.toXmlString(options, body);
      const buffer = Buffer.from(xml, "utf8");
      const base64String = buffer.toString("base64");

      let payload = {
        changeNotAllowed: false,
        embedFont: 0,
        formLocale: "en_US",
        formType: "print",
        printNotAllowed: false,
        taggedPdf: 1,
        xdpTemplate: xdpTemplate,
        xmlData: base64String,
      };
      let msg = await formsDestination({
        method: "POST",
        url: `/v1/adsRender/pdf?templateSource=storageName&TraceLevel=2 `,
        data: payload,
      });

      if (msg.status !== 200) {
        return res.status(400).json({
          error: `Hubo un error al generar el pdf, intente nuevamente`,
        });
      }
      let base64 = msg.data.fileContent;

      //genero los firmantes
      let aSigners = aAprobadores.map((firmante, index) => {
        let cont = index + 1;
        return {
          recipientId: cont.toString(),
          name: firmante.nombre_apellido,
          email: firmante.correo,
          routingOrder: "1",
          emailNotification: {
            emailSubject: `${oP3.codigo} - Acta de adicionales N° ${oActasAdicionales.nro_acta}`,
            emailBody:
              "La comunicación está pendiente de firma. Por favor, firme el documento para enviarla.",
            supportedLanguage: "es",
          },
          tabs: makePayloadSigners(firmante.rol_ID, cont),
        };
      });

      //envio el documento a docuSign
      let envelopeId = await docuSignAdicional(
        base64,
        oActasAdicionales.nro_acta,
        oP3.codigo,
        aSigners
      );
      promises.push(
        cds.run(
          UPDATE(ActasAdicionales)
            .data({
              envelopeId,
              estado_ID: aData.nuevo_estado,
            })
            .where({ ID: oActasAdicionales.ID })
        )
      );
    }
    await Promise.all(promises);
    res.status(201).json({
      ok: true,
    });
  } catch (error) {
    console.log("ERROR UPDATE ACTUALIZAR ActasAdicionales-->", error);
    res.status(400).json({
      error: error.error,
    });
  }
};
const actualizarActasExcedidas = async (req = request, res = response) => {
  try {
    const aData = req.body;
    let promises = [];

    const oActasExcedidas = await cds.run(
      SELECT.one.from(ActasExcedidas).where({ ID: aData.actaExcedidas })
    );

    if (!oActasExcedidas) {
      return res.status(400).json({
        error: `No se encontró un Acta de excedidas para el ID: ${aData.actaExcedidas}`,
      });
    }
    if (aData.nuevo_estado !== "PF") {
      promises.push(
        cds.run(
          UPDATE(ActasExcedidas)
            .data({
              estado_ID: aData.nuevo_estado,
            })
            .where({ ID: aData.actaExcedidas })
        )
      );
    }

    const oActas = await cds.run(
      SELECT.one.from(Actas).where({ ID: oActasExcedidas.acta_ID })
    );

    const oPI = await cds.run(
      SELECT.one.from(ObraPI).where({ ID: oActas.pi_ID })
    );
    const oP3 = await cds.run(SELECT.one.from(P3).where({ ID: oPI.p3_ID }));

    promises.push(
      cds.run(
        UPDATE(AprobadoresActa)
          .data({
            decision_ID: aData.decision,
            observaciones: aData.observaciones,
          })
          .where({
            acta_ID: oActas.ID,
            rol_ID: aData.rol,
            usuario: aData.usuario,
          })
      )
    );

    //4 - Si nueva fecha de finalización esta completa generar PDF y enviarlo a docuSign
    if (aData.nuevo_estado === "PF") {
      const aAprobadores = await cds.run(
        SELECT.from(AprobadoresActa).where({
          acta_ID: oActas.ID,
          decision_ID: "AP",
        })
      );

      const aPartidasExcedidas = await cds.run(
        `SELECT PARTIDAS.*, ITEM.DESCRIPCION AS ITEMDES, SUBITEM.DESCRIPCION AS SUBITEMDES, UNIDADMEDIDA.DESCRIPCION AS UMDES FROM COM_AYSA_PGO_PARTIDASEXCEDIDAS AS PARTIDAS
          JOIN COM_AYSA_PGO_ITEMPARTIDIMETRO AS ITEM
              ON ITEM.ID = PARTIDAS.ITEM_ID
          JOIN COM_AYSA_PGO_SUBITEMPARTIDIMETRO AS SUBITEM
              ON PARTIDAS.SUBITEM_ID = SUBITEM.ID
          JOIN COM_AYSA_PGO_UMGENERAL AS UNIDADMEDIDA
              ON UNIDADMEDIDA.ID = PARTIDAS.UM_ID
          WHERE PARTIDAS.ACTA_EXCEDIDA_ID = '${aData.actaExcedidas}'`
      );
      let partidas_excedidas = aPartidasExcedidas.map((item) => {
        return {
          c1: item.CODIGO1 ? item.CODIGO1 : "",
          c2: item.CODIGO2 ? item.CODIGO2 : "",
          c3: item.CODIGO3 ? item.CODIGO3 : "",
          c4: item.CODIGO4 ? item.CODIGO4 : "",
          c5: item.CODIGO5 ? item.CODIGO5 : "",
          descripcion: item.DESCRIPCION ? item.DESCRIPCION : "",
          observaciones: item.OBSERVACION ? item.OBSERVACION : "",
          cantidad: item.CANTIDAD ? parseFloat(item.CANTIDAD) : "",
          precio_unitario: item.PRECIO_UNITARIO
            ? parseFloat(item.PRECIO_UNITARIO)
            : "", // Convert to number
          item: item.ITEMDES ? item.ITEMDES : "",
          subitem: item.SUBITEMDES ? item.SUBITEMDES : "",
          unidad: item.UMDES ? item.UMDES : "",
          subtotal: item.PRECIO_UNITARIO
            ? parseFloat(item.PRECIO_UNITARIO) * item.CANTIDAD
            : "",
        };
      });

      let oObra = await cds.run(
        `SELECT OBRAS.*, 
        PARTIDOS.DESCRIPCION AS PartDes, 
        FLUIDOS.DESCRIPCION AS FluDes, 
        SISTEMAS.DESCRIPCION AS SisDes, 
        FINANCIAMIENTOS.DESCRIPCION AS FinDes, 
        CONTRATISTAS.RAZONSOCIAL 
  FROM COM_AYSA_PGO_P3 AS P3
      INNER JOIN COM_AYSA_PGO_OBRAS AS OBRAS
          ON P3.OBRA_ID = OBRAS.ID
      INNER JOIN COM_AYSA_PGO_PARTIDOS AS PARTIDOS
          ON PARTIDOS.ID = P3.PARTIDO_ID
      JOIN COM_AYSA_PGO_FLUIDOS AS FLUIDOS
          ON FLUIDOS.ID = P3.FLUIDO_ID
      JOIN COM_AYSA_PGO_SISTEMAS AS SISTEMAS
          ON P3.SISTEMA_ID = SISTEMAS.ID
      JOIN COM_AYSA_PGO_CONTRATISTAOBRA AS CONTRATISTAOBRA
          ON CONTRATISTAOBRA.OBRA_ID = OBRAS.ID
      JOIN COM_AYSA_PGO_CONTRATISTAS AS CONTRATISTAS
          ON CONTRATISTAS.ID = CONTRATISTAOBRA.CONTRATISTA_ID
      JOIN COM_AYSA_PGO_FINANCIAMIENTOS AS FINANCIAMIENTOS
          ON FINANCIAMIENTOS.ID = OBRAS.FINANCIAMIENTO_OBRA_ID
  WHERE P3.ID = '${oP3.ID}' 
       AND OBRAS.ID = '${oP3.obra_ID}'`
      );

      //Genero el payload del pdf
      const currentDate = new Date();
      const day = currentDate.getDate().toString().padStart(2, "0");
      const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
      const year = currentDate.getFullYear();

      const formattedDate = `${day}/${month}/${year}`;
      oObra = oObra[0];
      let body = {
        nro_documento: oActasExcedidas.nro_acta ? oActasExcedidas.nro_acta : "",
        nrop3: oP3.codigo ? oP3.codigo : "",
        obra: oObra.NOMBRE ? oObra.NOMBRE : "",
        partido: oObra.PARTDES ? oObra.PARTDES : "",
        sistema: oObra.SISDES ? oObra.SISDES : "",
        fecha: formattedDate,
        contratista: oObra.RAZONSOCIAL ? oObra.RAZONSOCIAL : "",
        referencia: "Acta Excedidas",
        financiada_por: oObra.FINDES ? oObra.FINDES : "",
        fecha_inicio_contractual: oObra.FECHA_INICIO_CONTRACTUAL
          ? convertirFormatoFecha(oObra.FECHA_INICIO_CONTRACTUAL)
          : "",
        nro_PI: oActasExcedidas.pi_ID ? oActasExcedidas.pi_ID : "",
        justificacion_partida: oActasExcedidas.justificacion
          ? oActasExcedidas.justificacion
          : "",
        descripcion_cantidad_alcance: oActasExcedidas.descripcion
          ? oActasExcedidas.descripcion
          : "",
        valoracion_economica: oActasExcedidas.monto
          ? oActasExcedidas.monto
          : "",
        monto_original_monetario: oObra.monto_original
          ? oObra.monto_original
          : "",
        monto_original_porcentual: oObra.monto_original_porcentual
          ? oObra.monto_original_porcentual
          : "",
        contractuales_final_obra_monetario: aData.contractuales__monetario
          ? aData.contractuales__monetario
          : "",
        contractuales_final_obra_porcentual: aData.contractuales_porcentual
          ? aData.contractuales_porcentual
          : "",
        excedidas_final_obra_monetario: aData.excedidas_monetario
          ? aData.excedidas_monetario
          : "",
        excedidas_final_obra_porcentual: aData.excedidas_porcentual
          ? aData.excedidas_porcentual
          : "",
        adicionales_final_obra_monetario: aData.adicionales_monetario
          ? aData.adicionales_monetario
          : "",
        adicionales_final_obra_porcentual: aData.adicionales_porcentual
          ? aData.adicionales_porcentual
          : "",
        ampliacion_final_obra_monetario: aData.ampliacion_monetario
          ? aData.ampliacion_monetario
          : "",
        ampliacion_final_obra_porcentual: aData.ampliacion_porcentual
          ? aData.ampliacion_porcentual
          : "",
        certificacion_acumulada_obra_monetario: aData.certificacion_acumulada
          ? aData.certificacion_acumulada
          : "",
        certificacion_acumulada_obra_monetaria: aData.certificacion_acumulada
          ? aData.certificacion_acumulada
          : "",
        certificacion_acumulada_obra_porcentual:
          aData.certificacion_acumulada_porcentual
            ? aData.certificacion_acumulada_porcentual
            : "",
        partidas_excedidas,
      };

      //genero el pdf
      const formsDestination = SapCfAxios("FORMSSERVICE");
      const options = {
        beautify: false,
        selfClosing: true,
        attrKey: "@",
        contentKey: "#",
        entityMap: {
          '"': "&#34;",
          "&": "&#38;",
        },
        declaration: {
          encoding: "UTF-8",
          standalone: "yes",
        },
      };
      let xdpTemplate = `actaexcedida/actaexcedida`;
      body = {
        form1: {
          ...body,
        },
      };
      const xml = parser.jsXml.toXmlString(options, body);
      const buffer = Buffer.from(xml, "utf8");
      const base64String = buffer.toString("base64");

      let payload = {
        changeNotAllowed: false,
        embedFont: 0,
        formLocale: "en_US",
        formType: "print",
        printNotAllowed: false,
        taggedPdf: 1,
        xdpTemplate: xdpTemplate,
        xmlData: base64String,
      };
      let msg = await formsDestination({
        method: "POST",
        url: `/v1/adsRender/pdf?templateSource=storageName&TraceLevel=2 `,
        data: payload,
      });

      if (msg.status !== 200) {
        return res.status(400).json({
          error: `Hubo un error al generar el pdf, intente nuevamente`,
        });
      }
      let base64 = msg.data.fileContent;

      //genero los firmantes
      let aSigners = aAprobadores.map((firmante, index) => {
        let cont = index + 1;
        return {
          recipientId: cont.toString(),
          name: firmante.nombre_apellido,
          email: firmante.correo,
          routingOrder: "1",
          emailNotification: {
            emailSubject: `${oP3.codigo} - Acta de excedidas N° ${oActasExcedidas.nro_acta}`,
            emailBody:
              "La comunicación está pendiente de firma. Por favor, firme el documento para enviarla.",
            supportedLanguage: "es",
          },
          tabs: makePayloadSigners(firmante.rol_ID, cont),
        };
      });

      //envio el documento a docuSign
      let envelopeId = await docuSignExcedidas(
        base64,
        oActasExcedidas.nro_acta,
        oP3.codigo,
        aSigners
      );

      promises.push(
        cds.run(
          UPDATE(ActasExcedidas)
            .data({
              envelopeId,
              estado_ID: aData.nuevo_estado,
            })
            .where({ ID: aData.actaExcedidas })
        )
      );
    }

    await Promise.all(promises);
    res.status(201).json({
      ok: true,
    });
  } catch (error) {
    console.log("ERROR UPDATE ACTUALIZAR ActasExcedidas-->", error);
    res.status(400).json({
      error,
    });
  }
};

const actualizarActasSuspension = async (req = request, res = response) => {
  try {
    const aData = req.body;
    let promises = [];

    const oActasSuspension = await cds.run(
      SELECT.one.from(ActasSuspension).where({ ID: aData.actaSuspension })
    );

    if (!oActasSuspension) {
      return res.status(400).json({
        error: `No se encontró un Acta de suspensión para el ID: ${aData.actaSuspension}`,
      });
    }
    if (aData.nuevo_estado !== "PF") {
      promises.push(
        cds.run(
          UPDATE(ActasSuspension)
            .data({
              estado_ID: aData.nuevo_estado,
            })
            .where({ ID: aData.actaSuspension })
        )
      );
    }

    const oActas = await cds.run(
      SELECT.one.from(Actas).where({ ID: oActasSuspension.acta_ID })
    );

    const oPI = await cds.run(
      SELECT.one.from(ObraPI).where({ ID: oActas.pi_ID })
    );
    const oP3 = await cds.run(SELECT.one.from(P3).where({ ID: oPI.p3_ID }));

    await cds.run(
      UPDATE(AprobadoresActa)
        .data({
          decision_ID: aData.decision,
          observaciones: aData.observaciones,
        })
        .where({
          acta_ID: oActas.ID,
          rol_ID: aData.rol,
          usuario: aData.usuario,
        })
    );
    //4 - Si nueva fecha de finalización esta completa generar PDF y enviarlo a docuSign
    if (aData.nuevo_estado === "PF") {
      const aAprobadores = await cds.run(
        SELECT.from(AprobadoresActa).where({
          acta_ID: oActas.ID,
          decision_ID: "AP",
        })
      );

      let oObra = await cds.run(
        `SELECT OBRAS.*, 
        PARTIDOS.DESCRIPCION AS PartDes, 
        FLUIDOS.DESCRIPCION AS FluDes, 
        SISTEMAS.DESCRIPCION AS SisDes, 
        FINANCIAMIENTOS.DESCRIPCION AS FinDes, 
        CONTRATISTAS.RAZONSOCIAL,
        UMGENERAL.DESCRIPCION AS UMDES
      FROM COM_AYSA_PGO_P3 AS P3
      INNER JOIN COM_AYSA_PGO_OBRAS AS OBRAS
          ON P3.OBRA_ID = OBRAS.ID
      INNER JOIN COM_AYSA_PGO_PARTIDOS AS PARTIDOS
          ON PARTIDOS.ID = P3.PARTIDO_ID
      JOIN COM_AYSA_PGO_FLUIDOS AS FLUIDOS
          ON FLUIDOS.ID = P3.FLUIDO_ID
      JOIN COM_AYSA_PGO_SISTEMAS AS SISTEMAS
          ON P3.SISTEMA_ID = SISTEMAS.ID
      JOIN COM_AYSA_PGO_CONTRATISTAOBRA AS CONTRATISTAOBRA
          ON CONTRATISTAOBRA.OBRA_ID = OBRAS.ID
      JOIN COM_AYSA_PGO_CONTRATISTAS AS CONTRATISTAS
          ON CONTRATISTAS.ID = CONTRATISTAOBRA.CONTRATISTA_ID
      JOIN COM_AYSA_PGO_FINANCIAMIENTOS AS FINANCIAMIENTOS
          ON FINANCIAMIENTOS.ID = OBRAS.FINANCIAMIENTO_OBRA_ID
      JOIN COM_AYSA_PGO_UMGENERAL AS UMGENERAL
          ON UMGENERAL.ID = OBRAS.UM_PLAZO_ID
      WHERE P3.ID = '${oP3.ID}' 
       AND OBRAS.ID = '${oP3.obra_ID}'`
      );

      //Genero el payload del pdf
      const currentDate = new Date();
      const day = currentDate.getDate().toString().padStart(2, "0");
      const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
      const year = currentDate.getFullYear();
      let titularB;
      if (oActasSuspension.tipo_acta_ID == "IN") {
        titularB = "Cantidad estimada de días de Suspensión";
      } else {
        titularB = "Cantidad real de días de Suspensión";
      }
      const formattedDate = `${day}/${month}/${year}`;
      oObra = oObra[0];
      let body = {
        titular:
          oActasSuspension.tipo_acta_ID == "IN"
            ? "Acta de Inicio de Suspensión de Obra"
            : "Acta de Fin de Suspensión de Obra",
        nro_documento: oActasSuspension.nro_acta
          ? oActasSuspension.nro_acta
          : "",
        nrop3: oP3.codigo ? oP3.codigo : "",
        obra: oObra.NOMBRE ? oObra.NOMBRE : "",
        partido: oObra.PARTDES ? oObra.PARTDES : "",
        sistema: oObra.SISDES ? oObra.SISDES : "",
        fecha: formattedDate,
        contratista: oObra.RAZONSOCIAL ? oObra.RAZONSOCIAL : "",
        referencia: "Acta Suspensión",
        fecha_inicio_contractual: oObra.FECHA_INICIO_FISICO
          ? convertirFormatoFecha(oObra.FECHA_INICIO_FISICO)
          : "",
        nro_PI: oPI.pi ? oPI.pi : "",
        titularB,
        monto_contrato: oObra.MONTO_ORIGINAL_CONTRATO
          ? Number(oObra.MONTO_ORIGINAL_CONTRATO).toFixed()
          : "",
        plazo_ejecucion: oObra.PLAZO_EJECUCION
          ? oObra.PLAZO_EJECUCION + " " + oObra.UMDES
          : "",
        fecha_fin_contractual: oObra.FECHA_FIN_CONTRACTUAL_ORIGINAL_VIGENTE
          ? convertirFormatoFecha(oObra.FECHA_FIN_CONTRACTUAL_ORIGINAL_VIGENTE)
          : "",
        justificacion_partida: oActasSuspension.fundamentos
          ? oActasSuspension.fundamentos
          : "",
        cantidad_dias_suspension: oActasSuspension.cantidad_dias_suspension
          ? oActasSuspension.cantidad_dias_suspension
          : "",
        nueva_fecha_finalizacion: oActasSuspension.nueva_fecha_finalizacion
          ? convertirFormatoFecha(oActasSuspension.nueva_fecha_finalizacion)
          : "",
        fecha_fin_suspension: oActasSuspension.fecha_fin_suspension
          ? convertirFormatoFecha(oActasSuspension.fecha_fin_suspension)
          : "",
        fecha_inicio_suspension: oActasSuspension.fecha_inicio_suspension
          ? convertirFormatoFecha(oActasSuspension.fecha_inicio_suspension)
          : "",
        referenciaNdp: aData.referenciaNdp ? aData.referenciaNdp : "",
        referenciaOds: aData.referenciaOds ? aData.referenciaOds : "",
        referenciaAdicional: aData.referenciaAdicional
          ? aData.referenciaAdicional
          : "",
        redetermina: aData.no_redetermina ? aData.no_redetermina : "",
      };

      //genero el pdf
      const formsDestination = SapCfAxios("FORMSSERVICE");
      const options = {
        beautify: false,
        selfClosing: true,
        attrKey: "@",
        contentKey: "#",
        entityMap: {
          '"': "&#34;",
          "&": "&#38;",
        },
        declaration: {
          encoding: "UTF-8",
          standalone: "yes",
        },
      };
      let xdpTemplate = `actasuspension/actasuspension`;
      body = {
        form1: {
          ...body,
        },
      };
      const xml = parser.jsXml.toXmlString(options, body);
      const buffer = Buffer.from(xml, "utf8");
      const base64String = buffer.toString("base64");

      let payload = {
        changeNotAllowed: false,
        embedFont: 0,
        formLocale: "en_US",
        formType: "print",
        printNotAllowed: false,
        taggedPdf: 1,
        xdpTemplate: xdpTemplate,
        xmlData: base64String,
      };
      let msg = await formsDestination({
        method: "POST",
        url: `/v1/adsRender/pdf?templateSource=storageName&TraceLevel=2 `,
        data: payload,
      });

      if (msg.status !== 200) {
        return res.status(400).json({
          error: `Hubo un error al generar el pdf, intente nuevamente`,
        });
      }
      let base64 = msg.data.fileContent;

      //genero los firmantes
      let aSigners = aAprobadores.map((firmante, index) => {
        let cont = index + 1;
        return {
          recipientId: cont.toString(),
          name: firmante.nombre_apellido,
          email: firmante.correo,
          routingOrder: "1",
          emailNotification: {
            emailSubject: `${oP3.codigo} - Acta de suspension N° ${oActasSuspension.nro_acta}`,
            emailBody:
              "La comunicación está pendiente de firma. Por favor, firme el documento para enviarla.",
            supportedLanguage: "es",
          },
          tabs: makePayloadSigners(firmante.rol_ID, cont),
        };
      });

      //envio el documento a docuSign
      let envelopeId = await docuSignSuspension(
        base64,
        oActasSuspension.nro_acta,
        oP3.codigo,
        aSigners
      );

      promises.push(
        cds.run(
          UPDATE(ActasSuspension)
            .data({
              envelopeId,
              estado_ID: aData.nuevo_estado,
            })
            .where({ ID: aData.actaSuspension })
        )
      );
    }

    await Promise.all(promises);
    res.status(201).json({
      ok: true,
    });
  } catch (error) {
    console.log("ERROR UPDATE ACTUALIZAR ActasSuspension-->", error);
    res.status(400).json({
      error,
    });
  }
};
const formatPartidasAdicionales = (aPartidasAdicionales) => {
  return aPartidasAdicionales.map((item) => {
    // Asegurarse de que precio_unitario y cantidad son números
    const precioUnitario = parseFloat(item.precio_unitario);
    const cantidad = parseFloat(item.cantidad);

    // Calcular el subtotal
    const subtotal = precioUnitario * cantidad;

    // Devolver un nuevo objeto con el subtotal agregado
    return { ...item, subtotal };
  });
};

const actualizarActasAmpliacion = async (req = request, res = response) => {
  try {
    const aData = req.body;
    let promises = [];

    const oActasAmpliacion = await cds.run(
      SELECT.one.from(ActasAmpliaciones).where({ ID: aData.actaAmpliaciones })
    );

    if (!oActasAmpliacion) {
      return res.status(400).json({
        error: `No se encontró un Acta de ampliacion para el ID: ${aData.actaAmpliaciones}`,
      });
    }
    if (aData.nuevo_estado !== "PF") {
      promises.push(
        cds.run(
          UPDATE(ActasAmpliaciones)
            .data({
              estado_ID: aData.nuevo_estado,
            })
            .where({ ID: aData.actaAmpliaciones })
        )
      );
    }

    const oActas = await cds.run(
      SELECT.one.from(Actas).where({ ID: oActasAmpliacion.acta_ID })
    );

    const oPI = await cds.run(
      SELECT.one.from(ObraPI).where({ ID: oActas.pi_ID })
    );
    const oP3 = await cds.run(SELECT.one.from(P3).where({ ID: oPI.p3_ID }));

    promises.push(
      cds.run(
        UPDATE(AprobadoresActa)
          .data({
            decision_ID: aData.decision,
            observaciones: aData.observaciones,
          })
          .where({
            acta_ID: oActas.ID,
            rol_ID: aData.rol,
            usuario: aData.usuario,
          })
      )
    );

    //4 - Si nueva fecha de finalización esta completa generar PDF y enviarlo a docuSign
    if (aData.nuevo_estado === "PF") {
      const aAprobadores = await cds.run(
        SELECT.from(AprobadoresActa).where({
          acta_ID: oActas.ID,
          decision_ID: "AP",
        })
      );

      const oPI = await cds.run(
        SELECT.one.from(ObraPI).where({ ID: oActas.pi_ID })
      );
      const oP3 = await cds.run(SELECT.one.from(P3).where({ ID: oPI.p3_ID }));
      let oObra = await cds.run(
        `SELECT OBRAS.*, 
        PARTIDOS.DESCRIPCION AS PartDes, 
        FLUIDOS.DESCRIPCION AS FluDes, 
        SISTEMAS.DESCRIPCION AS SisDes, 
        FINANCIAMIENTOS.DESCRIPCION AS FinDes, 
        CONTRATISTAS.RAZONSOCIAL 
  FROM COM_AYSA_PGO_P3 AS P3
      INNER JOIN COM_AYSA_PGO_OBRAS AS OBRAS
          ON P3.OBRA_ID = OBRAS.ID
      INNER JOIN COM_AYSA_PGO_PARTIDOS AS PARTIDOS
          ON PARTIDOS.ID = P3.PARTIDO_ID
      JOIN COM_AYSA_PGO_FLUIDOS AS FLUIDOS
          ON FLUIDOS.ID = P3.FLUIDO_ID
      JOIN COM_AYSA_PGO_SISTEMAS AS SISTEMAS
          ON P3.SISTEMA_ID = SISTEMAS.ID
      JOIN COM_AYSA_PGO_CONTRATISTAOBRA AS CONTRATISTAOBRA
          ON CONTRATISTAOBRA.OBRA_ID = OBRAS.ID
      JOIN COM_AYSA_PGO_CONTRATISTAS AS CONTRATISTAS
          ON CONTRATISTAS.ID = CONTRATISTAOBRA.CONTRATISTA_ID
      JOIN COM_AYSA_PGO_FINANCIAMIENTOS AS FINANCIAMIENTOS
          ON FINANCIAMIENTOS.ID = OBRAS.FINANCIAMIENTO_OBRA_ID
  WHERE P3.ID = '${oP3.ID}' 
       AND OBRAS.ID = '${oP3.obra_ID}'`
      );

      //Genero el payload del pdf
      const currentDate = new Date();
      const day = currentDate.getDate().toString().padStart(2, "0");
      const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
      const year = currentDate.getFullYear();

      let partidas_adicionales_formateadas = formatPartidasAdicionales(
        aData.partidas_adicionales
      );
      const formattedDate = `${day}/${month}/${year}`;
      oObra = oObra[0];
      let body = {
        nro_acta: oActasAmpliacion.nro_acta ? oActasAmpliacion.nro_acta : "",
        nrop3: oP3.codigo ? oP3.codigo : "",
        obra: oObra.NOMBRE ? oObra.NOMBRE : "",
        partido: oObra.PARTDES ? oObra.PARTDES : "",
        sistema: oObra.SISDES ? oObra.SISDES : "",
        fecha: formattedDate,
        contratista: oObra.RAZONSOCIAL ? oObra.RAZONSOCIAL : "",
        financiada_por: oObra.FINDES ? oObra.FINDES : "",
        nro_PI: oPI.pi ? oPI.pi : "",
        prorrogas_asociadas: oActasAmpliacion.prorrogas_asociadas ? "SI" : "NO",
        justificacion_partida: oActasAmpliacion.justificacion
          ? oActasAmpliacion.justificacion
          : "",
        cantidad_dias: oActasAmpliacion.ampliacion_dias
          ? oActasAmpliacion.ampliacion_dias
          : "",
        fecha_inicio_trabajos: convertirFormatoFecha(
          oActasAmpliacion.fecha_inicio_trabajos
        ),
        descripcion_cantidad_alcance: oActasAmpliacion.descripcion
          ? oActasAmpliacion.descripcion
          : "",
        valoracion_economica: oActasAmpliacion.monto
          ? oActasAmpliacion.monto
          : "",
        monto_original_monetario: oObra.monto_original
          ? oObra.monto_original
          : "",
        monto_original_porcentual: oObra.monto_original_porcentual
          ? oObra.monto_original_porcentual
          : "",
        contractuales_final_obra_monetario: aData.contractuales__monetario
          ? aData.contractuales__monetario
          : "",
        contractuales_final_obra_porcentual: aData.contractuales_porcentual
          ? aData.contractuales_porcentual
          : "",
        excedidas_final_obra_monetario: aData.excedidas_monetario
          ? aData.excedidas_monetario
          : "",
        excedidas_final_obra_porcentual: aData.excedidas_porcentual
          ? aData.excedidas_porcentual
          : "",
        adicionales_final_obra_monetario: aData.adicionales_monetario
          ? aData.adicionales_monetario
          : "",
        adicionales_final_obra_porcentual: aData.adicionales_porcentual
          ? aData.adicionales_porcentual
          : "",
        ampliacion_final_obra_monetario: aData.ampliacion_monetario
          ? aData.ampliacion_monetario
          : "",
        ampliacion_final_obra_porcentual: aData.ampliacion_porcentual
          ? aData.ampliacion_porcentual
          : "",
        certificacion_acumulada_obra_monetario: aData.certificacion_acumulada
          ? aData.certificacion_acumulada
          : "",
        certificacion_acumulada_obra_porcentual: aData.certificacion_acumulada
          ? aData.certificacion_acumulada
          : "",
        documentacion_referencia: aData.documentacion_referencia,
        partidas_adicionales: partidas_adicionales_formateadas,
        partidas_excedidas: aData.partidas_excedidas,
      };

      const formsDestination = SapCfAxios("FORMSSERVICE");
      const options = {
        beautify: false,
        selfClosing: true,
        attrKey: "@",
        contentKey: "#",
        entityMap: {
          '"': "&#34;",
          "&": "&#38;",
        },
        declaration: {
          encoding: "UTF-8",
          standalone: "yes",
        },
      };
      let xdpTemplate = `actaampliacion/actaampliacion`;
      body = {
        form1: {
          ...body,
        },
      };
      const xml = parser.jsXml.toXmlString(options, body);
      const buffer = Buffer.from(xml, "utf8");
      const base64String = buffer.toString("base64");

      let payload = {
        changeNotAllowed: false,
        embedFont: 0,
        formLocale: "en_US",
        formType: "print",
        printNotAllowed: false,
        taggedPdf: 1,
        xdpTemplate: xdpTemplate,
        xmlData: base64String,
      };
      let msg = await formsDestination({
        method: "POST",
        url: `/v1/adsRender/pdf?templateSource=storageName&TraceLevel=2 `,
        data: payload,
      });

      if (msg.status !== 200) {
        return res.status(400).json({
          error: `Hubo un error al generar el pdf, intente nuevamente`,
        });
      }
      let base64 = msg.data.fileContent;

      //genero los firmantes
      let aSigners = aAprobadores.map((firmante, index) => {
        let cont = index + 1;
        return {
          recipientId: cont.toString(),
          name: firmante.nombre_apellido,
          email: firmante.correo,
          routingOrder: "1",
          emailNotification: {
            emailSubject: `${oP3.codigo} - Acta de ampliación N° ${oActasAmpliacion.nro_acta}`,
            emailBody:
              "La comunicación está pendiente de firma. Por favor, firme el documento para enviarla.",
            supportedLanguage: "es",
          },
          tabs: makePayloadSigners(firmante.rol_ID, cont),
        };
      });

      //envio el documento a docuSign
      let envelopeId = await docuSignAmpliacion(
        base64,
        oActasAmpliacion.nro_acta,
        oP3.codigo,
        aSigners
      );

      promises.push(
        cds.run(
          UPDATE(ActasAmpliaciones)
            .data({
              envelopeId,
              estado_ID: aData.nuevo_estado,
            })
            .where({ ID: aData.actaAmpliaciones })
        )
      );
    }

    await Promise.all(promises);
    res.status(201).json({
      ok: true,
    });
  } catch (error) {
    console.log("ERROR UPDATE ACTUALIZAR ActasExcedidas-->", error);
    res.status(400).json({
      error,
    });
  }
};
const actualizarActasSancion = async (req = request, res = response) => {
  try {
    const aData = req.body;
    let promises = [];

    const oActasSancion = await cds.run(
      SELECT.one.from(ActasSanciones).where({ ID: aData.actaSanciones })
    );

    if (!oActasSancion) {
      return res.status(400).json({
        error: `No se encontró un Acta de sanción para el ID: ${aData.actaSanciones}`,
      });
    }
    if (aData.nuevo_estado !== "PF") {
      promises.push(
        cds.run(
          UPDATE(ActasSanciones)
            .data({
              estado_ID: aData.nuevo_estado,
            })
            .where({ ID: aData.actaSanciones })
        )
      );
    }

    const oActas = await cds.run(
      SELECT.one.from(Actas).where({ ID: oActasSancion.acta_ID })
    );

    const oPI = await cds.run(
      SELECT.one.from(ObraPI).where({ ID: oActas.pi_ID })
    );
    const oP3 = await cds.run(SELECT.one.from(P3).where({ ID: oPI.p3_ID }));

    promises.push(
      cds.run(
        UPDATE(AprobadoresActa)
          .data({
            decision_ID: aData.decision,
            observaciones: aData.observaciones,
          })
          .where({
            acta_ID: oActas.ID,
            rol_ID: aData.rol,
            usuario: aData.usuario,
          })
      )
    );

    if (aData.nuevo_estado === "PF") {
      const aAprobadores = await cds.run(
        SELECT.from(AprobadoresActa).where({
          acta_ID: oActas.ID,
          decision_ID: "AP",
        })
      );
      let oObra = await cds.run(
        `SELECT OBRAS.*, 
        PARTIDOS.DESCRIPCION AS PartDes, 
        FLUIDOS.DESCRIPCION AS FluDes, 
        SISTEMAS.DESCRIPCION AS SisDes, 
        FINANCIAMIENTOS.DESCRIPCION AS FinDes, 
        CONTRATISTAS.RAZONSOCIAL,
        UMGENERAL.DESCRIPCION AS UMDES
        FROM COM_AYSA_PGO_P3 AS P3
      INNER JOIN COM_AYSA_PGO_OBRAS AS OBRAS
          ON P3.OBRA_ID = OBRAS.ID
      INNER JOIN COM_AYSA_PGO_PARTIDOS AS PARTIDOS
          ON PARTIDOS.ID = P3.PARTIDO_ID
      JOIN COM_AYSA_PGO_FLUIDOS AS FLUIDOS
          ON FLUIDOS.ID = P3.FLUIDO_ID
      JOIN COM_AYSA_PGO_SISTEMAS AS SISTEMAS
          ON P3.SISTEMA_ID = SISTEMAS.ID
      JOIN COM_AYSA_PGO_CONTRATISTAOBRA AS CONTRATISTAOBRA
          ON CONTRATISTAOBRA.OBRA_ID = OBRAS.ID
      JOIN COM_AYSA_PGO_CONTRATISTAS AS CONTRATISTAS
          ON CONTRATISTAS.ID = CONTRATISTAOBRA.CONTRATISTA_ID
      JOIN COM_AYSA_PGO_FINANCIAMIENTOS AS FINANCIAMIENTOS
          ON FINANCIAMIENTOS.ID = OBRAS.FINANCIAMIENTO_OBRA_ID
      JOIN COM_AYSA_PGO_UMGENERAL AS UMGENERAL
          ON UMGENERAL.ID = OBRAS.UM_PLAZO_ID
      WHERE P3.ID = '${oP3.ID}' 
       AND OBRAS.ID = '${oP3.obra_ID}'`
      );
      let representacion =
        (oActasSancion.valoracion_economica /
          oObra[0].MONTO_ORIGINAL_CONTRATO) *
        100;

      //Genero el payload del pdf
      const currentDate = new Date();
      const day = currentDate.getDate().toString().padStart(2, "0");
      const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
      const year = currentDate.getFullYear();
      let aprobadoresPdf = [];
      var director_aprueba = "";
      var motivo_aprobacion = "";
      var nombre_completo_director = "";
      if (aData.rol == "DI") {
        var director = aAprobadores.find(
          (aprobador) => aprobador.rol_ID == "DI"
        );
        director_aprueba = "Si";
        motivo_aprobacion = aData.observaciones ? aData.observaciones : "";
        nombre_completo_director = director ? director.nombre_apellido : "";
      }
      const formattedDate = `${day}/${month}/${year}`;
      aAprobadores.forEach((aprobador) =>
        aprobadoresPdf.push({
          procede: "Si",
          fecha: formattedDate,
          puesto: aprobador.rol_ID,
          nombre_completo: aprobador.nombre_apellido,
        })
      );
      oObra = oObra[0];
      let body = {
        nro_documento: oActasSancion.nro_acta ? oActasSancion.nro_acta : "",
        nrop3: oP3.codigo ? oP3.codigo : "",
        obra: oObra.NOMBRE ? oObra.NOMBRE : "",
        partido: oObra.PARTDES ? oObra.PARTDES : "",
        zona: oObra.SISDES ? oObra.SISDES : "",
        fecha: formattedDate,
        estado: oActasSancion.estado_ID,
        texto_ods_sancion: oActasSancion.texto_referencia_ods,
        valoracion_economica: `Valoración Económica de la sanción: $ ${oActasSancion.valoracion_economica} representa un ${representacion} % del monto del contrato`,
        contratista: oObra.RAZONSOCIAL ? oObra.RAZONSOCIAL : "",
        docs_adjuntos: aData.docs_adjs,
        fecha_inicio_contractual: oObra.FECHA_INICIO_FISICO
          ? convertirFormatoFecha(oObra.FECHA_INICIO_FISICO)
          : "",
        nro_PI: oPI.pi ? oPI.pi : "",
        aprobadores: aprobadoresPdf,
        director_aprueba,
        motivo_aprobacion,
        nombre_completo_director,
      };

      //genero el pdf
      const formsDestination = SapCfAxios("FORMSSERVICE");
      const options = {
        beautify: false,
        selfClosing: true,
        attrKey: "@",
        contentKey: "#",
        entityMap: {
          '"': "&#34;",
          "&": "&#38;",
        },
        declaration: {
          encoding: "UTF-8",
          standalone: "yes",
        },
      };
      let xdpTemplate = `actasancion/actasancion`;
      body = {
        form1: {
          ...body,
        },
      };
      const xml = parser.jsXml.toXmlString(options, body);
      const buffer = Buffer.from(xml, "utf8");
      const base64String = buffer.toString("base64");

      let payload = {
        changeNotAllowed: false,
        embedFont: 0,
        formLocale: "en_US",
        formType: "print",
        printNotAllowed: false,
        taggedPdf: 1,
        xdpTemplate: xdpTemplate,
        xmlData: base64String,
      };
      let msg = await formsDestination({
        method: "POST",
        url: `/v1/adsRender/pdf?templateSource=storageName&TraceLevel=2 `,
        data: payload,
      });

      if (msg.status !== 200) {
        return res.status(400).json({
          error: `Hubo un error al generar el pdf, intente nuevamente`,
        });
      }
      let base64 = msg.data.fileContent;
      let aAprobadoresBase = [
        {
          recipientId: 1,
          name: "test",
          email: "tobias.racedo@datco.net",
          routingOrder: "1",
          emailNotification: {
            emailSubject: `${oP3.codigo} - Acta de sanción N° ${oActasSancion.nro_acta}`,
            emailBody:
              "La comunicación está pendiente de firma. Por favor, firme el documento para enviarla.",
            supportedLanguage: "es",
          },
        },
      ];
      //genero los firmantes
      if (aAprobadores) {
        let dir = aAprobadores.find((aprobador) => aprobador.rol_ID == "DI");
        aAprobadoresBase[0].name = dir.nombre_apellido;
        aAprobadoresBase[0].email = dir.usuario;
      } else {
        var aSigners = aAprobadoresTest.map((firmante, index) => {
          if (firmante.rol_ID == "DI")
            return {
              recipientId: cont.toString(),
              name: firmante.nombre_apellido,
              email: firmante.correo,
              routingOrder: "1",
              emailNotification: {
                emailSubject: `${oP3.codigo} - Acta de sanción N° ${oActasSancion.nro_acta}`,
                emailBody:
                  "La comunicación está pendiente de firma. Por favor, firme el documento para enviarla.",
                supportedLanguage: "es",
              },
              tabs: makePayloadSigners(firmante.rol_ID, cont),
            };
        });
      }

      //envio el documento a docuSign
      let envelopeId = await docuSignSancion(
        base64,
        oActasSancion.nro_acta,
        oP3.codigo,
        aAprobadoresBase
      );

      //4 - Si nueva fecha de finalización esta completa generar PDF y enviarlo a docuSign
      promises.push(
        cds.run(
          UPDATE(ActasSanciones)
            .data({
              envelopeId,
              estado_ID: aData.nuevo_estado,
            })
            .where({ ID: aData.actaSanciones })
        )
      );
    }

    await Promise.all(promises);
    res.status(201).json({
      ok: true,
    });
  } catch (error) {
    console.log("ERROR UPDATE ACTUALIZAR ActasSanciones-->", error);
    res.status(400).json({
      error,
    });
  }
};

function convertirFormatoFecha(inputDate) {
  const partes = inputDate.split("-");

  const anio = partes[0];
  const mes = partes[1];
  const dia = partes[2];

  const fechaFormateada = `${dia}/${mes}/${anio}`;
  return fechaFormateada;
}

function transformArray(arr) {
  const transformedArray = [];

  arr.forEach((item) => {
    const dias = `${item.PLAZO_PRORROGA} días`;
    const fecha = item.FECHA_ACTA.split("-").reverse().join("/");
    const acum = `${item.PLAZO_PRORROGA_ACUMULADO}%`;

    transformedArray.push({
      dias,
      fecha,
      acum,
    });
  });

  return transformedArray;
}

const makePayloadSigners = (rol_ID, cont) => {
  let anchorString;
  switch (rol_ID) {
    case "IN":
      anchorString = "Firma y Sello Inspector";
      break;
    case "JI":
      anchorString = "Firma y Sello Jefe Inspección";
      break;
    case "GE":
      anchorString = "Firma y Sello Gerente";
      break;
    case "JA":
      anchorString = "Firma y Sello Jefe de Área";
      break;
    case "DI":
      anchorString = "Firma y Sello Director";
      break;

    default:
      break;
  }
  return {
    signHereTabs: [
      {
        anchorString,
        anchorUnits: "pixels",
        anchorYOffset: "-20",
        tabLabel: "Firma",
        documentId: "1",
        recipientId: cont.toString(),
      },
    ],
  };
};

function replaceNullsWithEmptyStrings(obj) {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      replaceNullsWithEmptyStrings(obj[i]);
    }
  } else if (typeof obj === "object") {
    for (let key in obj) {
      if (obj[key] === null) {
        obj[key] = "";
      } else {
        replaceNullsWithEmptyStrings(obj[key]);
      }
    }
  }
}
const generatePDF = async (req = request, res = response) => {
  try {
    const formsDestination = SapCfAxios("FORMSSERVICE");
    let data = req.body;
    const options = {
      beautify: false,
      selfClosing: true,
      attrKey: "@",
      contentKey: "#",
      entityMap: {
        '"': "&#34;",
        "&": "&#38;",
      },
      declaration: {
        encoding: "UTF-8",
        standalone: "yes",
      },
    };
    replaceNullsWithEmptyStrings(data);
    let xdpTemplate = `${data.doc_id}/${data.doc_id}`;
    delete data.doc_id;
    delete data.formato;
    data = {
      form1: {
        ...data,
      },
    };
    /* parseo de json a xml, a base64 y hago el payload */
    const xml = parser.jsXml.toXmlString(options, data);
    const buffer = Buffer.from(xml, "utf8");
    const base64String = buffer.toString("base64");

    let payload = {
      changeNotAllowed: false,
      embedFont: 0,
      formLocale: "en_US",
      formType: "print",
      printNotAllowed: false,
      taggedPdf: 1,
      xdpTemplate: xdpTemplate,
      xmlData: base64String,
    };
    let msg = await formsDestination({
      method: "POST",
      url: `/v1/adsRender/pdf?templateSource=storageName&TraceLevel=2 `,
      data: payload,
    });
    res.status(201).json({
      data: msg.data.fileContent,
    });
  } catch (error) {
    console.log("ERROR generatePDF-->", error);
    res.status(400).json({
      error,
    });
  }
};

const removeNullBytes = (uint8Array) => {
  const nonNullValues = Array.from(uint8Array).filter((value) => value !== 0);
  return new Uint8Array(nonNullValues);
};

const generatePDFDiagramaCuadra = async (req = request, res = response) => {
  try {
    const formsDestination = SapCfAxios("FORMSSERVICE");
    /* const dmsDestination = SapCfAxios("DMS_ROOT_CLIENTCREDENTIALS"); */
    debugger;
    /* let pdfA = await dmsDestination({
      method: "GET",
      url: req.body.plano_altimetria,
    }); */
    let data = req.body;
    const options = {
      beautify: false,
      selfClosing: true,
      attrKey: "@",
      contentKey: "#",
      entityMap: {
        '"': "&#34;",
        "&": "&#38;",
      },
      declaration: {
        encoding: "UTF-8",
        standalone: "yes",
      },
    };
    replaceNullsWithEmptyStrings(data);
    let xdpTemplate = `${data.doc_id}/${data.doc_id}`;
    delete data.doc_id;
    delete data.formato;
    data = {
      form1: {
        ...data,
      },
    };
    /* parseo de json a xml, a base64 y hago el payload */
    const xml = parser.jsXml.toXmlString(options, data);
    const buffer = Buffer.from(xml, "utf8");
    const base64String = buffer.toString("base64");

    var merger = new PDFMerger();

    let pdf1 = { data: "base64" };
    let pdf2 = { data: "base64" };
    var jsString = toUint8Array(pdf1.data);
    var jsString2 = toUint8Array(pdf2.data);
    const tmpFile1 = tmp.fileSync();
    const tmpFile2 = tmp.fileSync();

    fs.writeFileSync(tmpFile1.name, jsString);
    fs.writeFileSync(tmpFile2.name, jsString2);
    await merger.add(tmpFile1.name, 1);
    await merger.add(tmpFile2.name, 1);
    let pdfFinal = await merger
      .saveAsBuffer()
      .then((mergedArrayBuffer) => {
        let pdfFinal = mergedArrayBuffer.toString("base64");

        tmpFile1.removeCallback();
        tmpFile2.removeCallback();
        res.status(201).json({
          data: pdfFinal,
        });
      })
      .catch((error) => {
        console.error("Error merging PDFs:", error);

        // Cleanup: Remove temporary files
        tmpFile1.removeCallback();
        tmpFile2.removeCallback();
      });
    pdfFinal = pdfFinal.toString("base64");
    res.status(201).json({
      data: pdfFinal,
    });
    let payload = {
      changeNotAllowed: false,
      embedFont: 0,
      formLocale: "en_US",
      formType: "print",
      printNotAllowed: false,
      taggedPdf: 1,
      xdpTemplate: xdpTemplate,
      xmlData: base64String,
    };
    let msg = await formsDestination({
      method: "POST",
      url: `/v1/adsRender/pdf?templateSource=storageName&TraceLevel=2`,
      data: payload,
    });

    res.status(201).json({
      data: msg.data.fileContent,
    });
  } catch (error) {
    console.log("ERROR generatePDF-->", error);
    res.status(400).json({
      error,
    });
  }
};
function sumarDias(fecha, dias) {
  if (fecha === null) {
    return null;
  }
  var fechaObj = new Date(fecha);
  fechaObj.setDate(fechaObj.getDate() + dias);
  return fechaObj.toISOString().slice(0, 10);
}
router.get("/getUUID", getUUID);
router.post("/firmaElectronica", firmaElectronica);
router.post("/deleteTablas", deleteTablas);
router.post("/notificacionVencimiento", notificacionVencimiento);
router.post("/createOC", createOC);
router.post("/generatePDF", generatePDF);
router.post("/generatePDFDiagramaCuadra", generatePDFDiagramaCuadra);
router.post("/pasarActaProrrogaPlazos", pasarActaProrrogaPlazos);
router.post("/rechazarActaProrrogaPlazos", rechazarActaProrrogaPlazos);
router.post("/aprobarActaProrrogaPlazos", aprobarActaProrrogaPlazos);
router.post("/actualizarActaProrrogaPlazos", actualizarActaProrrogaPlazos);
router.post("/actualizarActaEconomias", actualizarActaEconomias);
router.post("/actualizarActasAdicionales", actualizarActasAdicionales);
router.post("/actualizarActasExcedidas", actualizarActasExcedidas);
router.post("/actualizarActasSuspension", actualizarActasSuspension);
router.post("/actualizarActasAmpliacion", actualizarActasAmpliacion);
router.post("/actualizarActasSancion", actualizarActasSancion);

module.exports = router;

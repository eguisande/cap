const cds = require("@sap/cds");
const SapCfAxios = require("sap-cf-axios").default;
const { v4: uuidv4 } = require("uuid");

const {
  AprobadoresPlanDeTrabajo,
  Obras,
  Ofertas,
  OrdenesCompra,
  Contratistas,
  Representantes,
  Inspectores,
  ObraInspectores,
  ObraPI,
  Partidimetros,
  DetallePartidimetro,
  DocumentoModificacionCabecera,
  DocumentosPreconstruccion,
  CatalogoDocumentos,
  InspeccionesElectro,
  PartidasInspeccionElectro,
  PartidasInspeccionCI,
  CertificadosControlPolizas,
  VTV,
  LicenciasConducir,
  Cedulas,
  RegistrosEspeciales,
  PlanesTrabajo,
  PermisosTramo,
  PermisosMunicipales,
  PermisosEspeciales,
  DiagramasCuadra,
  ConsumosPartida,
  Planimetrias,
  Fechas,
  MemoriaCriterios,
  MemoriaCriteriosEL,
  MemoriaCalculo,
  MemoriaCalculoEL,
  MemoriaPartidasEL,
  MemoriaCalculoCI,
  MemoriaPartidasCI,
  PartidasAcumuladasOCE,
  Tramos,
  MemoriaTramos,
  MemoriaPartidas,
  TareasPlanTrabajo,
  AcopiosMateriales,
  ActasConstatacion,
  ContratistaObra,
  InspectoresResponsables,
  Responsables,
  ResponsablesPI,
  P3,
  Areas,
  AprobadoresDocumentoPreconstruccion,
  OrdenesServicio,
  NotasPedido,
  ActasTradicion,
  ActasAdicionales,
  ActasEconomias,
  ActasExcedidas,
  ActasAmpliaciones,
  ActasSuspension,
  PartesDiarios,
  Actas,
  ActasMedicion,
  Anexos,
  Directores,
  JefesArea,
  Gerentes,
  Gerencias,
  PartidasAcopio,
  PartidasAcumuladas,
} = cds.entities("CatalogService");

module.exports = (srv) => {
  srv.on("getUUID", async (req) => {
    try {
      return uuidv4();
    } catch (error) {
      console.log("--CREATE getUUID--", error);
      return req.error(400, `Error al crear uuid`);
    }
  });

  srv.on("getUserRoles", async (req) => {

    const currentUser =  req.user.id;
  


    try {
      const apiRolDestination = SapCfAxios("PGO_XSUAA");

      const { data } = await apiRolDestination({
        method: "GET",
        url: `/sap/rest/authorization/v2/rolecollections?showUsers=true`,
      });

      return data.length
        ? data
            .filter(
              (item) =>
                item.name.startsWith("PGO") &&
                item.userReferences &&
                item.userReferences.filter(
                  (user) => user.username === currentUser
                ).length
            )
            .map((item) => item.name)
        : [currentUser];
    } catch (error) {
      return req.reject(
        400,
        `Error al obtener roles para el usuario: ${currentUser}, ${error}`
      );
    }
  });

  srv.on("changeStatusSend", async (req) => {
    const { ID } = req.data;
    const transaction = cds.transaction(req);

    if (!ID) {
      return req.reject(400, "EL ID es obligatorio");
    }

    try {
      const oObra = await transaction.run(SELECT.one.from(Obras).where({ ID }));

      if (!oObra) {
        return req.error(400, `No se encotro una obra para el ID ${ID}`);
      }

      const aOfertas = await transaction.run(
        SELECT.from(Ofertas).where({
          obra_ID: ID,
          estado_ID: "BO",
        })
      );

      if (!aOfertas.length) {
        return req.error(400, `No hay registros para validar`);
      }

      await transaction.run(
        UPDATE(Ofertas)
          .data({ estado_ID: "PI" })
          .where({ ID: { in: aOfertas.map((oferta) => oferta.ID) } })
      );
      return req.notify(201, "Cambio de estado OK");
    } catch (error) {
      console.log("--changeStatusSend--", error);
      return req.reject(400, "Error al cambiar de estado");
    }
  });

  srv.on("getQuantity", async (req) => {
    const { proyecto_inversion } = req.data;

    try {
      const [{ QUANTITY }] = await cds.run(`SELECT OC,  
                                                SUM(QUANTITY) AS QUANTITY 
                                        FROM COM_AYSA_PGO_ORDENESCOMPRAORACLE 
                                        WHERE OC IN ( SELECT OC 
                                                    FROM COM_AYSA_PGO_ORDENESCOMPRAORACLE 
                                                    WHERE PROYECTO_INVERSION = '${proyecto_inversion}')
                                        GROUP BY OC`);

      return QUANTITY;
    } catch (error) {
      console.log("--GET QUANTITY--", error);
      return req.error(
        400,
        `Error al obtener cantidades para el proyecto de inversion ${proyecto_inversion}`
      );
    }
  });

  srv.on("getOCQuantity", async (req) => {
    const { proyecto_inversion } = req.data;
    try {
      const aData = await cds.run(`SELECT PROYECTO_INVERSION as PI,
                                                OC,  
                                                SUM(QUANTITY) AS QUANTITY 
                                        FROM COM_AYSA_PGO_ORDENESCOMPRAORACLE 
                                        WHERE OC IN ( SELECT OC FROM COM_AYSA_PGO_ORDENESCOMPRAORACLE WHERE PROYECTO_INVERSION = '${proyecto_inversion}')
                                        GROUP BY PROYECTO_INVERSION, OC`);

      return aData.map((item) => ({
        pi: item.PI,
        oc: item.OC,
        quantity: item.QUANTITY,
      }));
    } catch (error) {
      console.log("--GET OC QUANTITY--", error);
      return req.error(
        400,
        `Error al obtener cantidades para el proyecto de inversion ${proyecto_inversion}`
      );
    }
  });

  srv.on("getContratista", async (req) => {
    const { registro_proveedor } = req.data;
    try {
      return await cds.run(
        SELECT.one.from(Contratistas).where({ registro_proveedor })
      );
    } catch (error) {
      console.log("--GET Contratista--", error);
      return req.error(
        400,
        `Error al obtener el contratista ${registro_proveedor}`
      );
    }
  });

  srv.on("getObrasByUserID", async (req) => {
    const { usuario, ID } = req.data;
    try {
      const aRepresentates = await cds.run(
        SELECT.from(Representantes).where({ usuario })
      );

      if (!aRepresentates.length) {
        return [];
      }
      const aContratistasObra = await cds.run(
        SELECT.from(ContratistaObra).where({
          contratista_ID: {
            in: aRepresentates.map(
              (representate) => representate.contratista_ID
            ),
          },
        })
      );
      if (!aContratistasObra.length) {
        return [];
      }
      const fechaActual = new Date().toISOString().split("T")[0];

      // Filtra los objetos que están dentro de vigencia
      const contratistasVigentes = aContratistasObra.filter((contratista) => {
        const vigenciaDesde = contratista.vigencia_desde;
        const vigenciaHasta = contratista.vigencia_hasta;

        return (
          fechaActual >= vigenciaDesde &&
          fechaActual <= vigenciaHasta &&
          contratista.obra_ID == ID
        );
      });

      if (!contratistasVigentes.length) {
        return [];
      }
      const obra = await cds.run(
        SELECT.from(Obras)
          .where({
            ID: {
              in: contratistasVigentes.map(
                (representate) => representate.obra_ID
              ),
            },
          })
          .orderBy({ ref: ["nombre"], sort: "asc" })
      );
      if (obra.length == 0) {
        return req.error(
          400,
          `El usuario ${usuario} no tiene permisos para ver esta obra.`
        );
      }
      return obra;
    } catch (error) {
      console.log("--GET OBRAS USER ID--", error);
      return req.error(
        400,
        `El usuario ${usuario} no tiene permisos para ver esta obra.`
      );
    }
  });

  srv.on("getObrasByUser", async (req) => {
    const { usuario } = req.data;
    try {
      const aRepresentates = await cds.run(
        SELECT.from(Representantes).where({ usuario })
      );
      /*
      const query = {
        SELECT: {
          from: { ref: ["CatalogService.Obras"] },
          columns: [
            "*",
            { ref: ["tipo_obra"], expand: ["*"] },
            { ref: ["tipo_contrato"], expand: ["*"] },
            { ref: ["fluido"], expand: ["*"] },
            { ref: ["partido"], expand: ["*"] },
            { ref: ["sistema"], expand: ["*"] },
            { ref: ["estado"], expand: ["*"] },
            { ref: ["direccion"], expand: ["*"] },
            { ref: ["gerencia"], expand: ["*"] },
            { ref: ["contratista"], expand: ["*"] },
            {
              ref: ["inspectores"],
              expand: [
                "*",
                {
                  ref: ["inspector"],
                  expand: ["*", { ref: ["tipo_inspector"], expand: ["*"] }],
                },
              ],
            },
            {
              ref: ["pi"],
              expand: [
                "*",
                {
                  ref: ["partidimetros"],
                  expand: ["*", { ref: ["estado"], expand: ["*"] }],
                },
              ],
            },
            {
              ref: ["orden_servicio"],
              expand: [
                "*",
                { ref: ["estado"], expand: ["*"] },
                { ref: ["referencia"], expand: ["*"] },
                { ref: ["anexo"], expand: ["*"] },
                { ref: ["nota_pedido"], expand: ["*"] },
                { ref: ["presentacion"], expand: ["*"] },
              ],
            },
            {
              ref: ["nota_pedido"],
              expand: [
                "*",
                { ref: ["estado"], expand: ["*"] },
                { ref: ["referencia"], expand: ["*"] },
                { ref: ["anexos"], expand: ["*"] },
                { ref: ["presentacion"], expand: ["*"] },
                { ref: ["documento_adjunto"], expand: ["*"] },
              ],
            },
            {
              ref: ["presentaciones"],
              expand: ["*", { ref: ["estado"], expand: ["*"] }],
            },
            {
              ref: ["plan_trabajo"],
              expand: ["*", { ref: ["estado"], expand: ["*"] }],
            },
          ],
          where: [
            /
            {
              xpr: [
                { ref: ["contratista_ID"] },
                "in",
                {
                  val: aRepresentates.map(
                    (representate) => representate.contratista_ID
                  ),
                },
              ],
            },
            "and",
            /
            {
              xpr: [
                { ref: ["estado_ID"] },
                "=",
                { val: "CO" },
                "or",
                { ref: ["estado_ID"] },
                "=",
                { val: "RC" },
                "or",
                { ref: ["estado_ID"] },
                "=",
                { val: "SP" },
                "or",
                { ref: ["estado_ID"] },
                "=",
                { val: "ST" },
                "or",
                { ref: ["estado_ID"] },
                "=",
                { val: "FP" },
                "or",
                { ref: ["estado_ID"] },
                "=",
                { val: "FT" },
                "or",
                { ref: ["estado_ID"] },
                "=",
                { val: "TR" },
              ],
            },
          ],
          limit: { rows: { val: 1000 } },
          orderBy: [{ ref: ["ID"], sort: "asc" }],
        },
      };
      const aContratistas = aRepresentates.map(
        (representate) => representate.contratista_ID
      );

      const aData = await cds.run(query);

      return aData.filter((item) =>
        aContratistas.includes(item.contratista_ID)
      );

      /*
      */
      if (!aRepresentates.length) {
        return [];
      }
      const aContratistasObra = await cds.run(
        SELECT.from(ContratistaObra).where({
          contratista_ID: {
            in: aRepresentates.map(
              (representate) => representate.contratista_ID
            ),
          },
        })
      );
      if (!aContratistasObra.length) {
        return [];
      }
      const fechaActual = new Date().toISOString().split("T")[0];

      // Filtra los objetos que están dentro de vigencia
      const contratistasVigentes = aContratistasObra.filter((objeto) => {
        const vigenciaDesde = objeto.vigencia_desde;
        const vigenciaHasta = objeto.vigencia_hasta;

        return fechaActual >= vigenciaDesde && fechaActual <= vigenciaHasta;
      });

      if (!contratistasVigentes.length) {
        return [];
      }
      return await cds.run(
        SELECT.from(Obras)
          .where({
            estado_ID: { in: ["CO", "RC", "SP", "ST", "FP", "FT", "TR", "EJ"] },
            ID: {
              in: contratistasVigentes.map(
                (representate) => representate.obra_ID
              ),
            },
          })
          .orderBy({ ref: ["nombre"], sort: "asc" })
      );
    } catch (error) {
      console.log("--GET OBRAS USER--", error);
      return req.error(
        400,
        `El usuario ${usuario} no es representante de ningún contratista`
      );
    }
  });
  srv.on("getObrasByUserLogged", async (req) => {
    const { usuario } = req.data;
    try {
      const apiRolDestination = SapCfAxios("PGO_XSUAA");

      const { data } = await apiRolDestination({
        method: "GET",
        url: `/sap/rest/authorization/v2/rolecollections?showUsers=true`,
      });

      let oUserLoggedData = data.length
        ? data
            .filter(
              (item) =>
                item.name.startsWith("PGO") &&
                item.userReferences &&
                item.userReferences.filter((user) => user.username === usuario)
                  .length
            )
            .map((item) => item.name)
        : [];
      let obras = [];
      if (
        oUserLoggedData.includes("PGO_AreaPermisos") ||
        oUserLoggedData.includes("PGO_Analista") ||
        oUserLoggedData.includes("PGO_AreaPermisos") ||
        oUserLoggedData.includes("PGO_AreaSeguridadHigiene") ||
        oUserLoggedData.includes("PGO_AreaIngenieria") ||
        oUserLoggedData.includes("PGO_AreaCarteleria") ||
        oUserLoggedData.includes("PGO_Medioambiente") ||
        oUserLoggedData.includes("PGO_AreaMedioambiente") ||
        oUserLoggedData.includes("PGO_AreaGenero") ||
        oUserLoggedData.includes("PGO_Super")
      ) {
        return await cds.run(
          SELECT.from(Obras).orderBy({ ref: ["nombre"], sort: "asc" })
        );
      }
      if (oUserLoggedData.includes("PGO_Contratista")) {
        const aRepresentates = await cds.run(
          SELECT.from(Representantes).where({ usuario })
        );

        if (aRepresentates.length) {
          const aContratistasObra = await cds.run(
            SELECT.from(ContratistaObra).where({
              contratista_ID: {
                in: aRepresentates.map(
                  (representate) => representate.contratista_ID
                ),
              },
            })
          );

          if (aContratistasObra.length) {
            const fechaActual = new Date().toISOString().split("T")[0];
            // Filtra los objetos que están dentro de vigencia
            const contratistasVigentes = aContratistasObra.filter((objeto) => {
              const vigenciaDesde = objeto.vigencia_desde;
              const vigenciaHasta = objeto.vigencia_hasta;

              return (
                fechaActual >= vigenciaDesde && fechaActual <= vigenciaHasta
              );
            });

            if (contratistasVigentes.length) {
              return await cds.run(
                SELECT.from(Obras)
                  .where({
                    estado_ID: {
                      in: ["CO", "RC", "SP", "ST", "FP", "FT", "TR", "EJ"],
                    },
                    ID: {
                      in: contratistasVigentes.map(
                        (representate) => representate.obra_ID
                      ),
                    },
                  })
                  .orderBy({ ref: ["nombre"], sort: "asc" })
              );
            }
          }
        }
      }
      if (oUserLoggedData.includes("PGO_JefeInspeccion")) {
        const aInspectores = await cds.run(
          SELECT.from(Inspectores).where({ usuario, tipo_inspector_ID: "JE" })
        );
        if (!aInspectores.length) {
          return [];
        }
        const aInspectoresResponsables = await cds.run(
          SELECT.from(InspectoresResponsables).where({
            inspector_ID: { in: aInspectores.map((inspector) => inspector.ID) },
          })
        );
        if (!aInspectoresResponsables.length) {
          return [];
        }
        const aResponsables = await cds.run(
          SELECT.from(Responsables).where({
            ID: {
              in: aInspectoresResponsables.map(
                (inspector) => inspector.responsable_ID
              ),
            },
          })
        );
        if (!aResponsables.length) {
          return [];
        }

        return await cds.run(
          SELECT.from(Obras)
            .where({
              ID: {
                in: aResponsables.map((representate) => representate.obra_ID),
              },
            })
            .orderBy({ ref: ["nombre"], sort: "asc" })
        );
      }

      if (oUserLoggedData.includes("PGO_Inspector")) {
        const aInspectores = await cds.run(
          SELECT.from(Inspectores).where({ usuario, tipo_inspector_ID: "EM" })
        );
        if (!aInspectores.length) {
          return [];
        }
        const aInspectoresResponsables = await cds.run(
          SELECT.from(InspectoresResponsables).where({
            inspector_ID: { in: aInspectores.map((inspector) => inspector.ID) },
          })
        );
        if (!aInspectoresResponsables.length) {
          return [];
        }
        const aResponsables = await cds.run(
          SELECT.from(Responsables).where({
            ID: {
              in: aInspectoresResponsables.map(
                (inspector) => inspector.responsable_ID
              ),
            },
          })
        );
        if (!aResponsables.length) {
          return [];
        }

        return await cds.run(
          SELECT.from(Obras)
            .where({
              ID: {
                in: aResponsables.map((representate) => representate.obra_ID),
              },
            })
            .orderBy({ ref: ["nombre"], sort: "asc" })
        );
      }
      if (
        oUserLoggedData.includes("PGO_Director") ||
        oUserLoggedData.includes("PGO_JefeArea")
      ) {
        const aDirectores = await cds.run(
          SELECT.from(Directores).where({ usuario })
        );
        const aJefesArea = await cds.run(
          SELECT.from(JefesArea).where({ usuario })
        );
        if (aDirectores.length) {
          const aResponsables = await cds.run(
            SELECT.from(Responsables).where({
              ID: { in: aDirectores.map((director) => director.direccion_ID) },
            })
          );
          if (aResponsables.length) {
            return await cds.run(
              SELECT.from(Obras)
                .where({
                  ID: {
                    in: aResponsables.map(
                      (representate) => representate.obra_ID
                    ),
                  },
                })
                .orderBy({ ref: ["nombre"], sort: "asc" })
            );
          }
        }
        if (aJefesArea.length) {
          const aResponsables = await cds.run(
            SELECT.from(Responsables).where({
              direccion_ID: {
                in: aJefesArea.map((jefeArea) => jefeArea.direccion_ID),
              },
            })
          );
          if (aResponsables.length) {
            return await cds.run(
              SELECT.from(Obras)
                .where({
                  ID: {
                    in: aResponsables.map(
                      (representate) => representate.obra_ID
                    ),
                  },
                })
                .orderBy({ ref: ["nombre"], sort: "asc" })
            );
          }
        }
      }
      if (oUserLoggedData.includes("PGO_Gerente")) {
        const aGerentes = await cds.run(
          SELECT.from(Gerentes).where({ usuario })
        );
        if (aGerentes.length) {
          const aGerencias = await cds.run(
            SELECT.from(Gerencias).where({
              ID: { in: aGerentes.map((gerente) => gerente.gerencia_ID) },
            })
          );
          if (aGerencias.length) {
            const aResponsables = await cds.run(
              SELECT.from(Responsables).where({
                direccion_ID: {
                  in: aGerencias.map((gerencia) => gerencia.direccion_ID),
                },
              })
            );
            return await cds.run(
              SELECT.from(Obras)
                .where({
                  ID: {
                    in: aResponsables.map(
                      (representate) => representate.obra_ID
                    ),
                  },
                })
                .orderBy({ ref: ["nombre"], sort: "asc" })
            );
          }
        }
      }
      return [];
    } catch (error) {
      console.log("--GET OBRAS USER--", error);
      return req.error(
        400,
        `El usuario ${usuario} no es representante de ningún contratista`
      );
    }
  });

  srv.on("getCatalogoDocumentos", async (req) => {
    const { obra_ID } = req.data;
    try {
      return await cds.run(
        `SELECT 
                    CATALOGODOCUMENTOS.AREA_ID AS "area_ID",
                    AREAS.DESCRIPCION AS "area_descripcion",
                    DOCUMENTOSADJUNTO.ID AS "documento_adjunto_ID",
                    DOCUMENTOSADJUNTO.ADJUNTO AS "documento_adjunto",
                    DOCUMENTOSADJUNTO.FECHA_ENTREGA AS "fecha_entrega",
                    DOCUMENTOSPRECONSTRUCCION.ESTADO_ID AS "estado_ID",
                    ESTADOS.DESCRIPCION AS "estado_descripcion",                 
                    ESTADOS.COLOR AS "estado_color"                 
                FROM COM_AYSA_PGO_OBRAS AS OBRAS
                INNER JOIN COM_AYSA_PGO_PRECONSTRUCCIONES AS PRECONSTRUCCIONES
                    ON PRECONSTRUCCIONES.ID = OBRAS.PRECONSTRUCCION_ID
                INNER JOIN COM_AYSA_PGO_DOCUMENTOSPRECONSTRUCCION AS DOCUMENTOSPRECONSTRUCCION
                    ON PRECONSTRUCCIONES.ID = DOCUMENTOSPRECONSTRUCCION.PRECONSTRUCCION_ID
                INNER JOIN COM_AYSA_PGO_DOCUMENTOSADJUNTO AS DOCUMENTOSADJUNTO
                    ON DOCUMENTOSADJUNTO.DOCUMENTO_PRECONSTRUCCION_ID = DOCUMENTOSPRECONSTRUCCION.ID
                INNER JOIN COM_AYSA_PGO_CATALOGODOCUMENTOS AS CATALOGODOCUMENTOS
                    ON CATALOGODOCUMENTOS.ID = DOCUMENTOSPRECONSTRUCCION.CATALOGO_DOCUMENTOS_ID
                INNER JOIN COM_AYSA_PGO_AREAS AS AREAS
                    ON AREAS.ID = CATALOGODOCUMENTOS.AREA_ID
                INNER JOIN COM_AYSA_PGO_ESTADOSGENERAL AS ESTADOS
                    ON ESTADOS.ID = DOCUMENTOSPRECONSTRUCCION.ESTADO_ID
                WHERE OBRAS.ID = '${obra_ID}'`
      );
    } catch (error) {
      console.log("--GET DOCUMENTOS--", error);
      return req.error(
        400,
        `Error al obtener documentos de la obra ${obra_ID}`
      );
    }
  });

  function mesAnterior(mesActual) {
    // Convertir el string a un número entero
    let mesNumero = parseInt(mesActual, 10);
    // Calcular el mes anterior
    let mesPrevio = mesNumero - 1;
    // Si el mes actual es Enero (01), establecer el mes anterior como Diciembre (12)
    if (mesPrevio === 0) {
      mesPrevio = 12;
    }
    // Devolver el mes anterior como un string de dos dígitos
    return mesPrevio.toString().padStart(2, "0");
  }

  srv.on("getDataMemoriaCalculo", async (req) => {
    const { pi_ID, tipo_pi, nro, memoria_calculo_ID, mes } = req.data;
    try {
      if (tipo_pi == "EL") {
        let todasMemorias = await cds.run(
          SELECT.from(MemoriaCalculoEL)
            .where({ pi_ID })
            .orderBy({ nro_memoria_calculo: "desc" })
        );
        let memoriasAnteriores = todasMemorias.filter((memoria) => {
          return (
            memoria.nro_memoria_calculo === null ||
            memoria.nro_memoria_calculo < nro
          );
        });
        let partidasMemorias = await cds.run(
          SELECT.from(MemoriaPartidasEL).where({
            memoria_calculo_ID: {
              in: memoriasAnteriores.map((memoria) => memoria.ID),
            },
          })
        );
        if (memoriasAnteriores.length == 1) {
          return [];
        }
        let oMemoriaActual = await cds.run(
          SELECT.one.from(MemoriaCalculoEL).where({
            ID: memoria_calculo_ID,
          })
        );
        let oPartidasMemoriaActual = await cds.run(
          SELECT.from(MemoriaPartidasEL).where({
            memoria_calculo_ID: memoria_calculo_ID,
          })
        );

        let todosAcopios = await cds.run(
          SELECT.from(AcopiosMateriales).where({ pi_ID })
        );
        const datoMes = parseInt(oMemoriaActual.mes, 10);
        const datoAnio = parseInt(oMemoriaActual.anio, 10);

        const acopiosMismoMes = todosAcopios.filter(
          (item) =>
            parseInt(item.mes, 10) === datoMes &&
            parseInt(item.anio, 10) === datoAnio &&
            item.pi_ID === oMemoriaActual.pi_ID
        );

        const acopiosAnteriores = todosAcopios.filter((acopio) => {
          const acopioMes = parseInt(acopio.mes, 10);
          const acopioAnio = parseInt(acopio.anio, 10);

          return (
            (acopioAnio < datoAnio ||
              (acopioAnio === datoAnio && acopioMes < datoMes)) &&
            acopio.pi_ID === oMemoriaActual.pi_ID
          );
        });
        if (acopiosMismoMes.length) {
          var partidasAcopiosMes = await cds.run(
            SELECT.from(PartidasAcopio).where({
              acopio_material_ID: {
                in: acopiosMismoMes.map((acopio) => acopio.ID),
              },
            })
          );
        } else {
          var partidasAcopiosMes = [];
        }
        if (acopiosAnteriores.length) {
          var partidasAcopiosAnteriores = await cds.run(
            SELECT.from(PartidasAcopio).where({
              acopio_material_ID: {
                in: acopiosAnteriores.map((acopio) => acopio.ID),
              },
            })
          );
        } else {
          var partidasAcopiosAnteriores = [];
        }
        var partidasAEnviar = [];
        partidasAcopiosMes.forEach((partidaActual) => {
          let partidaEquivalentesAnteriores = partidasAcopiosAnteriores.filter(
            (item) =>
              item.codigo1 === partidaActual.codigo1 &&
              item.codigo2 === partidaActual.codigo2 &&
              item.codigo3 === partidaActual.codigo3 &&
              item.codigo4 === partidaActual.codigo4 &&
              item.codigo5 === partidaActual.codigo5
          );
          const totalCantidadCertificarAnterior =
            partidaEquivalentesAnteriores.reduce((acumulado, item) => {
              return acumulado + parseFloat(item.cantidad_factura);
            }, 0);
          let partidasPartidimetroEquivalentesAnteriores =
            partidasMemorias.filter(
              (item) =>
                item.codigo1 === partidaActual.codigo1 &&
                item.codigo2 === partidaActual.codigo2 &&
                item.codigo3 === partidaActual.codigo3 &&
                item.codigo4 === partidaActual.codigo4 &&
                item.codigo5 === partidaActual.codigo5
            );
          const partidasPartidimetroCertificarAnterior =
            partidasPartidimetroEquivalentesAnteriores.reduce(
              (acumulado, item) => {
                return acumulado + parseFloat(item.cantidad_certificar);
              },
              0
            );
          partidasAEnviar.push({
            codigo1: partidaActual.codigo1,
            codigo2: partidaActual.codigo2,
            codigo3: partidaActual.codigo3,
            codigo4: partidaActual.codigo4,
            codigo5: partidaActual.codigo5,
            tipo_partida: "acopio",
            subitem_ID: partidaActual.subitem_ID,
            item_ID: partidaActual.item_ID,
            descripcion: partidaActual.descripcion_factura,
            um_ID: partidaActual.unidad_partida_ID,
            cantidad_contractual: partidaActual.cantidad_contractual,
            precio_unitario: partidaActual.precio_unitario,
            cantidades_acopiadas:
              totalCantidadCertificarAnterior + partidaActual.cantidad_factura,
            total_acum_anterior:
              totalCantidadCertificarAnterior +
              partidaActual.cantidad_factura -
              partidasPartidimetroCertificarAnterior,
            total_acum_presente: partidaActual.cantidad_factura,
            cantidades_desacopiar:
              partidaActual.cantidad_factura -
              partidasPartidimetroCertificarAnterior,
            estimacion_mensual:
              (partidaActual.cantidad_factura -
                partidasPartidimetroCertificarAnterior) *
              partidaActual.precio_unitario *
              -1,
          });
        });
        oPartidasMemoriaActual.forEach((partidaActual) => {
          let partidaEquivalentesAnteriores = partidasMemorias.filter(
            (item) =>
              item.codigo1 === partidaActual.codigo1 &&
              item.codigo2 === partidaActual.codigo2 &&
              item.codigo3 === partidaActual.codigo3 &&
              item.codigo4 === partidaActual.codigo4 &&
              item.codigo5 === partidaActual.codigo5
          );
          const totalCantidadCertificarAnterior =
            partidaEquivalentesAnteriores.reduce((acumulado, item) => {
              return acumulado + parseFloat(item.cantidad_certificar);
            }, 0);
          partidasAEnviar.push({
            codigo1: partidaActual.codigo1,
            codigo2: partidaActual.codigo2,
            codigo3: partidaActual.codigo3,
            codigo4: partidaActual.codigo4,
            codigo5: partidaActual.codigo5,
            ID: partidaActual.ID,
            subitem_ID: partidaActual.subitem_ID,
            item_ID: partidaActual.item_ID,
            descripcion: partidaActual.descripcion,
            um_ID: partidaActual.unidad_partida_ID,
            montaje: partidaActual.montaje,
            orden_compra: partidaActual.orden_compra,
            avance_taller: partidaActual.avance_taller,
            pie_obra: partidaActual.pie_obra,
            precio_unitario: partidaActual.precio_unitario,
            puesta_marcha: partidaActual.puesta_marcha,
            cantidad_contractual: partidaActual.cantidad_contractual,
            tipo_partida: partidaActual.tipo_partida_ID,
            total_mensual: partidaActual.cantidad_certificar,
            total_acum_anterior: totalCantidadCertificarAnterior,
            total_acum_presente:
              totalCantidadCertificarAnterior +
              partidaActual.cantidad_certificar,
            estimacion_mensual:
              partidaActual.cantidad_certificar * partidaActual.precio_unitario,
          });
        });
      }
      if (tipo_pi == "CI") {
        let todasMemorias = await cds.run(
          SELECT.from(MemoriaCalculoCI)
            .where({ pi_ID })
            .orderBy({ nro_memoria_calculo: "desc" })
        );
        let memoriasAnteriores = todasMemorias.filter((memoria) => {
          return (
            memoria.nro_memoria_calculo === null ||
            memoria.nro_memoria_calculo < nro
          );
        });
        let partidasMemorias = await cds.run(
          SELECT.from(MemoriaPartidasCI).where({
            memoria_calculo_ID: {
              in: memoriasAnteriores.map((memoria) => memoria.ID),
            },
          })
        );
        if (memoriasAnteriores.length == 1) {
          return [];
        }
        let oMemoriaActual = await cds.run(
          SELECT.one.from(MemoriaCalculoCI).where({
            ID: memoria_calculo_ID,
          })
        );
        let oPartidasMemoriaActual = await cds.run(
          SELECT.from(MemoriaPartidasCI).where({
            memoria_calculo_ID: memoria_calculo_ID,
          })
        );

        let todosAcopios = await cds.run(
          SELECT.from(AcopiosMateriales).where({ pi_ID })
        );
        const datoMes = parseInt(oMemoriaActual.mes, 10);
        const datoAnio = parseInt(oMemoriaActual.anio, 10);

        const acopiosMismoMes = todosAcopios.filter(
          (item) =>
            parseInt(item.mes, 10) === datoMes &&
            parseInt(item.anio, 10) === datoAnio &&
            item.pi_ID === oMemoriaActual.pi_ID
        );

        const acopiosAnteriores = todosAcopios.filter((acopio) => {
          const acopioMes = parseInt(acopio.mes, 10);
          const acopioAnio = parseInt(acopio.anio, 10);

          return (
            (acopioAnio < datoAnio ||
              (acopioAnio === datoAnio && acopioMes < datoMes)) &&
            acopio.pi_ID === oMemoriaActual.pi_ID
          );
        });
        if (acopiosMismoMes.length) {
          var partidasAcopiosMes = await cds.run(
            SELECT.from(PartidasAcopio).where({
              acopio_material_ID: {
                in: acopiosMismoMes.map((acopio) => acopio.ID),
              },
            })
          );
        } else {
          var partidasAcopiosMes = [];
        }
        if (acopiosAnteriores.length) {
          var partidasAcopiosAnteriores = await cds.run(
            SELECT.from(PartidasAcopio).where({
              acopio_material_ID: {
                in: acopiosAnteriores.map((acopio) => acopio.ID),
              },
            })
          );
        } else {
          var partidasAcopiosAnteriores = [];
        }
        var partidasAEnviar = [];
        partidasAcopiosMes.forEach((partidaActual) => {
          let partidaEquivalentesAnteriores = partidasAcopiosAnteriores.filter(
            (item) =>
              item.codigo1 === partidaActual.codigo1 &&
              item.codigo2 === partidaActual.codigo2 &&
              item.codigo3 === partidaActual.codigo3 &&
              item.codigo4 === partidaActual.codigo4 &&
              item.codigo5 === partidaActual.codigo5
          );
          const totalCantidadCertificarAnterior =
            partidaEquivalentesAnteriores.reduce((acumulado, item) => {
              return acumulado + parseFloat(item.cantidad_factura);
            }, 0);
          let partidasPartidimetroEquivalentesAnteriores =
            partidasMemorias.filter(
              (item) =>
                item.codigo1 === partidaActual.codigo1 &&
                item.codigo2 === partidaActual.codigo2 &&
                item.codigo3 === partidaActual.codigo3 &&
                item.codigo4 === partidaActual.codigo4 &&
                item.codigo5 === partidaActual.codigo5
            );
          const partidasPartidimetroCertificarAnterior =
            partidasPartidimetroEquivalentesAnteriores.reduce(
              (acumulado, item) => {
                return acumulado + parseFloat(item.cantidad_certificar);
              },
              0
            );
          partidasAEnviar.push({
            codigo1: partidaActual.codigo1,
            codigo2: partidaActual.codigo2,
            codigo3: partidaActual.codigo3,
            codigo4: partidaActual.codigo4,
            codigo5: partidaActual.codigo5,
            tipo_partida: "acopio",
            subitem_ID: partidaActual.subitem_ID,
            item_ID: partidaActual.item_ID,
            descripcion: partidaActual.descripcion_factura,
            um_ID: partidaActual.unidad_partida_ID,
            cantidad_contractual: partidaActual.cantidad_contractual,
            precio_unitario: partidaActual.precio_unitario,
            cantidades_acopiadas:
              totalCantidadCertificarAnterior + partidaActual.cantidad_factura,
            total_acum_anterior:
              totalCantidadCertificarAnterior +
              partidaActual.cantidad_factura -
              partidasPartidimetroCertificarAnterior,
            total_acum_presente: partidaActual.cantidad_factura,
            cantidades_desacopiar:
              partidaActual.cantidad_factura -
              partidasPartidimetroCertificarAnterior,
            estimacion_mensual:
              (partidaActual.cantidad_factura -
                partidasPartidimetroCertificarAnterior) *
              partidaActual.precio_unitario *
              -1,
          });
        });
        oPartidasMemoriaActual.forEach((partidaActual) => {
          let partidaEquivalentesAnteriores = partidasMemorias.filter(
            (item) =>
              item.codigo1 === partidaActual.codigo1 &&
              item.codigo2 === partidaActual.codigo2 &&
              item.codigo3 === partidaActual.codigo3 &&
              item.codigo4 === partidaActual.codigo4 &&
              item.codigo5 === partidaActual.codigo5
          );
          const totalCantidadCertificarAnterior =
            partidaEquivalentesAnteriores.reduce((acumulado, item) => {
              return acumulado + parseFloat(item.cantidad_certificar);
            }, 0);
          partidasAEnviar.push({
            codigo1: partidaActual.codigo1,
            codigo2: partidaActual.codigo2,
            codigo3: partidaActual.codigo3,
            codigo4: partidaActual.codigo4,
            codigo5: partidaActual.codigo5,
            subitem_ID: partidaActual.subitem_ID,
            item_ID: partidaActual.item_ID,
            descripcion: partidaActual.descripcion,
            um_ID: partidaActual.unidad_partida_ID,
            montaje: partidaActual.montaje,
            orden_compra: partidaActual.orden_compra,
            avance_taller: partidaActual.avance_taller,
            pie_obra: partidaActual.pie_obra,
            precio_unitario: partidaActual.precio_unitario,
            puesta_marcha: partidaActual.puesta_marcha,
            cantidad_contractual: partidaActual.cantidad_contractual,
            tipo_partida: partidaActual.tipo_partida_ID,
            total_mensual: partidaActual.cantidad_certificar,
            total_acum_anterior: totalCantidadCertificarAnterior,
            total_acum_presente:
              totalCantidadCertificarAnterior +
              partidaActual.cantidad_certificar,
            estimacion_mensual:
              partidaActual.cantidad_certificar * partidaActual.precio_unitario,
          });
        });
      }
      if (tipo_pi == "RE") {
        let todasMemorias = await cds.run(
          SELECT.from("MemoriaCalculo")
            .where({ pi_ID })
            .orderBy({ nro_memoria_calculo: "desc" })
        );
        let memoriasAnteriores = todasMemorias.filter((memoria) => {
          return (
            memoria.nro_memoria_calculo === null ||
            memoria.nro_memoria_calculo < nro
          );
        });
        let partidasMemorias = await cds.run(
          SELECT.from(PartidasAcumuladas).where({
            memoria_calculo_ID: {
              in: memoriasAnteriores.map((memoria) => memoria.ID),
            },
          })
        );
        if (memoriasAnteriores.length == 1) {
          return [];
        }
        let oMemoriaActual = await cds.run(
          SELECT.one.from(MemoriaCalculo).where({
            ID: memoria_calculo_ID,
          })
        );
        let oPartidasMemoriaActual = await cds.run(
          SELECT.from(MemoriaPartidasEL).where({
            memoria_calculo_ID: oMemoriaActual.ID,
          })
        );

        let todosAcopios = await cds.run(
          SELECT.from(AcopiosMateriales).where({ pi_ID })
        );
        const datoMes = parseInt(oMemoriaActual.mes, 10);
        const datoAnio = parseInt(oMemoriaActual.anio, 10);

        const acopiosMismoMes = todosAcopios.filter(
          (item) =>
            parseInt(item.mes, 10) === datoMes &&
            parseInt(item.anio, 10) === datoAnio &&
            item.pi_ID === oMemoriaActual.pi_ID
        );

        const acopiosAnteriores = todosAcopios.filter((acopio) => {
          const acopioMes = parseInt(acopio.mes, 10);
          const acopioAnio = parseInt(acopio.anio, 10);

          return (
            (acopioAnio < datoAnio ||
              (acopioAnio === datoAnio && acopioMes < datoMes)) &&
            acopio.pi_ID === oMemoriaActual.pi_ID
          );
        });
        if (acopiosMismoMes.length) {
          var partidasAcopiosMes = await cds.run(
            SELECT.from(PartidasAcopio).where({
              acopio_material_ID: {
                in: acopiosMismoMes.map((acopio) => acopio.ID),
              },
            })
          );
        } else {
          var partidasAcopiosMes = [];
        }
        if (acopiosAnteriores.length) {
          var partidasAcopiosAnteriores = await cds.run(
            SELECT.from(PartidasAcopio).where({
              acopio_material_ID: {
                in: acopiosAnteriores.map((acopio) => acopio.ID),
              },
            })
          );
        } else {
          var partidasAcopiosAnteriores = [];
        }
        var partidasAEnviar = [];
        partidasAcopiosMes.forEach((partidaActual) => {
          let partidaEquivalentesAnteriores = partidasAcopiosAnteriores.filter(
            (item) =>
              item.codigo1 === partidaActual.codigo1 &&
              item.codigo2 === partidaActual.codigo2 &&
              item.codigo3 === partidaActual.codigo3 &&
              item.codigo4 === partidaActual.codigo4 &&
              item.codigo5 === partidaActual.codigo5
          );
          const totalCantidadCertificarAnterior =
            partidaEquivalentesAnteriores.reduce((acumulado, item) => {
              return acumulado + parseFloat(item.cantidad_factura);
            }, 0);
          let partidasPartidimetroEquivalentesAnteriores =
            partidasMemorias.filter(
              (item) =>
                item.codigo1 === partidaActual.codigo1 &&
                item.codigo2 === partidaActual.codigo2 &&
                item.codigo3 === partidaActual.codigo3 &&
                item.codigo4 === partidaActual.codigo4 &&
                item.codigo5 === partidaActual.codigo5
            );
          const partidasPartidimetroCertificarAnterior =
            partidasPartidimetroEquivalentesAnteriores.reduce(
              (acumulado, item) => {
                return acumulado + parseFloat(item.cantidad_certificar);
              },
              0
            );
          partidasAEnviar.push({
            codigo1: partidaActual.codigo1,
            codigo2: partidaActual.codigo2,
            codigo3: partidaActual.codigo3,
            codigo4: partidaActual.codigo4,
            codigo5: partidaActual.codigo5,
            tipo_partida: "acopio",
            cantidades_acopiadas:
              totalCantidadCertificarAnterior + partidaActual.cantidad_factura,
            total_acum_anterior:
              totalCantidadCertificarAnterior +
              partidaActual.cantidad_factura -
              partidasPartidimetroCertificarAnterior,
            total_acum_presente: partidaActual.cantidad_factura,
            cantidades_desacopiar:
              partidaActual.cantidad_factura -
              partidasPartidimetroCertificarAnterior,
            estimacion_mensual:
              (partidaActual.cantidad_factura -
                partidasPartidimetroCertificarAnterior) *
              partidaActual.precio_unitario *
              -1,
          });
        });
        oPartidasMemoriaActual.forEach((partidaActual) => {
          let partidaEquivalentesAnteriores = partidasMemorias.filter(
            (item) =>
              item.codigo1 === partidaActual.codigo1 &&
              item.codigo2 === partidaActual.codigo2 &&
              item.codigo3 === partidaActual.codigo3 &&
              item.codigo4 === partidaActual.codigo4 &&
              item.codigo5 === partidaActual.codigo5
          );
          const totalCantidadCertificarAnterior =
            partidaEquivalentesAnteriores.reduce((acumulado, item) => {
              return acumulado + parseFloat(item.cantidad_certificar);
            }, 0);
          partidasAEnviar.push({
            codigo1: partidaActual.codigo1,
            codigo2: partidaActual.codigo2,
            codigo3: partidaActual.codigo3,
            codigo4: partidaActual.codigo4,
            codigo5: partidaActual.codigo5,
            subitem_ID: partidaActual.subitem_ID,
            item_ID: partidaActual.item_ID,
            descripcion: partidaActual.descripcion,
            um_ID: partidaActual.unidad_partida_ID,
            montaje: partidaActual.montaje,
            cantidad_contractual: partidaActual.cantidad_contractual,
            tipo_partida: partidaActual.tipo_partida_ID,
            total_mensual: partidaActual.cantidad_certificar,
            total_acum_anterior: totalCantidadCertificarAnterior,
            total_acum_presente:
              totalCantidadCertificarAnterior +
              partidaActual.cantidad_certificar,
            estimacion_mensual:
              partidaActual.cantidad_certificar * partidaActual.precio_unitario,
          });
        });
      }
      return partidasAEnviar;
    } catch (error) {
      console.log("--GET DOCUMENTOS--", error);
      return req.error(400, `Error al obtener documentos de la obra ${pi_ID}`);
    }
  });
  srv.on("getListadoAnexos", async (req) => {
    const { pi_ID, tipo_pi } = req.data;
    try {
      let anexos_existentes = await cds.run(
        SELECT.from(Anexos).where({
          pi_ID,
        })
      );
      let actas = await cds.run(
        SELECT.from(Actas).where({
          pi_ID,
        })
      );
      let actasTradicion = await cds.run(
        SELECT.from(ActasTradicion).where({
          estado_ID: "AP",
          ID: {
            in: actas.map((acta) => acta.ID),
          },
        })
      );
      let actasAdicionales = await cds.run(
        SELECT.from(ActasAdicionales).where({
          estado_ID: "AP",
          ID: {
            in: actas.map((acta) => acta.ID),
          },
        })
      );
      let actasEconomias = await cds.run(
        SELECT.from(ActasEconomias).where({
          estado_ID: "AP",
          ID: {
            in: actas.map((acta) => acta.ID),
          },
        })
      );
      let actasAmpliaciones = await cds.run(
        SELECT.from(ActasAmpliaciones).where({
          estado_ID: "AP",
          ID: {
            in: actas.map((acta) => acta.ID),
          },
        })
      );
      let actasExcedidas = await cds.run(
        SELECT.from(ActasExcedidas).where({
          estado_ID: "AP",
          ID: {
            in: actas.map((acta) => acta.ID),
          },
        })
      );
      let partesDiarios = await cds.run(
        SELECT.from(PartesDiarios).where({
          estado_ID: "AP",
          ID: {
            in: actas.map((acta) => acta.ID),
          },
        })
      );
      let actasSuspension = await cds.run(
        SELECT.from(ActasSuspension).where({
          estado_ID: "AP",
          ID: {
            in: actas.map((acta) => acta.ID),
          },
        })
      );
      let arrayBaseHastaActaMedicion = [
        {
          nro_anexo: 1,
          descripcion: "Memoria de cálculo",
          estado_ID: "PE",
          obligatorio: true,
          observaciones: "",
          tipo_anexo: "A",
        },
        {
          nro_anexo: 2,
          descripcion: "Acta de Medición",
          estado_ID: "PE",
          obligatorio: true,
          observaciones: "",
          tipo_anexo: "A",
        },
        {
          nro_anexo: 3,
          descripcion: "Certificado",
          estado_ID: "PE",
          obligatorio: true,
          observaciones: "",
          tipo_anexo: "A",
        },
        {
          nro_anexo: 1,
          descripcion:
            "R-OBR- 023 Listado del Personal del Contratista y Subcontratista asignado a la Obra.",
          estado_ID: "PE",
          obligatorio: true,
          observaciones: "",
          tipo_anexo: "B",
          acopio: "N/A",
        },
        {
          nro_anexo: 2,
          descripcion:
            "Copia de recibos de haberes firmados por el trabajador (constancia de pago de las remuneraciones) de la 1ra y 2da quincena en relación al mes del F9",
          estado_ID: "PE",
          obligatorio: true,
          observaciones: "",
          tipo_anexo: "B",
          acopio: "N/A",
        },
        {
          nro_anexo: 3,
          descripcion:
            "Copia del F931 AFIP (del mes anterior al mes de Certificación",
          estado_ID: "PE",
          obligatorio: true,
          observaciones: "",
          tipo_anexo: "B",
        },
        {
          nro_anexo: 4,
          descripcion:
            "Acuse de Recibo de la Declaración Jurada y Constancia de Pago con sello del banco (del punto 3) y copia impresión de la “Nomina de Empleados” AFIP (del mismo mes del F931).",
          estado_ID: "PE",
          obligatorio: true,
          observaciones: "",
          tipo_anexo: "B",
        },
        {
          nro_anexo: 5,
          descripcion: "Copia Plan de Pago 'Mis Facilidades'.",
          estado_ID: "PE",
          obligatorio: true,
          observaciones: "",
          tipo_anexo: "B",
        },
        {
          nro_anexo: 6,
          descripcion: "Acuse Recibo de la Declaración Jurada (del punto 5).",
          estado_ID: "PE",
          obligatorio: true,
          observaciones: "",
          tipo_anexo: "B",
        },
        {
          nro_anexo: 7,
          descripcion:
            "Detalle de las obligaciones regularizadas y detalle del plan de pago (del punto 5)",
          estado_ID: "PE",
          obligatorio: true,
          observaciones: "",
          tipo_anexo: "B",
        },
        {
          nro_anexo: 8,
          descripcion:
            "Copia del Certificado de ART con nómina del personal cubierto por el Seguro de Riesgos de Trabajo, cláusula de no repetición a favor de AySA SA. Deberá acreditarse el pago del Seguro de Riesgo de Trabajo mediante Volante Electrónico de Pago (VEP) de la AFIP, acompañado de su comprobante de pago.",
          estado_ID: "PE",
          obligatorio: true,
          observaciones: "",
          tipo_anexo: "B",
          acopio: "N/A",
        },
        {
          nro_anexo: 9,
          descripcion:
            "Copia del Certificado de Seguro de Vida Obligatorio Dto. 1567/74 con nómina del personal. Deberá acreditarse el pago del Seguro de Vida Obligatorio mediante Volante Electrónico de Pago (VEP) de la AFIP, acompañado de su comprobante de pago",
          estado_ID: "PE",
          obligatorio: true,
          observaciones: "",
          tipo_anexo: "B",
          acopio: "N/A",
        },
        {
          nro_anexo: 10,
          descripcion:
            "Copia de la Constancia de Pago de UOCRA, IERIC y Fondo de Desempleo en relación al mes del F93",
          estado_ID: "PE",
          obligatorio: true,
          observaciones: "",
          tipo_anexo: "B",
          acopio: "N/A",
        },
        {
          nro_anexo: 11,
          descripcion:
            "Copia del formulario 'CONTROL DE POLIZAS de SEGUROS' vigente, emitido por la Gcia. de Administración de Riesgos de la Dirección Económico Financiera de AYSA S.A. que incluya las Pólizas definidas como obligatorias en el Acta de Preconstrucción de la obra.",
          estado_ID: "PE",
          obligatorio: true,
          observaciones: "",
          tipo_anexo: "B",
          acopio: "N/A",
        },
        {
          nro_anexo: 12,
          descripcion:
            "Copia de Constancia de Cuenta Corriente Bancaria emitida y firmada por el Banco.",
          estado_ID: "PE",
          obligatorio: true,
          observaciones: "",
          tipo_anexo: "B",
        },
        {
          nro_anexo: 13,
          descripcion:
            "Copia de la autorización de AySA para la utilización de cada una de las empresas subcontratistas en obra",
          estado_ID: "PE",
          obligatorio: true,
          observaciones: "",
          tipo_anexo: "B",
          acopio: "N/A",
        },
        {
          nro_anexo: 14,
          descripcion:
            "Copia de la Inscripción del Contrato del representante técnico en el Colegio de Ing. Pcia. Bs.As.",
          estado_ID: "PE",
          obligatorio: true,
          observaciones: "",
          tipo_anexo: "B",
        },
        {
          nro_anexo: 15,
          descripcion:
            "Copia de todas las constancias de pago de la BOLETA de APORTES, a la Caja de Previsión Social - Ley 12490- del Representante Técnico",
          estado_ID: "PE",
          obligatorio: true,
          observaciones: "",
          tipo_anexo: "B",
        },
      ];
      let nro = 4;
      if (tipo_pi == "RE") {
        arrayBaseHastaActaMedicion.push({
          nro_anexo: 4,
          descripcion: "Diagrama de cuadra",
          estado_ID: "PE",
          observaciones: "",
          tipo_anexo: "A",
        });
        nro += 1;
      }
      if (actasTradicion) {
        actasTradicion.forEach((acta) => {
          arrayBaseHastaActaMedicion.push({
            nro_anexo: nro,
            descripcion: "Acta de Tradición Nº" + acta.nro_acta,
            estado_ID: "PE",
            obligatorio: true,
            observaciones: "",
            tipo_anexo: "A",
          });
          nro += 1;
        });
      }
      if (actasAdicionales) {
        actasAdicionales.forEach((acta) => {
          arrayBaseHastaActaMedicion.push({
            nro_anexo: nro,
            descripcion: "Acta de adicionales Nº" + acta.nro_acta,
            estado_ID: "PE",
            obligatorio: true,
            observaciones: "",
            tipo_anexo: "A",
          });
          nro += 1;
        });
      }
      if (actasEconomias) {
        actasEconomias.forEach((acta) => {
          arrayBaseHastaActaMedicion.push({
            nro: nro,
            descripcion: "Acta de economías Nº" + acta.nro_acta,
            estado_ID: "PE",
            obligatorio: true,
            observaciones: "",
            tipo_anexo: "A",
          });
          nro += 1;
        });
      }
      if (actasExcedidas) {
        actasExcedidas.forEach((acta) => {
          arrayBaseHastaActaMedicion.push({
            nro_anexo: nro,
            descripcion: "Acta de excedidas Nº" + acta.nro_acta,
            estado_ID: "PE",
            obligatorio: true,
            observaciones: "",
            tipo_anexo: "A",
          });
          nro += 1;
        });
      }
      if (actasAmpliaciones) {
        actasAmpliaciones.forEach((acta) => {
          arrayBaseHastaActaMedicion.push({
            nro_anexo: nro,
            descripcion: "Acta de ampliaciones Nº" + acta.nro_acta,
            estado_ID: "PE",
            obligatorio: true,
            observaciones: "",
            tipo_anexo: "A",
          });
          nro += 1;
        });
      }
      if (actasSuspension) {
        actasSuspension.forEach((acta) => {
          arrayBaseHastaActaMedicion.push({
            nro_anexo: nro,
            descripcion: "Acta de suspensión Nº" + acta.nro_acta,
            estado_ID: "PE",
            obligatorio: true,
            observaciones: "",
            tipo_anexo: "A",
          });
          nro += 1;
        });
      }
      if (partesDiarios) {
        partesDiarios.forEach((acta) => {
          arrayBaseHastaActaMedicion.push({
            nro_anexo: nro,
            descripcion: "Acta de suspensión Nº" + acta.nro_parte,
            estado_ID: "PE",
            obligatorio: true,
            observaciones: "",
            tipo_anexo: "A",
          });
          nro += 1;
        });
      }

      anexos_existentes.forEach((anexo) => {
        const anexoExistente = arrayBaseHastaActaMedicion.find(
          (anexoAEnviar) =>
            anexoAEnviar.nro === anexo.nro_anexo &&
            anexoAEnviar.tipo_anexo === anexo.tipo_anexo
        );

        if (anexoExistente) {
          anexoExistente.estado_ID = anexo.estado_ID;
          anexoExistente.ruta = anexo.ruta;
        } else {
          arrayBaseHastaActaMedicion.push(anexo);
        }
      });

      return arrayBaseHastaActaMedicion;
    } catch (error) {
      console.log("--GET DOCUMENTOS--", error);
      return req.error(
        400,
        `Error al obtener documentos de la obra ${obra_ID}`
      );
    }
  });

  srv.on("getPartidimetroDetalleByObraPI", async (req) => {
    const { p3_ID, pi } = req.data;
    try {
      const oObraPi = await cds.run(
        SELECT.one.from(ObraPI).where({ p3_ID, pi })
      );
      if (!oObraPi) {
        return [];
      }

      const oPartidimetro = await cds.run(
        SELECT.one
          .from(Partidimetros)
          .where({ pi_ID: oObraPi.ID, estado_ID: "AP" })
          .orderBy({ nro_partidimetro: "desc" })
      );

      if (!oPartidimetro) {
        return [];
      }

      return await cds.run(
        SELECT.from(DetallePartidimetro).where({
          partidimetro_ID: oPartidimetro.ID,
        })
      );
    } catch (error) {
      console.log("--GET PARTIDIMETRO DETALLE--", error);
      return req.error(
        400,
        `Error al obtener datos para la obra ${obra_ID} y pi ${pi}`
      );
    }
  });

  srv.on("getObrasByContratista", async (req) => {
    const { usuario } = req.data;
    try {
      const aRepresentates = await cds.run(
        SELECT.from(Representantes).where({ usuario })
      );
      if (!aRepresentates.length) {
        return [];
      }

      const aContratistasObra = await cds.run(
        SELECT.from(ContratistaObra).where({
          contratista_ID: {
            in: aRepresentates.map(
              (representate) => representate.contratista_ID
            ),
          },
        })
      );

      if (!aContratistasObra.length) {
        return [];
      }

      const fechaActual = new Date().toISOString().split("T")[0];

      // Filtra los objetos que están dentro de vigencia
      const contratistasVigentes = aContratistasObra.filter((objeto) => {
        const vigenciaDesde = objeto.vigencia_desde;
        const vigenciaHasta = objeto.vigencia_hasta;
        if (fechaActual >= vigenciaDesde && fechaActual <= vigenciaHasta)
          return objeto;
      });

      if (!aContratistasObra.length) {
        return [];
      }
      return await cds.run(
        SELECT.from(Obras)
          .where({
            ID: {
              in: aContratistasObra.map((representate) => representate.obra_ID),
            },
          })
          .orderBy({ ref: ["nombre"], sort: "asc" })
      );
    } catch (error) {
      console.log("--GET OBRAS CONTRATISTA--", error);
      return req.error(400, `Error al obtener el usuario ${usuario}`);
    }
  });

  srv.on("getObrasByInspector", async (req) => {
    const { usuario, tipo_inspector: tipo_inspector_ID } = req.data;
    try {
      const aInspectores = await cds.run(
        SELECT.from(Inspectores).where({ usuario, tipo_inspector_ID })
      );
      if (!aInspectores.length) {
        return [];
      }
      const aInspectoresResponsables = await cds.run(
        SELECT.from(InspectoresResponsables).where({
          inspector_ID: { in: aInspectores.map((inspector) => inspector.ID) },
        })
      );
      if (!aInspectoresResponsables.length) {
        return [];
      }
      const aResponsables = await cds.run(
        SELECT.from(Responsables).where({
          ID: {
            in: aInspectoresResponsables.map(
              (inspector) => inspector.responsable_ID
            ),
          },
        })
      );
      if (!aResponsables.length) {
        return [];
      }

      return await cds.run(
        SELECT.from(Obras)
          .where({
            ID: {
              in: aResponsables.map((representate) => representate.obra_ID),
            },
          })
          .orderBy({ ref: ["nombre"], sort: "asc" })
      );
    } catch (error) {
      console.log("--GET OBRAS INSPECTOR--", error);
      return req.error(400, `Error al obtener el usuario ${usuario}`);
    }
  });
  srv.on("getPIByInspector", async (req) => {
    const { usuario, tipo_inspector: tipo_inspector_ID, obra_ID } = req.data;
    try {
      const aInspectores = await cds.run(
        SELECT.from(Inspectores).where({ usuario, tipo_inspector_ID })
      );

      if (!aInspectores.length) {
        return [];
      }
      const aInspectoresResponsables = await cds.run(
        SELECT.from(InspectoresResponsables).where({
          inspector_ID: { in: aInspectores.map((inspector) => inspector.ID) },
        })
      );
      if (!aInspectoresResponsables.length) {
        return [];
      }

      const aResponsablesGeneral = await cds.run(
        SELECT.from(Responsables).where({
          ID: {
            in: aInspectoresResponsables.map(
              (inspector) => inspector.responsable_ID
            ),
          },
        })
      );
      if (!aResponsablesGeneral.length) {
        return [];
      }
      let responsablesPI = await cds.run(
        SELECT.from(ResponsablesPI).where({
          responsables_ID: {
            in: aResponsablesGeneral.map((responsablesPI) => responsablesPI.ID),
          },
        })
      );
      if (obra_ID != "00000000-0000-0000-0000-000000000000") {
        const aP3 = await cds.run(SELECT.from(P3).where({ obra_ID }));
        return await cds.run(
          SELECT.from("ObraPI").where({
            ID: { in: responsablesPI.map((responsable) => responsable.pi_ID) },
            p3_ID: { in: aP3.map((p3) => p3.ID) },
          })
        );
      }
      return await cds.run(
        SELECT.from("ObraPI").where({
          ID: { in: responsablesPI.map((responsable) => responsable.pi_ID) },
        })
      );
    } catch (error) {
      console.log("--GET PI's INSPECTOR--", error);
      return req.error(400, `Error al obtener el usuario ${usuario}`);
    }
  });

  srv.on("getLastOrden", async (req) => {
    const { pi_ID, p3, especialidad, tipo, contratista } = req.data;
    try {
      const [oPresentacion] = await cds.run(`SELECT MAX(PLANOS.ORDEN) AS COUNT
                                        FROM COM_AYSA_PGO_PRESENTACIONES AS PRESENTACIONES
                                        INNER JOIN COM_AYSA_PGO_PLANOS AS PLANOS 
                                        ON PRESENTACIONES.ID = PLANOS.PRESENTACION_ID 
                                        WHERE PRESENTACIONES.PI_ID  = '${pi_ID}'
                                        AND PLANOS.P3 = '${p3}'
                                        AND PLANOS.ESPECIALIDAD_ID = '${especialidad}'
                                        AND PLANOS.TIPO_ID = '${tipo}'
                                        AND PLANOS.CONTRATISTA_ID = '${contratista}'`);

      return oPresentacion.COUNT + 1;
    } catch (error) {
      console.log("--MAX ORDEN--", error);
      return req.error(400, `Error al obtener datos`);
    }
  });

  srv.on("getLastRevision", async (req) => {
    const { pi_ID, p3, especialidad, tipo, contratista, orden } = req.data;
    try {
      const [oPresentacion] =
        await cds.run(`SELECT MAX(PLANOS.REVISION) AS COUNT
                                        FROM COM_AYSA_PGO_PRESENTACIONES AS PRESENTACIONES
                                        INNER JOIN COM_AYSA_PGO_PLANOS AS PLANOS 
                                        ON PRESENTACIONES.ID = PLANOS.PRESENTACION_ID 
                                        WHERE PRESENTACIONES.PI_ID  = '${pi_ID}'
                                        AND PLANOS.P3 = '${p3}'
                                        AND PLANOS.ESPECIALIDAD_ID = '${especialidad}'
                                        AND PLANOS.TIPO_ID = '${tipo}'
                                        AND PLANOS.CONTRATISTA_ID = '${contratista}'
                                        AND PLANOS.ORDEN = '${orden}'`);

      return oPresentacion.COUNT + 1;
    } catch (error) {
      console.log("--MAX REVISION--", error);
      return req.error(400, `Error al obtener datos`);
    }
  });

  srv.before(["CREATE"], "AcopiosMateriales", async (req) => {
    const { pi_ID } = req.data;
    try {
      const aAcopios = await cds.run(
        SELECT.from(AcopiosMateriales).where({ pi_ID, estado_ID: "AP" })
      );

      const acumulado = aAcopios.reduce(
        (accumulator, item) => {
          accumulator.porcentaje_acumulado =
            accumulator.porcentaje_acumulado + Number(item.porcentaje_acopio);
          accumulator.monto_acumulado =
            accumulator.monto_acumulado + Number(item.monto);
          return accumulator;
        },
        { porcentaje_acumulado: 0, monto_acumulado: 0 }
      );

      req.data.porcentaje_acumulado =
        acumulado.porcentaje_acumulado + req.data.porcentaje_acopio
          ? Number(req.data.porcentaje_acopio)
          : 0;
      req.data.monto_acumulado =
        acumulado.monto_acumulado + Number(req.data.monto);

      const [oData] = await cds.run(`SELECT MAX(NRO_ACOPIO) AS COUNT 
                                        FROM COM_AYSA_PGO_ACOPIOSMATERIALES 
                                        WHERE PI_ID = '${pi_ID}'`);

      req.data.nro_acopio = oData.COUNT + 1;
    } catch (error) {
      console.log("--CREATE ACOPIO MATERIALES--", error);
      return req.error(400, `Error calcular porcentaje acumulado`);
    }
  });

  srv.before(["CREATE"], "PresentacionesSH", async (req) => {
    const { obra_ID, grupo_ID } = req.data;
    try {
      const [oData] = await cds.run(`SELECT MAX(NRO_PRESENTACION) AS COUNT 
                                        FROM COM_AYSA_PGO_PRESENTACIONESSH 
                                        WHERE OBRA_ID  = '${obra_ID}'
                                          AND GRUPO_ID = '${grupo_ID}'`);

      req.data.nro_presentacion = oData.COUNT + 1;
    } catch (error) {
      console.log("--CREATE PRESENTACION SH--", error);
      return req.error(400, `Error al obtener datos`);
    }
  });

  srv.before(["CREATE"], "Adendas", async (req) => {
    const { pi_ID } = req.data;
    try {
      const [oData] = await cds.run(`SELECT MAX(NRO_ADENDA) AS COUNT 
                                        FROM COM_AYSA_PGO_ADENDAS 
                                        WHERE PI_ID  = '${pi_ID}'`);

      req.data.nro_adenda = oData.COUNT + 1;
    } catch (error) {
      console.log("--CREATE ADENDA--", error);
      return req.error(400, `Error al obtener datos`);
    }
  });

  srv.before(["CREATE"], "ActasMedicion", async (req) => {
    const { pi_ID } = req.data;
    try {
      const [oData] = await cds.run(`SELECT MAX(NRO_ACTA) AS COUNT 
                                        FROM COM_AYSA_PGO_ACTASMEDICION 
                                        WHERE PI_ID  = '${pi_ID}'`);

      req.data.nro_acta = oData.COUNT + 1;
    } catch (error) {
      console.log("--CREATE Actas Medicion --", error);
      return req.error(400, `Error al obtener datos`);
    }
  });

  srv.before(["CREATE"], "ActasPartidasNegativas", async (req) => {
    const { pi_ID } = req.data;
    try {
      const [oData] = await cds.run(`SELECT MAX(NRO_ACTA) AS COUNT 
                                        FROM COM_AYSA_PGO_ACTASPARTIDASNEGATIVAS 
                                        WHERE PI_ID  = '${pi_ID}'`);

      req.data.nro_acta = oData.COUNT + 1;
    } catch (error) {
      console.log("--CREATE Actas Medicion --", error);
      return req.error(400, `Error al obtener datos`);
    }
  });

  srv.before(["CREATE"], "MemoriaCalculoEL", async (req) => {
    const { pi_ID } = req.data;
    try {
      const [oData] = await cds.run(`SELECT MAX(NRO_MEMORIA_CALCULO) AS COUNT 
                                        FROM COM_AYSA_PGO_MEMORIACALCULOEL 
                                        WHERE PI_ID  = '${pi_ID}'`);

      req.data.nro_memoria_calculo = oData.COUNT + 1;
    } catch (error) {
      console.log("--CREATE MemoriaCalculoEL--", error);
      return req.error(400, `Error al obtener datos`);
    }
  });

  srv.before(["CREATE"], "MemoriaCalculo", async (req) => {
    const { obra_ID } = req.data;
    try {
      const [oData] = await cds.run(`SELECT MAX(NRO_MEMORIA_CALCULO) AS COUNT 
                                        FROM COM_AYSA_PGO_MEMORIACALCULO 
                                        WHERE OBRA_ID  = '${obra_ID}'`);

      req.data.nro_memoria_calculo = oData.COUNT + 1;
    } catch (error) {
      console.log("--CREATE MemoriaCalculo--", error);
      return req.error(400, `Error al obtener datos`);
    }
  });

  srv.before(["CREATE"], "InspeccionesSeguridadHigiene", async (req) => {
    const { pi_ID } = req.data;
    try {
      const [oData] = await cds.run(`SELECT MAX(NRO_INSPECCION) AS COUNT 
                                        FROM COM_AYSA_PGO_INSPECCIONESSEGURIDADHIGIENE 
                                        WHERE PI_ID  = '${pi_ID}'`);

      req.data.nro_inspeccion = oData.COUNT + 1;
    } catch (error) {
      console.log("--CREATE InspeccionesSeguridadHigiene--", error);
      return req.error(400, `Error al obtener datos`);
    }
  });

  srv.before(["CREATE"], "PlanosInterferencias", async (req) => {
    const { pi_ID } = req.data;
    try {
      const [oData] = await cds.run(`SELECT MAX(NRO_PLANO) AS COUNT 
                                        FROM COM_AYSA_PGO_PLANOSINTERFERENCIAS 
                                        WHERE PI_ID  = '${pi_ID}'`);

      req.data.nro_plano = oData.COUNT + 1;
    } catch (error) {
      console.log("--CREATE PLANOS INTERFERENCIAS--", error);
      return req.error(400, `Error al obtener datos`);
    }
  });
  /*
  srv.before(["CREATE"], "AcopiosMateriales", async (req) => {
    const { pi_ID } = req.data;
    try {
      const [oData] = await cds.run(`SELECT MAX(NRO_ACOPIO) AS COUNT 
                                        FROM COM_AYSA_PGO_ACOPIOSMATERIALES 
                                        WHERE PI_ID = '${pi_ID}'`);

      req.data.nro_acopio = oData.COUNT + 1;
    } catch (error) {
      console.log("--CREATE ACOPIOS MATERIALES--", error);
      return req.error(400, `Error al obtener datos`);
    }
  });
*/
  srv.before(["CREATE"], "ProgramasCateos", async (req) => {
    const { pi_ID } = req.data;
    try {
      const [oData] = await cds.run(`SELECT MAX(NRO_PROGRAMA) AS COUNT 
                                        FROM COM_AYSA_PGO_PROGRAMASCATEOS 
                                        WHERE PI_ID  = '${pi_ID}'`);

      req.data.nro_programa = oData.COUNT + 1;
    } catch (error) {
      console.log("--CREATE PROGRAMAS CATEOS--", error);
      return req.error(400, `Error al obtener datos`);
    }
  });

  srv.before(["CREATE"], "InformesCateo", async (req) => {
    const { pi_ID } = req.data;
    try {
      const [oData] = await cds.run(`SELECT MAX(NRO_INFORME) AS COUNT 
                                        FROM COM_AYSA_PGO_INFORMESCATEO 
                                        WHERE PI_ID  = '${pi_ID}'`);

      req.data.nro_informe = oData.COUNT + 1;
    } catch (error) {
      console.log("--CREATE INFORMES CATEO--", error);
      return req.error(400, `Error al obtener datos`);
    }
  });

  srv.before(["CREATE"], "OrdenesServicio", async (req) => {
    const { pi_ID } = req.data;
    try {
      const [oData] = await cds.run(`SELECT MAX(NRO_ORDEN_SERVICIO) AS COUNT 
                                        FROM COM_AYSA_PGO_ORDENESSERVICIO 
                                        WHERE PI_ID  = '${pi_ID}'`);

      req.data.nro_orden_servicio = oData.COUNT + 1;
    } catch (error) {
      console.log("--CREATE ORDEN SERVICIO--", error);
      return req.error(400, `Error al obtener datos`);
    }
  });

  srv.on(["READ"], "PlanesTrabajo", async (req, next) => {
    try {
      const oData = await next();

      if (!oData.tareas) {
        return oData;
      }

      const aObraPi = await cds.run(
        SELECT.from(ObraPI).where({
          ID: {
            in: oData.tareas
              .filter((tarea) => tarea)
              .map((tarea) => tarea.pi_ID),
          },
        })
      );
      if (!aObraPi.length) {
        return oData;
      }

      const aPartidimetro = await cds.run(
        SELECT.from(Partidimetros)
          .where({
            pi_ID: { in: aObraPi.map((item) => item.ID) },
            estado_ID: "AP",
          })
          .orderBy({ nro_partidimetro: "desc" })
      );

      if (!aPartidimetro.length) {
        return oData;
      }

      const aDetallePartidas = await cds.run(
        SELECT.from(DetallePartidimetro).where({
          partidimetro_ID: { in: aPartidimetro.map((item) => item.ID) },
        })
      );

      const tareas = oData.tareas.map((tarea) => {
        if (!tarea.codigo) {
          return tarea;
        }

        const oFindPI = aObraPi.find((obra) => obra.ID === tarea.pi_ID);
        if (!oFindPI) {
          return tarea;
        }

        const oFindPartida = aPartidimetro.find(
          (partida) => partida.pi_ID === oFindPI.ID
        );
        if (!oFindPartida) {
          return tarea;
        }

        const oFind = aDetallePartidas.find((detalle) => {
          const sCodigo = `${detalle.codigo1}-${detalle.codigo2}-${detalle.codigo3}-${detalle.codigo4}-${detalle.codigo5}`;
          //Tuve que hacer esta negrada pq el back no reconoce el replaceAll
          const codSplit = sCodigo
            .split("-")
            .filter((item) => item !== "null")
            .join("-");

          return (
            detalle.partidimetro_ID === oFindPartida.ID &&
            codSplit == tarea.codigo
          );
        });

        if (!oFind) {
          return tarea;
        }

        return { ...tarea, cantidadpartida: oFind.cantidad || null };
      });

      return { ...oData, tareas };
    } catch (error) {
      console.log("--PlanesTrabajo--", error);
      return req.error(400, `Error al obtener datos`);
    }
  });

  srv.before(["CREATE"], "PlanesTrabajo", async (req) => {
    const { obra_ID, codigo_ID, nro_plan } = req.data;
    try {
      if (!codigo_ID) {
        const [oData] = await cds.run(`SELECT MAX(NRO_PLAN) AS COUNT 
                                          FROM COM_AYSA_PGO_PLANESTRABAJO 
                                          WHERE OBRA_ID  = '${obra_ID}'`);
        req.data.nro_plan = oData.COUNT + 1;
      }
      if (codigo_ID) {
        const [oData] = await cds.run(`SELECT MAX(SUBNRO) AS COUNT 
                                          FROM COM_AYSA_PGO_PLANESTRABAJO 
                                          WHERE OBRA_ID  = '${obra_ID}' AND NRO_PLAN = '${nro_plan}'`);
        req.data.subnro = oData.COUNT + 1;
      }
    } catch (error) {
      console.log("--CREATE PLAN TRABAJO--", error);
      return req.error(400, `Error al obtener datos`);
    }
  });

  srv.after(["UPDATE"], "AprobadoresPlanDeTrabajo", async (req, param) => {
    const { ID } = req;
    try {
      const { plan_trabajo_ID } = await cds.run(
        SELECT.one.from(AprobadoresPlanDeTrabajo).where({ ID })
      );

      const aprobadores = await cds.run(
        SELECT.from(AprobadoresPlanDeTrabajo).where({ plan_trabajo_ID })
      );

      let aprIncomplete =
        aprobadores.some((apr) => {
          return apr.decision_ID === null;
        }) || false;

      if (!aprIncomplete) {
        let aResp = [];
        for (let item of aprobadores) {
          if (aResp.indexOf(item.decision_ID) < 0) {
            aResp.push(item.decision_ID);
          }
        }

        let estado = aResp.length > 1 ? "APP" : aResp[0];

        cds.run(
          UPDATE(PlanesTrabajo)
            .data({
              estado_ID: estado,
            })
            .where({ ID: plan_trabajo_ID })
        );
      }
    } catch (err) {
      return err;
    }
  });

  srv.before(["CREATE"], "Presentaciones", async (req) => {
    const { pi_ID } = req.data;
    try {
      const [oData] = await cds.run(`SELECT MAX(NRO_PRESENTACION) AS COUNT 
                                        FROM COM_AYSA_PGO_PRESENTACIONES 
                                        WHERE PI_ID  = '${pi_ID}'`);

      req.data.nro_presentacion = oData.COUNT + 1;
    } catch (error) {
      console.log("--CREATE nro_presentacion--", error);
      return req.error(400, `Error al obtener datos`);
    }
  });

  srv.before(["CREATE"], "NotasPedido", async (req) => {
    const { pi_ID } = req.data;
    try {
      const [oData] = await cds.run(`SELECT MAX(NRO_NOTA_PEDIDO) AS COUNT 
                                        FROM COM_AYSA_PGO_NOTASPEDIDO 
                                        WHERE PI_ID  = '${pi_ID}'`);

      req.data.nro_nota_pedido = oData.COUNT + 1;
    } catch (error) {
      console.log("--CREATE ORDEN SERVICIO--", error);
      return req.error(400, `Error al obtener datos`);
    }
  });

  srv.before(["CREATE"], "Partidimetros", async (req) => {
    const { pi_ID } = req.data;
    try {
      const [oData] = await cds.run(`SELECT MAX(NRO_PARTIDIMETRO) AS COUNT 
                                        FROM COM_AYSA_PGO_PARTIDIMETROS 
                                        WHERE PI_ID = '${pi_ID}'`);

      req.data.nro_partidimetro = oData.COUNT + 1;
    } catch (error) {
      console.log("--CREATE PARTIDIMETRO--", error);
      return req.error(400, `Error al obtener cantidades para el pi ${pi_ID}`);
    }
  });

  srv.before(["CREATE"], "AnalisisPrecios", async (req) => {
    const { partida_ID } = req.data;
    try {
      const [oData] = await cds.run(`SELECT MAX(NRO_APU) AS COUNT 
                                        FROM COM_AYSA_PGO_ANALISISPRECIOS 
                                        WHERE PARTIDA_ID = '${partida_ID}'`);

      req.data.nro_apu = oData.COUNT + 1;
    } catch (error) {
      console.log("--CREATE ANALISIS PRECIOS--", error);
      return req.error(400, `Error al obtener nro maximo APU ${partida_ID}`);
    }
  });

  srv.on("validatePIPorveedor", async (req) => {
    const { proyecto_inversion, nro_proveedor } = req.data;
    try {
      const oOrdenExist = await cds.run(
        SELECT.one
          .from(OrdenesCompra)
          .where({ proyecto_inversion, nro_proveedor })
      );
      return oOrdenExist || {};
    } catch (error) {
      return req.error(
        400,
        `Error al obtener el proyecto de inversion ${proyecto_inversion} para el nro de proveedor ${nro_proveedor}`
      );
    }
  });

  srv.before(["UPDATE"], async (req) => {
    //return req;
    try {
      const tabla = req.entity.slice(15);
      const aKeys = Object.keys(req.data).filter((item) => item !== "ID");
      const oDataInput = req.data;
      const clave_objeto = await getClaveObjeto(tabla, oDataInput);
      const query = req.query.UPDATE.entity.ref;

      const oData = await getDataFromTable(query, tabla);
      if (!oData) {
        return req;
      }

      const oDocumentoModificacionCabecera = getDataToInsert(
        aKeys,
        clave_objeto,
        oData,
        oDataInput,
        tabla
      );
      if (!oDocumentoModificacionCabecera.posicion.length) {
        return req;
      }

      await cds.run(
        INSERT.into(DocumentoModificacionCabecera).entries(
          oDocumentoModificacionCabecera
        )
      );

      return req;
    } catch (error) {
      console.log(error);
      return req;
    }
  });

  srv.after(["CREATE"], async (req, param) => {
    try {
      const tabla = param.entity.slice(15);
      const clave_objeto = await getClaveObjeto(tabla, req);

      const oHeader = {
        tabla,
        clave_objeto,
        accion_ID: "I",
      };

      await cds.run(
        INSERT.into(DocumentoModificacionCabecera).entries(oHeader)
      );

      return req;
    } catch (error) {
      console.log(error);
      return req;
    }
  });

  srv.before(["DELETE"], async (req) => {
    //return req;
    try {
      const tabla = req.entity.slice(15);
      const clave_objeto = await getClaveObjeto(tabla, req.data);

      const oHeader = {
        tabla,
        clave_objeto,
        accion_ID: "D",
      };

      await cds.run(
        INSERT.into(DocumentoModificacionCabecera).entries(oHeader)
      );

      return req;
    } catch (error) {
      console.log(error);
      return req;
    }
  });

  const getClaveObjeto = async (tabla, data) => {
    const catalog = await cds.connect.to("CatalogService");
    const currentEntity = catalog.entities[tabla];

    const tableKeys = Object.keys(currentEntity.keys).filter(
      (item) =>
        (currentEntity.keys[item].type === "cds.UUID" ||
          currentEntity.keys[item].type === "cds.String") &&
        currentEntity.keys[item].key
    );

    return tableKeys.map((item) => data[item]).join(";");
  };

  const getDataFromTable = async (aWhereCondition, tabla) => {
    if (tabla === "Obras") {
      const oQuery = {
        SELECT: {
          from: {
            ref: aWhereCondition,
          },
          columns: [
            "*",
            { ref: ["inspectores"], expand: ["*"] },
            { ref: ["pi"], expand: ["*"] },
          ],
          one: true,
        },
      };

      return await cds.run(oQuery);
    }

    const oQuery = {
      SELECT: {
        from: {
          ref: aWhereCondition,
        },
        one: true,
      },
    };

    return await cds.run(oQuery);
  };

  const getDataToInsert = (aKeys, clave_objeto, oData, oDataInput, tabla) => {
    if (tabla === "Obras") {
      let aPosiciones = [];

      for (const oObject of oDataInput.inspectores) {
        const oFind = oData.inspectores.find(
          (item) => item.inspector_ID === oObject.inspector_ID
        );
        if (!oFind) {
          aPosiciones.push({
            campo: "inspector_ID",
            valor_nuevo: oObject.inspector_ID?.toString(),
          });
        }
      }

      for (const oObject of oDataInput.pi) {
        const oFind = oData.pi.find((item) => item.ID === oObject.ID);
        if (!oFind) {
          aPosiciones.push({
            campo: "pi",
            valor_nuevo: oObject.ID?.toString(),
          });
        }
      }

      for (const oObject of aKeys) {
        if (Array.isArray(oDataInput[oObject])) {
          continue;
        }

        if (oData[oObject] === oDataInput[oObject]) {
          continue;
        }

        aPosiciones.push({
          campo: oObject,
          valor_anterior: oData[oObject]?.toString(),
          valor_nuevo: oDataInput[oObject]?.toString(),
        });
      }

      return {
        tabla,
        clave_objeto,
        accion_ID: "U",
        posicion: aPosiciones,
      };
    }

    return {
      tabla,
      clave_objeto,
      accion_ID: "U",
      posicion: aKeys
        .filter(
          (item) =>
            oData[item] !== oDataInput[item] && !Array.isArray(oDataInput[item])
        )
        .map((item) => ({
          campo: item,
          valor_anterior: oData[item]?.toString(),
          valor_nuevo: oDataInput[item]?.toString(),
        })),
    };
  };
  srv.before(["CREATE"], "DiagramasCuadra", async (req) => {
    const { tramo_ID } = req.data;
    try {
      const [oData] = await cds.run(`SELECT MAX(NRO_DIAGRAMA) AS COUNT 
                                        FROM COM_AYSA_PGO_DIAGRAMASCUADRA 
                                        WHERE TRAMO_ID = '${tramo_ID}'`);

      req.data.nro_diagrama = oData.COUNT + 1;
    } catch (error) {
      console.log("--CREATE DiagramasCuadra--", error);
      return req.error(
        400,
        `Error al obtener nro maximo DiagramasCuadra ${tramo_ID}`
      );
    }
  });

  srv.before(["CREATE"], "Actas", async (req) => {
    const { tipo_acta_ID } = req.data;

    try {
      if (
        tipo_acta_ID == "SU" &&
        req.data.acta_suspension.tipo_acta_ID == "IN"
      ) {
        const [oData] = await cds.run(`SELECT MAX(A.NRO_ACTA) AS COUNT
        FROM COM_AYSA_PGO_ACTASSUSPENSION AS A
        JOIN COM_AYSA_PGO_ACTAS AS ACT ON ACT.ID = A.ACTA_ID
        WHERE ACT.TIPO_ACTA_ID = 'SU'
          AND ACT.PI_ID = '${req.data.pi_ID}' AND A.TIPO_ACTA_ID = 'IN'`);

        req.data.acta_suspension.nro_acta = oData.COUNT + 1;
      }
      if (
        tipo_acta_ID == "SU" &&
        req.data.acta_suspension.tipo_acta_ID == "FI"
      ) {
        const [oData] = await cds.run(`SELECT MAX(A.NRO_ACTA) AS COUNT
        FROM COM_AYSA_PGO_ACTASSUSPENSION AS A
        JOIN COM_AYSA_PGO_ACTAS AS ACT ON ACT.ID = A.ACTA_ID
        WHERE ACT.TIPO_ACTA_ID = 'SU'
          AND ACT.PI_ID = '${req.data.pi_ID}' AND A.TIPO_ACTA_ID = 'FI'`);

        req.data.acta_suspension.nro_acta = oData.COUNT + 1;
      }
      if (tipo_acta_ID == "PR") {
        const [oData] = await cds.run(`SELECT MAX(A.NRO_ACTA) AS COUNT
        FROM COM_AYSA_PGO_ACTASPRORROGAPLAZOS AS A
        JOIN COM_AYSA_PGO_ACTAS AS ACT ON ACT.ID = A.ACTA_ID
        WHERE ACT.TIPO_ACTA_ID = 'PR'
          AND ACT.PI_ID = '${req.data.pi_ID}'`);

        req.data.acta_prorroga_plazos.nro_acta = oData.COUNT + 1;
      }
      if (tipo_acta_ID == "AM") {
        const [oData] = await cds.run(`SELECT MAX(A.NRO_ACTA) AS COUNT
        FROM COM_AYSA_PGO_ACTASAMPLIACIONES AS A
        JOIN COM_AYSA_PGO_ACTAS AS ACT ON ACT.ID = A.ACTA_ID
        WHERE ACT.TIPO_ACTA_ID = 'AM'
          AND ACT.PI_ID = '${req.data.pi_ID}'`);

        req.data.acta_ampliacion[0].nro_acta = oData.COUNT + 1;
      }

      if (tipo_acta_ID == "SA") {
        const [oData] = await cds.run(`SELECT MAX(A.NRO_ACTA) AS COUNT
        FROM COM_AYSA_PGO_ACTASSANCIONES AS A
        JOIN COM_AYSA_PGO_ACTAS AS ACT ON ACT.ID = A.ACTA_ID
        WHERE ACT.TIPO_ACTA_ID = 'SA'
          AND ACT.PI_ID = '${req.data.pi_ID}'`);

        req.data.acta_sancion[0].nro_acta = oData.COUNT + 1;
      }
      if (tipo_acta_ID == "AD") {
        const [oData] = await cds.run(`SELECT MAX(A.NRO_ACTA) AS COUNT
        FROM COM_AYSA_PGO_ACTASADICIONALES AS A
        JOIN COM_AYSA_PGO_ACTAS AS ACT ON ACT.ID = A.ACTA_ID
        WHERE ACT.TIPO_ACTA_ID = 'AD'
          AND ACT.PI_ID = '${req.data.pi_ID}'`);

        req.data.acta_adicional[0].nro_acta = oData.COUNT + 1;
      }
      if (tipo_acta_ID == "EX") {
        const [oData] = await cds.run(`SELECT MAX(A.NRO_ACTA) AS COUNT
        FROM COM_AYSA_PGO_ACTASEXCEDIDAS AS A
        JOIN COM_AYSA_PGO_ACTAS AS ACT ON ACT.ID = A.ACTA_ID
        WHERE ACT.TIPO_ACTA_ID = 'EX'
          AND ACT.PI_ID = '${req.data.pi_ID}'`);

        req.data.acta_excedida[0].nro_acta = oData.COUNT + 1;
      }
      if (tipo_acta_ID == "EC") {
        const [oData] = await cds.run(`SELECT MAX(A.NRO_ACTA) AS COUNT
        FROM COM_AYSA_PGO_ACTASECONOMIAS AS A
        JOIN COM_AYSA_PGO_ACTAS AS ACT ON ACT.ID = A.ACTA_ID
        WHERE ACT.TIPO_ACTA_ID = 'EC'
          AND ACT.PI_ID = '${req.data.pi_ID}'`);

        req.data.acta_economia[0].nro_acta = oData.COUNT + 1;
      }
    } catch (error) {
      console.log("--CREATE Actas--", error);
      return req.error(
        400,
        `Error al obtener nro maximo Actas ${tipo_acta_ID} ${tramo_ID}`
      );
    }
  });

  const generateDocumentsObject = async (oObra, area, areaCompleta) => {
    try {
      const docs = await cds.run(`SELECT DP.*, CD.*
      FROM COM_AYSA_PGO_DOCUMENTOSPRECONSTRUCCION DP
      JOIN COM_AYSA_PGO_CATALOGODOCUMENTOS CD ON CD.ID = DP.CATALOGO_DOCUMENTOS_ID
      WHERE DP.PRECONSTRUCCION_ID = '${oObra.preconstruccion_ID}' AND CD.AREA_ID = '${area}' AND DP.ESTADO_ID != 'BO'`);
      const [oData] = await cds.run(`SELECT MAX(FECHA_LIMITE) AS FECHA 
                                        FROM COM_AYSA_PGO_DOCUMENTOSPRECONSTRUCCION DP
                                        JOIN COM_AYSA_PGO_CATALOGODOCUMENTOS CD ON CD.ID = DP.CATALOGO_DOCUMENTOS_ID
      WHERE DP.PRECONSTRUCCION_ID = '${oObra.preconstruccion_ID}' AND CD.AREA_ID = '${area}' AND DP.ESTADO_ID != 'BO'`);
      const [oFechaMin] = await cds.run(`SELECT MIN(FECHA_LIMITE) AS FECHA_MIN 
                                        FROM COM_AYSA_PGO_DOCUMENTOSPRECONSTRUCCION DP
                                        JOIN COM_AYSA_PGO_CATALOGODOCUMENTOS CD ON CD.ID = DP.CATALOGO_DOCUMENTOS_ID
      WHERE DP.PRECONSTRUCCION_ID = '${oObra.preconstruccion_ID}' AND CD.AREA_ID = '${area}' AND DP.ESTADO_ID != 'BO'`);
      const [fecha_preconstruccion] = await cds.run(
        `SELECT * FROM COM_AYSA_PGO_PRECONSTRUCCIONES DP WHERE DP.ID = '${oObra.preconstruccion_ID}'`
      );
      let estado_vencimiento = "A tiempo";
      if (oFechaMin.FECHA_MIN && fecha_preconstruccion.FECHA_GENERACION) {
        let fecha_actual = new Date();
        let fecha_limite = new Date(oFechaMin.FECHA_MIN);
        let fecha_base = new Date(fecha_preconstruccion.FECHA_GENERACION);

        let vto = fecha_actual - fecha_limite;
        let dif_tiempo = fecha_limite - fecha_base;
        let porcentajeTiempoTranscurrido = (dif_tiempo / 86400000) * 100;
        if (porcentajeTiempoTranscurrido >= 60) {
          estado_vencimiento = "Vencido";
        } else if (fecha_actual > fecha_limite) {
          estado_vencimiento = "Por vencer";
        }
      }
      let contCantidad = 0;
      let contAP = 0;
      let contPA = 0;
      let contPI = 0;
      let contRE = 0;
      for ([i, documento] of docs.entries()) {
        contCantidad += 1;
        if (docs[i].ESTADO_ID == "AP") contAP += 1;
        if (docs[i].ESTADO_ID == "PA") contPA += 1;
        if (docs[i].ESTADO_ID == "PI") contPI += 1;
        if (docs[i].ESTADO_ID == "RE") contRE += 1;
      }
      let avance = (contAP / contCantidad) * 100 || 0;

      let estado_ID = "PE";
      if (contCantidad == contAP && contCantidad !== 0)
        (estado_ID = "AP"), (avance = 100);
      if (contRE >= 1) estado_ID = "RE";
      if (contPI >= 1) estado_ID = "PI";
      if (contPA >= 1) estado_ID = "PA";

      const documentObject = {
        area: areaCompleta,
        estado_ID,
        avance,
        responsable_ID: "CO",
        estado_vencimiento,
        fecha_real_entrega: null,
        fecha_limite: oData.FECHA,
      };
      return documentObject;
    } catch (error) {
      console.log("--generateDocumentsObject--", error);
    }
  };

  const generateIngenieriaObject = async (oObra, area, areaCompleta) => {
    const aP3 = await cds.run(
      `SELECT P.ID, PI.ID AS PI_ID FROM COM_AYSA_PGO_P3 P JOIN COM_AYSA_PGO_OBRAS O ON O.ID = P.OBRA_ID JOIN COM_AYSA_PGO_OBRAPI PI ON PI.P3_ID = P.ID WHERE O.ID = '${oObra.ID}' `
    );
    let aData = [];
    for (oP3 of aP3) {
      aData.push(
        await cds.run(`SELECT * FROM COM_AYSA_PGO_PRESENTACIONES
      WHERE NRO_PRESENTACION = (SELECT MAX(NRO_PRESENTACION) FROM COM_AYSA_PGO_PRESENTACIONES WHERE PI_ID = '${oP3.PI_ID}' AND ESTADO_ID != 'BO') AND PI_ID = '${oP3.PI_ID}' AND ESTADO_ID != 'BO'`)
      );
    }
    let oPresentacion = aData.flat();
    const [oFechaMin] = await cds.run(`SELECT MIN(FECHA_LIMITE) AS FECHA_MIN 
                                        FROM COM_AYSA_PGO_DOCUMENTOSPRECONSTRUCCION DP
                                        JOIN COM_AYSA_PGO_CATALOGODOCUMENTOS CD ON CD.ID = DP.CATALOGO_DOCUMENTOS_ID
      WHERE DP.PRECONSTRUCCION_ID = '${oObra.preconstruccion_ID}' AND CD.AREA_ID = '${area}' AND DP.ESTADO_ID != 'BO'`);

    const [fecha_preconstruccion] = await cds.run(
      `SELECT * FROM COM_AYSA_PGO_PRECONSTRUCCIONES DP WHERE DP.ID = '${oObra.preconstruccion_ID}'`
    );
    let estado_vencimiento = "A tiempo";
    if (oFechaMin.FECHA_MIN && fecha_preconstruccion.FECHA_GENERACION) {
      let fecha_actual = new Date();
      let fecha_limite = new Date(oFechaMin.FECHA_MIN);
      let fecha_base = new Date(fecha_preconstruccion.FECHA_GENERACION);

      let vto = fecha_actual - fecha_limite;
      let dif_tiempo = fecha_limite - fecha_base;
      let porcentajeTiempoTranscurrido = (dif_tiempo / 86400000) * 100;
      if (fecha_actual > fecha_limite) {
        estado_vencimiento = "Vencido";
      } else if (porcentajeTiempoTranscurrido >= 60) {
        estado_vencimiento = "Por vencer";
      }
    }
    let avance = 0;
    let estado_ID = "PE";
    if (oPresentacion[0] && oPresentacion[0].ESTADO_ID) {
      estado_ID = oPresentacion[0].ESTADO_ID;
    }
    if (estado_ID == "AP") {
      avance = 100;
    }

    const documentObject = {
      area: areaCompleta,
      estado_ID,
      avance,
      responsable_ID: "CO",
      estado_vencimiento,
      fecha_real_entrega: null,
      fecha_limite: null,
    };
    return documentObject;
  };

  const generatePolizasObject = async (oObra, areaCompleta) => {
    try {
      const CertificadosControl = await cds.run(
        SELECT.from(CertificadosControlPolizas).where({
          obra_ID: oObra.ID,
          estado_ID: "EN",
        })
      );
      const VTVs = await cds.run(
        SELECT.from(VTV).where({ obra_ID: oObra.ID, estado_ID: "EN" })
      );
      const Licencias = await cds.run(
        SELECT.from(LicenciasConducir).where({
          obra_ID: oObra.ID,
          estado_ID: "EN",
        })
      );
      const Cedula = await cds.run(
        SELECT.from(Cedulas).where({ obra_ID: oObra.ID, estado_ID: "EN" })
      );
      const Registros = await cds.run(
        SELECT.from(RegistrosEspeciales).where({
          obra_ID: oObra.ID,
          estado_ID: "EN",
        })
      );
      const [oFechaMin] = await cds.run(`SELECT MIN(FECHA_LIMITE) AS FECHA_MIN 
      FROM COM_AYSA_PGO_DOCUMENTOSPRECONSTRUCCION DP
      JOIN COM_AYSA_PGO_CATALOGODOCUMENTOS CD ON CD.ID = DP.CATALOGO_DOCUMENTOS_ID
WHERE DP.PRECONSTRUCCION_ID = '${oObra.preconstruccion_ID}' AND CD.AREA_ID = 'PO' AND DP.ESTADO_ID != 'BO'`);

      const [fecha_preconstruccion] = await cds.run(
        `SELECT * FROM COM_AYSA_PGO_PRECONSTRUCCIONES DP WHERE DP.ID = '${oObra.preconstruccion_ID}'`
      );
      let estado_vencimiento = "A tiempo";
      if (oFechaMin.FECHA_MIN && fecha_preconstruccion.FECHA_GENERACION) {
        let fecha_actual = new Date();
        let fecha_limite = new Date(oFechaMin.FECHA_MIN);
        let fecha_base = new Date(fecha_preconstruccion.FECHA_GENERACION);

        let vto = fecha_actual - fecha_limite;
        let dif_tiempo = fecha_limite - fecha_base;
        let porcentajeTiempoTranscurrido = (dif_tiempo / 86400000) * 100;
        if (porcentajeTiempoTranscurrido >= 60) {
          estado_vencimiento = "Vencido";
        } else if (fecha_actual > fecha_limite) {
          estado_vencimiento = "Por vencer";
        }
      }

      let aPolizas = [];
      aPolizas.push(CertificadosControl, VTVs, Licencias, Cedula, Registros);
      aPolizas = aPolizas.flat();

      let estado_ID;
      if (aPolizas.length > 0) {
        estado_ID = "AP";
      } else {
        estado_ID = "PE";
      }

      let avance;
      if (estado_ID == "AP") {
        avance = 100;
      } else {
        avance = 0;
      }
      const documentObject = {
        area: areaCompleta,
        estado_ID,
        avance,
        responsable_ID: "CO",
        estado_vencimiento,
        fecha_real_entrega: null,
        fecha_limite: null,
      };
      return documentObject;
    } catch (error) {
      console.log("--Polizas--", error);
    }
  };

  const generateOfertaObject = async (oObra, areaCompleta) => {
    try {
      const aOfertas = await cds.run(
        SELECT.from(Ofertas).where({ obra_ID: oObra.ID })
      );
      const [oFechaMin] = await cds.run(`SELECT MIN(FECHA_LIMITE) AS FECHA_MIN 
      FROM COM_AYSA_PGO_DOCUMENTOSPRECONSTRUCCION DP
      JOIN COM_AYSA_PGO_CATALOGODOCUMENTOS CD ON CD.ID = DP.CATALOGO_DOCUMENTOS_ID
WHERE DP.PRECONSTRUCCION_ID = '${oObra.preconstruccion_ID}' AND CD.AREA_ID = 'OF' AND DP.ESTADO_ID != 'BO'`);

      const [fecha_preconstruccion] = await cds.run(
        `SELECT * FROM COM_AYSA_PGO_PRECONSTRUCCIONES DP WHERE DP.ID = '${oObra.preconstruccion_ID}'`
      );
      let estado_vencimiento = "A tiempo";
      if (oFechaMin.FECHA_MIN && fecha_preconstruccion.FECHA_GENERACION) {
        let fecha_actual = new Date();
        let fecha_limite = new Date(oFechaMin.FECHA_MIN);
        let fecha_base = new Date(fecha_preconstruccion.FECHA_GENERACION);

        let vto = fecha_actual - fecha_limite;
        let dif_tiempo = fecha_limite - fecha_base;
        let porcentajeTiempoTranscurrido = (dif_tiempo / 86400000) * 100;
        if (porcentajeTiempoTranscurrido >= 60) {
          estado_vencimiento = "Vencido";
        } else if (fecha_actual > fecha_limite) {
          estado_vencimiento = "Por vencer";
        }
      }

      let contCantidad = 0;
      let contAP = 0;
      let contPA = 0;
      let contPI = 0;
      let contRE = 0;
      for (let oferta of aOfertas) {
        contCantidad += 1;
        if (oferta.estado_ID == "AP") contAP += 1;
        if (oferta.estado_ID == "PA") contPA += 1;
        if (oferta.estado_ID == "PI") contPI += 1;
        if (oferta.estado_ID == "RE") contRE += 1;
        if (oferta.estado_ID == "PE") contPE += 1;
      }

      let avance = (contAP / contCantidad) * 100 || 0;

      let estado_ID = "PE";
      if (contCantidad == contAP && contCantidad != 0)
        (estado_ID = "AP"), (avance = 100);
      if (contRE >= 1) estado_ID = "RE";
      if (contPI >= 1) estado_ID = "PI";
      if (contPA >= 1) estado_ID = "PA";

      const documentObject = {
        area: areaCompleta,
        estado_ID,
        avance,
        responsable_ID: "AY",
        estado_vencimiento,
        fecha_real_entrega: null,
        fecha_limite: null,
      };
      return documentObject;
    } catch (error) {}
  };

  const generatePlanTrabajoObject = async (oObra, areaCompleta) => {
    PlanesTrabajo;
    const oPlanTrabajo = await cds.run(`SELECT * FROM COM_AYSA_PGO_PLANESTRABAJO
    WHERE NRO_PLAN = (SELECT MAX(NRO_PLAN) FROM COM_AYSA_PGO_PLANESTRABAJO) AND OBRA_ID = '${oObra.ID}' AND ESTADO_ID != 'BO'`);
    const [oFechaMin] = await cds.run(`SELECT MIN(FECHA_LIMITE) AS FECHA_MIN 
    FROM COM_AYSA_PGO_DOCUMENTOSPRECONSTRUCCION DP
    JOIN COM_AYSA_PGO_CATALOGODOCUMENTOS CD ON CD.ID = DP.CATALOGO_DOCUMENTOS_ID
WHERE DP.PRECONSTRUCCION_ID = '${oObra.preconstruccion_ID}' AND CD.AREA_ID = 'PT' AND DP.ESTADO_ID != 'BO'`);

    const [fecha_preconstruccion] = await cds.run(
      `SELECT * FROM COM_AYSA_PGO_PRECONSTRUCCIONES DP WHERE DP.ID = '${oObra.preconstruccion_ID}'`
    );
    let estado_vencimiento = "A tiempo";
    if (oFechaMin.FECHA_MIN && fecha_preconstruccion.FECHA_GENERACION) {
      let fecha_actual = new Date();
      let fecha_limite = new Date(oFechaMin.FECHA_MIN);
      let fecha_base = new Date(fecha_preconstruccion.FECHA_GENERACION);

      let vto = fecha_actual - fecha_limite;
      let dif_tiempo = fecha_limite - fecha_base;
      let porcentajeTiempoTranscurrido = (dif_tiempo / 86400000) * 100;
      if (fecha_actual > fecha_limite) {
        estado_vencimiento = "Vencido";
      } else if (porcentajeTiempoTranscurrido >= 60) {
        estado_vencimiento = "Por vencer";
      }
    }
    let estado_ID = oPlanTrabajo.ESTADO_ID || "PE";

    let avance;
    if (estado_ID == "AP") {
      avance = 100;
    } else {
      avance = 0;
    }

    return (documentObject = {
      area: areaCompleta,
      estado_ID,
      avance,
      responsable_ID: "CO",
      estado_vencimiento,
      fecha_real_entrega: oPlanTrabajo.FECHA_CREACION,
      fecha_limite: null,
    });
  };

  const generatePermisosObject = async (oObra, areaCompleta) => {
    const aP3 = await cds.run(
      `SELECT P.ID, PI.ID AS PI_ID FROM COM_AYSA_PGO_P3 P JOIN COM_AYSA_PGO_OBRAS O ON O.ID = P.OBRA_ID JOIN COM_AYSA_PGO_OBRAPI PI ON PI.P3_ID = P.ID WHERE O.ID = '${oObra.ID}' `
    );
    let aPermisos = [];

    for (oP3 of aP3) {
      aPermisos.push(
        await cds.run(SELECT.from(PermisosTramo).where({ pi_ID: oP3.PI_ID }))
      );
      aPermisos.push(
        await cds.run(
          SELECT.from(PermisosEspeciales).where({ pi_ID: oP3.PI_ID })
        )
      );
      aPermisos.push(
        await cds.run(
          SELECT.from(PermisosMunicipales).where({ pi_ID: oP3.PI_ID })
        )
      );
    }
    const [oFechaMin] = await cds.run(`SELECT MIN(FECHA_LIMITE) AS FECHA_MIN 
    FROM COM_AYSA_PGO_DOCUMENTOSPRECONSTRUCCION DP
    JOIN COM_AYSA_PGO_CATALOGODOCUMENTOS CD ON CD.ID = DP.CATALOGO_DOCUMENTOS_ID
WHERE DP.PRECONSTRUCCION_ID = '${oObra.preconstruccion_ID}' AND CD.AREA_ID = 'PE' AND DP.ESTADO_ID != 'BO'`);

    const [fecha_preconstruccion] = await cds.run(
      `SELECT * FROM COM_AYSA_PGO_PRECONSTRUCCIONES DP WHERE DP.ID = '${oObra.preconstruccion_ID}'`
    );
    let estado_vencimiento = "A tiempo";
    if (oFechaMin.FECHA_MIN && fecha_preconstruccion.FECHA_GENERACION) {
      let fecha_actual = new Date();
      let fecha_limite = new Date(oFechaMin.FECHA_MIN);
      let fecha_base = new Date(fecha_preconstruccion.FECHA_GENERACION);

      let vto = fecha_actual - fecha_limite;
      let dif_tiempo = fecha_limite - fecha_base;
      let porcentajeTiempoTranscurrido = (dif_tiempo / 86400000) * 100;
      if (fecha_actual > fecha_limite) {
        estado_vencimiento = "Vencido";
      } else if (porcentajeTiempoTranscurrido >= 60) {
        estado_vencimiento = "Por vencer";
      }
    }

    aPermisos = aPermisos.flat();

    let estado_ID = "PE";
    let avance = 0;
    for (let permiso of aPermisos) {
      if (permiso.fecha_otorgacion !== null) {
        estado_ID = "AP";
        avance = 100;
        break;
      }
    }
    return (documentObject = {
      area: areaCompleta,
      estado_ID,
      avance,
      responsable_ID: "CO",
      estado_vencimiento,
      fecha_real_entrega: null,
      fecha_limite: null,
    });
  };

  const getPartidimetrosObject = async (oObra, areaCompleta) => {
    const aP3 = await cds.run(
      `SELECT P.ID, PI.ID AS PI_ID FROM COM_AYSA_PGO_P3 P JOIN COM_AYSA_PGO_OBRAS O ON O.ID = P.OBRA_ID JOIN COM_AYSA_PGO_OBRAPI PI ON PI.P3_ID = P.ID WHERE O.ID = '${oObra.ID}' `
    );
    let aData = [];
    for (oP3 of aP3) {
      aData.push(
        await cds.run(
          `SELECT * FROM COM_AYSA_PGO_OBRAPI O JOIN COM_AYSA_PGO_PARTIDIMETROS P ON O.ID = P.PI_ID WHERE P.estado_ID != 'BO' AND O.P3_ID = '${oP3.ID}' AND P.NRO_PARTIDIMETRO = (SELECT MAX(NRO_PARTIDIMETRO) FROM COM_AYSA_PGO_PARTIDIMETROS PD WHERE O.ID = PD.PI_ID AND ESTADO_ID != 'BO')`
        )
      );
    }
    const [oFechaMin] = await cds.run(`SELECT MIN(FECHA_LIMITE) AS FECHA_MIN 
    FROM COM_AYSA_PGO_DOCUMENTOSPRECONSTRUCCION DP
    JOIN COM_AYSA_PGO_CATALOGODOCUMENTOS CD ON CD.ID = DP.CATALOGO_DOCUMENTOS_ID
WHERE DP.PRECONSTRUCCION_ID = '${oObra.preconstruccion_ID}' AND CD.AREA_ID = 'PA' AND DP.ESTADO_ID != 'BO'`);

    //por defecto esta a tiempo, si no esta a tiempo le pongo el estado (calculo el tiempo transcurrido entre fechas)
    const [fecha_preconstruccion] = await cds.run(
      `SELECT * FROM COM_AYSA_PGO_PRECONSTRUCCIONES DP WHERE DP.ID = '${oObra.preconstruccion_ID}'`
    );
    let estado_vencimiento = "A tiempo";
    if (oFechaMin.FECHA_MIN && fecha_preconstruccion.FECHA_GENERACION) {
      let fecha_actual = new Date();
      let fecha_limite = new Date(oFechaMin.FECHA_MIN);
      let fecha_base = new Date(fecha_preconstruccion.FECHA_GENERACION);

      let vto = fecha_actual - fecha_limite;
      let dif_tiempo = fecha_limite - fecha_base;
      let porcentajeTiempoTranscurrido = (dif_tiempo / 86400000) * 100;
      if (fecha_actual > fecha_limite) {
        estado_vencimiento = "Vencido";
      } else if (porcentajeTiempoTranscurrido >= 60) {
        estado_vencimiento = "Por vencer";
      }
    }
    let avance = 0;
    let responsable_ID = "CO";
    if (areaCompleta == "Partidímetros") responsable_ID = "AY";
    aData = aData.flat();
    if (aData.length > 0) {
      let estado_ID = "PE";
      if (aData.every((partidimetro) => partidimetro.ESTADO_ID == "AP"))
        (estado_ID = "AP"), (avance = 100);
      if (aData.some((partidimetro) => partidimetro.ESTADO_ID == "RE"))
        estado_ID = "RE";
      if (aData.some((partidimetro) => partidimetro.ESTADO_ID == "PI"))
        estado_ID = "PI";

      let fecha_real_entrega = aData.reduce((minFecha, part) => {
        const fechaActual = new Date(part.FECHA_CARGA);
        if (minFecha === null || fechaActual < minFecha) {
          return fechaActual;
        } else {
          return minFecha;
        }
      }, null);

      fecha_real_entrega = new Date(fecha_real_entrega)
        .toISOString()
        .split("T")[0];

      return (documentObject = {
        area: areaCompleta,
        estado_ID,
        avance,
        responsable_ID,
        estado_vencimiento,
        fecha_real_entrega,
        fecha_limite: null,
      });
    }
    return (documentObject = {
      area: areaCompleta,
      estado_ID: "PE",
      avance: 0,
      responsable_ID,
      estado_vencimiento,
      fecha_real_entrega: null,
      fecha_limite: null,
    });
  };

  const getPresentacionesObject = async (oObra, areaCompleta) => {
    const oPresentacion =
      await cds.run(`SELECT * FROM COM_AYSA_PGO_PRESENTACIONESSH
    WHERE NRO_PRESENTACION = (SELECT MAX(NRO_PRESENTACION) FROM COM_AYSA_PGO_PRESENTACIONESSH WHERE GRUPO_ID = 'P1' AND ESTADO_ID != 'BO') AND OBRA_ID = '${oObra.ID}' AND GRUPO_ID = 'P1' AND ESTADO_ID != 'BO'`);
    const [oFechaMin] = await cds.run(`SELECT MIN(FECHA_LIMITE) AS FECHA_MIN 
    FROM COM_AYSA_PGO_DOCUMENTOSPRECONSTRUCCION DP
    JOIN COM_AYSA_PGO_CATALOGODOCUMENTOS CD ON CD.ID = DP.CATALOGO_DOCUMENTOS_ID
WHERE DP.PRECONSTRUCCION_ID = '${oObra.preconstruccion_ID}' AND CD.AREA_ID = 'SH' AND DP.ESTADO_ID != 'BO'`);

    const [fecha_preconstruccion] = await cds.run(
      `SELECT * FROM COM_AYSA_PGO_PRECONSTRUCCIONES DP WHERE DP.ID = '${oObra.preconstruccion_ID}'`
    );
    let estado_vencimiento = "A tiempo";
    if (oFechaMin.FECHA_MIN && fecha_preconstruccion.FECHA_GENERACION) {
      let fecha_actual = new Date();
      let fecha_limite = new Date(oFechaMin.FECHA_MIN);
      let fecha_base = new Date(fecha_preconstruccion.FECHA_GENERACION);

      let vto = fecha_actual - fecha_limite;
      let dif_tiempo = fecha_limite - fecha_base;
      let porcentajeTiempoTranscurrido = (dif_tiempo / 86400000) * 100;
      if (fecha_actual > fecha_limite) {
        estado_vencimiento = "Vencido";
      } else if (porcentajeTiempoTranscurrido >= 60) {
        estado_vencimiento = "Por vencer";
      }
    }
    let estado_ID = "PE";
    if (oPresentacion.ESTADO_ID == "PO" || oPresentacion.ESTADO_ID == "AP")
      estado_ID = "AP";
    if (oPresentacion.ESTADO_ID == "PH" || oPresentacion.ESTADO_ID == "RE")
      estado_ID = "RE";

    let avance = 0;
    if (estado_ID == "AP") avance = 100;
    return (documentObject = {
      area: areaCompleta,
      estado_ID,
      avance,
      responsable_ID: "CO",
      estado_vencimiento,
      fecha_real_entrega: null,
      fecha_limite: null,
    });
  };

  srv.on("getControlDocumentacionData", async (req) => {
    const { obra_ID } = req.data;
    try {
      const oObra = await SELECT.from(Obras).where({ ID: obra_ID });
      aDocumentacion = [];
      aDocumentacion.push(
        await generateDocumentsObject(oObra[0], "IS", "Inspección")
      );
      aDocumentacion.push(
        await generateIngenieriaObject(oObra[0], "IN", "Ingeniería")
      );
      aDocumentacion.push(
        await getPresentacionesObject(oObra[0], "Seguridad e Higiene")
      );
      aDocumentacion.push(
        await generateDocumentsObject(oObra[0], "MA", "Medioambiente y calidad")
      );
      aDocumentacion.push(await generatePermisosObject(oObra[0], "Permisos"));
      aDocumentacion.push(await generatePolizasObject(oObra[0], "Pólizas"));
      aDocumentacion.push(
        await generateDocumentsObject(oObra[0], "CA", "Cartelería")
      );
      aDocumentacion.push(
        await generateDocumentsObject(oObra[0], "GE", "Género")
      );
      aDocumentacion.push(await getPartidimetrosObject(oObra[0], "APU"));
      aDocumentacion.push(
        await generatePlanTrabajoObject(oObra[0], "Plan de trabajo")
      );
      aDocumentacion.push(await generateOfertaObject(oObra[0], "Ofertas"));
      aDocumentacion.push(
        await getPartidimetrosObject(oObra[0], "Partidímetros")
      );

      let posicion = 1;
      for (let oDoc of aDocumentacion) {
        oDoc.posicion = posicion;
        posicion++;
      }

      return aDocumentacion;
    } catch (error) {
      console.log("--getControlDocumentacionData--", error);
      return req.error(400, error);
    }
  });
  srv.on("enviarActaConstatacion", async (req, res) => {
    const aData = req.data;
    try {
      let promises = [];

      let oActaConstatacion = await cds.run(
        SELECT.one(ActasConstatacion).where({ ID: aData.actaConstatacion_ID })
      );

      if (!oActaConstatacion) {
        return res.status(400).json({
          error: `No se encontró un Acta de constatación  para el ID: ${aData.actaConstatacion_ID}`,
        });
      }

      promises.push(
        cds.run(
          UPDATE(ActasConstatacion)
            .data({
              estado_ID: "EN",
            })
            .where({ ID: aData.actaConstatacion_ID })
        )
      );
      promises.push(
        cds.run(
          UPDATE(AcopiosMateriales)
            .data({
              estado_ID: "AP",
            })
            .where({ ID: oActaConstatacion.acopio_material_ID })
        )
      );

      await Promise.all(promises);
    } catch (error) {
      console.log("ERROR UPDATE ACTASCONSTATACION-->", error);
      res.status(400).json({
        error,
      });
    }
  });

  srv.on("getTareasPlanTrabajoObra", async (req) => {
    const { obra_ID } = req.data;

    const oPlanTrabajo = await cds.run(`SELECT * FROM COM_AYSA_PGO_PLANESTRABAJO
    WHERE NRO_PLAN = (
        SELECT MAX(NRO_PLAN) 
        FROM COM_AYSA_PGO_PLANESTRABAJO 
        WHERE OBRA_ID = '${obra_ID}' AND ESTADO_ID IN ('AP', 'SP')
    ) AND OBRA_ID = '${obra_ID}' AND ESTADO_ID IN ('AP', 'SP')`);

    if (oPlanTrabajo.length > 0) {
      const tareasPlanTrabajo = await cds.run(
        SELECT.from(TareasPlanTrabajo).where({
          plan_trabajo_ID: oPlanTrabajo[0].ID,
        })
      );
      return tareasPlanTrabajo;
    }
    return [];
  });

  srv.on("enviarInspeccionElectro", async (req) => {
    const { ID } = req.data;
    try {
      const oInspeccionesElectro = await cds.run(
        SELECT.one.from(InspeccionesElectro).where({ ID })
      );

      if (!oInspeccionesElectro) {
        return req.error(400, `No se encontro una inspección para el ID ${ID}`);
      }
      const aMemoriaCriteriosEL = await cds.run(
        SELECT.from(MemoriaCriteriosEL)
      );

      const aSubItemsValidos = aMemoriaCriteriosEL.map(
        (item) => item.subitem_ID
      );

      const aPartidasInspeccionElectro = await cds.run(
        SELECT.from(PartidasInspeccionElectro).where({
          inspeccion_electro_ID: oInspeccionesElectro.ID,
        })
      );

      const aDetallePartidas = await cds.run(
        SELECT.from(DetallePartidimetro).where({
          ID: { in: aPartidasInspeccionElectro.map((item) => item.partida_ID) },
          subitem_partida_ID: { in: aSubItemsValidos },
        })
      );

      if (!aDetallePartidas.length) {
        return req.error(400, `No hay partidas validas para certificar`);
      }

      const aDetallesIDValidos = aDetallePartidas.map((item) => item.ID);
      const aPartidasInspeccionElectroValidas = aPartidasInspeccionElectro
        .filter((item) => aDetallesIDValidos.includes(item.partida_ID))
        .map((item) => {
          const oDetallePartidas = aDetallePartidas.find(
            (detalle) => detalle.ID === item.partida_ID
          );
          return oDetallePartidas
            ? {
                ...item,
                subitem_ID: oDetallePartidas.subitem_partida_ID,
                item_ID: oDetallePartidas.item_partida_ID,
                tipo_partida_ID: oDetallePartidas.tipo_partida_ID,
                unidad_partida_ID: oDetallePartidas.unidad_partida_ID,
              }
            : item;
        });

      await Promise.all(
        aDetallePartidas.map((detalle) => {
          const oPartidasInspeccionElectro = aPartidasInspeccionElectro.find(
            (item) => item.partida_ID === detalle.ID
          );
          if (!oPartidasInspeccionElectro) {
            return [];
          }

          return cds.run(
            UPDATE(DetallePartidimetro)
              .data({
                porc_avance_taller:
                  oPartidasInspeccionElectro.porc_avance_taller,
                fecha_colocacion: oPartidasInspeccionElectro.fecha_colocacion,
                fecha_pie_obra: oPartidasInspeccionElectro.fecha_pie_obra,
                fecha_puesta_marcha:
                  oPartidasInspeccionElectro.fecha_puesta_marcha,
                fecha_orden_compra:
                  oPartidasInspeccionElectro.fecha_orden_compra,
              })
              .where({ ID: detalle.ID })
          );
        })
      );

      const oPorcentajesCertificar = aPartidasInspeccionElectroValidas.reduce(
        (acum, partida) => {
          const partidasAcum = aMemoriaCriteriosEL
            .filter((item) => item.subitem_ID === partida.subitem_ID)
            .reduce((acumulador, elemento) => {
              const clave = elemento.subitem_ID;
              if (!acumulador[clave]) {
                acumulador[clave] = 0;
              }

              if (validateFieldsOCE(partida, elemento)) {
                const porcentaje = elemento.proporcional
                  ? (Number(elemento.porcentaje) / 100) *
                    Number(partida.porc_avance_taller)
                  : Number(elemento.porcentaje);
                acumulador[clave] += porcentaje;
              }
              return acumulador;
            }, {});

          return { ...acum, ...partidasAcum };
        },
        {}
      );

      const maxMesAnio = await cds.run(
        SELECT.one
          .from(MemoriaCalculoEL, [
            "MAX(anio) as max_anio",
            "MAX(mes) as max_mes",
          ])
          .where({
            obra_ID: aPartidasInspeccionElectroValidas.at(0).pi_ID,
          })
      );

      const oMemoriaCalculo = await cds.run(
        SELECT.one.from(MemoriaCalculoEL).where({
          obra_ID: aPartidasInspeccionElectroValidas.at(0).pi_ID,
          anio: maxMesAnio.max_anio,
          mes: maxMesAnio.max_mes,
        })
      );

      const aMemoriaPartidasEL = aPartidasInspeccionElectroValidas.map(
        (item) => {
          //oPorcentajesCertificar

          return {
            memoria_calculo_ID: oMemoriaCalculo.ID,
            pi_ID: item.pi_ID,
            codigo1: item.codigo1,
            codigo2: item.codigo2,
            codigo3: item.codigo3,
            codigo4: item.codigo4,
            codigo5: item.codigo5,
            subitem_ID: item.subitem_ID,
            item_ID: item.item_ID,
            tipo_partida: item.tipo_partida_ID,
            unidad_partida_ID: item.unidad_partida_ID,
            porcentaje_certificacion: oPorcentajesCertificar[item.subitem_ID],
            cantidad_certificar: Number(item.cantidad),
            monto_certificar:
              (Number(item.cantidad) *
                oPorcentajesCertificar[item.subitem_ID]) /
                100 || 0,
          };
        }
      );

      const partidas_contractuales = aPartidasInspeccionElectroValidas
        .filter((item) => item.tipo_partida_ID === "CO")
        .reduce((acumulador, elemento) => {
          const monto_certificar =
            (Number(elemento.cantidad) *
              porcentajeCertificar[elemento.subitem_ID]) /
            100;
          return (acumulador += monto_certificar);
        }, 0);

      const total = aMemoriaPartidasEL.reduce(
        (acumulador, elemento) => (acumulador += elemento.monto_certificar),
        0
      );

      const oMemoriaToUpdate = {
        ...oMemoriaCalculo,
        partidas_contractuales,
        total,
      };

      const aMemoriasPartidas = await cds.run(
        SELECT.from(MemoriaPartidasEL).where({
          memoria_calculo_ID: oMemoriaToUpdate.ID,
        })
      );

      await Promise.all([
        cds.run(
          UPDATE(MemoriaCalculoEL)
            .data(oMemoriaToUpdate)
            .where({ ID: oMemoriaToUpdate.ID })
        ),
        cds.run(
          UPDATE(InspeccionesElectro)
            .data({ estado_ID: "PT" })
            .where({ ID: oInspeccionesElectro.ID })
        ),
        ...aMemoriaPartidasEL.map((item) => {
          const oMemoriasPartidas = aMemoriasPartidas.find(
            (partida) =>
              item.codigo1 === partida.codigo1 &&
              item.codigo2 === partida.codigo2 &&
              item.codigo3 === partida.codigo3 &&
              item.codigo4 === partida.codigo4 &&
              item.codigo5 === partida.codigo5
          );

          return oMemoriasPartidas
            ? cds.run(
                UPDATE(MemoriaPartidasEL)
                  .data({
                    ...item,
                    porcentaje_certificacion:
                      Number(item.porcentaje_certificacion) +
                      Number(oMemoriasPartidas.porcentaje_certificacion),
                    cantidad_certificar:
                      Number(item.cantidad_certificar) +
                      Number(oMemoriasPartidas.cantidad_certificar),
                    monto_certificar:
                      Number(item.monto_certificar) +
                      Number(oMemoriasPartidas.monto_certificar),
                  })
                  .where({ ID: item.ID })
              )
            : cds.run(INSERT.into(MemoriaPartidasEL).entries(item));
        }),
      ]);

      return req.notify(201, `Inspeccion Electro ${ID} aprobado`);
    } catch (err) {
      return req.error(400, err);
    }
  });
  srv.on("enviarInspeccionCivil", async (req) => {
    const { ID } = req.data;
    try {
      const oInspeccionCivil = await cds.run(
        SELECT.one.from(InspeccionesCI).where({ ID })
      );

      if (!oInspeccionCivil) {
        return req.error(400, `No se encontro una inspección para el ID ${ID}`);
      }
      const aMemoriaCriteriosCI = await cds.run(
        SELECT.from(MemoriaCriteriosCI)
      );

      const aSubItemsValidos = aMemoriaCriteriosEL.map(
        (item) => item.subitem_ID
      );

      const aPartidasInspeccionCI = await cds.run(
        SELECT.from(PartidasInspeccionCI).where({
          inspeccion_civil_ID: oInspeccionCivil.ID,
        })
      );

      const aDetallePartidas = await cds.run(
        SELECT.from(DetallePartidimetro).where({
          ID: { in: aPartidasInspeccionCI.map((item) => item.partida_ID) },
          subitem_partida_ID: { in: aSubItemsValidos },
        })
      );

      if (!aDetallePartidas.length) {
        return req.error(400, `No hay partidas validas para certificar`);
      }

      const aDetallesIDValidos = aDetallePartidas.map((item) => item.ID);
      const aPartidasInspeccionCIValidas = aPartidasInspeccionCI
        .filter((item) => aDetallesIDValidos.includes(item.partida_ID))
        .map((item) => {
          const oDetallePartidas = aDetallePartidas.find(
            (detalle) => detalle.ID === item.partida_ID
          );
          return oDetallePartidas
            ? {
                ...item,
                subitem_ID: oDetallePartidas.subitem_partida_ID,
                item_ID: oDetallePartidas.item_partida_ID,
                tipo_partida_ID: oDetallePartidas.tipo_partida_ID,
                unidad_partida_ID: oDetallePartidas.unidad_partida_ID,
              }
            : item;
        });

      await Promise.all(
        aDetallePartidas.map((detalle) => {
          const oPartidasInspeccionCI = aPartidasInspeccionCI.find(
            (item) => item.partida_ID === detalle.ID
          );
          if (!oPartidasInspeccionCI) {
            return [];
          }

          return cds.run(
            UPDATE(DetallePartidimetro)
              .data({
                porc_avance_taller: oPartidasInspeccionCI.porc_avance_taller,
                fecha_colocacion: oPartidasInspeccionCI.fecha_colocacion,
                fecha_pie_obra: oPartidasInspeccionCI.fecha_pie_obra,
                fecha_puesta_marcha: oPartidasInspeccionCI.fecha_puesta_marcha,
                fecha_orden_compra: oPartidasInspeccionCI.fecha_orden_compra,
              })
              .where({ ID: detalle.ID })
          );
        })
      );

      const oPorcentajesCertificar = aPartidasInspeccionCIValidas.reduce(
        (acum, partida) => {
          const partidasAcum = aMemoriaCriteriosCI
            .filter((item) => item.subitem_ID === partida.subitem_ID)
            .reduce((acumulador, elemento) => {
              const clave = elemento.subitem_ID;
              if (!acumulador[clave]) {
                acumulador[clave] = 0;
              }

              if (validateFieldsOCE(partida, elemento)) {
                const porcentaje = elemento.proporcional
                  ? (Number(elemento.porcentaje) / 100) *
                    Number(partida.porc_avance_taller)
                  : Number(elemento.porcentaje);
                acumulador[clave] += porcentaje;
              }
              return acumulador;
            }, {});

          return { ...acum, ...partidasAcum };
        },
        {}
      );

      const maxMesAnio = await cds.run(
        SELECT.one
          .from(MemoriaCalculoCI, [
            "MAX(anio) as max_anio",
            "MAX(mes) as max_mes",
          ])
          .where({
            obra_ID: aPartidasInspeccionCIValidas.at(0).pi_ID,
          })
      );

      const oMemoriaCalculo = await cds.run(
        SELECT.one.from(MemoriaCalculoCI).where({
          obra_ID: aPartidasInspeccionCIValidas.at(0).pi_ID,
          anio: maxMesAnio.max_anio,
          mes: maxMesAnio.max_mes,
        })
      );

      const aMemoriaPartidasCI = aPartidasInspeccionCIValidas.map((item) => {
        //oPorcentajesCertificar

        return {
          memoria_calculo_ID: oMemoriaCalculo.ID,
          pi_ID: item.pi_ID,
          codigo1: item.codigo1,
          codigo2: item.codigo2,
          codigo3: item.codigo3,
          codigo4: item.codigo4,
          codigo5: item.codigo5,
          subitem_ID: item.subitem_ID,
          item_ID: item.item_ID,
          tipo_partida: item.tipo_partida_ID,
          unidad_partida_ID: item.unidad_partida_ID,
          porcentaje_certificacion: oPorcentajesCertificar[item.subitem_ID],
          cantidad_certificar: Number(item.cantidad),
          monto_certificar:
            (Number(item.cantidad) * oPorcentajesCertificar[item.subitem_ID]) /
              100 || 0,
        };
      });

      const partidas_contractuales = aPartidasInspeccionCIValidas
        .filter((item) => item.tipo_partida_ID === "CO")
        .reduce((acumulador, elemento) => {
          const monto_certificar =
            (Number(elemento.cantidad) *
              porcentajeCertificar[elemento.subitem_ID]) /
            100;
          return (acumulador += monto_certificar);
        }, 0);

      const total = aMemoriaPartidasCI.reduce(
        (acumulador, elemento) => (acumulador += elemento.monto_certificar),
        0
      );

      const oMemoriaToUpdate = {
        ...oMemoriaCalculo,
        partidas_contractuales,
        total,
      };

      const aMemoriasPartidas = await cds.run(
        SELECT.from(MemoriaPartidasCI).where({
          memoria_calculo_ID: oMemoriaToUpdate.ID,
        })
      );

      await Promise.all([
        cds.run(
          UPDATE(MemoriaCalculoCI)
            .data(oMemoriaToUpdate)
            .where({ ID: oMemoriaToUpdate.ID })
        ),
        cds.run(
          UPDATE(InspeccionesElectro)
            .data({ estado_ID: "PT" })
            .where({ ID: oInspeccionesElectro.ID })
        ),
        ...aMemoriaPartidasCI.map((item) => {
          const oMemoriasPartidas = aMemoriasPartidas.find(
            (partida) =>
              item.codigo1 === partida.codigo1 &&
              item.codigo2 === partida.codigo2 &&
              item.codigo3 === partida.codigo3 &&
              item.codigo4 === partida.codigo4 &&
              item.codigo5 === partida.codigo5
          );

          return oMemoriasPartidas
            ? cds.run(
                UPDATE(MemoriaPartidasCI)
                  .data({
                    ...item,
                    porcentaje_certificacion:
                      Number(item.porcentaje_certificacion) +
                      Number(oMemoriasPartidas.porcentaje_certificacion),
                    cantidad_certificar:
                      Number(item.cantidad_certificar) +
                      Number(oMemoriasPartidas.cantidad_certificar),
                    monto_certificar:
                      Number(item.monto_certificar) +
                      Number(oMemoriasPartidas.monto_certificar),
                  })
                  .where({ ID: item.ID })
              )
            : cds.run(INSERT.into(MemoriaPartidasCI).entries(item));
        }),
      ]);

      return req.notify(201, `Inspeccion civil ${ID} aprobado`);
    } catch (err) {
      return req.error(400, err);
    }
  });

  srv.on("aprobarDiagramaCuadra", async (req) => {
    const { ID } = req.data;
    try {
      //Revisar los select y asociaciones
      //2)	Navegar desde DiagramaCuadras a ConsumosPartidas.
      //    Sumarizar por PI y códigos manteniendo item y subitem
      const oDiagramasCuadra = await cds.run(
        SELECT.one.from(DiagramasCuadra).where({ ID })
      );

      if (!oDiagramasCuadra) {
        return req.error(400, `No se encontro un diagrama para el ID ${ID}`);
      }

      const aConsumosPartida = await cds.run(
        SELECT.from(ConsumosPartida).where({
          diagrama_cuadra_ID: oDiagramasCuadra.ID,
        })
      );

      if (!aConsumosPartida.length) {
        return req.error(
          400,
          `No se encontraron consumos para el diagrama ${ID}`
        );
      }

      //3)	Navegar desde DiagramaCuadras a Fechas
      //    (colocación, prueba_hidraulica, reparación_vereda,
      //    aprobación_municipal, reparación_pavimento )
      // Esto esta bien, es un objeto dentro de cada prop
      const oPlanimetrias = await cds.run(
        SELECT.one.from(Planimetrias).where({
          diagrama_ID: oDiagramasCuadra.ID,
        })
      );

      const oFechas = await cds.run(
        SELECT.one.from(Fechas).where({
          planimetria_ID: oPlanimetrias.ID,
        })
      );

      //4)	Recuperar MemoriaCriterios.
      const aMemoriaCriterios = await cds.run(SELECT.from(MemoriaCriterios));

      //5)	Recuperar último Partidimetro con estado_ID = “AP”
      //  de cada proyecto de inversión de la obra junto con su DetallePartidimetro.
      // recuperar el tramo id y buscar la obra con ese ID

      const oTramo = await cds.run(
        SELECT.one.from(Tramos).where({
          ID: oDiagramasCuadra.tramo_ID,
        })
      );
      /*
            const aObraPI = await cds.run(
              SELECT.from(ObraPI).where({
                obra_ID: oTramo.obra_ID,
              })
            );
      */
      const maxQuery = await cds.run(
        SELECT.from(Partidimetros, ["MAX(NRO_PARTIDIMETRO) AS MAX"]).where({
          estado_ID: "AP",
          //pi_ID: { in: aObraPI.map((item) => item.ID) },
          pi_ID: oDiagramasCuadra.pi_ID,
        })
      );

      const aPartidimetros = await Promise.all(
        maxQuery.map(({ pi_ID, MAX }) => {
          //const oMax = aObraPI.find((item) => max.pi_ID === item.ID);
          return cds.run(
            SELECT.one.from(Partidimetros).where({
              estado_ID: "AP",
              pi_ID: oDiagramasCuadra.pi_ID,
              nro_partidimetro: MAX,
            })
          );
        })
      );

      const aDetallePartidimetro = await cds.run(
        SELECT.from(DetallePartidimetro).where({
          partidimetro_ID: { in: aPartidimetros.map((item) => item.ID) },
        })
      );

      const aPartidimetrosAcum = aPartidimetros.map((oPartidimetro) => {
        const acumulado = aConsumosPartida
          .filter((item) => item.proyecto_inversion_ID === oPartidimetro.pi_ID)
          .reduce((acumulador, elemento) => {
            const clave = `${elemento.proyecto_inversion_ID}-${
              elemento.codigo1
            }-${elemento.codigo2 || ""}-${elemento.codigo3 || ""}-${
              elemento.codigo4 || ""
            }-${elemento.codigo5 || ""}`;
            const oDetallePartidimetro = aDetallePartidimetro.find(
              (item) =>
                item.partidimetro_ID === oPartidimetro.ID &&
                item.codigo1 === elemento.codigo1 &&
                item.codigo2 === elemento.codigo2 &&
                item.codigo3 === elemento.codigo3 &&
                item.codigo4 === elemento.codigo4 &&
                item.codigo5 === elemento.codigo5
            );
            if (!acumulador[clave]) {
              acumulador[clave] = {
                ...elemento,
                cantidad: 0,
                item_partida_ID: oDetallePartidimetro.item_partida_ID,
                subitem_partida_ID: oDetallePartidimetro.subitem_partida_ID,
                tipo_partida_ID: oDetallePartidimetro.tipo_partida_ID,
              };
            }
            acumulador[clave].cantidad =
              Number(elemento.cantidad) + Number(acumulador[clave].cantidad);
            return acumulador;
          }, {});

        const resultado = Object.values(acumulado);

        return { ...oPartidimetro, resultado };
      });
      //Acumulado por pi y codigo

      //aMemoriaCriterios ver logica
      //de donde sale las fechas

      const porcentajeCertificar = aMemoriaCriterios.reduce(
        (acumulador, elemento) => {
          const clave = elemento.subitem_ID;
          if (!acumulador[clave]) {
            acumulador[clave] = 0;
          }

          if (validateFields(oFechas, elemento)) {
            acumulador[clave] += Number(elemento.porcentaje);
          }
          return acumulador;
        },
        {}
      );

      const maxMesAnio = await cds.run(
        SELECT.one
          .from(MemoriaCalculo, [
            "MAX(anio) as max_anio",
            "MAX(mes) as max_mes",
          ])
          .where({
            obra_ID: oDiagramasCuadra.pi_ID,
          })
      );

      const oMemoriaCalculo = await cds.run(
        SELECT.one.from(MemoriaCalculo).where({
          //obra_ID: { in: aObraPI.map((item) => item.ID) },
          obra_ID: oDiagramasCuadra.pi_ID,
          anio: maxMesAnio.max_anio,
          mes: maxMesAnio.max_mes,
        })
      );

      let aMemoriasPartidimetro = [];
      let partidas_contractuales = 0;

      for (const oPartidimetro of aPartidimetrosAcum) {
        const { resultado } = oPartidimetro;

        const aMemoriaPartidas = resultado.map((item) => ({
          pi_ID: item.proyecto_inversion_ID,
          codigo1: item.codigo1,
          codigo2: item.codigo2,
          codigo3: item.codigo3,
          codigo4: item.codigo4,
          codigo5: item.codigo5,
          tipo_partida_ID: item.tipo_partida_ID,
          //cantidad_ultimo_diagrama:
          porcentaje_certificacion:
            porcentajeCertificar[item.subitem_partida_ID],
          cantidad_certificar: Number(item.cantidad),
          monto_certificar:
            (Number(item.cantidad) *
              porcentajeCertificar[item.subitem_partida_ID]) /
              100 || 0,
        }));

        aMemoriasPartidimetro = [...aMemoriasPartidimetro, ...aMemoriaPartidas];

        const partidas_contractuales_for = resultado
          .filter((item) => item.tipo_partida_ID === "CO")
          .reduce((acumulador, elemento) => {
            const monto_certificar =
              (Number(elemento.cantidad) *
                porcentajeCertificar[elemento.subitem_partida_ID]) /
              100;
            return (acumulador += monto_certificar);
          }, 0);

        partidas_contractuales += partidas_contractuales_for;
      }

      const total = aMemoriasPartidimetro.reduce(
        (acumulador, elemento) => (acumulador += elemento.monto_certificar),
        0
      );

      const oMemoriaToUpdate = {
        ...oMemoriaCalculo,
        partidas_contractuales,
        total,
      };

      //Viene un ID de diagrama de cuadra?  ==> Si, llega ID Diagrama cuadra
      //1)	Cambiar DiagramasCuadra.estado_ID a “AP”.

      const [aMemoriaTramos] = await Promise.all([
        cds.run(
          SELECT.from(MemoriaTramos).where({
            tramo_ID: oTramo.ID,
          })
        ),
        cds.run(
          UPDATE(DiagramasCuadra)
            .data({ estado_ID: "AP", memoria_calculo_ID: oMemoriaCalculo.ID })
            .where({ ID })
        ),
        cds.run(
          UPDATE(MemoriaCalculo)
            .data(oMemoriaToUpdate)
            .where({ ID: oMemoriaToUpdate.ID })
        ),
      ]);

      if (aMemoriaTramos.length) {
        const aMemoriaPartidas = await cds.run(
          SELECT.from(MemoriaPartidas).where({
            tramo_memoria_ID: {
              in: aMemoriaTramos.map((item) => item.ID),
            },
          })
        );

        for (const oMemoriaTramos of aMemoriaTramos) {
          const oDataUpdate = {
            ...oMemoriaTramos,
            colocacion: Boolean(oFechas.colocacion),
            prueba_hidraulica: Boolean(oFechas.prueba_hidraulica),
            reparacion_vereda: Boolean(oFechas.reparacion_vereda),
            aprobacion_municipal: Boolean(oFechas.aprobacion_municipal),
            reparacion_pavimento: Boolean(oFechas.reparacion_pavimento),
          };

          await Promise.all([
            cds.run(
              UPDATE(MemoriaTramos)
                .data(oDataUpdate)
                .where({ ID: oDataUpdate.ID })
            ),
            cds.run(
              UPDATE(MemoriaPartidas)
                .data(oDataUpdate)
                .where({ tramo_memoria_ID: oDataUpdate.ID })
            ),
            ...aMemoriasPartidimetro.map((oMemo) => {
              const oFind = aMemoriaPartidas.find(
                (oMemoPartida) =>
                  oMemoriaTramos.ID === oMemoPartida.tramo_memoria_ID &&
                  oMemoPartida.pi_ID === oMemo.pi_ID &&
                  oMemoPartida.codigo1 === oMemo.codigo1 &&
                  oMemoPartida.codigo2 === oMemo.codigo2 &&
                  oMemoPartida.codigo3 === oMemo.codigo3 &&
                  oMemoPartida.codigo4 === oMemo.codigo4 &&
                  oMemoPartida.codigo5 === oMemo.codigo5
              );

              return oFind
                ? cds.run(
                    UPDATE(MemoriaPartidas)
                      .data({
                        ...oMemo,
                        tramo_memoria_ID: oMemoriaTramos.ID,
                      })
                      .where({ ID: oFind.ID })
                  )
                : cds.run(
                    INSERT.into(MemoriaPartidas).entries({
                      ...oMemo,
                      tramo_memoria_ID: oMemoriaTramos.ID,
                    })
                  );
            }),
          ]);
        }
      } else {
        const oDataInsert = {
          tramo_ID: oTramo.ID,
          colocacion: Boolean(oFechas.colocacion),
          prueba_hidraulica: Boolean(oFechas.prueba_hidraulica),
          reparacion_vereda: Boolean(oFechas.reparacion_vereda),
          aprobacion_municipal: Boolean(oFechas.aprobacion_municipal),
          reparacion_pavimento: Boolean(oFechas.reparacion_pavimento),
          memoria_calculo_ID: oMemoriaToUpdate.ID,
        };

        const oInsertTramo = await cds.run(
          INSERT.into(MemoriaTramos).entries(oDataInsert)
        );

        await Promise.all(
          aMemoriasPartidimetro.map((item) => {
            return cds.run(
              INSERT.into(MemoriaPartidas).entries({
                ...item,
                tramo_memoria_ID: oInsertTramo.req.data.ID,
              })
            );
          })
        );
      }

      return req.notify(201, `Diagrama ${ID} aprobado`);
    } catch (error) {
      console.log("ERROR --generateMemoriaCalculo--", error);
      return req.error(400, error);
    }
  });

  const validateFields = (oFechas, elemento) => {
    const oValues = {
      colocacion: null,
      prueba_hidraulica: null,
      reparacion_vereda: null,
      aprobacion_municipal: null,
      reparacion_pavimento: null,
    };

    let oFields = {};

    for (const key in oValues) {
      if (elemento[key]) {
        oFields[key] = true;
      }
    }

    for (const sKey of Object.keys(oFields)) {
      if (!oFechas[sKey]) {
        return false;
      }
    }

    return true;
  };

  const validateFieldsOCE = (oFechas, elemento) => {
    const oValues = {
      fecha_montaje: null,
      fecha_orden_compra: null,
      fecha_pie_obra: null,
      fecha_puesta_marcha: null,
    };

    let oFields = {};

    for (const key in oValues) {
      if (elemento[key]) {
        oFields[key] = true;
      }
    }

    for (const sKey of Object.keys(oFields)) {
      if (!oFechas[sKey]) {
        return false;
      }
    }

    return true;
  };

  srv.before(["CREATE"], "PartesDiarios", async (req) => {
    const { pi_ID } = req.data;
    try {
      const [oData] = await cds.run(`SELECT MAX(NRO_PARTE) AS COUNT 
                                        FROM COM_AYSA_PGO_PARTESDIARIOS 
                                        WHERE PI_ID = '${pi_ID}'`);

      req.data.nro_parte = oData.COUNT + 1;
    } catch (error) {
      console.log("--CREATE PartesDiarios--", error);
      return req.error(
        400,
        `Error al obtener nro maximo PartesDiarios ${obra_ID}`
      );
    }
  });

  srv.before(["CREATE"], "InspeccionesElectro", async (req) => {
    const { pi_ID } = req.data;
    try {
      const [oData] = await cds.run(`SELECT MAX(NRO_ACTA) AS COUNT 
                                        FROM COM_AYSA_PGO_INSPECCIONESELECTRO
                                        WHERE PI_ID = '${pi_ID}'`);

      req.data.nro_acta = oData.COUNT + 1;
    } catch (error) {
      console.log("--CREATE InspeccionesElectro--", error);
      return req.error(
        400,
        `Error al obtener nro maximo InspeccionesElectro ${obra_ID}`
      );
    }
  });

  srv.before(["CREATE"], "InspeccionesCI", async (req) => {
    const { pi_ID } = req.data;
    try {
      const [oData] = await cds.run(`SELECT MAX(NRO_ACTA) AS COUNT 
                                        FROM COM_AYSA_PGO_INSPECCIONESCI
                                        WHERE PI_ID = '${pi_ID}'`);

      req.data.nro_acta = oData.COUNT + 1;
    } catch (error) {
      console.log("--CREATE InspeccionesCiviles--", error);
      return req.error(
        400,
        `Error al obtener nro maximo InspeccionesCiviles ${obra_ID}`
      );
    }
  });

  srv.before(["CREATE"], "ActasTradicion", async (req) => {
    const { inspeccion_electro_ID } = req.data;
    try {
      const [oData] = await cds.run(`SELECT MAX(NRO_ACTA) AS COUNT 
                                        FROM COM_AYSA_PGO_ACTASTRADICION AS ACTATRAD
                                        WHERE ACTATRAD.INSPECCION_ELECTRO_ID = '${inspeccion_electro_ID}'`);

      req.data.nro_acta = oData.COUNT + 1;
    } catch (error) {
      console.log("--CREATE ACTASTRADICION--", error);
      return req.error(
        400,
        `Error al obtener nro maximo ACTASTRADICION ${inspeccion_electro_ID}`
      );
    }
  });

  srv.before(["CREATE"], "ControlesPersonal", async (req) => {
    const { obra_ID, ID } = req.data;
    try {
      const [oData] = await cds.run(`SELECT MAX(NRO_CONTROL) AS COUNT 
                                        FROM COM_AYSA_PGO_CONTROLESPERSONAL
                                        WHERE OBRA_ID = '${obra_ID}'`);
      const [oDataEmpleado] = await cds.run(`SELECT MAX(NRO_EMPLEADO) AS COUNT 
                                        FROM COM_AYSA_PGO_EMPLEADOSCONTROLPERSONAL
                                        WHERE CONTROL_PERSONAL_ID = '${ID}'`);

      let cont = oDataEmpleado.COUNT;
      req.data.empleados.forEach((empleado) => {
        cont++;
        empleado.nro_empleado = cont;
      });
      req.data.nro_control = oData.COUNT + 1;
    } catch (error) {
      console.log("--CREATE ControlesPersonal--", error);
      return req.error(
        400,
        `Error al obtener nro maximo ControlesPersonal ${obra_ID}`
      );
    }
  });

  srv.before(["UPDATE"], "ControlesPersonal", async (req) => {
    const { ID } = req.data;
    try {
      const [oData] = await cds.run(`SELECT MAX(NRO_EMPLEADO) AS COUNT 
                                        FROM COM_AYSA_PGO_EMPLEADOSCONTROLPERSONAL
                                        WHERE CONTROL_PERSONAL_ID = '${ID}'`);

      let cont = oData.COUNT;
      req.data.empleados.forEach((empleado) => {
        if (empleado.nro_empleado == null) {
          cont++;
          empleado.nro_empleado = cont;
        }
      });
    } catch (error) {
      console.log("--CREATE ControlesPersonal--", error);
      return req.error(
        400,
        `Error al obtener nro maximo ControlesPersonal ${obra_ID}`
      );
    }
  });

  srv.on("getPartidasMateriales", async (req) => {
    const { pi_ID } = req.data;
    try {
      const [oData] = await cds.run(
        `SELECT PM.ID FROM COM_AYSA_PGO_PARTIDIMETROS AS PM WHERE PM.ESTADO_ID = 'AP' AND PM.PI_ID = (SELECT ID FROM COM_AYSA_PGO_OBRAPI WHERE ID = '${pi_ID}' AND TIPO_PI_ID = 'EL') AND NRO_PARTIDIMETRO = (SELECT MAX(NRO_PARTIDIMETRO) FROM COM_AYSA_PGO_PARTIDIMETROS WHERE ESTADO_ID = 'AP' AND PI_ID = (SELECT ID FROM COM_AYSA_PGO_OBRAPI WHERE ID = '${pi_ID}' AND TIPO_PI_ID = 'EL'))`
      );

      if (oData && oData.ID) {
        const aDetallesPartidimetro = await cds.run(
          SELECT.from(DetallePartidimetro).where({ partidimetro_ID: oData.ID })
        );

        const resultado = [];
        if (aDetallesPartidimetro.length > 0) {
          for (detalle of aDetallesPartidimetro) {
            let materiales = await cds.run(
              `SELECT DESCRIPCION, CANTIDAD, UNIDAD_MEDIDA_ID, ap.PARTIDA_ID AS PARTIDA_ANALISIS_PRECIO_ID, PRECIO FROM COM_AYSA_PGO_MATERIALESPARTIDA mp JOIN COM_AYSA_PGO_IMPORTESMATERIALES IMPMT ON IMPMT.MATERIAL_ID = mp.ID JOIN COM_AYSA_PGO_ANALISISPRECIOS ap ON mp.PARTIDA_ID = ap.ID WHERE ap.PARTIDA_ID = '${detalle.ID}' AND ap.ESTADO_ID = 'EN' AND ap.NRO_APU = (SELECT MAX(NRO_APU) FROM COM_AYSA_PGO_ANALISISPRECIOS WHERE PARTIDA_ID = '${detalle.ID}')`
            );
            const nuevoObjeto = {
              ID: detalle.ID,
              createdAt: detalle.createdAt,
              createdBy: detalle.createdBy,
              modifiedAt: detalle.modifiedAt,
              modifiedBy: detalle.modifiedBy,
              item_partida_ID: detalle.item_partida_ID,
              subitem_partida_ID: detalle.subitem_partida_ID,
              tipo_partida_ID: detalle.tipo_partida_ID,
              partidimetro_ID: detalle.partidimetro_ID,
              codigo1: detalle.codigo1,
              codigo2: detalle.codigo2,
              codigo3: detalle.codigo3,
              codigo4: detalle.codigo4,
              codigo5: detalle.codigo5,
              fecha_montaje: detalle.fecha_montaje,
              ruta_oc: detalle.ruta_oc,
              nombre_archivo_oc: detalle.nombre_archivo_oc,
              fecha_orden_compra: detalle.fecha_orden_compra,
              item: detalle.item,
              subitem: detalle.subitem,
              designacion: detalle.designacion,
              unidad: detalle.unidad,
              cantidad: detalle.cantidad,
              precio_unitario: detalle.precio_unitario,
              porc_avance_taller: detalle.porc_avance_taller,
              fecha_pie_obra: detalle.fecha_pie_obra,
              fecha_puesta_marcha: detalle.fecha_puesta_marcha,
              //fecha_colocacion: detalle.fecha_colocacion,
              fecha_montaje: detalle.fecha_montaje,
              materiales: materiales.map((material) => ({
                descripcion: material.DESCRIPCION,
                cantidad: Number(material.CANTIDAD),
                um: material.UNIDAD_MEDIDA_ID,
              })),
            };
            resultado.push(nuevoObjeto);
          }
          let resultadoFiltrado = resultado.filter(
            (item) => item.materiales.length > 0
          );
          return resultadoFiltrado;
        }
      }
      return [];
    } catch (error) {
      console.log("--getControlDocumentacionData--", error);
      return req.error(400, error);
    }
  });

  let formatearPartidas = (objeto) => {
    return {
      ID: objeto.DETALLEID,
      codigo1: objeto.CODIGO1,
      codigo2: objeto.CODIGO2,
      codigo3: objeto.CODIGO3,
      codigo4: objeto.CODIGO4,
      codigo5: objeto.CODIGO5,
      precio_unitario: objeto.PRECIO_UNITARIO,
      cantidad: objeto.CANTIDAD,
      descripcion: objeto.DESIGNACION,
      item: objeto.DETALLEITEM,
      item_partida_ID: objeto.DETALLEITEMID,
      subitem: objeto.DETALLESUBITEM,
      subitem_partida_ID: objeto.DETALLESUBITEMID,
      unidad: objeto.UNIDAD,
      unidad_ID: objeto.UNIDAD_PARTIDA_ID,
    };
  };

  let formatearItemsPartidas = (arreglo) => {
    const itemsMap = {};

    arreglo.forEach((objeto) => {
      const itemID = objeto.ID;
      if (!itemsMap[itemID]) {
        itemsMap[itemID] = {
          ID: objeto.ID,
          descripcion: objeto.DESCRIPCION,
          subitems: [],
        };
      }

      const subitemID = objeto.SUBITEMID;
      const subitemDesc = objeto.SUBITEMDESC;
      if (
        !itemsMap[itemID].subitems.some((subitem) => subitem.ID === subitemID)
      ) {
        itemsMap[itemID].subitems.push({
          ID: subitemID,
          descripcion: subitemDesc,
        });
      }
    });

    const itemsNormalizados = Object.values(itemsMap);
    return itemsNormalizados;
  };

  srv.on("getUltimosPartidimetros", async (req) => {
    const { obra_ID } = req.data;
    try {
      const aP3ID = await cds.run(
        `SELECT P3.ID FROM COM_AYSA_PGO_P3 AS P3 WHERE OBRA_ID = '${obra_ID}'`
      );
      let aObraPIID = [];
      for (let p3 of aP3ID) {
        aObraPIID.push(
          await cds.run(
            `SELECT PI.ID FROM COM_AYSA_PGO_OBRAPI AS PI WHERE P3_ID = '${p3.ID}'`
          )
        );
      }
      aObraPIID = aObraPIID.flat();

      if (aObraPIID.length > 0) {
        let aPartidas = [];
        for (pi_ID of aObraPIID) {
          const oCustom = await cds.run(
            `SELECT DETALLEPM.ID AS DETALLEID, DETALLEPM.DESIGNACION, DETALLEPM.ITEM AS DETALLEITEM, DETALLEPM.SUBITEM AS DETALLESUBITEM, DETALLEPM.ITEM_PARTIDA_ID AS DETALLEITEMID, DETALLEPM.SUBITEM_PARTIDA_ID AS DETALLESUBITEMID, DETALLEPM.PRECIO_UNITARIO, DETALLEPM.CANTIDAD, 
            DETALLEPM.CODIGO1, DETALLEPM.CODIGO2, DETALLEPM.CODIGO3, DETALLEPM.CODIGO4, DETALLEPM.CODIGO5, DETALLEPM.UNIDAD, DETALLEPM.UNIDAD_PARTIDA_ID, ITEMPM.ID, ITEMPM.DESCRIPCION, SUBITEMPM.ID AS SUBITEMID, SUBITEMPM.DESCRIPCION AS SUBITEMDESC 
            FROM COM_AYSA_PGO_PARTIDIMETROS AS PARTIDIMETRO 
            JOIN COM_AYSA_PGO_DETALLEPARTIDIMETRO AS DETALLEPM ON DETALLEPM.PARTIDIMETRO_ID = PARTIDIMETRO.ID 
            JOIN COM_AYSA_PGO_ITEMPARTIDIMETRO AS ITEMPM ON DETALLEPM.ITEM_PARTIDA_ID = ITEMPM.ID
            JOIN COM_AYSA_PGO_SUBITEMPARTIDIMETRO AS SUBITEMPM ON DETALLEPM.SUBITEM_PARTIDA_ID = SUBITEMPM.ID 
            WHERE ( DETALLEPM.TIPO_PARTIDA_ID != 'EC' OR DETALLEPM.TIPO_PARTIDA_ID is null ) AND PARTIDIMETRO.ESTADO_ID = 'AP' AND PARTIDIMETRO.PI_ID = '${pi_ID.ID}' 
            AND PARTIDIMETRO.NRO_PARTIDIMETRO = (SELECT MAX(PARTIDIMETRO.NRO_PARTIDIMETRO) FROM COM_AYSA_PGO_PARTIDIMETROS AS PARTIDIMETRO WHERE ESTADO_ID = 'AP' AND PI_ID = '${pi_ID.ID}')`
          );

          if (oCustom.length > 0) {
            let aCodigos = oCustom.map((objeto) => formatearPartidas(objeto));
            let itemsNormalizados = formatearItemsPartidas(oCustom);

            const nuevoObjeto = {
              obraPI_ID: pi_ID.ID,
              partidas: aCodigos,
              items: itemsNormalizados,
            };

            aPartidas.push(nuevoObjeto);
          }
        }

        return aPartidas;
      }

      throw new Error("No hay ningun ObraPI correspondiente a esta obra");
    } catch (error) {
      console.log("--getControlDocumentacionData--", error);
      return req.error(400, error);
    }
  });
  srv.before(["CREATE"], "PruebasHidraulicas", async (req) => {
    const { pi_ID } = req.data;
    try {
      const [oData] = await cds.run(`SELECT MAX(NRO_PH) AS COUNT 
                                        FROM COM_AYSA_PGO_PRUEBASHIDRAULICAS
                                        WHERE PI_ID = '${pi_ID}'`);

      req.data.nro_ph = oData.COUNT + 1;
    } catch (error) {
      console.log("--CREATE PruebasHidraulicas--", error);
      return req.error(
        400,
        `Error al obtener nro maximo PruebasHidraulicas ${pi_ID}`
      );
    }
  });
  srv.before(["CREATE"], "ActasConstatacion", async (req) => {
    const { pi_ID } = req.data;
    try {
      const [oData] = await cds.run(`SELECT MAX(NRO_ACTA) AS COUNT 
                                        FROM COM_AYSA_PGO_ACTASCONSTATACION
                                        WHERE PI_ID = '${pi_ID}'`);

      req.data.nro_acta = oData.COUNT + 1;
    } catch (error) {
      console.log("--CREATE ActasConstatacion--", error);
      return req.error(
        400,
        `Error al obtener nro maximo ActasConstatacion ${pi_ID}`
      );
    }
  });

  srv.before(["CREATE"], "ControlesSostenimiento", async (req) => {
    const { pi_ID } = req.data;
    try {
      const [oData] = await cds.run(`SELECT MAX(NRO_CONTROL) AS COUNT 
                                        FROM COM_AYSA_PGO_CONTROLESSOSTENIMIENTO AS CONTROL
                                        WHERE CONTROL.PI_ID = '${pi_ID}'`);

      req.data.nro_control = oData.COUNT + 1;
    } catch (error) {
      console.log("--CREATE ControlesSostenimiento--", error);
      return req.error(
        400,
        `Error al obtener nro maximo ControlesSostenimiento ${obra_ID}`
      );
    }
  });

  srv.before(["CREATE"], "InspeccionesMedioambiente", async (req) => {
    const { pi_ID } = req.data;
    try {
      const [oData] = await cds.run(`SELECT MAX(NRO_INSPECCION) AS COUNT 
                                        FROM COM_AYSA_PGO_INSPECCIONESMEDIOAMBIENTE AS INSPECCION
                                        WHERE INSPECCION.PI_ID = '${pi_ID}'`);

      req.data.nro_inspeccion = oData.COUNT + 1;
    } catch (error) {
      console.log("--CREATE InspeccionesMedioambiente--", error);
      return req.error(
        400,
        `Error al obtener nro maximo InspeccionesMedioambiente ${obra_ID}`
      );
    }
  });

  srv.on("getConexiones", async (req) => {
    const { pi_ID } = req.data;
    try {
      const aTramosID = await cds.run(
        `SELECT TRAMO.ID FROM COM_AYSA_PGO_TRAMOS AS TRAMO WHERE PI_ID = '${pi_ID}'`
      );

      if (aTramosID.length > 0) {
        let aTramosFormateados = [];
        for (tramo_ID of aTramosID) {
          const oCustom = await cds.run(
            `SELECT CONEXION.PROGRESIVA, CONEXION.ID AS CONEXION_ID, CONEXION.NRO_PROPIEDAD, DIAGRAMA.ID FROM COM_AYSA_PGO_DIAGRAMASCUADRA AS DIAGRAMA
            JOIN COM_AYSA_PGO_PLANIMETRIAS AS PLANIMETRIA ON PLANIMETRIA.DIAGRAMA_ID = DIAGRAMA.ID
            JOIN COM_AYSA_PGO_GRUPOSCONEXIONES AS GRUPOCONEXION ON GRUPOCONEXION.PLANIMETRIA_ID = PLANIMETRIA.ID
            JOIN COM_AYSA_PGO_CONEXIONES AS CONEXION ON CONEXION.GRUPOS_CONEXIONES_ID = GRUPOCONEXION.ID
            WHERE CONEXION.ES_BOCA_REGISTRO = FALSE AND DIAGRAMA.ESTADO_ID = 'AP' AND DIAGRAMA.TRAMO_ID = '${tramo_ID.ID}' 
            AND DIAGRAMA.NRO_DIAGRAMA = (SELECT MAX(DIAGRAMA.NRO_DIAGRAMA) FROM COM_AYSA_PGO_DIAGRAMASCUADRA AS DIAGRAMA WHERE ESTADO_ID = 'AP' AND TRAMO_ID = '${tramo_ID.ID}')`
          );

          if (oCustom.length > 0) {
            let aObjetos = oCustom.map((objeto) => {
              aTramosFormateados.push({
                tramo_ID: tramo_ID.ID,
                progresiva: parseFloat(objeto.PROGRESIVA),
                nro_propiedad: objeto.NRO_PROPIEDAD,
                conexion_ID: objeto.CONEXION_ID,
              });
            });
          }
        }
        return aTramosFormateados;
      }

      throw new Error("No hay ningun Tramo correspondiente a esta obra");
    } catch (error) {
      console.log("--getConexiones--", error);
      return req.error(400, error);
    }
  });

  srv.on("actualizarDocsPre", async (req, res) => {
    const {
      p3,
      documentoPreconstruccion,
      decision,
      rol,
      usuario,
      observaciones,
    } = req.data;

    try {
      let promises = [];
      const oDocumentosPreconstruccion = await cds.run(
        SELECT.one
          .from(DocumentosPreconstruccion)
          .where({ ID: documentoPreconstruccion })
      );
      if (!oDocumentosPreconstruccion) {
        return req.error(
          400,
          `No se encontró un Documento de Preconstruccion para el ID: ${documentoPreconstruccion}`
        );
      }
      let oCatalogoDocumento = await cds.run(
        SELECT.one
          .from(CatalogoDocumentos)
          .where({ ID: oDocumentosPreconstruccion.catalogo_documentos_ID })
      );
      let oArea = await cds.run(
        SELECT.one.from(Areas).where({ ID: oCatalogoDocumento.area_ID })
      );
      await cds.run(
        UPDATE(AprobadoresDocumentoPreconstruccion)
          .data({
            decision_ID: decision,
            observaciones: observaciones,
          })
          .where({
            documento_preconstruccion_ID: oDocumentosPreconstruccion.ID,
            rol_ID: rol,
            usuario: usuario,
          })
      );

      if (oDocumentosPreconstruccion.unificado) {
        if (decision == "AP") {
          if (!oArea.area_aprueba_doc) {
            promises.push(
              cds.run(
                UPDATE(DocumentosPreconstruccion)
                  .data({
                    estado_ID: "PA",
                  })
                  .where({ ID: oDocumentosPreconstruccion.ID })
              )
            );
          } else {
            promises.push(
              cds.run(
                UPDATE(DocumentosPreconstruccion)
                  .data({
                    estado_ID: "AP",
                  })
                  .where({ ID: documentoPreconstruccion })
              )
            );
          }
        } else {
          promises.push(
            cds.run(
              UPDATE(DocumentosPreconstruccion)
                .data({
                  estado_ID: "RE",
                })
                .where({ ID: oDocumentosPreconstruccion.ID })
            )
          );
        }
      }
      if (!oDocumentosPreconstruccion.unificado) {
        if (decision == "RE") {
          promises.push(
            cds.run(
              UPDATE(DocumentosPreconstruccion)
                .data({
                  estado_ID: "RE",
                })
                .where({ ID: oDocumentosPreconstruccion.ID })
            )
          );
        } else {
          const aPi = await cds.run(SELECT.from(ObraPI).where({ p3_ID: p3 }));

          const aAprobadoresPorPI = await cds.run(
            SELECT.from(AprobadoresDocumentoPreconstruccion).where({
              pi_ID: { in: aPi.map((pi) => pi.ID) },
            })
          );
          if (
            aAprobadoresPorPI.length &&
            aAprobadoresPorPI.every(
              (aprobador) => (aprobador.decision_ID = "AP")
            )
          ) {
            if (!oArea.area_aprueba_doc) {
              promises.push(
                cds.run(
                  UPDATE(DocumentosPreconstruccion)
                    .data({
                      estado_ID: "AP",
                    })
                    .where({ ID: oDocumentosPreconstruccion.ID })
                )
              );
            } else {
              promises.push(
                cds.run(
                  UPDATE(DocumentosPreconstruccion)
                    .data({
                      estado_ID: "PA",
                    })
                    .where({ ID: oDocumentosPreconstruccion.ID })
                )
              );
            }
          }
        }
      }

      await Promise.all(promises);
    } catch (error) {
      console.log("ERROR UPDATE ACTUALIZAR ACTUALIZAR DOCS PRE-->", error);
      return req.error(400, error);
    }
  });
  srv.on("cierreMemoriaCalculo", async (req, res) => {
    const { ID, tipo_memoria } = req.data;

    try {
      let promises = [];
      if (tipo_memoria == "RE") {
        const oMemoriaCalculoRedes = await cds.run(
          SELECT.one.from(MemoriaCalculo).where({ ID })
        );
        if (!oMemoriaCalculoRedes) {
          return req.error(
            400,
            `No se encontró una memoria de calculo para el ID: ${ID}`
          );
        }
        await cds.run(
          UPDATE(MemoriaCalculo)
            .data({
              estado_ID: "FI",
            })
            .where({
              ID,
            })
        );
      }
      if (tipo_memoria == "EL") {
        const oMemoriaCalculoEL = await cds.run(
          SELECT.one.from(MemoriaCalculoEL).where({ ID })
        );
        if (!oMemoriaCalculoEL) {
          return req.error(
            400,
            `No se encontró una memoria de calculo para el ID: ${ID}`
          );
        }
        await cds.run(
          UPDATE(MemoriaCalculoEL)
            .data({
              estado_ID: "FI",
            })
            .where({
              ID,
            })
        );
      }

      await Promise.all(promises);
    } catch (error) {
      console.log("ERROR UPDATE Memoria Calculo-->", error);
      return req.error(400, error);
    }
  });

  srv.on("obtenerHistorialNdpOds", async (req, res) => {
    const { ID, tipo_documento } = req.data;

    try {
      const historial = await obtenerHistorialOrdenado(ID, tipo_documento);

      historial.sort((a, b) => {
        const fechaA =
          tipo_documento === "ods" ? a.FECHA_ENVIO_ODS : a.FECHA_ENVIO_NDP;
        const fechaB =
          tipo_documento === "ods" ? b.FECHA_ENVIO_ODS : b.FECHA_ENVIO_NDP;
        return new Date(fechaA) - new Date(fechaB);
      });

      const resultado = historial.map((entidad) => {
        const tipo_comunicacion =
          entidad.tipo_documento === "ods"
            ? "Orden de Servicio"
            : "Nota de Pedido";
        const nro =
          entidad.tipo_documento === "ods"
            ? entidad.NRO_ORDEN.toString()
            : entidad.NRO_NOTA.toString();
        const fecha_envio =
          entidad.tipo_documento === "ods"
            ? entidad.FECHA_ENVIO_ODS
            : entidad.FECHA_ENVIO_NDP;
        const rta_nro = entidad.NRO_RESPUESTA
          ? entidad.NRO_RESPUESTA.toString()
          : "";
        const responsable = entidad.EMISOR ? entidad.EMISOR : "Contratista";
        const id = entidad.ID_VIAJE;
        const envelopeId =
          entidad.tipo_documento === "ods"
            ? entidad.ENVELOPE_ORDEN
            : entidad.ENVELOPE_NDP;

        return {
          id,
          tipo_comunicacion,
          nro,
          fecha_envio,
          rta_nro,
          responsable,
          envelopeId,
        };
      });

      const esUnico = (valor, indice, self) => {
        const indiceDuplicado = self.findIndex(
          (elemento) =>
            elemento.tipo_comunicacion === valor.tipo_comunicacion &&
            elemento.nro === valor.nro &&
            elemento.fecha_envio === valor.fecha_envio &&
            elemento.envelopeId === valor.envelopeId &&
            elemento.id === valor.id &&
            elemento.responsable === valor.responsable
        );

        return indice === indiceDuplicado;
      };

      const historialFiltrado =
        ordenarIntercalarComunicaciones(resultado).filter(esUnico);
      return historialFiltrado;
    } catch (error) {
      console.error("ERROR obtenerHistorialNdpOds -->", error);
      return req.error(400, error);
    }
  });

  async function obtenerHistorialOrdenado(idEntidad, tipoDocumento) {
    const historial = [];

    async function buscarHistorial(
      idEntidad,
      tipoDocumento,
      processedIds = new Set()
    ) {
      try {
        if (processedIds.has(idEntidad)) {
          return; // Evitar procesar la misma entidad más de una vez
        }

        processedIds.add(idEntidad);

        let entidad;

        if (tipoDocumento === "ods") {
          entidad = await cds.run(`
            SELECT 
              OrdenesServicio.ID AS ID_VIAJE,
              OrdenesServicio.NRO_ORDEN_SERVICIO AS nro_orden,
              OrdenesServicio.ENVELOPEID AS envelope_orden,
              OrdenesServicio.RESPUESTA_ID AS ods_respuesta_id,
              NotasPedido.NRO_NOTA_PEDIDO AS nro_nota,
              NotasPedido.ID AS id,
              OrdenesServicio.FECHA_ENVIO AS fecha_envio_ods,
              NotasPedido.FECHA_ENVIO AS fecha_envio_ndp,
              NotasPedido.ENVELOPEID AS envelope_ndp,
              NDPRESPUESTA.NRO_NOTA_PEDIDO as NRO_RESPUESTA,
              NDPRESPUESTA.ID as NDRP_RESPUESTA_ID,
              OrdenesServicio.Emisor AS emisor
            FROM COM_AYSA_PGO_ORDENESSERVICIO AS OrdenesServicio
            LEFT JOIN COM_AYSA_PGO_NOTASPEDIDO AS NotasPedido ON NotasPedido.orden_servicio_ID = OrdenesServicio.ID
            LEFT JOIN COM_AYSA_PGO_NOTASPEDIDO AS NDPRESPUESTA ON NDPRESPUESTA.ID = OrdenesServicio.RESPUESTA_ID
            WHERE OrdenesServicio.ID = '${idEntidad}'
          `);
        } else if (tipoDocumento === "ndp") {
          entidad = await cds.run(`
            SELECT 
              NotasPedido.ID AS ID_VIAJE,
              NotasPedido.NRO_NOTA_PEDIDO AS nro_nota,
              NotasPedido.ENVELOPEID AS envelope_ndp,
              OrdenesServicio.RESPUESTA_ID AS ods_respuesta_id,
              OrdenesServicio.NRO_ORDEN_SERVICIO AS nro_orden,
              OrdenesServicio.ID AS id,
              OrdenesServicio.FECHA_ENVIO AS fecha_envio_ods,
              NotasPedido.FECHA_ENVIO AS fecha_envio_ndp,
              OrdenesServicio.ENVELOPEID AS envelope_orden,
              ORDENRESPUESTA.NRO_ORDEN_SERVICIO AS NRO_RESPUESTA,
              ORDENRESPUESTA.ID AS ODS_RESPUESTA_ID
            FROM COM_AYSA_PGO_NOTASPEDIDO AS NotasPedido
            LEFT JOIN COM_AYSA_PGO_ORDENESSERVICIO AS OrdenesServicio ON OrdenesServicio.respuesta_ID = NotasPedido.ID
            JOIN COM_AYSA_PGO_ORDENESSERVICIO AS ORDENRESPUESTA ON ORDENRESPUESTA.ID = NotasPedido.ORDEN_SERVICIO_ID
            WHERE NotasPedido.ID = '${idEntidad}'
          `);
        }

        if (entidad && entidad.length > 0) {
          for (const respuesta of entidad) {
            tipoDocumento === "ods"
              ? (respuesta["tipo_documento"] = "ods")
              : (respuesta["tipo_documento"] = "ndp");
            historial.unshift(respuesta);

            // Llamada recursiva para subir en el árbol
            if (tipoDocumento === "ods" && respuesta.NDRP_RESPUESTA_ID) {
              await buscarHistorial(
                respuesta.NDRP_RESPUESTA_ID,
                "ndp",
                processedIds
              );
            } else if (tipoDocumento === "ndp" && respuesta.ODS_RESPUESTA_ID) {
              await buscarHistorial(
                respuesta.ODS_RESPUESTA_ID,
                "ods",
                processedIds
              );
            }

            // Llamada recursiva para bajar en el árbol
            if (respuesta && respuesta.ID) {
              if (tipoDocumento === "ods") {
                await buscarHistorial(respuesta.ID, "ndp", processedIds);
              } else if (tipoDocumento === "ndp") {
                await buscarHistorial(respuesta.ID, "ods", processedIds);
              }
            }
          }
        }
      } catch (error) {
        console.log(error);
      }
    }

    await buscarHistorial(idEntidad, tipoDocumento);
    let historialFlat = historial.flat();
    return historialFlat;
  }

  function ordenarIntercalarComunicaciones(arrayOriginal) {
    const arrayOrdenado = [];
    let indiceUltimoPedido = -1;

    // Ordenar por nro de Orden de Servicio
    arrayOriginal.sort((a, b) =>
      a.tipo_comunicacion === "Orden de Servicio" &&
      b.tipo_comunicacion === "Orden de Servicio"
        ? a.nro - b.nro
        : -1
    );

    for (const objeto of arrayOriginal) {
      if (objeto.tipo_comunicacion === "Orden de Servicio") {
        // Si no está duplicada, agregar la Orden de Servicio
        if (!arrayOrdenado.find((obj) => obj.id === objeto.id)) {
          arrayOrdenado.push(objeto);
        }

        const nroRta = objeto.rta_nro;
        const indiceNotaPedido = arrayOriginal.findIndex(
          (objeto) =>
            objeto.tipo_comunicacion === "Nota de Pedido" &&
            objeto.nro === nroRta
        );

        if (indiceNotaPedido !== -1) {
          // Si no está duplicada, agregar la Nota de Pedido
          if (
            !arrayOrdenado.find(
              (obj) => obj.id === arrayOriginal[indiceNotaPedido].id
            )
          ) {
            arrayOrdenado.push(arrayOriginal[indiceNotaPedido]);
            indiceUltimoPedido = indiceNotaPedido;
          }
        }
      } else if (objeto.tipo_comunicacion === "Nota de Pedido") {
        const nroRta = objeto.rta_nro;
        const indiceOrdenServicio = arrayOriginal.findIndex(
          (objeto) =>
            objeto.tipo_comunicacion === "Orden de Servicio" &&
            objeto.nro === nroRta
        );

        if (
          indiceOrdenServicio !== -1 &&
          indiceOrdenServicio > indiceUltimoPedido
        ) {
          // Si no está duplicada, agregar la Orden de Servicio
          if (
            !arrayOrdenado.find(
              (obj) => obj.id === arrayOriginal[indiceOrdenServicio].id
            )
          ) {
            arrayOrdenado.push(arrayOriginal[indiceOrdenServicio]);
          }
        }

        // Si no está duplicada, agregar la Nota de Pedido
        if (!arrayOrdenado.find((obj) => obj.id === objeto.id)) {
          arrayOrdenado.push(objeto);
        }
      }
    }

    return arrayOrdenado;
  }
};

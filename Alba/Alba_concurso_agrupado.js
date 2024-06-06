function main(data) {

	// Obtener el mail del usuario (concursos)
	var mUser = Ax.db.call('userAutConc', Ax.db.getUser());

	//Llamar al css de la pagina
	var mCss = Ax.db.call('cssConcursosAgrupado');

	/* ============================================
		Comprobar que el usuario esta autorizado
	============================================ */

	if (mUser == null) {

		return Ax.db.call('returnNoAut', mCss);

	} else {

		/* ====================================================================================
			Comprobar que el usuario (email) es el contacto para el proveedor en esta oferta
			- si es null -> No autorizado
		==================================================================================== */

		var mAutorizado = Ax.db.of('erp_t5').executeGet(`
			<select oracle='ansi'>
				<columns>
					DISTINCT
					gcomofeh.tercer
				</columns>
				<from table='gcomofeh'>
					<join table='gcomconh'>
						<on>gcomofeh.docori= gcomconh.docser</on>
						<join table='gcomconl'>
							<on>gcomconh.cabid= gcomconl.cabid</on>
							<join table='gcomofeh_orig'>
								<on>gcomofeh.cabid = gcomofeh_orig.cabofe</on>
								<on>gcomconl.linid = gcomofeh_orig.lincon</on>
								<on>gcomofeh.tercer = gcomofeh_orig.tercer</on>
							</join>
							<join table='gcomcong'>
								<on>gcomconl.linid = gcomcong.lincon</on>
								<join table='gcontact'>
									<on>gcomcong.linid = gcontact.linid</on>
									<on>gcomcong.cabid = gcontact.cabid</on>
								</join>
							</join>
						</join>
					</join>
				</from>
				<where>
					gcomconh.docser = '${data.docori}'
					AND gcontact.tercer = gcomofeh.tercer
					AND gcontact.email = '${mUser}'
				</where>
			</select>
		`)

		if (mAutorizado == null) {

			return new Ax.net.HttpResponseBuilder()
			.seeOther("/service/rest/gestele5/mediaset/v1/api/concurso/listado?mResponse=No+Autorizado")
			.status(303)
			.build();

		}else{

			// El boton de envio cambiará dependiendo de si hay ofertas o no
			var mHtmlBoton = '';
			var mHtmlBtnEnviar = '';
			var mHtmlOfer = '';
			var mHtmlOfertas = '';
			var mRecClass = '';
			var mEstlin='';
			var mStyle='';
			var mDisabled = '';
			var mHtmlEnviarDocs='';
			var mContBorrar=0;
			var mHtmlTh='';
			var mRequiredDoc = '';
			var mHtmlDocs = '';
			var mHtmlRechazar = '';

	

			/* ========================================================
				Obtener la información de la cabecera del concurso
			======================================================= */

			var mCabCon = Ax.db.of('erp_t5').executeQuery(`
				<select>
					<columns>
						distinct
						gcomconh.docser,

						CASE WHEN (SELECT COUNT(DISTINCT gcon.tercer) FROM gcontact gcon where gcon.cabid = gcomconh.cabid and gcon.envcon = 1) > 1
							THEN 'CONCURSO:'
							ELSE 'SOLIC. OFERTA:'
						END  <alias name='docori_box'/>,

						TO_CHAR(gcomconh.fecfin, '%d-%m-%Y') fecfin,
						TO_CHAR(gcomconh.pubfin, '%d-%m-%Y') pubfin,
						gcomconh.estcab <alias name='estcab_con'/>,
						gcomconh_note.data,
						CASE
							WHEN DATE(TODAY) > DATE(gcomconh.pubfin)
								THEN  1
								ELSE 0
						END pubfin_superada
					</columns>
					<from table='gcomconh'>
						<join type='left' table="gcomconh_note">
							<on>gcomconh.cabid= gcomconh_note.cabid</on>
						</join>
						<join table='gcomcong'>
							<on>gcomconh.cabid = gcomcong.cabid</on>
							<join table='gcontact'>
								<on>gcomcong.linid = gcontact.linid</on>
								<on>gcomcong.cabid = gcontact.cabid</on>
							</join>
						</join>
					</from>
					<where>
						gcomconh.docser = '${data.docori}'
						AND gcontact.email = '${mUser}'
					</where>
					<order>3 desc</order>
				</select>
			`).toOne();

			//Obtener la observacion comun a todas las ofertas

			var mComent = Ax.db.of('erp_t5').executeGet(`
				<select first='1'>
					<columns>
						NVL(gcomofeh.coment, '') coment
					</columns>
					<from table='gcomofeh'>
					</from>
					<where>
						gcomofeh.docori = '${data.docori}'
						AND gcomofeh.tercer  = '${mAutorizado}'
					</where>
				</select>
			`);

			/* ===========================================================================
				Comprobar si el el concurso esta anulado, cerrado o pasado de fecha
			========================================================================== */

			mCondError = '';

			if(mCabCon.estcab_con =='N' || mCabCon.estcab_con =='C' || mCabCon.pubfin_superada == 1 ){


				switch (mCabCon.estcab_con) {
					case 'N':
						mCondError += `<div class="incorrecto campo">IMPORTANTE: Este concurso esta ANULADO. Sólo puede visualizar los datos de la oferta.</div>`;
					break;
					case 'C':
						mCondError += `<div class="incorrecto campo">IMPORTANTE: Este concurso esta CERRADO. Sólo puede visualizar los datos de la oferta.</div>`;
					break;
				}

				if(mCabCon.pubfin_superada == 1){
					mCondError += `<div class="incorrecto campo">IMPORTANTE: Fecha límite de concurso superada. Sólo puede visualizar los datos de la oferta.</div>`;
				}

			}

			/* ============================================================================
				Comprobar que puede pulsar el boton de enviar documentos
				- Puede pulsar el boton de enviar documentos si ya hay ofertas enviadas
			============================================================================ */

			var  mCabidOfe = Ax.db.of('erp_t5').executeGet(`
			<select first='1'>
				<columns>
					gcomofel.cabid
				</columns>
				<from table='gcomofel'>
					<join table='gcomofeh'>
						<on>gcomofeh.cabid = gcomofel.cabid</on>0
					</join>
				</from>
				<where>
					gcomofeh.docori = '${data.docori}'
					AND gcomofeh.tercer = '${mAutorizado}'
				</where>
			</select>`)

			if (mCabidOfe != null){
				mHtmlEnviarDocs = `
				<div class="fila">
					<button type="button" id="enviar_docs" class="btn_enviar" onclick="enviarDocs('b')">Enviar documentos</button>
				</div>
				`
			}

			/* ============================================================================
				Comprobar si ya hay documentos asociados al concurso para este proveedor
				- Si no hay documentos, será OBLIGATORIO adjuntar uno
			============================================================================ */

			var mRsDocs = Ax.db.of('erp_t5').executeQuery(`
			<select>
				<columns>
					gcomofeh_docs.seqno,
					REPLACE(gcomofeh_docs.file_name,'[Doc.PROVEEDOR]','') file_name,
					gcomofeh_docs.file_type,
					gcomofeh_docs.file_size,
					gcomofeh_docs.file_data,
					gcomofeh_docs.file_date
				</columns>
				<from table='gcomofeh'>
					<join table='gcomofeh_docs'>
						<on>gcomofeh_docs.cabid = gcomofeh.cabid</on>
					</join>
				</from>
				<where>
					gcomofeh.docori = '${data.docori}'
					AND gcomofeh.tercer = '${mAutorizado}'
				</where>
			</select>
			`).toMemory();

			if (mRsDocs.getRowCount() == 0){
				mRequiredDoc = `required`
			}else{

				mRsDocs.forEach( mRowDocs => {

					var enlace = ''

					var encode = Ax.util.Base64.encode(mRowDocs.file_data)
					var string = `data:${mRowDocs.file_type};base64,${encode}`
					enlace = `<a style="text-decoration:none;color:black;" class="campo btn_des" href="${string}" download="${mRowDocs.file_name}"><span class="mdi mdi-arrow-down-bold-box" style="font-size: 24px;"></span></a>`
					mHtmlDocs += `<div class="fila_ficheros">${enlace}<span class="campo btn_del mdi mdi-delete" name="${mRowDocs.seqno}" style="font-size: 24px;" onclick="eliminarDoc(this)"></span><div class="campo2 campo" style="background-color:white;">${mRowDocs.file_name}</div></div>`

				})

				// si existen ficheros
				
				if( mHtmlDocs != ''  ){
					
					mHtmlDocs = `


					<div style="margin-bottom:0px">
						${mHtmlDocs}
					</div>

					`
					
				}
			}

			// Include de sobre el campo (mirar wic_iges_t5 -> version antigua)
			var mObjRech = {
				"": "-- Ninguno --",
				"NFAB": "NO TRABAJO CON ESE FABRICANTE",
				"NSTOCK": "NO STOCK",
				"DESC": "DESCATALOGADO"
			}
			
			for (campo in mObjRech){

				mHtmlRechazar += `
				<option value="${campo}">${mObjRech[campo]}</option>`;

			}

			/* ====================================================
				Obtener todas las ofertas asociadas al concurso
			=================================================== */

			var mRsOfertas = Ax.db.of('erp_t5').executeQuery(`
				<select>
					<columns>
						distinct
						gcomofeh.cabid,
						gcomofeh.docser,
						gcomconh.pubfin,
						gcomconh.codcom,
						gcomofeh.estcab <alias name='estcab_ofe'/>,
						gcomofeh.auxchr5,
						gcomofeh.auxnum1 <alias name='provee_notif'/>,
						NVL(gcomsoll.auxchr7,'-') auxchr7,
						NVL(gcomsoll.auxchr8,'-') auxchr8,
						CASE WHEN <length>gcomconl.desvar</length> &gt; 0
							THEN gcomconl.desvar
							ELSE garticul.nomart
						END <alias name='desvar' />,
						ROUND(gcomconl.canpro,0) <alias name='canpro'/>,
						gcomconl.linid linid_concur,
						gcomofeh.docori,
						gcomofeh.tercer
					</columns>
					<from table='gcomofeh'>
						<join table='gcomconh'>
							<on>gcomofeh.docori= gcomconh.docser</on>
							<join table='gcomconl'>
								<on>gcomconh.cabid= gcomconl.cabid</on>
								<join table='gcomofeh_orig'>
									<on>gcomofeh.cabid = gcomofeh_orig.cabofe</on>
									<on>gcomconl.linid = gcomofeh_orig.lincon</on>
									<on>gcomofeh.tercer = gcomofeh_orig.tercer</on>
								</join>
								<join table='gcomcong'>
									<on>gcomconl.linid = gcomcong.lincon</on>
									<on>gcomconl.cabid = gcomcong.cabid</on>
									<join table='gcontact'>
										<on>gcomcong.linid = gcontact.linid</on>
										<on>gcomcong.cabid = gcontact.cabid</on>
										<on>gcontact.tercer = gcomofeh.tercer</on>
										<on>gcontact.cabofe = gcomofeh.cabid</on>
									</join>
								</join>
								<join table='gcomsoll'>
									<on>(gcomsoll.lincon=gcomconl.linid OR gcomsoll.linid = gcomconl.auxnum1)</on>
								</join>
								<join type='left' table='garticul'>
									<on>gcomconl.codart = garticul.codigo</on>
								</join>
							</join>
						</join>
					</from>
					<where>
						gcontact.email = '${mUser}'
						AND gcomofeh.docori = '${data.docori}'
					</where>
					<order>2 desc</order>
				</select>
			`).toMemory();

			// Comprobar que hay ofertas con estado 'E', que se puedan borrar

			var mCountBorrar = Ax.db.of('erp_t5').executeGet(`
			<select>
				<columns>
					count(gcomofel.linid)
				</columns>
				<from table='gcomofeh'>
					<join table='gcomconh'>
						<on>gcomconh.docser = gcomofeh.docori</on>
						<join table='gcomconl'>
							<on>gcomconh.cabid = gcomconl.cabid</on>
							<join table='gcomofeh_orig'>
								<on>gcomofeh.cabid = gcomofeh_orig.cabofe</on>
								<on>gcomconl.linid = gcomofeh_orig.lincon</on>
								<on>gcomofeh.tercer = gcomofeh_orig.tercer</on>
							</join>
						</join>
					</join>
					<join table='gcomofel'>
						<on>gcomofeh.cabid = gcomofel.cabid</on>
						<join type='left' table='cerrcode'>
							<on>gcomofel.errlin = cerrcode.codigo</on>
						</join>
					</join>
				</from>
				<where>
					gcomofel.estlin = 'E'
					AND gcomofeh.docori = '${data.docori}'
					AND gcomofeh.tercer = '${mAutorizado}'
				</where>
			</select>
			`);

			/* =================================================================
				Por cada oferta, buscar las lineas subidas por el proveedor
				- ultima (estlin = 'V' ) o actual (estlin = 'E')
			================================================================ */

			mRsOfertas.forEach( row => {

				var mHtmlBtnBorrarOfe='';
				var mReadOnly='';
				var mMotRech ='';
				var mMotRechSpan ='';
				var mMotRechTr ='';

				row.desvar = row.desvar.replace('https://', 'URL : ')

				/* =======================================================================
					Comprobar si la oferta ha sido rechazada por el proveedor
				======================================================================= */

				if( row.auxchr5 != null ){
					// mRecClass = `class="rechazada"`;
					mEstlin='Rechazada';
					mStyle = `style="background-color:#ffc8c8; color: #ff4141 ;"`;
					//mDisabled = `disabled`;
				}

				
				/* =========================================
					Obtener si la oferta ya tiene lineas
				========================================= */

				mLinidActu = Ax.db.of('erp_t5').executeGet(`
					<select oracle='ansi'>
						<columns>
							MAX(linid)
						</columns>
						<from table='gcomofel'>
							<join table='gcomofeh'>
								<on>gcomofeh.cabid = gcomofel.cabid</on>
							</join>
						</from>
						<where>
							gcomofel.cabid  = ${row.cabid}
						</where>
					</select>
				`);

				/* =======================================================================
					En caso de que tenga lineas obtengo la ultima, que NO SEA LA ACTUAL
				======================================================================= */

				if(mLinidActu != null){

					var mOfe = Ax.db.of('erp_t5').executeQuery(`
						<select>
							<columns>
								TO_CHAR(DATE(gcomofel.auxfec1), '%Y-%m-%d') auxfec1_date,
								TO_CHAR(gcomofel.auxfec1, '%d-%m-%Y %H:%M:%S') auxfec1,
								ROUND(NVL(gcomofel.precio,0),2) prepro,
								ROUND(NVL(gcomofel.dtolin,0),2) dtopro,
								ROUND(NVL(gcomofel.auxnum3,0),2) auxnum3_ofel,
								ROUND(NVL(gcomofel.impnet,0),2) imppro,
								gcomofel.auxchr3,
								gcomofel.auxfec3,
								NVL(gcomofel.auxchr1, '') auxchr1,
								gcomofel.linid,
								gcomofel.estlin,
								gcomofel.errlin,
								gcomofel.wkflin,
								gcomofel.auxnum2, <!-- Rechaza por el gestor -->
								gcomofel.auxchr2 <!-- Motivo de rechazo del gestor -->
							</columns>
							<from table='gcomofel'>
								<join table='gcomofeh'>
									<on>gcomofeh.cabid = gcomofel.cabid</on>
									<join table='gcomconh'>
										<on>gcomofeh.docori= gcomconh.docser</on>
										<join table='gcomconl'>
											<on>gcomconh.cabid= gcomconl.cabid</on>
											<join table='gcomofeh_orig'>
												<on>gcomofeh.cabid = gcomofeh_orig.cabofe</on>
												<on>gcomconl.linid = gcomofeh_orig.lincon</on>
												<on>gcomofeh.tercer = gcomofeh_orig.tercer</on>
											</join>
										</join>
									</join>
								</join>
							</from>
							<where>
								gcomofel.cabid  = ${row.cabid}
								<!-- AND gcomofel.estlin != 'E'-->
								AND gcomofel.linid IN ( SELECT MAX(linid) FROM gcomofel, gcomofeh WHERE gcomofel.cabid = gcomofeh.cabid <!-- AND gcomofel.estlin != 'E' --> and gcomofel.cabid = ${row.cabid})
							</where>
						</select>
					`).toOne();

					// Si hay linid en la oferta actual, dar la opción de borrar la oferta actual

					if(mCountBorrar !== 0){
						
						if (mOfe.linid != null && mOfe.estlin == 'E'){
							mContBorrar++;
							mHtmlBtnBorrarOfe = `
								<td>
									<span class="campo btn_del mdi mdi-delete" style="font-size: 24px;" onclick="borrarOferta(this)"></span>
								</td>
							`
							mReadOnly = `readonly`;
	
						}else{
							mHtmlBtnBorrarOfe = `
								<td>
								</td>
							`
						}
					}
					

				}else{

					var mOfe = Ax.db.of('erp_t5').executeQuery(`
						<select first='1'>
							<columns>
								gcomofel.wkflin,
								gcomofel.errlin,
								cerrcode.nomerr,
								gcomofel.estlin,
								CASE WHEN gcomofel.precio IS NULL
									THEN ROUND(gcomconl.prepro,2)
									ELSE ROUND(NVL(gcomofel.precio,0),2)
								END prepro,
								CASE WHEN gcomofel.dtolin IS NULL
									THEN ROUND(gcomconl.dtopro,2)
									ELSE ROUND(NVL(gcomofel.dtolin,0),2)
								END dtopro,
								CASE WHEN gcomofel.impnet IS NULL
									THEN ROUND(gcomconl.imppro,2)
									ELSE ROUND(NVL(gcomofel.impnet,0),2)
								END imppro,
								ROUND(NVL(gcomofel.auxnum3,0),2) auxnum3_ofel,
								NVL(<cast type='lvarchar' size='1024'>gcomofel.auxchr1</cast>,'') auxchr1,
								gcomofel.auxchr3,
								gcomofel.auxfec3,
								gcomofel.linid,
								gcomofel.auxnum2, <!-- Rechaza por el gestor -->
								gcomofel.auxchr2 <!-- Motivo de rechazo del gestor -->
							</columns>
							<from table='gcomofeh'>
								<join table='gcomconh'>
									<on>gcomconh.docser = gcomofeh.docori</on>
									<join table='gcomconl'>
										<on>gcomconh.cabid = gcomconl.cabid</on>
										<join table='gcomofeh_orig'>
											<on>gcomofeh.cabid = gcomofeh_orig.cabofe</on>
											<on>gcomconl.linid = gcomofeh_orig.lincon</on>
											<on>gcomofeh.tercer = gcomofeh_orig.tercer</on>
										</join>
									</join>
								</join>
									<!-- Esta join nos dice que las que vayan con gcomofel son la oferta borrador aun sin validar -->
									<join table='gcomofel' type='left'>
										<on>gcomofeh.cabid = gcomofel.cabid</on>
										<join type='left' table='cerrcode'>
											<on>gcomofel.errlin = cerrcode.codigo</on>
										</join>
									</join>
								<join type='left' table='garticul'>
									<on>gcomconl.codart = garticul.codigo</on>
								</join>
							</from>
							<where>
								gcomofel.estlin ='E' AND
								gcomofeh.cabid = ${row.cabid}
							</where>
						</select>
					`).toOne();

				}

				if(mOfe.linid != null) {

					// Adaptar el campo de fecha
					if(mOfe.auxfec3 != null){
						mOfe.auxfec3 = new Date(mOfe.auxfec3);
						mOfe.auxfec3 = Ax.text.DateFormat.format(mOfe.auxfec3, "yyyy-MM-dd");
					}else{
						mOfe.auxfec3 = ''
					}

					if(row.auxchr5 == null){
						
						if(mOfe.estlin == 'E'){
							mEstlin = 'Creada'
							mStyle=`style="background-color:#ffe3c2; color: #fa941e;"`
						}else if(mOfe.estlin == 'V'){
							mEstlin = 'Enviada'
							mStyle=`style="background-color:#dafec3; color: #52a11c;"`
						}

					}
					

					/* ==========================================================
						Comprobar si la oferta ha sido rechazada por el gestor
					========================================================== */

					if( mOfe.auxnum2 == 1 ){
						// mRecClass = `class="rechazada"`;
						mEstlin='Rechazada';
						mStyle = `style="background-color:#ffc8c8; color: #ff4141 ;"`;
					}
				}

				if(mContBorrar != 0){
					mHtmlTh = `
						<th class="cent">Borrar</th>
					`
				}

				/* ============================================================================================
					tiene prioridad la linea rechazada por el proveedor que la linea rechazada por el gestor
				============================================================================================ */ 

				if(row.auxchr5 != null){
					mMotRech = row.auxchr5;
					mMotRechTr = row.auxchr5;
			
				}else if( mOfe.auxnum2 == 1  && mOfe.auxchr2 != null){
					mMotRech = mOfe.auxchr2;
					mMotRechTr = mOfe.auxchr2;
				}

				// Hacer el selector dinamico
				var mSelectionAuxchr5 = '';
				
				
				for (campo in mObjRech){

					mSelectionAuxchr5 += `
					<option value="${campo}">${mObjRech[campo]}</option>`;

				}
				// if( mOfe.auxnum2 == 1  && mOfe.auxchr2 != null){
				// 	mObjRech[mMotRech] = mMotRech
				// }

				var mRechaz = '';

				// Si hay motivo de rechazo
				if(mMotRech != ''){
					
					// Si el objeto no contiene el motivo del rechazo es porque es un rechazo antiguo o un rechazo del gestor
					if(!mObjRech.hasOwnProperty(mMotRech)){

						mSelectionAuxchr5 +=  `
						<option value="${mMotRech}">${mMotRech}</option>
						`
					}else{
						mMotRech = mObjRech[mMotRech];
					}

					// Indicar si es proveedor o el gestor quien la ha rechazado

					if(row.auxchr5 != null){
						mMotRechSpan = `<span class="tooltiptext">PROVEEDOR: ${mMotRech}</span>`
						mRechaz = 'P'
				
					}else if( mOfe.auxnum2 == 1  && mOfe.auxchr2 != null){
						mMotRechSpan = `<span class="tooltiptext">GESTOR: ${mMotRech}</span>`
						mRechaz = 'G'

					}
					
				}

				mHtmlOfer = `

					<tr linid_concur="${row.linid_concur}" canpro="${row.canpro}" estlin="${mOfe.estlin}"
						cabid="${row.cabid}" linid="${mOfe.linid}" errlin="${mOfe.errlin}" docser="${row.docser}"
						wkflin="${mOfe.wkflin}" docori="${row.docori}" tercer="${row.tercer}" rechaz="${mRechaz}"
						motrech="${mMotRechTr}"
						${mRecClass}>
						<td>

							<div class="campo_checkbox">
								<input type="checkbox" name="select" ${mDisabled}>
								<span class="checkmark"></span>
							</div>

						</td>
						<td>
							<div class="tooltip">
								<div class="style_number" name="desvar">${row.desvar}</div>
								<span class="tooltiptext">${row.desvar}</span>
							</div>
						</td>
						<td>
							<div class="style_number cent" name="auxchr7">${row.auxchr7}</div>
						</td>
						<td>
							<div class="style_number cent" name="auxchr8">${row.auxchr8}</div>
						</td>
						<td>
							<div class="style_number cent" name="canpro">${row.canpro}</div>
						</td>
						<td>
							<div class="tooltip">
								<input class="input" type="text" id="prepro" name="prepro" placeholder="Precio Ud." value="${mOfe.prepro}" onChange="pos_prepro(this); setea_importe(this)" oninput="cambiarFormato(this)" required ${mReadOnly}>
								<span class="tooltiptext">${mOfe.prepro}</span>
							</div>
						</td>
						<td>
							<div class="tooltip">
								<input class="input" type="text" id="dtopro" name="dtopro"  placeholder="Descuento propuesto (%):" value="${mOfe.dtopro}" onChange="neg_dtopro(this); setea_importe(this)" oninput="cambiarFormato(this)" ${mReadOnly}>
								<span class="tooltiptext">${mOfe.dtopro}</span>
							</div>
						</td>
						<td>
							<div class="tooltip">
								<input class="input" type="text" id="auxnum3_ofel" name="auxnum3_ofel" placeholder="Canon Digital/Tasa" value="${mOfe.auxnum3_ofel}" onChange="pos_auxnum3(this); setea_importe(this)" oninput="cambiarFormato(this)" ${mReadOnly}>
								<span class="tooltiptext">${mOfe.auxnum3_ofel}</span>
							</div>
						</td>
						<td>
							<div class="tooltip">
								<input class="input" type="number" id="imppro" name="imppro" placeholder="Importe total" value="${mOfe.imppro}" readonly>
								<span class="tooltiptext">${mOfe.imppro}</span>
							</div>
						</td>
						<td>
							<div class="tooltip">
								<input class="input" type="date" id="auxfec3" name="auxfec3" placeholder="Fecha de entrega" value="${mOfe.auxfec3}" required ${mReadOnly}>
								<span class="tooltiptext">${mOfe.auxfec3}</span>
							</div>
						</td>
						<td>
							<div class="tooltip">
								<select id="auxchr5" name="auxchr5" ${mReadOnly}>
									${mSelectionAuxchr5}
								</select>
								${mMotRechSpan}
							</div>
						</td>
						<td>
							<div class="tooltip">
								<div class='estfac' ${mStyle} mStyle>
									${mEstlin}
								</div>
								${mMotRechSpan}
							</div>
						</td>
						${mHtmlBtnBorrarOfe}
						<td>
							<div class='style_number'><button type="button"  class="btnChat" onclick="redirigirHist(this)" target="_top"><span class="mdi mdi-list-box"></span></button></div>
						</td>
					</tr>
				`

				/* ===============================================
					Añadir el HTML de la oferta correspondiente
				=============================================== */

				mHtmlOfertas += mHtmlOfer;


			})

			mHtmlBoton += `
			<div class="fila_botones" style="margin-bottom:-20px">
				<button type="button" id="enviar" class="btn_enviar" onclick="verifOfertas()">Enviar oferta</button>
				<button type="button" id="enviar" class="btn_borrar" onclick="openPopup('popup_rechazar')">Rechazar todas las ofertas</button>
			</div>
			`


			return `

			<!DOCTYPE html>
			<html lang="en">

			<head>
				<title></title>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1">

				<link href="https://fonts.googleapis.com/css?family=Material+Icons|Material+Icons+Outlined" rel="stylesheet">
				<link href="https://cdn.jsdelivr.net/npm/@mdi/font@7.2.96/css/materialdesignicons.min.css" rel="stylesheet">
				<link href='https://fonts.googleapis.com/css?family=Source+Sans+Pro' rel='stylesheet' type='text/css'>

				<script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/2.2.9/purify.min.js"></script>
				<style>
					${mCss}
				</style>
				<script>

					document.addEventListener("DOMContentLoaded", function() {

						// Cargar la parte superior
						window.parent.scrollTo({
							top: 0
						});

						// Visualizar botones
						visualizarBotones();

						/* =================================
							Activar / Desactivar checkbox
						================================= */

						// Selecciona todos los elementos checkmark
						var checkmarks = document.querySelectorAll('.checkmark');
						var output = document.getElementById("card_notificaciones");

						// Añade un event listener a cada checkmark
						checkmarks.forEach((checkmark, index) => {
							checkmark.addEventListener('click', function() {

								// Limpiar los errores
								while (output.firstChild) {
									output.removeChild(output.firstChild);
								}

								inputErroneos = document.querySelectorAll(".error_checkmark");
								for (var i = 0; i < inputErroneos.length; i++) {
									inputErroneos[i].classList.remove("error_checkmark");
								}

								// Encuentra el input asociado
								const checkbox = this.previousElementSibling;


								// Cambia el estado checked del input si no esta desactivado
								if(!checkbox.disabled){
									checkbox.checked = !checkbox.checked;
								}else{

									output.innerHTML += '<div class="incorrecto campo">No puede seleccionar una linea rechazada.</br></div>'
									this.classList.add('error_checkmark');
								}

								// Dispara el evento change para actualizar el estado visual
								checkbox.dispatchEvent(new Event('change'));

								// si el check activado es el principal, activar todos los checks

									if (index === 0) {
										var isChecked = checkbox.checked;
										checkmarks.forEach((check, idx) => {
											if (idx !== 0 && !check.previousElementSibling.disabled) {
												var check_list = check.previousElementSibling;
												check_list.checked = isChecked;
												check_list.dispatchEvent(new Event('change'));
											}
										});
									}
							});
						});

						/* ===========
							Tooltip
						=========== */

						function cambiarTooltip(input) {
							var tooltipParent = input.closest('.tooltip');
							if (tooltipParent) {
								if (input.value.trim() === '') {
									tooltipParent.classList.remove('tooltip');
								} else {
									tooltipParent.classList.add('tooltip');
								}
							}

						}

						function updateSpanValue(input) {
							var tooltipParent = input.closest('.tooltip');
							if (tooltipParent) {
								var tooltipText = tooltipParent.querySelector('.tooltiptext');
								if (tooltipText) {
									tooltipText.textContent = input.value;
								}
							}
						}


						// Seleccionar todos los inputs
						var inputs = document.querySelectorAll('.input');

						// Aplicar la lógica a cada input
						inputs.forEach(function(input) {
							cambiarTooltip(input); // Ejecutar al cargar la página

							// Agregar un evento de escucha de entrada para cada input
							input.addEventListener('change', function() {
								cambiarTooltip(input); // Ejecutar cuando haya un cambio en el input
								updateSpanValue(input)
							});

							// Agregar un evento de escucha de entrada para cada input
							input.addEventListener('input', function() {
								cambiarTooltip(input); // Ejecutar cuando haya un cambio en el input
								updateSpanValue(input)
							});

						});

						
							
						//cargar select-option
						var mFilas = document.querySelectorAll('tbody tr');
						mFilas.forEach(row => {

							var mMotrech = row.getAttribute('motrech');

							if(mMotrech != ''){
								var mSelect = row.querySelector('select');
								mSelect.value = mMotrech
							}
						
						});

					});

					/* ==============================================
						Cambiar formato de los campos con decimales
					=============================================== */

					function cambiarFormato(input){
						let valor = input.value;

						// Reemplazar puntos y comas por comas
						valor = valor.replace(/[,.]/g, ',');

						// Eliminar todos los caracteres que no sean números o comas
						valor = valor.replace(/[^0-9,-]/g, '');

                        // Eliminar todos los guiones que no estén en la primera posición
                        valor = valor.replace(/-/g, (_, index) => index === 0 ? '-' : '');

						// Reemplazar todas las comas adicionales por una sola coma
						// valor = valor.replace(/(\d+,\d*),/g, '$1');
						// Eliminar todas las comas adicionales dejando solo la última
						const partes = valor.split(',');
						valor = partes[0] + (partes.length > 1 ? ',' + partes.slice(1).join('') : '');

						input.value = valor;

					}

					/* ===========================
						Convertir undefined a 0
					=========================== */

					function convertNaN(valor) {

						if (valor == '' || valor == undefined || valor == null) {
							return 0
						}else{
							valor = String(valor).replace(/,/g, '.')
							return valor
						}

					}

					/* ==================================
						Setear importe (oferta actual)
					================================== */

					function setea_importe(element){
						var mTr = element.closest('tr');
						var m_imppro = mTr.querySelector('[name="imppro"]');

						m_imppro.classList.remove("error");

						var m_canpro = convertNaN(mTr.getAttribute('canpro'));
						var m_prepro = parseFloat(convertNaN(mTr.querySelector('[name="prepro"]').value));
						var m_dtopro = parseFloat(convertNaN(mTr.querySelector('[name="dtopro"]').value));
						var m_canon = parseFloat(convertNaN(mTr.querySelector('[name="auxnum3_ofel"]').value));


						// var impnet = (m_canpro * (m_prepro + m_canon) * (1 + m_dtopro / 100));

						var impnet = m_canpro * (m_prepro * (1 + m_dtopro / 100) ) + m_canpro * m_canon

						impnet = Math.round(impnet*Math.pow(10,2))/Math.pow(10,2);
						console.log(impnet);
						if (impnet < 0 ){

							m_imppro.classList.add("error");
							alert('El importe neto no puede ser menor que 0');
							return false;

						}else{

							m_imppro.value = impnet;
							return true;
						}
					}


					/* ========================================
						positivación del importe introducido
					======================================= */
					function pos_prepro(element) {

						//var m_prepro = pFila.querySelector('input[name="prepro"]');
						var m_prepro = element;
						m_prepro.value = parseFloat(convertNaN(m_prepro.value))

						if ( parseFloat(convertNaN(m_prepro.value)) < 0) {
							m_prepro.value = parseFloat(convertNaN(m_prepro.value))*(-1)
							m_prepro.value = Math.round(parseFloat(convertNaN(m_prepro.value))*Math.pow(10,2))/Math.pow(10,2);
							console.log(m_prepro.value)
							alert("El precio debe ser positivo.")
						}
					}
					/* ========================================
						positivación del canon introducido
					======================================= */
					function pos_auxnum3(element) {

						//var m_auxnum3 = document.getElementById('auxnum3_ofel');
						var m_auxnum3 = element;

						auxnum3_ofel.value = parseFloat(convertNaN(m_auxnum3.value))
						if ( parseFloat(convertNaN(m_auxnum3.value)) < 0) {
							m_auxnum3.value = parseFloat(convertNaN(m_auxnum3.value))*(-1)
							m_auxnum3.value = Math.round(parseFloat(convertNaN(m_auxnum3.value))*Math.pow(10,2))/Math.pow(10,2);
							console.log(m_auxnum3.value)
							alert("El precio debe ser positivo.")
						}
					}

					/* =================
						importe no 0
					================ */

					function nocero_prepro(pFila) {

						var output = document.getElementById("card_notificaciones");
						var m_prepro = pFila.querySelector('input[name="prepro"]');

						if(parseFloat(m_prepro.value) === 0){
							console.log(parseFloat(m_prepro.value))
							// alert("El precio debe ser mayor que 0.");
							output.innerHTML += '<div class="incorrecto campo">El precio debe ser mayor que 0.</br></div>'
							m_prepro.classList.add("error");
							return;
						}
						// else {
						// 	m_prepro.classList.add("error");

						// 	window.onbeforeunload === null;
						// 	return true;
						// }
						return;

					}

					/* ===============================
						negativización de descuentos
					=============================== */

					function neg_dtopro(element) {

						// var m_dtopro = document.getElementById('dtopro');
						var m_dtopro = element;
						m_dtopro.value = parseFloat(convertNaN(m_dtopro.value));

						if (m_dtopro.value > 0) {
							m_dtopro.value = parseFloat(convertNaN(m_dtopro.value))*(-1)
							// m_dtopro.value = Math.round(m_dtopro.value * Math.pow(10,2))/Math.pow(10,2);
							alert("Los descuentos deben ser negativos.")
							}
					}

					/* ==============================
						Auxfec3 no anterior a hoy
					============================= */

					function comprobar_auxfec3(pFila){

						var output = document.getElementById("card_notificaciones");
						var m_auxfec3 = pFila.querySelector('input[name="auxfec3"]');

						m_auxfec3_date = new Date(m_auxfec3.value);

						console.log(m_auxfec3_date)

						var m_today = new Date();

						m_today.setHours(0, 0, 0, 0);


						if (m_auxfec3_date < m_today) {
							output.innerHTML += '<div class="incorrecto campo">La fecha de entrega no puede ser anterior al dia de hoy.</br></div>'
							m_auxfec3.classList.add("error");
						}
					}

					/* =========================
						Selección de ficheros
					========================= */

					function selectFichero(elemento){
                        var inputFile = elemento.nextElementSibling;
                        inputFile.click();
                    }


					//Lista para almacenar los archivos seleccionados

					const selectedFiles = [];

					/* ===============================
						Borrar docs antes de subirlos
					==================================*/
                    function borrarDoc(elemento) {

                        var id = Number(elemento.id.replace('span_', ''));

                        selectedFiles.forEach((file, i) => {
                            if (file.name == elemento.parentNode.getAttribute("name")) {
                                selectedFiles.splice(i,1);
                            }
                        });

                        elemento.parentNode.parentNode.remove();
                    }

					/* ==================================
						Mostrar ficheros seleccionados
					================================== */

                    function mostrarFicheros(elemento) {

                        const files =  elemento.files;
                        //console.log(files);
                        // Agrega los archivos seleccionados a la lista

                        if (files.length > 0) {
                            selectedFiles.push(...files);
                            var mConteinerDocS = elemento.nextElementSibling

                            for (let i = 0; i < files.length; i++) {
                                var file = files[i];
                                mHtmlDoc = '<div class="fila_docs"><div class="documentos" name="' + file.name + '">' + file.name + '<span id="span_' + i + '" onclick="borrarDoc(this)" class="cerrar_doc"> X<span></div></div>'
                                mConteinerDocS.insertAdjacentHTML('afterbegin', mHtmlDoc);

                            }

                        }

                    }

					/* ==========================================
						Eliminar documento de la base de datos
					========================================== */

                    async function eliminarDoc(elemento){

                        var output = document.getElementById("card_notificaciones");
                    
						
						mSeqno = elemento.getAttribute("name");
                        nombreFichero = elemento.nextElementSibling.textContent;
                        var datos = {seqno: mSeqno}

						//Eliminar mensaje de error repetido
						
						output.querySelectorAll('.fichero').forEach(row =>{
							row.remove();
						})

						// Si el estado del concurso no es correcto, no permite borrar documentos
						
						if (${mCondError.length} !== 0) {
							let errorDiv = document.createElement('div');
							errorDiv.className = 'fichero incorrecto campo';
							errorDiv.textContent = 'No se pueden borrar los ficheros con el estado de concurso indicado.';
							output.appendChild(errorDiv);
					
							let successDiv = document.createElement('div');
							successDiv.className = 'correcto campo';
							successDiv.textContent = 'Fichero [ ' + nombreFichero + ' ] eliminado correctamente.';
							output.appendChild(successDiv);
					
							parent.window.scrollTo(0, 0);
						}else{

							//console.log(JSON.stringify(datos))

							const ofertaResponse = await fetch('/service/rest/gestele5/mediaset/v1/api/concurso/doc/borrarAgrupado/' + mSeqno, {
								method: "DELETE",
								credentials: "same-origin"
							})

							if (!ofertaResponse.ok) {

								// Captura el mensaje de error personalizado proporcionado por el servidor
								const errorResponse = await ofertaResponse.json();
								const errorMessage = errorResponse.message || 'Error al eliminar fichero '+ nombreFichero;
   
								console.log(errorMessage)
								// Muestra el mensaje de error al usuario
   
								// output.innerHTML += '<div class="incorrecto campo">Error en el envío de la factura</br>Error: ' + ofertaResponse.status + '<br>Mensaje: ' + ofertaResponse.statusText + '</div>'
								output.innerHTML += '<div class="incorrecto campo">' + errorMessage + '</div>';
   
								parent.window.scrollTo(0, 0);
							}
						   if (ofertaResponse.redirected) {
							   window.location.href = ofertaResponse.url;
						   } else {
   
							   elemento.parentNode.remove();
							   //refrescarPag();
							   output.innerHTML += '<div class="correcto campo">Fichero [ '+ nombreFichero +' ] eliminado correctamente.</div>';
							   parent.window.scrollTo(0, 0);
   
							   // ofertaResponse.json()
						   }
						}
                    }

					/* ============================================
						Borrar oferta actual de la base de datos
					============================================ */

                    async function borrarOferta(element){
                        
						var output = document.getElementById("card_notificaciones");
						var mTr = element.closest('tr');
						
						datos = {}
						datos.linid = mTr.getAttribute('linid');
						datos.cabid = mTr.getAttribute('cabid');
						
						mDesvar = mTr.querySelector('[name="desvar"]').innerText;

						const ofertaResponse = await fetch('/service/rest/gestele5/mediaset/v1/api/concurso/ofertaAgrupado/'+datos.cabid+'/'+datos.linid, {
                            method: "DELETE",
                            credentials: "same-origin"
						})

                        if (!ofertaResponse.ok) {

                             // Captura el mensaje de error personalizado proporcionado por el servidor
                             const errorResponse = await ofertaResponse.json();
                             const errorMessage = errorResponse.message || 'Error al eliminar la oferta actual'

                             console.log(errorMessage)
                             // Muestra el mensaje de error al usuario


                             output.innerHTML += '<div class="incorrecto campo">' + errorMessage + '</div>';

                             parent.window.scrollTo(0, 0);
                         }
						if (ofertaResponse.redirected) {
                            window.location.href = ofertaResponse.url;
                        } else {

							output.innerHTML += '<div class="correcto campo">Oferta actual ['+ mDesvar +'] borrada correctamente.</div>';
							parent.window.scrollTo(0, 0);

							//recargar página actual después de 3 segundos

							setTimeout(function() {
								refrescarPag();
							}, 3000);

                        }
                    }

					/* =================
						Crear oferta
					================ */

					async function crearOferta(pFila) {
						var output = document.getElementById("card_notificaciones");

						var objParent = {};

						var objChild = {};
						var elements = pFila.querySelectorAll("input, select, textarea");
						console.log(elements)
						for (element of elements) {
							var name = element.name;
							var value = DOMPurify.sanitize(element.value);
							var type = element.type;
							var data = element.data;

							if (name) {
								objChild[name] = value;
							}

						}


						var datos = objChild;
						datos.cabid = pFila.getAttribute('cabid');
						datos.linid_concur = pFila.getAttribute('linid_concur');
						datos.canpro = pFila.getAttribute('canpro');
						datos.event = 'I';
						datos.coment = document.getElementById('coment').value;

						delete datos.referen;
						delete datos.marca;
						delete datos.desvar;
						delete datos.select;

						mDesvar = pFila.querySelector('[name="desvar"]').innerText;


						console.log(JSON.stringify(datos));
						//output.innerHTML += JSON.stringify(datos) + '<br>'

						const ofertaResponse = await fetch('/service/rest/gestele5/mediaset/v1/api/concurso/ofertaAgrupado', {
							method: "POST",
							headers: { 'Content-Type': 'application/json' },
							credentials: "same-origin",
							body: JSON.stringify(datos)
						})

						if (!ofertaResponse.ok) {

							//console.log('Codigo de error: ' + ofertaResponse.status);
							//console.log('Mensaje de error: ' + ofertaResponse.statusText);

								// Captura el mensaje de error personalizado proporcionado por el servidor
								const errorResponse = await ofertaResponse.json();
								const errorMessage = errorResponse.message || 'Error en el envío de la oferta [ '+ mDesvar +' ] ';
								console.log(errorMessage)
								// Muestra el mensaje de error al usuario

								// output.innerHTML += '<div class="incorrecto campo">Error en el envío de la oferta</br>Error: ' + ofertaResponse.status + '<br>Mensaje: ' + ofertaResponse.statusText + '</div>'
								output.innerHTML += '<div class="incorrecto campo">Error en el envío de la oferta [ '+ mDesvar +' ]</br></div>'

								output.innerHTML += '<div class="incorrecto campo">' + errorMessage + '</div>';

								parent.window.scrollTo(0, 0);
							}
						if (ofertaResponse.redirected) {
							window.location.href = ofertaResponse.url;
						} else {

							output.innerHTML += '<div class="correcto campo">Oferta [ '+ mDesvar +' ] creada correctamente.</div>';
							enviarOferta(pFila);
							parent.window.scrollTo(0, 0);

							//recargar página actual después de 3 segundos

							// setTimeout(function() {
							// 	refrescarPag();
							// }, 3000);
						}

                    }

					/* ===============================
						Enviar documentos adjuntos
					============================== */

                    async function enviarDocs(pOrigen){

						var output = document.getElementById("card_notificaciones");
						
						if(pOrigen == 'b'){
							
							//Limpiar el output al principio
							while (output.firstChild) {
								output.removeChild(output.firstChild);
							}
							var inputErroneos = document.querySelectorAll(".error");
							console.log(inputErroneos)
							for (var i = 0; i < inputErroneos.length; i++) {
								inputErroneos[i].classList.remove("error");
							}

						}
						
                        seccion = document.getElementById("seccion1");
                        var elements = seccion.querySelectorAll("input, select, textarea");

						for (element of elements) {
							var name = element.name;
							var value = element.value;
							var type = element.type;
							var data = element.data;
						}

						// Obtener todos los elementos <input> dentro del formulario (ficheros)
						var inputsRequeridos = document.querySelectorAll("input[required], select[required], input");

						for (var i = 0; i < inputsRequeridos.length; i++) {

							if (inputsRequeridos[i].type == 'file' && selectedFiles.length == 0) {

								var area_fichero = inputsRequeridos[i].parentNode;

								area_fichero.classList.add("error");
							}
						}

                        //contador de ficheros excedidos en size
                        var mCont = 0;

                        listadoFicheros = document.querySelectorAll('div.fila_docs div.documentos');
                        var nameContador = {};


                        var ficherosTotales = [];
                        var area_fichero = document.querySelector("div.area_fichero");

                        for (var i = 0; i < listadoFicheros.length; i++) {
                            nombreFichero = listadoFicheros[i].getAttribute("name");

                            if (nombreFichero in nameContador) {
                                nameContador[nombreFichero]++;
                            } else {
                                nameContador[nombreFichero] = 1;
                            }


                            for (var j = 0; j < selectedFiles.length; j++) {

                                if (selectedFiles[j].name == nombreFichero) {

                                    var fichero = selectedFiles[j]
                                    var obj = {}
                                    var objP = {}

                                    for (campo in fichero) {
                                        obj[campo] = (fichero[campo])
                                    }
                                    objP.file = obj;
                                    objP.docori = '${data.docori}';
									objP.origen = 'ofer';

                                    function getBase64(file, onLoadCallback) {
                                        return new Promise(function (resolve, reject) {
                                            var reader = new FileReader();
                                            reader.onload = function () { resolve(reader.result); };
                                            reader.onerror = reject;
                                            reader.readAsDataURL(file);
                                        });
                                    }

                                    var promise = getBase64(selectedFiles[j]);
                                    var base64 = await promise;

                                    var string = 'data:' + obj.type + ';base64,';
                                    //console.log(string)
                                    base64 = base64.replace(string, '');
                                    objP.codeData = base64;
                                    //console.log(objP);
                                    ficherosTotales.push(objP);
                                }

                            }

                        }
                        for (var nombre in nameContador) {
                            if (nameContador.hasOwnProperty(nombre) && nameContador[nombre] > 1) {
                                area_fichero.classList.add("error");

                                output.innerHTML += '<div class="incorrecto campo">No puede adjuntar el mismo fichero dos veces.</div>'
                                parent.window.scrollTo(0, 0);
                                return;
                            }
                        }

                        //console.log(ficherosTotales)
                        if (mCont > 0) {
                            return;
                        }
						
						if(ficherosTotales.length == 0){
							output.innerHTML += '<div class="incorrecto campo">Debe adjuntar como mínimo un fichero.</div>'
							parent.window.scrollTo(0, 0);
                        }else if (document.querySelectorAll(".error").length > 0 || document.querySelectorAll(".error_checkmark").length > 0) {
                            parent.window.scrollTo(0, 0);
                       }else{

                        const fetchPromises = ficherosTotales.map(async (ficheroTotal) => {
                        try {
                            const ficheroResponse = await fetch('/service/rest/gestele5/mediaset/v1/api/concurso/doc/nuevoAgrupado', {
                              method: "POST",
                              headers: { 'Content-Type': 'application/json' },
                              credentials: "same-origin",
                              body: JSON.stringify(ficheroTotal)
                            });
                            console.log(ficheroResponse);
                            console.log(JSON.stringify(ficheroTotal));
                            if (!ficheroResponse.ok) {
                              const errorResponseFichero = await ficheroResponse.json();
                              const errorMessage = errorResponseFichero.message || 'Error en el envío de la oferta';
                              console.error(errorMessage); // Log the error message for debugging.
                              output.innerHTML += '<div class="incorrecto campo">' + errorMessage + '</div>';
                              return { success: false, message: errorMessage };
                            } else {
                              console.log(ficheroTotal.file.name + ' enviado de forma correcta');
                              return { success: true};
                            }
                          } catch (error) {
                            console.error('Error en la solicitud Fetch:', error);
                            output.innerHTML += '<div class="incorrecto campo">Error en el envío de ficheros.</div>'
                          }
                        });
						try {

							// Esperar a que todas las promesas de envío de ficheros se resuelvan
							const results = await Promise.all(fetchPromises);

							// Verificar si todas las promesas se completaron con éxito
							const allSuccessful = results.every(result => result.success);

							if (allSuccessful) {
								output.innerHTML += '<div class="correcto campo">Todos los ficheros se enviaron de forma correcta.</div>';
								parent.window.scrollTo(0, 0);

								//recargar página actual después de 3 segundos

								if(pOrigen == 'b'){

									// si el origen es el boton de enviar documentos, refrescar pagina
									setTimeout(function() {
										refrescarPag();
									}, 3000);

								}
								// else{
								// 	enviarOferta();
								// }


							}else{
								output.innerHTML += '<div class="incorrecto campo">Error en el envío de ficheros.</div>'
							}

						} catch (error) {
							console.error('Error en la promesa de Promise.all:', error);
							output.innerHTML += '<div class="incorrecto campo">Error en el envío ficheros.</div>'
						}

                       }

                    }

					/* ==================
						Enviar oferta
					================= */

					async function enviarOferta(pFila) {

                        var output = document.getElementById("card_notificaciones");

						var datos = {};

						datos.cabid =  pFila.getAttribute('cabid');
						datos.linid = pFila.getAttribute('linid');
						datos.errlin = pFila.getAttribute('errlin');
						datos.docser = pFila.getAttribute('docser');
						datos.wkflin = pFila.getAttribute('wkflin');
						datos.docori = pFila.getAttribute('docori');
						//datos.tercer = pFila.getAttribute('tercer');
						datos.tercer = '${mAutorizado}';
						datos.coment = document.getElementById('coment').value;

						mDesvar = pFila.querySelector('[name="desvar"]').innerText;

						console.log(JSON.stringify(datos));

						const envioResponse = await fetch('/service/rest/gestele5/mediaset/v1/api/concurso/oferta/enviarAgrupado', {
							method: "POST",
							headers: { 'Content-Type': 'application/json' },
							credentials: "same-origin",
							body: JSON.stringify(datos)
						})

						if (!envioResponse.ok) {

							//console.log('Codigo de error: ' + envioResponse.status);
							//console.log('Mensaje de error: ' + envioResponse.statusText);

								// Captura el mensaje de error personalizado proporcionado por el servidor
								const errorResponse = await envioResponse.json();
								const errorMessage = errorResponse.message || 'Error en el envío de la oferta';
								console.log(errorMessage)
								// Muestra el mensaje de error al usuario

								// output.innerHTML += '<div class="incorrecto campo">Error en el envío de la oferta</br>Error: ' + envioResponse.status + '<br>Mensaje: ' + envioResponse.statusText + '</div>'
								output.innerHTML += '<div class="incorrecto campo">Error en el envío de la oferta [ '+ mDesvar +' ]</br></div>'

								output.innerHTML += '<div class="incorrecto campo">' + errorMessage + '</div>';

								parent.window.scrollTo(0, 0);
						}
						if (envioResponse.redirected) {
							window.location.href = envioResponse.url;
						}else {

							output.innerHTML += '<div class="correcto campo">Oferta [ '+ mDesvar +' ] enviada correctamente.</div>';
							parent.window.scrollTo(0, 0);

							//recargar página actual después de 3 segundos

							// setTimeout(function() {
							// 	refrescarPag();
							// }, 3000);
						}
                    }

					/* ============================
                        popup de rechazar ofertas
                    ============================= */

                    // Abrir popup
                    function openPopup(id) {
						
                        var mPopup = document.getElementById(id);
                        var mOverlay = document.getElementById('overlay');

                        mPopup.classList.add('show');
                        mOverlay.style.display = 'block';
                    }

                    // Cerrar popup
                    function closePopup(id) {
						
                        var mPopup = document.getElementById(id);
                        var mOverlay = document.getElementById('overlay');

                        mPopup.classList.remove('show');
                        mOverlay.style.display = 'none';
						console
						if(id == 'popup_hist'){
							limpiar_popup('popup_hist');
						}
                    }

					// Limpiar ppopup
					function limpiar_popup(id){
                        var mPopup = document.getElementById(id);

                        // Selecciona todos los elementos hijos del div excepto el primero y el segundo
						var mPopupHijos = mPopup.querySelectorAll(':not(:nth-child(1)):not(:nth-child(2))');

                        // Elimina cada elemento hijo seleccionado
                        mPopupHijos.forEach(function(linea) {
                            linea.remove();
                        });
                    }



					/* ========================
						Redirigir al listado
					======================== */

					function redirigirListado(elemento){
						var url = "/service/rest/gestele5/mediaset/v1/api/concurso/listadoAgrupado"
						var request = new Request(url, {
						method: "GET",
						redirect: 'follow'
						});
						fetch(request)
						.then(function(response) {
							console.log(response);
							// Manejar la respuesta de la API aquí
							window.location.href = response.url;
						})
						.catch(function(error) {
							// Manejar el error aquí
							console.error(error);
						});
					}

					/* ========================
						Redirigir al chat
					======================== */

					function redirigirChat(elemento){
						var url = "/service/rest/gestele5/mediaset/v1/api/concurso/chatAgrupado/${data.docori}"
						var request = new Request(url, {
						method: "GET",
						redirect: 'follow'
						});
						fetch(request)
						.then(function(response) {
							console.log(response);
							// Manejar la respuesta de la API aquí
							window.location.href = response.url;
						})
						.catch(function(error) {
							// Manejar el error aquí
							console.error(error);
						});
					}

					/* ===========================
						Redirigir al historico
					=========================== */

					function redirigirHist(elemento){
						
						var mTr = elemento.closest('tr');
						mCabid = mTr.getAttribute('cabid');

						var url = "/service/rest/gestele5/mediaset/v1/api/concurso/oferta/detalle?cabid="+mCabid
						

						// la url devuelve un html, que es el contenido del iframe
						fetch(url)
							.then(response => response.text())
							.then(html => { 
										
								// Reemplazar el contenido del documento actual con el contenido del nuevo documento
								document.getElementById('popup_hist').innerHTML += html;
							
								openPopup('popup_hist');

							})
							.catch(error => {
								console.error('Error al obtener HTML desde la API:', error);
							});
					}

					/* =================
						Rechazar oferta
					=================== */

					async function rechazarOferta(pFila){

						var output = document.getElementById("card_notificaciones");
						var mArrayFilas = [];
						if (pFila != null) {
							mArrayFilas.push(pFila);
						}else {

							mAuxchr5 = document.getElementById("auxchr5");
							mAuxchr5.classList.remove('error');
							console.log(mAuxchr5);
							console.log(mAuxchr5.value);

							if(mAuxchr5.value == ''){
								mAuxchr5.classList.add('error');
							}else{
								var mFilas = document.querySelectorAll('tbody tr');
								mFilas.forEach(row => {

									//var mSelect = row.querySelector('[name="auxchr5"]');
									// if (mSelect && mSelect.value !== '') {
									// 	mArrayFilas.push(row);
									// }

									mArrayFilas.push(row);
								});
							}

							
						}

						if (mArrayFilas.length !== 0) {
							
							mArrayFilas.map(async mFila => {

								var datos = {};
								datos.cabid = mFila.getAttribute('cabid');
								
								if( pFila == null){
									datos.auxchr5 = document.getElementById("auxchr5").value;
								}else{
									datos.auxchr5 = mFila.querySelector("[name='auxchr5']").value;

								}
	
								var mDesvar = mFila.querySelector("[name='desvar']").innerText;
	
								console.log(JSON.stringify(datos));
	
								const ofertaResponse = await fetch('/service/rest/gestele5/mediaset/v1/api/concurso/rechazar_oferta', {
									method: "PUT",
									headers: { 'Content-Type': 'application/json' },
									credentials: "same-origin",
									body: JSON.stringify(datos)
								})
	
								if (!ofertaResponse.ok) {
	
									//console.log('Codigo de error: ' + ofertaResponse.status);
									//console.log('Mensaje de error: ' + ofertaResponse.statusText);
		
									 // Captura el mensaje de error personalizado proporcionado por el servidor
									 const errorResponse = await ofertaResponse.json();
									 const errorMessage = errorResponse.message || 'Error al rechazar la oferta [ ' + mDesvar + ' ].';
									 console.log(errorMessage)
									 // Muestra el mensaje de error al usuario
		
									 output.innerHTML += '<div class="incorrecto campo">Error al rechazar la oferta [ ' + mDesvar + ' ].</br></div>'
									 output.innerHTML += '<div class="incorrecto campo">' + errorMessage + '</div>';
		
								 }
								if (ofertaResponse.redirected) {
									window.location.href = ofertaResponse.url;
								} else {
		
									output.innerHTML += '<div class="correcto campo">Oferta [ ' + mDesvar + ' ] rechazada correctamente.</div>';
								}
	
							});

							if( pFila == null) {

								closePopup('popup_rechazar');
								parent.window.scrollTo(0, 0);
	
								//recargar página actual después de 3 segundos
	
								setTimeout(function() {
									refrescarPag();
								}, 3000);
							}

						}

					};

					/* =======================
						Refrescar la pagina
					======================= */
					function refrescarPag(){

						mUrlPrincipal = '/app/portal/factura/listado?code=LISTADO_OFERTAS'
						var mUrlNot = '/service/rest/gestele5/mediaset/v1/api/concurso/ofertaAgrupado?cabid=${data.cabid}'
						localStorage.setItem('mUrlNot', mUrlNot);
						window.top.location.href = mUrlPrincipal;

					}


					/* ===================================================
						Comprobar que los botones tienen que estar o no
					=================================================== */

					function visualizarBotones(){

						if( ${mCondError.length} !== 0){

							var mForm = document.getElementById('formulario_completo');

							//Buscar todos los divs que contengan botones
							var mDivBtn = mForm.querySelectorAll('div button');

							mDivBtn.forEach(function(button) {
								var div = button.closest('div'); // Encuentra el div ancestro más cercano
								if(div){

									if(div.classList.contains('area_fichero')){
										div = button.closest('.f_seccion');
									}

									if (div) {
										div.remove(); // Elimina el div
									}
								}
							})
						}
					}
					
					/* ===========================================================================
						Verificar que los datos de las ofertas son correctos antes de enviarlos
					=========================================================================== */
					async function verifOfertas(){

						var output = document.getElementById("card_notificaciones");

						while (output.firstChild) {
							output.removeChild(output.firstChild);
						}

						//limpiar errores
						var inputErroneos = document.querySelectorAll(".error");
						for (var i = 0; i < inputErroneos.length; i++) {
							inputErroneos[i].classList.remove("error");
						}
						inputErroneos = document.querySelectorAll(".error_checkmark");
						for (var i = 0; i < inputErroneos.length; i++) {
							inputErroneos[i].classList.remove("error_checkmark");
						}

						// Buscar todas las líneas que estan seleccionadas
						var mFilas = document.querySelectorAll('.formulario tbody tr');

						var mCheckCont = 0

						mFilas.forEach(mFila => {
							var mDesvar = mFila.querySelector('[name="desvar"]').innerText;
							var  mCheck = mFila.querySelector('input[type="checkbox"]');

							// Si la fila esta seleccionada, se comprueban los datos
							if (mCheck && mCheck.checked) {

								mCheckCont++;

								// Comporbar si el motivo de rechazo esta vacio, en caso de no estarlo comprobar si la linea ya estaba rechazada cuando carga la página
								
								if ( (mFila.querySelector("[name='auxchr5']").value != '')) {
									
										if(mFila.getAttribute("rechaz") == 'G' && mFila.querySelector("[name='auxchr5']").value != ''  && mFila.querySelector("[name='auxchr5']").value == mFila.getAttribute('motrech')) {
											
											output.innerHTML += '<div class="incorrecto campo">No puede rechazar [ ' + mDesvar + ' ] con la misma opción ofrecida por el gestor de compras.<br/> Si quiere enviar la oferta, rellene el campo "No ofertar" con motivo "Ninguno"</br7></div>'
											mFila.querySelector("[name='auxchr5']").classList.add("error");
											parent.window.scrollTo(0, 0);

										}else if(mFila.getAttribute("rechaz") == 'P' && mFila.querySelector("[name='auxchr5']").value != ''  && mFila.querySelector("[name='auxchr5']").value == mFila.getAttribute('motrech')){
											output.innerHTML += '<div class="incorrecto campo">No puede rechazar [ ' + mDesvar + ' ] con la misma opción seleccionada anteriormente.<br/> Si quiere enviar la oferta, rellene el campo "No ofertar" con motivo "Ninguno"</br7></div>'
											mFila.querySelector("[name='auxchr5']").classList.add("error");
											parent.window.scrollTo(0, 0);
										}else{
											rechazarOferta(mFila);
										}
										return;

								}else {

									// Comprobar que el precio no es 0
									nocero_prepro(mFila);

									// Comprobar auxfec3
									comprobar_auxfec3(mFila);

									// comprobar campos requeridos
									// Obtener todos los elementos <input> dentro del formulario
									var inputsRequeridos = mFila.querySelectorAll("input[required], select[required]");

									for (var i = 0; i < inputsRequeridos.length; i++) {

										if (inputsRequeridos[i].value == '' && inputsRequeridos[i].type != 'file') {
											inputsRequeridos[i].classList.add("error");
										}
									}

									// comprobar si es requerido el fichero
									var inputFile = document.querySelector("input[name='documento'][required]");
									if(inputFile){

										if (inputFile[i].type == 'file' && selectedFiles.length == 0) {

											var area_fichero = inputFile.parentNode;

											area_fichero.classList.add("error");
										}
									}
									
								}
								
							}
						});

						// Comprobar si hay filas seleccionadas o no
						if(mCheckCont == 0){

							// Obtener todos los checkmarks
							mCheks = document.querySelectorAll('.checkmark');
							mCheks.forEach( mSpan => {
								mSpan.classList.add('error_checkmark');
							})

							output.innerHTML += '<div class="incorrecto campo">Debe seleccionar al menos una fila.</div>';
							parent.window.scrollTo(0, 0);
						}else{

							// Una vez comprobadas todas las filas, indicar si hay errores
							if (document.querySelectorAll(".error").length > 0 || document.querySelectorAll(".error_checkmark").length > 0) {
								output.innerHTML += '<div class="incorrecto campo">Debe rellenar todos los campos</div>';
								parent.window.scrollTo(0, 0);
							}else{

								mFilas.forEach(mFila => {

									var  mCheck = mFila.querySelector('input[type="checkbox"]');

									// Si la fila esta seleccionada, se comprueban los datos
									if (mCheck && mCheck.checked) {
										
										// Procesar las filas que no van a ser rechazadas
										if (mFila.querySelector("[name='auxchr5']").value == '') {

											mEstlin = mFila.getAttribute('estlin');

											// Si estlin es 'E' hay que enviar la oferta, si es 'V' hay que crearla y enviarla
											if ( mEstlin == 'E' || mEstlin == 'null'){
												enviarOferta(mFila);

												//recargar página actual después de 3 segundos

												setTimeout(function() {
													refrescarPag();
												}, 3000);

											}else if (mEstlin == 'V'){
												crearOferta(mFila);
											}

										}
										
									}
								})

								if(selectedFiles.length !== 0){
									setTimeout(function() {
										enviarDocs('s');
									}, 3000);
								}
								//recargar página actual después de 3 segundos

								// setTimeout(function() {
								// 	refrescarPag();
								// }, 3000);

							}
						}
					}

				</script>
			</head>

			<body>

				<!-- Botones superiores -->
				<div class="fila_btn">
					<button type="button"  class="btnlist" onclick="redirigirListado(this)" target="_top" id="volver_listado">Volver al listado</button>
					<div style=" display: flex; align-items: center;"><span>Puede hablar con el gestor de compras a través de este chat &nbsp;</span><button type="button"  class="btnChat" onclick="redirigirChat(this)" target="_top" id="volver_listado"><span class="mdi mdi-message-text"></span></button></div>
				</div>

				<!-- Card de notificaciones -->

				<pre id="card_notificaciones">
					${mCondError}
				</pre>

				<!-- Popup rechazar ofertas -->
				<div id="popup_rechazar" class="popup" style="background-color: #F9FAFD; border: 1px solid #d2ce71;">
                    <span class="close" onclick="closePopup('popup_rechazar')">&times;</span>
					<div class="fila">

						<div class="campo" style="margin-bottom: 16px;">
							<label>Motivo de rechazo:</label>
							<br>
							<select id="auxchr5" name="auxchr5" style="margin-top: 10px;">
							${mHtmlRechazar}
							</select>
						</div>

					</div>

					<div class="fila">
						<button type="button" id="enviar" class="btn_borrar" onclick="rechazarOferta(null)">Rechazar oferta</button>
					</div>
                </div>

				<!-- Popup Historico -->
				<div id="popup_hist" class="popup" style="border: 1px solid #d2ce71;">
					<span class="close" onclick="closePopup('popup_hist')">&times;</span><br/>					
                </div>


				<div id="overlay" style="display: none;"></div>


				<!-- Cabecera del concurso -->
				<div id="cab_conscurso">
					<h3>${mCabCon.docori_box}&nbsp;<span>${mCabCon.docser}</span></h3>
					<p>Bienvenido al concurso de compras del grupo Mediaset España. Le proponemos que nos haga llegar una oferta en firme para el artículo y la cantidad indicados en esta pantalla.</p>
				</div>

				<!-- Informacion del articulo del concurso -->
				<div class="info_concurso" style="width: 95%; justify-content: flex-start;">
					<div class="fila" id="cab_art">
						<div>FECHA LÍMITE PRESENTACIÓN OFERTA: <span id="inf_art">${mCabCon.pubfin}</span></div>
					</div>
				</div>

				<!-- Información / Instrucciones de uso -->
				
				<div class="fila_info">
					<button type="button" class="campo btn_des mdi mdi-information-variant-circle-outline" style="font-size: 24px;" onclick="openPopup('popup_info')"></button>
					<div class="campo2 campo" style="background-color:white;">
						Pulse el icono de "i" para ver las intrucciones de uso.
					</div>
				</div>

				<div id="popup_info" class="popup" style="background-color: #F9FAFD; border: 1px solid #d2ce71;">
                    <span class="close" onclick="closePopup('popup_info')">&times;</span>
					<div class="formulario">

						<div class="tit_info">
							<span class="mdi mdi-pencil-outline icon"></span>
							<h4>Datos obligatorios</h4>
						</div>

						<div class="li_info">
							<ul>
								<li><span>Precio</span> (usando la coma ',' como separador decimal)</li>
								<li><span>Fichero adjunto</span></li>
							</ul>

						</div>

						<hr>

						<div class="tit_info">
							<span class="mdi mdi-plus icon"></span>
							<h4>Datos opcionales</h4>
						</div>

						<div class="li_info">
							<ul>
								<li><span>Descuento principal</span> (en negativo y usando la coma ',' como separador decimal)</li>
								<li><span>Canon digital/Tasas</span> (en positivo y usando la coma ',' como separador decimal)</li>
								<li><span>Observaciones</span></li>
							</ul>
						</div>

						<hr/>

						<div class="tit_info">
							<span class="mdi mdi-cog-outline icon"></span>
							<h4>Pasos / Botones / Links</h4>
						</div>

						<div>
							<div class="li_info">
								<ul>
									<!-- <li>Una vez introducidos lo datos puede pulsar el botón <b>Crear oferta</b> para formalizarla.</li> -->
									<li>Una vez introducidos lo datos puede pulsar el botón <b>Enviar Oferta</b> el cual enviará la oferta como validada a compras.</li>
									<!-- <li>Puede borrar la oferta presente en la pantalla y todos los documentos adjuntos para empezar a crear una nueva pulsando <b>Borrar oferta actual</b> </li> -->
									<!-- <li>Una vez finalizado el adjuntado de documentos aparecerá el boton <b>Enviar oferta</b> el cual enviará la oferta como validada a compras.</li> -->
								</ul>
							</div>
						</div>

					</div>
                </div>

				<!-- Formulario -->

				<form class="formulario_completo" id="formulario_completo" enctype="multipart/form-data" autocomplete="off">

					<div class="seccion activo" id="seccion1">

						<div class="formulario">
							<div class="table_scroll">
								<table>
									<thead>
										<tr>
											<th>
												<div class="campo_checkbox">
													<input type="checkbox" id="check_todo" name="check_todo">
													<span class="checkmark"></span>
												</div>
											</th>
											<th>Descripción</th>
											<th>Referencia</th>
											<th>Fabricante</th>
											<th>Cantidad</th>
											<th>Precio Ud.</th>
											<th>Descuento propuesto (%)</th>
											<th>Canon Digital/Tasa</th>
											<th>Importe total</th>
											<th>Fecha de entrega</th>
											<th class="no_ofer">No ofertar</th>
											<th class="cent">Estado</th>
											${mHtmlTh}
											<th class="cent">Histórico</th>
										</tr>
									</thead>
									<tbody>

										<!-- Listado de ofertas -->
										${mHtmlOfertas}

									</tbody>
								</table>
							</div>

							<!-- Campo de observaciones comunes -->
							<div class="fila">
				
								<div class="campo" style="margin: 5px 16px 0px 16px";>
									<label>Observaciones:</label>
									<br>
									<input class="input" type="text" id="coment" name="coment" placeholder="Observaciones" value="${mComent}" style="margin-top:5px;">
								</div>
				
							</div>
						</div>

						<!-- Adjuntar documentos -->

						<div id="docAsoc">

							<div class="formulario">
								<div class="fila">
									<div class="campo" style="color: #B9BCC3;">
										Puede añadir cualquier tipo de documentacion que considere relevante para la oferta, como por ejemplo, imágenes del producto
									</div>
								</div>

								<div class="fila">
									<div class="campo document">
										<label>Documento * </label>
										<br>
										<div class="area_fichero">
											<p>Arrastra aquí tu archivo</p>
											<button type="button" class="input seleccion_ficheros" onclick="selectFichero(this)">Elegir
												Archivos</button>
											<input class="input" type="file" multiple id="documento" name="documento"
												onchange="mostrarFicheros(this)" ${mRequiredDoc}
												accept=".docx, .doc, .xlsx, .xls, .pdf, .ppt, .pptx, .png, .jpg, .jpeg">
											<div id="listadoFicheros"></div>
										</div>
									</div>
								</div>

								${mHtmlEnviarDocs}

							</div>

						</div>

						<!-- Boton de envio de formulario -->
						${mHtmlBoton}

						<!-- Documentos asociados a la oferta actual -->

						${mHtmlDocs}

					</div>
				</form>

				<pre id="output"></pre>

			</body>

			</html>
		`
		}
	}
}
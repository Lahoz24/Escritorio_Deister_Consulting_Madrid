function cper_docref_valida(p_event, p_rowid) {
    
    //Inicializo variables tabla destino e id destino
    let m_iddes;
    let m_tabdes;

    switch(p_event){

        /// Delete
        case 'D':
            return;

        /// Insert
        case'I':

            // ¿Quizás no haga falta hacer select ya que con el context.data lo pillaría? --> NO = (no tendríamos el size ni el type del file ni el cabid)
            // var mIntSerial = Ax.db.insert("test_city",mRowCity).getSerial(); coger el serial del insertado

            var rs = Ax.db.executeQuery(`
                <select>
                    <columns>
                        tipodocu, catdoc, codemp, codcomp, fordoc, facid, file_data, file_name, file_type, file_size
                    </columns>
                    <from table='cper_docref'/>
                    <where>
                        cper_docref.rowid = ${p_rowid}
                    </where>
                </select>`).toOne();

            // Objeto del documento dinámico según tabla donde vaya a insertar (Evito líneas de código)
            var m_doc = {
                file_data: rs.file_data,
                file_name : rs.file_name,
                file_date : Date.now(),
                file_type : rs.file_type,
                file_size: rs.file_size
            }

            // ¿Es una factura?
            if(rs.tipodocu == "FC" && rs.catdoc == "L"){

                // Añado datos que me interesan al objeto ya creado para el insert en facturas
                m_doc.tipdoc = rs.tipodocu;
                m_doc.cabid = rs.facid;

                m_iddes = Ax.db.insert("gcomfach_docs",m_doc).getSerial();
                m_tabdes = "gcomfach_docs";

            // ¿Es de tipo laboral/trabajo?
            }else if(rs.catdoc == "L"){

                // Añado datos que me interesan al objeto ya creado para el insert en facturas
                m_doc.codper = rs.codemp;
                m_doc.file_doctype = rs.tipodocu;
                m_doc.file_presen = Date.now();
                
                m_iddes = Ax.db.insert("cper_empldocu",m_doc).getSerial();
                m_tabdes = "cper_empldocu";

            // ¿Es de tipo personal?
            }else if(rs.catdoc == "P"){

                // Añado datos que me interesan al objeto ya creado para el insert en facturas
                m_doc.codper = rs.codemp;
                m_doc.file_doctype = rs.tipodocu;
                m_doc.file_presen = Date.now();
                
                m_iddes = Ax.db.insert("cper_empldocu",m_doc).getSerial();
                m_tabdes = "cper_empldocu";

            // ¿Es de tipo competencia/formación?
            }else if(rs.catdoc == "C"){

                // Añado datos que me interesan al objeto ya creado para el insert en facturas
                m_doc.codper = rs.codemp;
                m_doc.file_doctype = rs.tipodocu;
                m_doc.file_presen = Date.now();
                
                m_iddes = Ax.db.insert("cper_empldocu",m_doc).getSerial();
                m_tabdes = "cper_empldocu";

            // ¿No pertenece a ninguna de esas categorías? = Mensaje de error
            }else{
                throw ("Rellena bien los campos");
            }
            
            // Updateo cper_docref con la traza de donde haya sido insertado el documento
            Ax.db.update('cper_docref', 
                {
                    iddes : m_iddes,
                    tabdes   : m_tabdes
                },
                {
                    rowid : p_rowid
                }
            );
            
            break;
            
        default:
            console.log("Evento no reconocido");
            break;
    }
}
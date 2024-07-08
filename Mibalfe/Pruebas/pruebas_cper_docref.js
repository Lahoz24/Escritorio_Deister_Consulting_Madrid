
    
    // Inicializo variables tabla destino e id destino
    let m_iddes;
    let m_tabdes;
    let p_event="I";
    let p_seqno=51;

    switch(p_event) {
        /// Delete
        case 'D':
            return;

        /// Insert
        case 'I':

            // Ejecutar la consulta y obtener los resultados
            var rs = Ax.db.executeQuery(`
                <select>
                    <columns>
                        tipodocu, catdoc, codemp, codcomp, fordoc, facid, file_data, file_name, file_type, file_size
                    </columns>
                    <from table='cper_docref'/>
                    <where>
                        cper_docref.seqno = ${p_seqno}
                    </where>
                </select>`).toOne();


            // Lógica de inserción según el tipo de documento
            if (rs.tipodocu == "FC" && rs.catdoc == "L") {
                console.log("Insertado en gcomfach_docs");

            } else if (rs.catdoc == "L") {

                console.log("Insertado en cper_empldocu (Laboral)");

            } else if (rs.catdoc == "P") {

                console.log("Insertado en cper_empldocu (Personal)");

            } else if (rs.catdoc == "C") {

                console.log("Insertado en cper_empldocu (Competencia)");

            } else {
                // No pertenece a ninguna de esas categorías -> Mensaje de error
                console.log("Rellena bien los campos");
            }
            break;

        default:
            console.log("Evento no reconocido");
            break;
    }




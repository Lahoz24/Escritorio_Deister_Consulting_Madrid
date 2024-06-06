function main(data){
	let cif = data.cif.toUpperCase();
	let numeroFactura = data.numeroFactura.toUpperCase();
	let importe = data.importe.toUpperCase();
	let motivoDevolucion = data.motivoDevolucion.toUpperCase();
	let fecha = Ax.text.DateFormat.parse(data.fecha, "yyyy-MM-dd");
    let anio = fecha.getFullYear();



 	let existeCliente = Ax.db.executeGet(`
            <select>
                <columns>
                    COUNT(*)
                </columns>
                <from table='gcliente'/>
                <where>
                    codigo = '${cif}'
                </where>
            </select>`);

	let existeFacturaAnio = Ax.db.executeGet(`
		<select>
			<columns>
				COUNT(*)
			</columns>
			<from table='gprefact'/>
			<where>
				cifpro = '${cif}' AND idfpr = '${numeroFactura}' AND YEAR(fecdoc) = ${anio}
			</where>
		</select>`);

        if(existeCliente == 0){
            return new Ax.net.HttpResponseBuilder()
                .seeOther("/service/rest/gestele5/mediaset/v1/api/alm/proveedor?tipoError=1")
                .status(303)
                .build();
        }else if(fecha.getFullYear() != new Date().getFullYear()){
            return new Ax.net.HttpResponseBuilder()
                .seeOther("/service/rest/gestele5/mediaset/v1/api/alm/proveedor?tipoError=2")
                .status(303)
                .build();   
        }else if(existeFacturaAnio != 0){
            return new Ax.net.HttpResponseBuilder()
                .seeOther("/service/rest/gestele5/mediaset/v1/api/alm/proveedor?tipoError=3")
                .status(303)
                .build();   
        }else{
			return new Ax.net.HttpResponseBuilder()
                .seeOther("/service/rest/gestele5/mediaset/v1/api/alm/proveedor?tipoError=0")
                .status(303)
                .build();  
		}
}
function importeTotalHija()
{
    let importe = getFieldValue("alm_alpargatasl.import");
    let dto = getFieldValue("alm_alpargatasl.dtoimp");
    
    //Cálculo descuento
    
    let dtoRes = (importe * dto) / 100;
    let resultado = importe - dtoRes;
    
    let importeTotal = setFieldValue("alm_alpargatasl.imptot",resultado);
}var linid;
var cabid;


function importeTotalHija()
{
    let importe = getFieldValue('alm_alpargatasl.import');
    let dto = getFieldValue('alm_alpargatasl.dtoimp');
    
    //Cálculo descuento
    
    let dtoRes = (importe * dto) / 100;
    let resultado = importe - dtoRes;
    
    let importeTotal = setFieldValue('alm_alpargatasl.imptot',resultado);
}
function insertarTextoUltimaModificacion()
{
/*    alert("holaaaaaa");
    
    alert(linid);*/
    
    let rs = executeQueryValues('ALM_SELECT_L', [linid]);
    var imp = rs[0].import;
    var dtoimp = rs[0].dtoimp;
    var imptot = rs[0].imptot;
    

    impNew= getFieldValue("alm_alpargatasl.import");
    dtoimpNew= getFieldValue("alm_alpargatasl.dtoimp");
    imptotNew= getFieldValue("alm_alpargatasl.imptot");
    
    if((impNew != imp) || (dtoimpNew != dtoimp) || (imptotNew != imptot)){
        console.log("se mete en if");
        let rs2  = executeQueryValue('ALM_TEXTO_DESCRI_H', [linid]);
    }else{
        console.log("se mete en else");
        // let rs2  = executeQueryValue('ALM_BORRA_DESCRI_H', [cabid]);
    }


    
/*    alert(textoImpl);*/

}
/*
function validacionFecha()
{
    
    fecha= getFieldValue('alm_alpargatasl.fecha');
    var splitF = fecha.split('-');
    fecha = new Date(splitF[2], splitF[1] - 1, splitF[0]);
    
    var rs= executeQueryValues('ALM_VALFEC',[cabid]);
    var fecini = rs[0].fecini;
    var fecfin = rs[0].fecfin;

    //let feciniFormat = fecini.toLocaleDateString("es-MX",{ weekday:'long', day:'numeric', month:'long', year:'numeric' }).toUpperCase();
  // let fecfinFormat = fecfin.toLocaleDateString("es-MX",{ weekday:'long', day:'numeric', month:'long', year:'numeric' }).toUpperCase();
    
     fecini = fecini.toLocaleDateString();
     fecfin = fecfin.toLocaleDateString();
     fecha = fecha.toLocaleDateString();
  
  //  let mensajeErr = 
  // let campoFecha = '';


    if ((fecha < fecini) || (fecha > fecfin))
    {
        console.log("se mete if y");
        setFieldError("alm_alpargatasl.fecha", "LA FECHA DEBE ESTAR ENTRE: " + fecini + " Y " + fecfin);        
    } 
}
*/
function validacionFecha2()
{
    console.log("Validación fecha 2");
    var rs= executeQueryValues('ALM_VALFEC',[cabid]);
    fecha= getFieldValue('alm_alpargatasl.fecha');
    estado= getFieldValue('alm_alpargatasl.estado');

 
    var fecini = rs[0].fecini;
    var fecfin = rs[0].fecfin;

    console.log(fecini);
    console.log(fecfin);
    console.log(fecfin.toLocaleDateString("es-MX"));
    console.log(fecfin.toLocaleDateString("es-MX"));
    

    let partesF = fecha.split("-");
    let dFec = partesF[0];
    let mFec = partesF[1];
    let yFec = partesF[2];
    
    console.log("Día:", dFec);
    console.log("Mes:", mFec);
    console.log("Año:", yFec);

    var dFecini = fecini.getDate();
    var mFecini = fecini.getMonth() + 1; // si es 0, es el mes Enero
    var yFecini = fecini.getFullYear();
    var dFecfin = fecfin.getDate();
    var mFecfin = fecfin.getMonth() + 1; 
    var yFecfin = fecfin.getFullYear();
    
/*    var feciniFormat = (dFecini < 10 ? '0' : '') + dFecini + '-' + (mFecini < 10 ? '0' : '') + mFecini + '-' + yFecini;
    var fecfinFormat = (dFecfin < 10 ? '0' : '') + dFecfin + '-' + (mFecfin < 10 ? '0' : '') + mFecfin + '-' + yFecfin;
    
    console.log(feciniFormat); // Salida: "11-04-2024"
    console.log(fecfinFormat); // Salida: "14-04-2024"
    console.log(fecha); //Viene de ese getFieldValue de esa forma
*/
    // PRUEBAS
/*    console.log(fecha < fecini);
    console.log(fecha > fecfin);
    console.log(fecha < feciniFormat);
    console.log(fecha > fecfinFormat);*/
/*  console.log(yFec < yFecini);
    console.log(yFec > yFecfin);*/
    
    let feciniFormat = fecini.toLocaleDateString("es-MX",{ weekday:'long', day:'numeric', month:'long', year:'numeric' }).toUpperCase();
    let fecfinFormat = fecfin.toLocaleDateString("es-MX",{ weekday:'long', day:'numeric', month:'long', year:'numeric' }).toUpperCase();


    if ((yFec < yFecini) || (yFec > yFecfin) || (mFec < mFecini) || (mFec > mFecfin) || (dFec < dFecini) || (dFec > dFecfin))
    {
        console.log("Principio if");
        var rs2= executeQueryValue('ALM_ESTADO_BLOQ',[linid,cabid]);
        //setFieldError('alm_alpargatasl.fecha', "LA FECHA DEBE ESTAR ENTRE: " + feciniFormat + " Y " + fecfinFormat);
        console.log("Final if");
    } 

   return true;
    

    
/*    if ((yFec < yFecini) || (yFec > yFecfin)) //podría poner aquí todos los if else pero así puedo seguir mejor por consola dónde está el error (debug)
    {
        console.log("se mete if y");
        setFieldError('alm_alpargatasl.fecha', "LA FECHA DEBE ESTAR ENTRE: " + feciniFormat + " Y " + fecfinFormat);        
    } else if ((mFec < mFecini) || (mFec > mFecfin))
    {
        console.log("se mete if m");
        setFieldError('alm_alpargatasl.fecha', "LA FECHA DEBE ESTAR ENTRE: " + feciniFormat + " Y " + fecfinFormat);

    } else if ((dFec < dFecini) || (dFec > dFecfin))
    {
        console.log("se mete en if d");
        setFieldError('alm_alpargatasl.fecha', "LA FECHA DEBE ESTAR ENTRE: " + feciniFormat + " Y " + fecfinFormat);
    }*/

}
 /*   
function validacionFecha3()
{
    
    var rs= executeQueryValues('ALM_VALFEC',[cabid]);
    fecha= getFieldValue('alm_alpargatasl.fecha');

 
    var fecini = rs[0].fecini;
    var fecfin = rs[0].fecfin;

    console.log(fecini);
    console.log(fecfin);

    var dFecini = fecini.getDate();
    var mFecini = fecini.getMonth() + 1; // si es 0, es el mes Enero
    var yFecini = fecini.getFullYear();
    var dFecfin = fecfin.getDate();
    var mFecfin = fecfin.getMonth() + 1; 
    var yFecfin = fecfin.getFullYear();
    
    var feciniFormat = (dFecini < 10 ? '0' : '') + dFecini + '-' + (mFecini < 10 ? '0' : '') + mFecini + '-' + yFecini;
    var fecfinFormat = (dFecfin < 10 ? '0' : '') + dFecfin + '-' + (mFecfin < 10 ? '0' : '') + mFecfin + '-' + yFecfin;
    
    console.log(feciniFormat); // Salida: "11-04-2024"
    console.log(fecfinFormat); // Salida: "14-04-2024"
    console.log(fecha); //Viene de ese getFieldValue de esa forma

    // PRUEBAS
    console.log(fecha < fecini);
    console.log(fecha > fecfin);
    
    
    
    if ((fecha < feciniFormat) || (fecha > fecfinFormat)) {
        console.log("se mete en if");
        feciniFormat = fecini.toLocaleDateString("es-MX",{ weekday:'long', day:'numeric', month:'long', year:'numeric' }).toUpperCase();
        fecfinFormat = fecfin.toLocaleDateString("es-MX",{ weekday:'long', day:'numeric', month:'long', year:'numeric' }).toUpperCase();
        setFieldError('alm_alpargatasl.fecha', "LA FECHA DEBE ESTAR ENTRE: " + feciniFormat + " Y " + fecfinFormat);
    } 

    
}
*/
function cargarDatosField()
{
    linid= getFieldValue("alm_alpargatasl.linid");
    cabid= getFieldValue("alm_alpargatasl.cabid");

}
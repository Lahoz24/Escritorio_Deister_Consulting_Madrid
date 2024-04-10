function importeTotalHija()
{
    let importe = getFieldValue("alm_alpargatasl.import");
    let dto = getFieldValue("alm_alpargatasl.dtoimp");
    
    //Cálculo descuento
    
    let dtoRes = (importe * dto) / 100;
    let resultado = importe - dtoRes;
    
    let importeTotal = setFieldValue("alm_alpargatasl.imptot",resultado);
}
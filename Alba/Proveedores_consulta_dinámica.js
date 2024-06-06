function main(data){
    let proveedores= "(32,47)";
        let rs_proveedores= Ax.db.executeQuery(`
        <select>
            <columns>
                cifpro,idfpr,impfac,motdev,fecdoc 
            </columns>
            <from table='gprefact'/>
            <where>
                idpre IN (32,47)
            </where>
        </select>`).toMemory();
		
        let textoFinal='';

		rs_proveedores.forEach( row => {
            console.log(row.idfpr)
            if(row.motdev == null){
                row.motdev='';
            }
    
            let texto =`<div class="container mt-5 mb-5">
                        <div class="row justify-content-center">
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header card-header-purple">
                                        <h4>Formulario de Devolución</h4>
                                    </div>
                                    <div class="card-body">
                                        <form>
                                            <div class="form-row">
                                                <div class="form-group col-md-6">
                                                    <label for="cif">CIF</label>
                                                    <input value='${row.cifpro}'type="text" class="form-control" id="cif" placeholder="Ingrese CIF">
                                                </div>
                                                <div class="form-group col-md-6">
                                                    <label for="numeroFactura">Número de Factura</label>
                                                    <select class="form-control" id="numeroFactura">
                                                        <option value="${row.idfpr}">${row.idfpr}</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-row">
                                                <div class="form-group col-md-6">
                                                    <label for="importe">Importe</label>
                                                    <input type="text" value="${row.impfac}" class="form-control" id="importe" placeholder="Ingrese importe">
                                                </div>
                                                <div class="form-group col-md-6">
                                                    <label for="fecha">Fecha</label>
                                                    <input type="date" value="${row.fecdoc}" class="form-control" id="fecha">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label for="motivoDevolucion">Motivo de Devolución</label>
                                                <input type="text" value="${row.motdev}" class="form-control" id="motivoDevolucion" placeholder="Ingrese motivo de devolución" >
                                            </div>
                                            <button type="submit" class="btn btn-purple">Enviar</button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;
    
                    textoFinal += texto;
		})
            
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Formulario de Devolución</title>
            <link href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
            <style>
                .btn-purple {
                    background-color: #6f42c1;
                    border-color: #6f42c1;
                    color: white;
                }
                .btn-purple:hover {
                    background-color: #5a32a3;
                    border-color: #5a32a3;
                    color: white;
                }
                .card-header-purple {
                    background-color: #6f42c1;
                    color: white;
                }
                .header-purple {
                    background-color: #6f42c1;
                    color: white;
                }
                /* Cambio de color al pasar el ratón */
                #numeroFactura:hover,
                #numeroFactura:focus,
                #cif:focus,
                #importe:focus,
                #fecha:focus,
                #motivoDevolucion:focus {
                    background-color: #f8f9fa; /* Cambia a un color más claro */
                    border-color: #6f42c1; /* Cambia el color del borde al enfoque */
                    box-shadow: 0 0 0 0.2rem rgba(111, 66, 193, 0.25); /* Efecto halo morado */
                }
            </style>
        </head>
        <body>
            <!-- Header -->
            <header class="header-purple text-white text-center py-4">
                <h1>Bienvenido al Sistema de Consulta de Devoluciones</h1>
                <p>Aquí podrás consultar las devoluciones de los usuarios</p>
            </header>
        
            <!-- Main Content -->
                ${textoFinal}
            <!-- Footer -->
            <footer class="bg-dark text-white text-center py-4">
                <p>&copy; 2024 Sistema de Consulta de Devoluciones. Todos los derechos reservados.</p>
                <p><a href="#" class="text-white">Términos y Condiciones</a> | <a href="#" class="text-white">Política de Privacidad</a></p>
            </footer>
        
            <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.0/umd/popper.min.js"></script>
            <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
        </body>
        </html>
    
            `
        }
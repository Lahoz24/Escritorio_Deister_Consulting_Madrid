function main(data){
	let mError="";
	let cardClass = "error-card";
    if (data.tipoError != null) {

		console.log("El tipo de error existe y es:", data.tipoError);
	    switch (data.tipoError) {
			case 0:
				mError = `<div class="campo correcto " id="cifErroneo">
							<h4>Insertado con éxito</h4>
						  </div>`;
				cardClass = "success-card";
				break; 

			case 1:
				mError = `<div class="campo incorrecto " id="cifErroneo">
							<h4>Error</h4>
							<p>El cif introducido no está registrado como cliente</p>
						  </div>`;
				break;
			case 2:
				mError = `<div class="campo incorrecto" id="numFacExiste">
							<h4>Error</h4>
							<p>La factura introducida tiene que ser del año actual</p>
						  </div>`;
				break;
			case 3:
				mError = `<div class="campo incorrecto" id="numFacExiste">
						   <h4>Error</h4>
				           <p>La factura introducida ya existe</p>
				          </div>`;
				break;
			default:
				break;
   		}
	} else {
		data.tipoError = null;
		mError= "";
		console.log("El tipo de error no existe. Se le asignó un valor predeterminado:", data.tipoError);
	}

    
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
				.error-message {
					color: red;
					font-size: 0.8em;
					margin-top: 0.25rem;
				}
				/* Quitar flechitas de incremento y decremento */
				input[type=number]::-webkit-inner-spin-button, 
				input[type=number]::-webkit-outer-spin-button {
					-webkit-appearance: none;
					margin: 0;
				}
				/* Estilos para la tarjeta de error */
				.error-card, .success-card {
					border-radius: 5px; /* Bordes redondeados */
					margin: 20px 0; /* Espaciado externo */
					font-family: Arial, sans-serif; /* Fuente */
					font-size: 14px; /* Tamaño de fuente */
					box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Sombra */
					max-width: 600px; /* Ancho máximo */
					word-wrap: break-word; /* Ajuste de texto */
					animation: fadeIn 0.5s ease-in-out; /* Animación de entrada */
					display: none; /* Ocultar inicialmente */
					justify-content: center; /* Centrar horizontalmente */
					align-items: center; /* Centrar verticalmente */
					text-align: center; /* Centrar el texto dentro del pre */
				}

				/* Estilos específicos para la tarjeta de error */
				.error-card {
					background-color: #f8d7da; /* Color de fondo rojo claro */
					color: #721c24; /* Color del texto rojo oscuro */
					border: 1px solid #f5c6cb; /* Borde rojo claro */
				}

				/* Estilos específicos para la tarjeta de éxito */
				.success-card {
					background-color: #d4edda; /* Color de fondo verde claro */
					color: #155724; /* Color del texto verde oscuro */
					border: 1px solid #c3e6cb; /* Borde verde claro */
				}

				/* Estilos para el contenido compacto del div campo incorrecto */
				.campo.incorrecto, .campo.correcto {
					margin: 0; /* Sin margen */
					padding: 5px; /* Padding reducido */
					line-height: 1.2; /* Reducir espacio entre líneas */
				}
				.campo.incorrecto p, .campo.correcto p {
					margin: 2px 0; /* Márgenes verticales pequeños */
					font-size: 0.9em; /* Tamaño de fuente reducido */
				}

				/* Animación de entrada */
				@keyframes fadeIn {
					from {
						opacity: 0;
						transform: translateY(-10px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}

				/* Centrar el contenedor principal y el formulario */
				.main-container {
					display: flex;
					flex-direction: column;
					align-items: center; /* Centrar horizontalmente */
					justify-content: flex-start; /* Iniciar en la parte superior */
					min-height: 100vh; /* Altura mínima para centrar verticalmente */
					padding-top: 20px; /* Espaciado superior */
				}
				.container {
					width: 100%; /* Ocupa todo el ancho disponible */
				}
			</style>
			<script>
				function loadElemDom() {
					form = document.getElementById("formDev");
					output = document.getElementById("card_notificaciones");
					const inputs = form.querySelectorAll('input');
					errorCard = document.getElementById("card_notificaciones");
					if (${data.tipoError} == null) {
						errorCard.style.display = "none";
					} else {
						errorCard.className = "${cardClass}"; // Aplicar clase según el tipo de error
						errorCard.style.display = "flex";
					}

					inputs.forEach(input => {
						input.addEventListener('blur', validateField);
					});

					form.addEventListener("submit", saveDataForm, false);
				}

				function validateField(event) {
					const field = event.target;
					const errorElement = document.getElementById(field.id + 'Error');

					if (!field.checkValidity()) {
						errorElement.textContent = field.title;
					} else {
						errorElement.textContent = '';
					}
				}

				async function saveDataForm(event) {
					if (!form.checkValidity()) {
						alert("Rellena bien los datos del formulario");
						return;
					}
					event.preventDefault(); // Evitar el envío del formulario
					const inputsDev = form.querySelectorAll('input, select, textarea');
					const proveedor = {};

					inputsDev.forEach(input => {
						proveedor[input.name] = input.value;
					});

					console.log(proveedor);
					console.log(JSON.stringify(proveedor));

					const proveedorResponse = await fetch('/service/rest/gestele5/mediaset/v1/api/alm/proveedor', {
						method: "POST",
						headers: { 'Content-Type': 'application/json' },
						credentials: "same-origin",
						body: JSON.stringify(proveedor)
					});
					
					console.log(proveedorResponse);
					
					if (!proveedorResponse.ok) {
						alert("error");
					} else if (proveedorResponse.redirected) {
						alert("Redirigido");
						window.location.href = proveedorResponse.url;
					} else {
						console.log("Insertado con éxito");
						
					}
				}
				
				document.addEventListener('DOMContentLoaded', loadElemDom);
			</script>
        </head>
        <body>
            <!-- Header -->
            <header class="header-purple text-white text-center py-4">
                <h1>Bienvenido al Sistema de Consulta de Devoluciones</h1>
                <p>Aquí podrás consultar las devoluciones de los usuarios</p>
            </header>
			

			<div class="main-container">
				<!-- Mensaje Error -->
				<div id="card_notificaciones" class="error-card">
					<pre>${mError}</pre>
				</div> 

				<!-- Main Content -->
				<div class="container mt-5 mb-5">
					<div class="row justify-content-center">
						<div class="col-md-6">
							<div class="card">
								<div class="card-header card-header-purple">
									<h4>Formulario de Devolución</h4>
								</div>
								<div class="card-body">
									<form id="formDev" novalidate>
										<div class="form-row">
											<div class="form-group col-md-6">
												<label for="cif">CIF</label>
												<input type="text" class="form-control" id="cif" name="cif" placeholder="Ingrese CIF" pattern="[0-9A-Za-z]{10}" title="Debe tener 10 caracteres alfanuméricos" minlength="10" maxlength="10" required>
												<div class="error-message" id="cifError"></div>
											</div>
											<div class="form-group col-md-6">
												<label for="numeroFactura">Número de Factura</label>
												<input type="text" class="form-control" id="numeroFactura" name="numeroFactura" placeholder="Ingrese número factura" title="Este campo debe estar relleno" minlength="1" required>
												<div class="error-message" id="numeroFacturaError"></div>
											</div> 
										</div>
										<div class="form-row">
											<div class="form-group col-md-6">
												<label for="importe">Importe</label>
												<input type="number" class="form-control" id="importe" name="importe" placeholder="Ingrese importe" title="Este campo debe estar relleno" min="1" step=".01" required>
												<div class="error-message" id="importeError"></div>
											</div>
											<div class="form-group col-md-6">
												<label for="fecha">Fecha</label>
												<input type="date" class="form-control" id="fecha" name="fecha" title="Este campo debe estar relleno" minlength="1" required>
												<div class="error-message" id="fechaError"></div>
											</div>
										</div>
										<div class="form-group">
											<label for="motivoDevolucion">Motivo de Devolución</label>
											<input type="text" class="form-control" id="motivoDevolucion" name="motivoDevolucion" placeholder="Ingrese motivo de devolución">
											<div class="error-message" id="motivoDevolucionError"></div>
										</div>
										<button type="submit" class="btn btn-purple">Enviar</button>
									</form> 
								</div>
							</div>
						</div>
					</div>
				</div>
		    </div>

            <!-- Footer -->
            <footer class="bg-dark text-white text-center py-4 fixed-bottom">
                <p>&copy; 2024 Sistema de Consulta de Devoluciones. Todos los derechos reservados.</p>
                <p><a href="#" class="text-white">Términos y Condiciones</a> | <a href="#" class="text-white">Política de Privacidad</a></p>
            </footer>

            <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.0/umd/popper.min.js"></script>
            <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
            
        </body>
        </html>
    `;
}
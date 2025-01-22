const inventario = []
const facturas = []
const compras = []
const cuentasCobrar = []
const cuentasPagar = []
const ingresos = []
const gastos = []
const capital = {
  productos: 0,
  efectivo: 0,
}
let ganancias = 0

function mostrarSeccion(seccion) {
  document.querySelectorAll(".seccion").forEach((s) => (s.style.display = "none"))
  document.getElementById(seccion).style.display = "block"
}

document.getElementById("btnAgregarProducto").addEventListener("click", () => {
  const form = document.getElementById("formInventario")
  form.style.display = "block"

  document.getElementById("btnGuardarProducto").textContent = "Agregar Producto"
  document.getElementById("btnCancelarEdicion").style.display = "none"
  form.reset()
})

document.getElementById("formInventario").addEventListener("submit", function (e) {
  e.preventDefault()
  const producto = {
    nombre: document.getElementById("nombreProducto").value,
    codigo: document.getElementById("codigoProducto").value,
    precioCompra: Number.parseFloat(document.getElementById("precioCompra").value),
    precioVenta: Number.parseFloat(document.getElementById("precioVenta").value),
    cantidad: Number.parseInt(document.getElementById("cantidadInventario").value),
    minimo: Number.parseInt(document.getElementById("cantidadMinima").value),
    etiqueta: document.getElementById("etiquetaProducto").value,
    fechaVencimiento: document.getElementById("fechaVencimiento").value,
  }

  const index = inventario.findIndex((p) => p.codigo === producto.codigo)
  if (index !== -1) {
    const cantidadAnterior = inventario[index].cantidad
    inventario[index] = producto
    capital.productos += (producto.cantidad - cantidadAnterior) * producto.precioCompra
  } else {
    inventario.push(producto)
    capital.productos += producto.cantidad * producto.precioCompra
  }

  actualizarTablaInventario()
  this.reset()
  this.style.display = "none"
  actualizarCapital()
})

document.getElementById("btnCancelarEdicion").addEventListener("click", function () {
  document.getElementById("formInventario").reset()
  document.getElementById("formInventario").style.display = "none"
  document.getElementById("btnGuardarProducto").textContent = "Agregar Producto"
  this.style.display = "none"
})

function actualizarTablaInventario(productosFiltrados = inventario) {
  const tbody = document.getElementById("cuerpoTablaInventario")
  tbody.innerHTML = ""
  productosFiltrados.forEach((producto, index) => {
    const tr = document.createElement("tr")
    tr.innerHTML = `
            <td>${producto.nombre}</td>
            <td>${producto.codigo}</td>
            <td>${producto.precioCompra.toFixed(2)}</td>
            <td>${producto.precioVenta.toFixed(2)}</td>
            <td>${producto.cantidad}</td>
            <td>${producto.minimo}</td>
            <td>${producto.etiqueta}</td>
            <td>${producto.fechaVencimiento || "N/A"}</td>
            <td>
                <button onclick="editarProducto(${index})">Editar</button>
                <button onclick="eliminarProducto(${index})">Eliminar</button>
            </td>
        `
    tbody.appendChild(tr)
  })
}

document.getElementById("buscarProducto").addEventListener("input", (e) => {
  const busqueda = e.target.value.toLowerCase()
  const productosFiltrados = inventario.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda) ||
      p.codigo.toLowerCase().includes(busqueda) ||
      p.etiqueta.toLowerCase().includes(busqueda),
  )
  productosFiltrados.sort((a, b) => {
    const aIncludes = a.nombre.toLowerCase().includes(busqueda)
    const bIncludes = b.nombre.toLowerCase().includes(busqueda)
    if (aIncludes && !bIncludes) return -1
    if (!aIncludes && bIncludes) return 1
    return 0
  })
  actualizarTablaInventario(productosFiltrados)
})

document.getElementById("ordenarProductos").addEventListener("change", (e) => {
  const criterio = e.target.value
  if (criterio === "alfabetico") {
    inventario.sort((a, b) => a.nombre.localeCompare(b.nombre))
  } else if (criterio === "vencimiento") {
    inventario.sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento))
  }
  actualizarTablaInventario()
})

function editarProducto(index) {
  const producto = inventario[index]
  document.getElementById("nombreProducto").value = producto.nombre
  document.getElementById("codigoProducto").value = producto.codigo
  document.getElementById("precioCompra").value = producto.precioCompra
  document.getElementById("precioVenta").value = producto.precioVenta
  document.getElementById("cantidadInventario").value = producto.cantidad
  document.getElementById("cantidadMinima").value = producto.minimo
  document.getElementById("etiquetaProducto").value = producto.etiqueta
  document.getElementById("fechaVencimiento").value = producto.fechaVencimiento

  document.getElementById("formInventario").style.display = "block"
  document.getElementById("btnGuardarProducto").textContent = "Guardar Cambios"
  document.getElementById("btnCancelarEdicion").style.display = "inline-block"
}

function eliminarProducto(index) {
  if (confirm("¿Está seguro de que desea eliminar este producto?")) {
    const producto = inventario[index]
    capital.productos -= producto.precioCompra * producto.cantidad
    inventario.splice(index, 1)
    actualizarTablaInventario()
    actualizarCapital()
  }
}

function importarDesdeExcel() {
  const input = document.getElementById("importarExcel")
  const file = input.files[0]
  const reader = new FileReader()
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result)
    const workbook = XLSX.read(data, { type: "array" })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const json = XLSX.utils.sheet_to_json(worksheet)
    json.forEach((row) => {
      const producto = {
        nombre: row.Nombre,
        codigo: row.Codigo,
        precioCompra: Number.parseFloat(row.PrecioCompra),
        precioVenta: Number.parseFloat(row.PrecioVenta),
        cantidad: Number.parseInt(row.Cantidad),
        minimo: Number.parseInt(row.Minimo),
        etiqueta: row.Etiqueta,
        fechaVencimiento: row.FechaVencimiento,
      }
      inventario.push(producto)
      capital.productos += producto.precioCompra * producto.cantidad
    })
    actualizarTablaInventario()
    actualizarCapital()
  }
  reader.readAsArrayBuffer(file)
}

document.getElementById("fechaFactura").value = new Date().toLocaleDateString()

document.getElementById("buscarProductoFactura").addEventListener("input", (e) => {
  const busqueda = e.target.value.toLowerCase()
  const select = document.getElementById("productoSeleccionado")
  select.innerHTML = ""
  inventario
    .filter((p) => p.nombre.toLowerCase().includes(busqueda) || p.codigo.toLowerCase().includes(busqueda))
    .forEach((p) => {
      const option = document.createElement("option")
      option.value = p.codigo
      option.textContent = `${p.nombre} - ${p.codigo}`
      select.appendChild(option)
    })
})

document.getElementById("productoSeleccionado").addEventListener("change", (e) => {
  const productoSeleccionado = inventario.find((p) => p.codigo === e.target.value)
  if (productoSeleccionado) {
    document.getElementById("precioFactura").value = productoSeleccionado.precioVenta.toFixed(2)
  }
})

let productosEnFactura = []

function agregarProductoFactura() {
  const codigo = document.getElementById("productoSeleccionado").value
  const cantidad = Number.parseInt(document.getElementById("cantidadFactura").value)
  const producto = inventario.find((p) => p.codigo === codigo)
  if (producto && cantidad > 0) {
    if (cantidad > producto.cantidad) {
      alert(`No hay suficiente stock. Stock disponible: ${producto.cantidad}`)
      return
    }
    const precio = producto.precioVenta
    productosEnFactura.push({ ...producto, cantidad, precio })
    actualizarTablaFactura()
    document.getElementById("productoSeleccionado").value = ""
    document.getElementById("cantidadFactura").value = ""
    document.getElementById("precioFactura").value = ""
    document.getElementById("buscarProductoFactura").value = ""
  }
}

function actualizarTablaFactura() {
  const tbody = document.getElementById("cuerpoTablaFactura")
  tbody.innerHTML = ""
  let total = 0
  productosEnFactura.forEach((p, index) => {
    const subtotal = p.cantidad * p.precio
    total += subtotal
    const tr = document.createElement("tr")
    tr.innerHTML = `
            <td>${p.nombre}</td>
            <td>${p.cantidad}</td>
            <td>${p.precio.toFixed(2)}</td>
            <td>${subtotal.toFixed(2)}</td>
            <td><button onclick="eliminarProductoFactura(${index})">Eliminar</button></td>
        `
    tbody.appendChild(tr)
  })
  document.getElementById("totalFactura").textContent = total.toFixed(2)
}

function eliminarProductoFactura(index) {
  productosEnFactura.splice(index, 1)
  actualizarTablaFactura()
}


function finalizarFactura() {
  const cliente = document.getElementById("clienteFactura").value.trim()
  const fecha = document.getElementById("fechaFactura").value
  const total = Number.parseFloat(document.getElementById("totalFactura").textContent)
  const tipoFactura = document.getElementById("tipoFactura").value
 
  if (cliente === "") {
    alert("Por favor, ingrese el nombre del cliente.")
    return
}   


  if (productosEnFactura.length === 0) {
    alert("No hay productos en la factura. Añada productos antes de finalizar.")
    return
  }
  
  
  let gananciaFactura = 0
  productosEnFactura.forEach((p) => {
    const productoInventario = inventario.find((inv) => inv.codigo === p.codigo)
    if (productoInventario) {
      productoInventario.cantidad -= p.cantidad
      gananciaFactura += (p.precio - p.precioCompra) * p.cantidad
      capital.productos -= p.precioCompra * p.cantidad
    }
  })

  const factura = { fecha, cliente, total, ganancia: gananciaFactura, productos: productosEnFactura, tipo: tipoFactura }

  if (tipoFactura === "contado") {
    facturas.push(factura)
    ganancias += gananciaFactura
    capital.efectivo += total - gananciaFactura
    ingresos.push({ fecha, monto: total , descripcion: `Factura al contado - ${cliente}`, etiqueta: "Venta" })
  } else {
    cuentasCobrar.push(factura)
  }

  actualizarTablaFacturas()
  actualizarTablaCuentasCobrar()
  actualizarGanancias()
  actualizarCapital()
  actualizarTablaInventario()

  productosEnFactura = []
  document.getElementById("formFactura").reset()
  document.getElementById("fechaFactura").value = new Date().toLocaleDateString()
  document.getElementById("cuerpoTablaFactura").innerHTML = ""
  document.getElementById("totalFactura").textContent = "0"

  alert("Factura emitida correctamente")
}

function actualizarTablaFacturas() {
  const tbody = document.getElementById("cuerpoTablaFacturas")
  if (!tbody) return // Add this check
  tbody.innerHTML = ""
  facturas.forEach((f) => {
    const tr = document.createElement("tr")
    tr.innerHTML = `
            <td>${f.fecha}</td>
            <td>${f.cliente}</td>
            <td>${f.total.toFixed(2)}</td>
            <td>${f.ganancia.toFixed(2)}</td>
            <td>${f.tipo}</td>
        `
    tbody.appendChild(tr)
  })
}

function actualizarTablaCuentasCobrar() {
  const tbody = document.getElementById("cuerpoTablaCuentasCobrar")
  tbody.innerHTML = ""
  cuentasCobrar.forEach((factura, index) => {
    const tr = document.createElement("tr")
    tr.innerHTML = `
            <td>${factura.fecha}</td>
            <td>${factura.cliente}</td>
            <td>${factura.total.toFixed(2)}</td>
            <td>
                <button onclick="registrarPagoCuentaCobrar(${index})">Registrar Pago</button>
                <button onclick="verDetallesCuentaCobrar(${index})">Ver Detalles</button>
            </td>
        `
    tbody.appendChild(tr)
  })
}

function registrarPagoCuentaCobrar(index) {
  const factura = cuentasCobrar[index]
  facturas.push(factura)
  ganancias += factura.ganancia
  capital.efectivo += factura.total
  ingresos.push({
    fecha: new Date().toLocaleDateString(),
    monto: factura.total,
    descripcion: `Pago de factura a crédito - ${factura.cliente}`,
    etiqueta: "Venta",
  })
  cuentasCobrar.splice(index, 1)
  actualizarTablaFacturas()
  actualizarTablaCuentasCobrar()
  actualizarGanancias()
  actualizarCapital()
  alert("Pago registrado correctamente")
}

function verDetallesCuentaCobrar(index) {
  const factura = cuentasCobrar[index]
  alert(`Detalles de la factura:
    Cliente: ${factura.cliente}
    Fecha: ${factura.fecha}
    Total: ${factura.total.toFixed(2)}
    Productos: ${factura.productos.map((p) => `${p.nombre} (${p.cantidad})`).join(", ")}`)
}
document.getElementById("fechaCompra").value = new Date().toLocaleDateString()

document.getElementById("formCompra").addEventListener("submit", (e) => {
  e.preventDefault()
  finalizarCompra()
})

let productosEnCompra = []


function agregarProductoCompra() {
  const codigo = document.getElementById("productoCompraSeleccionado").value
  const cantidad = Number.parseInt(document.getElementById("cantidadCompra").value)
  const precio = Number.parseFloat(document.getElementById("precioCompraProducto").value)
  const producto = inventario.find((p) => p.codigo === codigo)
  if (producto && cantidad > 0 && !isNaN(precio)) {
    productosEnCompra.push({ ...producto, cantidad, precio })
    actualizarTablaCompra()
    document.getElementById("productoCompraSeleccionado").value = ""
    document.getElementById("cantidadCompra").value = ""
    document.getElementById("precioCompraProducto").value = ""
    document.getElementById("buscarProductoCompra").value = ""
  } else {
    alert("Por favor, ingrese datos válidos para el producto.")
  }
}

function actualizarTablaCompra() {
  const tbody = document.getElementById("cuerpoTablaCompra")
  tbody.innerHTML = ""
  let total = 0
  productosEnCompra.forEach((p, index) => {
    const subtotal = p.cantidad * p.precio
    total += subtotal
    const tr = document.createElement("tr")
    tr.innerHTML = `
            <td>${p.nombre}</td>
            <td>${p.cantidad}</td>
            <td>${p.precio.toFixed(2)}</td>
            <td>${subtotal.toFixed(2)}</td>
            <td><button onclick="eliminarProductoCompra(${index})">Eliminar</button></td>
        `
    tbody.appendChild(tr)
  })
  document.getElementById("totalCompra").textContent = total.toFixed(2)
}

function eliminarProductoCompra(index) {
  productosEnCompra.splice(index, 1)
  actualizarTablaCompra()
}

document.getElementById("buscarProductoCompra").addEventListener("input", (e) => {
  const busqueda = e.target.value.toLowerCase()
  const select = document.getElementById("productoCompraSeleccionado")
  select.innerHTML = ""
  inventario
    .filter((p) => p.nombre.toLowerCase().includes(busqueda) || p.codigo.toLowerCase().includes(busqueda))
    .forEach((p) => {
      const option = document.createElement("option")
      option.value = p.codigo
      option.textContent = `${p.nombre} - ${p.codigo}`
      select.appendChild(option)
    })
})

function mostrarFormNuevoProducto() {
  document.getElementById("formNuevoProductoCompra").style.display = "block"
}

function agregarNuevoProductoCompra() {
  const nuevoProducto = {
    nombre: document.getElementById("nombreNuevoProducto").value,
    codigo: document.getElementById("codigoNuevoProducto").value,
    precioCompra: Number.parseFloat(document.getElementById("precioCompraNuevoProducto").value),
    precioVenta: Number.parseFloat(document.getElementById("precioVentaNuevoProducto").value),
    cantidad: Number.parseInt(document.getElementById("cantidadNuevoProducto").value),
    minimo: Number.parseInt(document.getElementById("cantidadMinimaNuevoProducto").value),
    etiqueta: document.getElementById("etiquetaNuevoProducto").value,
    fechaVencimiento: document.getElementById("fechaVencimientoNuevoProducto").value,
  }

  // Agregar el nuevo producto a productosEnCompra, pero no al inventario todavía
  productosEnCompra.push({ ...nuevoProducto, precio: nuevoProducto.precioCompra })

  actualizarTablaCompra()

  document.getElementById("formNuevoProductoCompra").style.display = "none"
  document.getElementById("formNuevoProductoCompra").reset()
}

function finalizarCompra() {
  const proveedor = document.getElementById("proveedorCompra").value.trim()
  const fecha = document.getElementById("fechaCompra").value
  const tipoCompra = document.getElementById("tipoCompra").value
  const total = Number.parseFloat(document.getElementById("totalCompra").textContent)

  if (proveedor === "") {
    alert("Por favor, ingrese el nombre del proveedor.")
    return
  }

  if (productosEnCompra.length === 0) {
    alert("No hay productos en la compra. Añada productos antes de finalizar.")
    return
  }

  const compra = { proveedor, fecha, total, productos: productosEnCompra, tipo: tipoCompra }

  if (tipoCompra === "contado") {
    compras.push(compra)
    capital.efectivo -= total
    gastos.push({ fecha, monto: total, descripcion: `Compra al contado - ${proveedor}`, etiqueta: "Compra" })
  } else {
    cuentasPagar.push(compra)
  }

  productosEnCompra.forEach((p) => {
    const productoInventario = inventario.find((inv) => inv.codigo === p.codigo)
    if (productoInventario) {
      productoInventario.cantidad += p.cantidad
      productoInventario.precioCompra = p.precio
    } else {
      // Este es un producto nuevo, lo agregamos al inventario
      inventario.push({
        nombre: p.nombre,
        codigo: p.codigo,
        precioCompra: p.precio,
        precioVenta: p.precioVenta || p.precio * 1.3, // Usamos precioVenta si está disponible, de lo contrario calculamos
        cantidad: p.cantidad,
        minimo: p.minimo || 5, // Usamos minimo si está disponible, de lo contrario usamos un valor por defecto
        etiqueta: p.etiqueta || "",
        fechaVencimiento: p.fechaVencimiento || "",
      })
    }
  })

  // Actualizamos capital.productos después de procesar todos los productos
  actualizarCapital()

  actualizarTablaCompras()
  actualizarTablaCuentasPagar()
  actualizarTablaInventario()

  productosEnCompra = []
  document.getElementById("formCompra").reset()
  document.getElementById("cuerpoTablaCompra").innerHTML = ""
  document.getElementById("totalCompra").textContent = "0"

  alert("Compra registrada correctamente")
}

function actualizarTablaCompras() {
  const tbody = document.getElementById("cuerpoTablaCompras")
  if (!tbody) return // Add this check
  tbody.innerHTML = ""
  compras.forEach((c, index) => {
    const tr = document.createElement("tr")
    tr.innerHTML = `
            <td>${c.fecha}</td>
            <td>${c.proveedor}</td>
            <td>${c.total.toFixed(2)}</td>
            <td><button onclick="verDetallesCompra(${index})">Ver Detalles</button></td>
        `
    tbody.appendChild(tr)
  })
}

function verDetallesCompra(index) {
  const compra = compras[index]
  alert(`Detalles de la compra:
    Proveedor: ${compra.proveedor}
    Fecha: ${compra.fecha}
    Total: ${compra.total.toFixed(2)}
    Productos: ${compra.productos.map((p) => `${p.nombre} (${p.cantidad})`).join(", ")}`)
}

function actualizarTablaCuentasPagar() {
  const tbody = document.getElementById("cuerpoTablaCuentasPagar")
  tbody.innerHTML = ""
  cuentasPagar.forEach((compra, index) => {
    const tr = document.createElement("tr")
    tr.innerHTML = `
            <td>${compra.fecha}</td>
            <td>${compra.proveedor}</td>
            <td>${compra.total.toFixed(2)}</td>
            <td>
                <button onclick="registrarPagoCuentaPagar(${index})">Registrar Pago</button>
                <button onclick="verDetallesCuentaPagar(${index})">Ver Detalles</button>
            </td>
        `
    tbody.appendChild(tr)
  })
}

function registrarPagoCuentaPagar(index) {
  const compra = cuentasPagar[index]
  compras.push(compra)
  capital.efectivo -= compra.total
  gastos.push({
    fecha: new Date().toLocaleDateString(),
    monto: compra.total,
    descripcion: `Pago de compra a crédito - ${compra.proveedor}`,
    etiqueta: "Compra",
  })
  cuentasPagar.splice(index, 1)
  actualizarTablaCompras()
  actualizarTablaCuentasPagar()
  actualizarCapital()
  alert("Pago registrado correctamente")
}

function verDetallesCuentaPagar(index) {
  const compra = cuentasPagar[index]
  alert(`Detalles de la compra a crédito:
    Proveedor: ${compra.proveedor}
    Fecha: ${compra.fecha}
    Total: ${compra.total.toFixed(2)}
    Productos: ${compra.productos.map((p) => `${p.nombre} (${p.cantidad})`).join(", ")}`)
}

document.getElementById("formIngresoGasto").addEventListener("submit", function (e) {
  e.preventDefault()
  const tipo = document.getElementById("tipoMovimiento").value
  const monto = Number.parseFloat(document.getElementById("montoMovimiento").value)
  const descripcion = document.getElementById("descripcionMovimiento").value
  const etiqueta = document.getElementById("etiquetaMovimiento").value
  const fecha = new Date().toLocaleDateString()
  if (tipo === "ingreso") {
    ingresos.push({ fecha, monto, descripcion, etiqueta })
    ganancias += monto
  } else {
    gastos.push({ fecha, monto, descripcion, etiqueta })
    ganancias -= monto
  }
  actualizarGanancias()
  actualizarRegistros()
  this.reset()
  alert(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} registrado correctamente.`)
})

function actualizarGanancias() {
  document.getElementById("gananciasTotal").textContent = ganancias.toFixed(2)
}

function buscarGananciasPorFecha() {
  const fechaInicio = new Date(document.getElementById("fechaInicioGanancias").value)
  const fechaFin = new Date(document.getElementById("fechaFinGanancias").value)
  let gananciasEnPeriodo = 0

  facturas.forEach((f) => {
    const fechaFactura = new Date(f.fecha)
    if (fechaFactura >= fechaInicio && fechaFactura <= fechaFin) {
      gananciasEnPeriodo += f.ganancia
    }
  })

  ingresos.forEach((i) => {
    const fechaIngreso = new Date(i.fecha)
    if (fechaIngreso >= fechaInicio && fechaIngreso <= fechaFin) {
      gananciasEnPeriodo += i.monto
    }
  })

  gastos.forEach((g) => {
    const fechaGasto = new Date(g.fecha)
    if (fechaGasto >= fechaInicio && fechaGasto <= fechaFin) {
      gananciasEnPeriodo -= g.monto
    }
  })

  alert(`Ganancias en el período seleccionado: ${gananciasEnPeriodo.toFixed(2)}`)
}

function actualizarCapital() {
  capital.productos = inventario.reduce((total, producto) => {
    return total + producto.cantidad * producto.precioCompra
  }, 0)
  document.getElementById("capitalProductos").textContent = capital.productos.toFixed(2)
  document.getElementById("capitalEfectivo").textContent = capital.efectivo.toFixed(2)
  document.getElementById("capitalTotal").textContent = (capital.productos + capital.efectivo).toFixed(2)
}

document.getElementById("formCapital").addEventListener("submit", function (e) {
  e.preventDefault()
  const monto = Number.parseFloat(document.getElementById("montoCapital").value)
  const descripcion = document.getElementById("descripcionCapital").value
  capital.efectivo += monto
  actualizarCapital()
  alert(`Se ha añadido ${monto.toFixed(2)} al capital. Descripción: ${descripcion}`)
  this.reset()
})

function anadirGananciasCapital() {
  const monto = Number.parseFloat(document.getElementById("montoGananciasCapital").value)
  if (isNaN(monto) || monto <= 0) {
    alert("Por favor, ingrese un monto válido.")
    return
  }
  if (monto > ganancias) {
    alert("No puedes añadir más de las ganancias actuales al capital.")
    return
  }
  capital.efectivo += monto
  ganancias -= monto
  actualizarCapital()
  actualizarGanancias()
  alert(`Se han añadido ${monto.toFixed(2)} de las ganancias al capital.`)
  document.getElementById("montoGananciasCapital").value = ""
}

function restarCapital() {
  const monto = Number.parseFloat(document.getElementById("montoRestarCapital").value)
  if (isNaN(monto) || monto <= 0) {
    alert("Por favor, ingrese un monto válido.")
    return
  }
  if (monto > capital.efectivo) {
    alert("No puedes restar más del capital en efectivo actual.")
    return
  }
  capital.efectivo -= monto
  actualizarCapital()
  alert(`Se han restado ${monto.toFixed(2)} del capital.`)
  document.getElementById("montoRestarCapital").value = ""
}

function actualizarRegistros() {
  const tipoRegistro = document.getElementById("tipoRegistro").value
  const tbody = document.getElementById("cuerpoTablaRegistros")
  const thead = document.getElementById("encabezadoRegistros")
  tbody.innerHTML = ""
  thead.innerHTML = ""

  switch (tipoRegistro) {
    case "facturas":
      thead.innerHTML = `
        <tr>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Total</th>
            <th>Tipo</th>
            <th>Detalles</th>
        </tr>
    `
      facturas.concat(cuentasCobrar).forEach((f, index) => {
        const tr = document.createElement("tr")
        tr.innerHTML = `
            <td>${f.fecha}</td>
            <td>${f.cliente}</td>
            <td>${f.total.toFixed(2)}</td>
            <td>${f.tipo}</td>
            <td><button onclick="verDetallesFactura(${index}, '${f.tipo}')">Ver Detalles</button></td>
        `
        tbody.appendChild(tr)
      })
      break
    case "ingresos":
      thead.innerHTML = `
                <tr>
                    <th>Fecha</th>
                    <th>Monto</th>
                    <th>Descripción</th>
                    <th>Etiqueta</th>
                </tr>
            `
      ingresos.forEach((i) => {
        const tr = document.createElement("tr")
        tr.innerHTML = `
                    <td>${i.fecha}</td>
                    <td>${i.monto.toFixed(2)}</td>
                    <td>${i.descripcion}</td>
                    <td>${i.etiqueta}</td>
                `
        tbody.appendChild(tr)
      })
      break
    case "gastos":
      thead.innerHTML = `
                <tr>
                    <th>Fecha</th>
                    <th>Monto</th>
                    <th>Descripción</th>
                    <th>Etiqueta</th>
                </tr>
            `
      gastos.forEach((g) => {
        const tr = document.createElement("tr")
        tr.innerHTML = `
                    <td>${g.fecha}</td>
                    <td>${g.monto.toFixed(2)}</td>
                    <td>${g.descripcion}</td>
                    <td>${g.etiqueta}</td>
                `
        tbody.appendChild(tr)
      })
      break
    case "compras":
      thead.innerHTML = `
                <tr>
                    <th>Fecha</th>
                    <th>Proveedor</th>
                    <th>Total</th>
                    <th>Detalles</th>
                </tr>
            `
      compras.forEach((c, index) => {
        const tr = document.createElement("tr")
        tr.innerHTML = `
                    <td>${c.fecha}</td>
                    <td>${c.proveedor}</td>
                    <td>${c.total.toFixed(2)}</td>
                    <td><button onclick="verDetallesCompra(${index})">Ver Detalles</button></td>
                `
        tbody.appendChild(tr)
      })
      break
  }
}

document.getElementById("tipoRegistro").addEventListener("change", actualizarRegistros)

document.getElementById("buscarRegistro").addEventListener("input", (e) => {
  const busqueda = e.target.value.toLowerCase()
  const tipoRegistro = document.getElementById("tipoRegistro").value
  let datosFiltrados

  switch (tipoRegistro) {
    case "facturas":
      datosFiltrados = facturas.filter((f) => f.cliente.toLowerCase().includes(busqueda) || f.fecha.includes(busqueda))
      break
    case "ingresos":
      datosFiltrados = ingresos.filter(
        (i) =>
          i.descripcion.toLowerCase().includes(busqueda) ||
          i.etiqueta.toLowerCase().includes(busqueda) ||
          i.fecha.includes(busqueda),
      )
      break
    case "gastos":
      datosFiltrados = gastos.filter(
        (g) =>
          g.descripcion.toLowerCase().includes(busqueda) ||
          g.etiqueta.toLowerCase().includes(busqueda) ||
          g.fecha.includes(busqueda),
      )
      break
    case "compras":
      datosFiltrados = compras.filter((c) => c.proveedor.toLowerCase().includes(busqueda) || c.fecha.includes(busqueda))
      break
  }

  actualizarRegistros(datosFiltrados)
})

function verDetallesFactura(index, tipo) {
  const factura = tipo === "contado" ? facturas[index] : cuentasCobrar[index]
  let detalles = `Cliente: ${factura.cliente}\nFecha: ${factura.fecha}\nTotal: ${factura.total.toFixed(2)}\nTipo: ${factura.tipo}\n\nProductos:\n`
  factura.productos.forEach((p) => {
    detalles += `- ${p.nombre}: ${p.cantidad} x ${p.precio.toFixed(2)} = ${(p.cantidad * p.precio).toFixed(2)}\n`
  })
  alert(detalles)
}

function imprimirFactura() {
  window.print()
}

function calcularVuelto() {
  const total = Number.parseFloat(document.getElementById("totalFactura").textContent)
  const pagoCon = Number.parseFloat(document.getElementById("pagoConFactura").value)
  if (!isNaN(pagoCon)) {
    const vuelto = pagoCon - total
    document.getElementById("vueltoFactura").textContent = vuelto.toFixed(2)
  } else {
    document.getElementById("vueltoFactura").textContent = "0.00"
  }
}

// Inicialización
window.onload = () => {
  mostrarSeccion("inventario")
  actualizarTablaInventario()
  actualizarCapital()
  actualizarGanancias()

  // Add event listeners for the buttons
  document.querySelector('button[onclick="finalizarFactura()"]').addEventListener("click", finalizarFactura)
  document.querySelector('button[onclick="finalizarCompra()"]').addEventListener("click", finalizarCompra)
}

// script.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('El DOM está listo.');

    // Aquí puedes poner cualquier manipulación del DOM, como cambiar el título.
    const title = document.querySelector('h1');
    title.textContent = 'Bienvenido a Chave Medicina';

    // Otras interacciones con el DOM
    const paragraph = document.querySelector('p');
    paragraph.style.color = 'blue';
});

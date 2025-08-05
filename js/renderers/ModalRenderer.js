// js/renderers/ModalRenderer.js

/**
 * Clase encargada de renderizar el HTML de todos los modales y formularios.
 * Esto aísla la lógica de presentación de la UI principal.
 */
export class ModalRenderer {
    /**
     * @param {function} formatCurrency - Función para formatear moneda, pasada desde UIManager.
     */
    constructor(formatCurrency) {
        this.formatCurrency = formatCurrency;
    }

    // Método privado para el contenedor común de todos los modales
    // Ajustado para un diseño más robusto y responsivo
    _renderModalWrapper(title, contentHtml) {
        return `
            <div class="modal-content bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto relative transform transition-all duration-300 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100">
                <div class="flex justify-between items-center mb-6 border-b pb-4 border-gray-200">
                    <h3 class="text-2xl font-bold text-slate-800">${title}</h3>
                    <button class="close-modal-btn text-gray-400 hover:text-gray-600 focus:outline-none p-2 -mr-2">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
                ${contentHtml}
            </div>
        `;
    }

    // Contenido del modal para crear/editar un proyecto
    renderProjectModalContent() {
        const today = new Date().toISOString().split('T')[0]; // Obtener la fecha actual en formato YYYY-MM-DD

        const formHtml = `
            <form id="add-project-form" class="space-y-5">
                <div>
                    <label for="projectName" class="block text-sm font-medium text-gray-700 mb-1">Nombre del Proyecto</label>
                    <input type="text" id="projectName" name="name" required 
                        class="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800">
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label for="projectType" class="block text-sm font-medium text-gray-700 mb-1">Tipo de Propiedad</label>
                        <select id="projectType" name="type" required 
                            class="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800">
                            <option value="terreno">Terreno</option>
                            <option value="casa">Casa</option>
                            <option value="departamento">Departamento</option>
                            <option value="hacienda">Hacienda</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>
                    <div>
                        <label for="projectLocation" class="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                        <input type="text" id="projectLocation" name="location" required 
                            class="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800">
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label for="projectSqMeters" class="block text-sm font-medium text-gray-700 mb-1">M²</label>
                        <input type="number" id="projectSqMeters" name="squareMeters" value="1" step="0.01" required 
                            class="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800">
                    </div>
                    <div>
                        <label for="projectAuctionDate" class="block text-sm font-medium text-gray-700 mb-1">Fecha de Remate</label>
                        <input type="date" id="projectAuctionDate" name="auctionDate" value="${today}" required 
                            class="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800">
                    </div>
                </div>
                <div class="flex justify-end pt-5 border-t border-gray-200 mt-6">
                    <button type="submit" class="bg-blue-600 text-white font-semibold px-8 py-3 rounded-full hover:bg-blue-700 transition-colors shadow-lg text-lg">
                        <i class="fas fa-plus mr-2"></i> Crear Proyecto
                    </button>
                </div>
            </form>
        `;
        return this._renderModalWrapper("Nuevo Proyecto", formHtml);
    }

    // Contenido del modal para añadir un gasto
    renderExpenseModalContent(projectId, categories) {
        const today = new Date().toISOString().split('T')[0]; // Fecha actual por defecto

        const formHtml = `
            <form id="add-expense-form" class="space-y-5" data-project-id="${projectId}">
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label for="expenseAmount" class="block text-sm font-medium text-gray-700 mb-1">*Monto ($)</label>
                        <input type="number" id="expenseAmount" name="amount" step="0.01" required 
                            class="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800">
                    </div>
                    <div>
                        <label for="expenseCategory" class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                        <select id="expenseCategory" name="category" required 
                            class="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800">
                            ${categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div>
                    <label for="expenseDescription" class="block text-sm font-medium text-gray-700 mb-1">*Descripción</label>
                    <input type="text" id="expenseDescription" name="description" required 
                        class="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800">
                </div>
                <div>
                    <label for="expenseDate" class="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                    <input type="date" id="expenseDate" name="date" value="${today}" required 
                        class="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800">
                </div>
                <div class="flex justify-end pt-5 border-t border-gray-200 mt-6">
                    <button type="submit" class="bg-emerald-600 text-white font-semibold px-8 py-3 rounded-full hover:bg-emerald-700 transition-colors shadow-lg text-lg">
                        <i class="fas fa-plus mr-2"></i> Añadir Gasto
                    </button>
                </div>
            </form>
        `;
        return this._renderModalWrapper("Añadir Gasto", formHtml);
    }

    // Contenido del modal para registrar una venta
    renderSaleModalContent(projectId) {
        const today = new Date().toISOString().split('T')[0]; // Fecha actual por defecto

        const formHtml = `
            <form id="add-sale-form" class="space-y-5" data-project-id="${projectId}">
                <div>
                    <label for="saleAmount" class="block text-sm font-medium text-gray-700 mb-1">Monto de Venta ($)</label>
                    <input type="number" id="saleAmount" name="saleAmount" step="0.01" required 
                        class="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800">
                </div>
                <div>
                    <label for="saleDate" class="block text-sm font-medium text-gray-700 mb-1">Fecha de Venta</label>
                    <input type="date" id="saleDate" name="saleDate" value="${today}" required 
                        class="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800">
                </div>
                <div class="flex justify-end pt-5 border-t border-gray-200 mt-6">
                    <button type="submit" class="bg-blue-600 text-white font-semibold px-8 py-3 rounded-full hover:bg-blue-700 transition-colors shadow-lg text-lg">
                        <i class="fas fa-sack-dollar mr-2"></i> Registrar Venta
                    </button>
                </div>
            </form>
        `;
        return this._renderModalWrapper("Registrar Venta", formHtml);
    }

    // Contenido del modal de confirmación
    renderConfirmationModalContent(message, confirmAction, itemId, extraData = {}) {
        const contentHtml = `
            <p class="text-slate-600 text-lg mb-6 text-center">${message}</p>
            <div class="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 pt-5 border-t border-gray-200 mt-6">
                <button id="cancel-confirm-btn" class="bg-gray-300 text-gray-700 font-semibold px-8 py-3 rounded-full hover:bg-gray-400 transition-colors shadow-md text-lg">
                    Cancelar
                </button>
                <button id="confirm-action-btn" 
                        class="bg-red-600 text-white font-semibold px-8 py-3 rounded-full hover:bg-red-700 transition-colors shadow-lg text-lg"
                        data-action="${confirmAction}" data-id="${itemId}" data-extra='${JSON.stringify(extraData)}'>
                    Confirmar
                </button>
            </div>
        `;
        // Ajustamos el max-w para el modal de confirmación, ya que es más pequeño
        return `
            <div class="modal-content bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md mx-auto relative transform transition-all duration-300 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100">
                <div class="flex justify-between items-center mb-6 border-b pb-4 border-gray-200">
                    <h3 class="text-2xl font-bold text-slate-800">Confirmación</h3>
                    <button class="close-modal-btn text-gray-400 hover:text-gray-600 focus:outline-none p-2 -mr-2">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
                ${contentHtml}
            </div>
        `;
    }
}

// js/expenseModule.js

/**
 * Módulo para la lógica de negocio de los gastos y ventas de proyectos.
 */
export class ExpenseModule { // Asegúrate de que esta clase esté exportada
    /**
     * @param {DatabaseManager} db - Instancia del gestor de la base de datos.
     * @param {UIManager} ui - Instancia del gestor de la interfaz de usuario.
     */
    constructor(db, ui) {
        this.db = db;
        this.ui = ui;
    }

    /**
     * Maneja la adición de un nuevo gasto a un proyecto.
     * @param {string} projectId - El ID del proyecto al que se añade el gasto.
     * @param {object} expenseData - Los datos del gasto.
     */
    async handleAddExpense(projectId, expenseData) {
        try {
            await this.db.addDocument('expenses', { ...expenseData, projectId: projectId });
            this.ui.closeModal('expense-modal');
            this.ui.loadProjectDetails(projectId); // Recargar los detalles del proyecto para actualizar la tabla y métricas
            console.log("Gasto añadido exitosamente.");
        } catch (error) {
            console.error("Error al añadir gasto:", error);
            // ui.showError('Error al añadir el gasto.');
        }
    }

    /**
     * Maneja la eliminación de un gasto específico.
     * @param {string} expenseId - El ID del gasto a eliminar.
     * @param {string} projectId - El ID del proyecto al que pertenece el gasto.
     */
    async handleDeleteExpense(expenseId, projectId) {
        try {
            await this.db.deleteDocument('expenses', expenseId);
            this.ui.loadProjectDetails(projectId); // Recargar los detalles del proyecto para actualizar la tabla y métricas
            console.log("Gasto eliminado exitosamente.");
        } catch (error) {
            console.error("Error al eliminar gasto:", error);
            // ui.showError('Error al eliminar el gasto.');
        }
    }

    /**
     * Maneja el registro de una venta para un proyecto.
     * Ya no cierra el proyecto automáticamente.
     * @param {string} projectId - El ID del proyecto al que se registra la venta.
     * @param {object} saleData - Los datos de la venta (monto y fecha).
     */
    async handleAddSale(projectId, saleData) {
        try {
            // Actualizar el proyecto con el monto y fecha de venta
            // CAMBIO CLAVE: Eliminado isClosed: true
            await this.db.updateDocument('projects', projectId, { 
                saleAmount: saleData.saleAmount,
                saleDate: saleData.saleDate
            });
            this.ui.closeModal('sale-modal');
            // CAMBIO CLAVE: Recargar los detalles del proyecto actual para ver las métricas actualizadas
            this.ui.loadProjectDetails(projectId); 
            console.log("Venta registrada exitosamente. El proyecto no se ha cerrado automáticamente.");
        } catch (error) {
            console.error("Error al registrar venta:", error);
            // ui.showError('Error al registrar la venta.');
        }
    }
}

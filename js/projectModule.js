// js/projectModule.js

/**
 * Módulo para la lógica de negocio de los proyectos.
 */
export class ProjectModule { // Asegúrate de que esta clase esté exportada
    /**
     * @param {DatabaseManager} db - Instancia del gestor de la base de datos.
     * @param {UIManager} ui - Instancia del gestor de la interfaz de usuario.
     */
    constructor(db, ui) {
        this.db = db;
        this.ui = ui;
    }

    /**
     * Maneja la adición de un nuevo proyecto.
     * @param {object} projectData - Los datos del nuevo proyecto.
     */
    async handleAddProject(projectData) {
        try {
            const newProject = {
                ...projectData,
                createdAt: new Date().toISOString().split('T')[0], // Fecha de creación
                isClosed: false, // Por defecto, el proyecto está activo
                saleAmount: null // Por defecto, sin monto de venta
            };
            await this.db.addDocument('projects', newProject);
            this.ui.closeModal('project-modal');
            this.ui.navigateTo('nav-dashboard'); // Volver al dashboard para ver el nuevo proyecto
            console.log("Proyecto añadido exitosamente.");
        } catch (error) {
            console.error("Error al añadir proyecto:", error);
            // ui.showError('Error al añadir el proyecto.');
        }
    }

    /**
     * Maneja el cierre de un proyecto.
     * @param {string} projectId - El ID del proyecto a cerrar.
     */
    async handleCloseProject(projectId) {
        try {
            await this.db.updateDocument('projects', projectId, { isClosed: true });
            this.ui.navigateTo('nav-dashboard'); // Volver al dashboard o actualizar la vista
            console.log("Proyecto cerrado exitosamente.");
        } catch (error) {
            console.error("Error al cerrar proyecto:", error);
            // ui.showError('Error al cerrar el proyecto.');
        }
    }

    /**
     * Maneja la reapertura de un proyecto.
     * @param {string} projectId - El ID del proyecto a reabrir.
     */
    async handleReopenProject(projectId) {
        try {
            await this.db.updateDocument('projects', projectId, { isClosed: false });
            this.ui.navigateTo('nav-dashboard'); // Navegar al dashboard para ver el proyecto reabierto
            console.log("Proyecto reabierto exitosamente.");
        } catch (error) {
            console.error("Error al reabrir proyecto:", error);
            // ui.showError('Error al reabrir el proyecto.');
        }
    }
}
